-- M7.1: Billing Hooks - Usage Ledger + Plan Enforcement

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 1) Organization Plans
CREATE TABLE IF NOT EXISTS org_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    monthly_price_cents INTEGER NOT NULL DEFAULT 0,
    included_analyses INTEGER NOT NULL DEFAULT 0,
    included_contracts INTEGER NOT NULL DEFAULT 0,
    max_file_size_bytes BIGINT NOT NULL DEFAULT 0,
    max_queue_depth INTEGER NOT NULL DEFAULT 0,
    ai_provider_allowed TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Organization Subscriptions (billing state without Stripe)
CREATE TABLE IF NOT EXISTS org_subscriptions (
    org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    plan_key TEXT NOT NULL REFERENCES org_plans(key),
    status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one subscription per org
    UNIQUE(org_id)
);

-- 3) Usage Ledger (append-only)
CREATE TABLE IF NOT EXISTS usage_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'CONTRACT_UPLOADED',
        'ANALYSIS_QUEUED', 
        'ANALYSIS_COMPLETED',
        'ANALYSIS_FAILED',
        'SIGNED_DOWNLOAD'
    )),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    units INTEGER NOT NULL DEFAULT 0,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    
    -- Prevent updates (append-only)
    CONSTRAINT usage_ledger_no_update CHECK (id IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_ledger_org_time ON usage_ledger(org_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_event_time ON usage_ledger(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_entity ON usage_ledger(entity_id);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_period ON usage_ledger(org_id, occurred_at DESC, event_type);

-- 4) RLS Policies

-- org_plans: readable by all authenticated
CREATE POLICY "org_plans_readable" ON org_plans
    FOR SELECT USING (auth.role() = 'authenticated');

-- org_subscriptions: org members can read, owners can write
CREATE POLICY "org_subscriptions_readable" ON org_subscriptions
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM organization_members om 
        JOIN organizations o ON o.id = om.org_id 
        WHERE o.id = org_subscriptions.org_id
    ));

CREATE POLICY "org_subscriptions_updatable_by_owners" ON org_subscriptions
    FOR UPDATE USING (auth.uid() IN (
        SELECT user_id FROM organization_members om 
        WHERE om.org_id = org_subscriptions.org_id AND om.role = 'owner'
    ));

-- usage_ledger: org members can read their org, service role writes
CREATE POLICY "usage_ledger_readable" ON usage_ledger
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM organization_members om 
        WHERE om.org_id = usage_ledger.org_id
    ));

CREATE POLICY "usage_ledger_insert_service_role" ON usage_ledger
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Optional: Allow authenticated users to insert for their org (with actor tracking)
CREATE POLICY "usage_ledger_insert_authenticated" ON usage_ledger
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        auth.uid() IN (
            SELECT user_id FROM organization_members om 
            WHERE om.org_id = usage_ledger.org_id
        ) AND
        usage_ledger.actor_user_id = auth.uid()
    );

-- 5) Trigger to prevent updates on usage_ledger (append-only enforcement)
CREATE OR REPLACE FUNCTION prevent_usage_ledger_updates()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'usage_ledger is append-only - updates not allowed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS usage_ledger_no_update_trigger ON usage_ledger;
CREATE TRIGGER usage_ledger_no_update_trigger
    BEFORE UPDATE ON usage_ledger
    FOR EACH ROW
    EXECUTE FUNCTION prevent_usage_ledger_updates();

-- 6) Helper Functions

-- Get current subscription for org
CREATE OR REPLACE FUNCTION get_current_subscription(p_org_id UUID)
RETURNS TABLE (
    plan_key TEXT,
    status TEXT,
    current_period_start DATE,
    current_period_end DATE,
    included_analyses INTEGER,
    max_file_size_bytes BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_subscription RECORD;
BEGIN
    SELECT s.*, p.included_analyses, p.max_file_size_bytes
    INTO v_subscription
    FROM org_subscriptions s
    JOIN org_plans p ON s.plan_key = p.key
    WHERE s.org_id = p_org_id AND s.status = 'active';
    
    IF NOT FOUND THEN
        -- Return default free plan if no subscription found
        RETURN QUERY SELECT 
            'free'::TEXT, 'active'::TEXT, 
            CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month')::DATE,
            10::INTEGER, 10485760::BIGINT; -- 10MB
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 
        v_subscription.plan_key,
        v_subscription.status,
        v_subscription.current_period_start,
        v_subscription.current_period_end,
        v_subscription.included_analyses,
        v_subscription.max_file_size_bytes;
END;
$$;

-- Get usage count for current period
CREATE OR REPLACE FUNCTION get_current_period_usage(
    p_org_id UUID, 
    p_event_type TEXT DEFAULT 'ANALYSIS_COMPLETED'
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_usage_count INTEGER;
    v_current_period_start DATE;
BEGIN
    -- Get current period start from subscription
    SELECT current_period_start INTO v_current_period_start
    FROM org_subscriptions 
    WHERE org_id = p_org_id AND status = 'active';
    
    IF v_current_period_start IS NULL THEN
        v_current_period_start := CURRENT_DATE;
    END IF;
    
    -- Count usage in current period
    SELECT COUNT(*) INTO v_usage_count
    FROM usage_ledger
    WHERE org_id = p_org_id 
    AND event_type = p_event_type
    AND occurred_at >= v_current_period_start::TIMESTAMPTZ;
    
    RETURN COALESCE(v_usage_count, 0);
END;
$$;

-- Check if org can enqueue analysis
CREATE OR REPLACE FUNCTION can_enqueue_analysis(p_org_id UUID)
RETURNS TABLE (
    allowed BOOLEAN,
    current_usage INTEGER,
    included_limit INTEGER,
    remaining INTEGER,
    message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_subscription RECORD;
    v_current_usage INTEGER;
    v_remaining INTEGER;
BEGIN
    -- Get current subscription
    SELECT * INTO v_subscription FROM get_current_subscription(p_org_id);
    
    -- Get current usage
    v_current_usage := get_current_period_usage(p_org_id, 'ANALYSIS_COMPLETED');
    
    -- Calculate remaining
    v_remaining := v_subscription.included_analyses - v_current_usage;
    
    RETURN QUERY SELECT 
        v_current_usage < v_subscription.included_analyses as allowed,
        v_current_usage as current_usage,
        v_subscription.included_analyses as included_limit,
        v_remaining as remaining,
        CASE 
            WHEN v_current_usage >= v_subscription.included_analyses THEN 
                'Analysis limit exceeded. Upgrade required for more analyses.'
            ELSE 
                'Analysis within plan limits.'
        END as message;
END;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION get_current_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_period_usage TO authenticated;
GRANT EXECUTE ON FUNCTION can_enqueue_analysis TO authenticated;
