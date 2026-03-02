-- M7: Operational Guardrails - Rate Limiting Table

-- Organization daily usage tracking for rate limiting
CREATE TABLE IF NOT EXISTS org_usage_daily (
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    analyses_requested INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for atomic upserts
    UNIQUE(org_id, day)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_org_usage_daily_org_day ON org_usage_daily(org_id, day);

-- RPC function for atomic rate limit check and increment
CREATE OR REPLACE FUNCTION check_and_increment_daily_usage(
    p_org_id UUID,
    p_daily_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    allowed BOOLEAN,
    current_count INTEGER,
    remaining INTEGER,
    message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_current_count INTEGER;
    v_remaining INTEGER;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Atomic upsert: increment counter or insert with count=1
    INSERT INTO org_usage_daily (org_id, day, analyses_requested)
    VALUES (p_org_id, v_today, 1)
    ON CONFLICT (org_id, day)
    DO UPDATE SET 
        analyses_requested = org_usage_daily.analyses_requested + 1,
        updated_at = NOW()
    RETURNING analyses_requested INTO v_current_count;
    
    -- Calculate remaining
    v_remaining := p_daily_limit - v_current_count;
    
    -- Return result
    RETURN QUERY SELECT 
        v_current_count <= p_daily_limit as allowed,
        v_current_count as current_count,
        v_remaining as remaining,
        CASE 
            WHEN v_current_count > p_daily_limit THEN 
                'Daily limit exceeded. ' || v_remaining || ' analyses remaining tomorrow.'
            ELSE 
                'Usage within limits. ' || v_remaining || ' analyses remaining today.'
        END as message;
END;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION check_and_increment_daily_usage TO authenticated;
