-- M7.1: Plan Seeding Data

-- Insert organization plans
INSERT INTO org_plans (key, name, monthly_price_cents, included_analyses, included_contracts, max_file_size_bytes, max_queue_depth, ai_provider_allowed) VALUES
('free', 'Free Plan', 0, 10, 50, 10485760, 5, ARRAY['mock']), -- 10MB, 5 queue depth
('pro', 'Pro Plan', 2900, 200, 1000, 20971520, 20, ARRAY['mock', 'openai']), -- 20MB, 20 queue depth
('business', 'Business Plan', 9900, 1000, 10000, 52428800, 50, ARRAY['mock', 'openai', 'anthropic']) -- 50MB, 50 queue depth
ON CONFLICT (key) DO NOTHING;

-- Update existing organizations to have free subscriptions
INSERT INTO org_subscriptions (org_id, plan_key, status, current_period_start, current_period_end)
SELECT 
    id as org_id,
    'free' as plan_key,
    'active' as status,
    DATE_TRUNC('month', CURRENT_DATE) as current_period_start,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') as current_period_end
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM org_subscriptions s WHERE s.org_id = o.id
)
ON CONFLICT (org_id) DO NOTHING;

-- Verify seeding
SELECT 
    p.key,
    p.name,
    p.monthly_price_cents / 100.0 as price_usd,
    p.included_analyses,
    p.max_file_size_bytes / 1024.0 / 1024.0 as max_file_size_mb
FROM org_plans p
ORDER BY p.monthly_price_cents;
