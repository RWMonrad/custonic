-- M7.1: USD Plans Seed - Simple and Robust
-- Safe "upsert" seed for org_plans with USD pricing

INSERT INTO public.org_plans
  (key, name, monthly_price_cents, included_analyses, included_contracts, max_file_size_bytes, max_queue_depth, created_at)
VALUES
  ('free', 'Free', 0, 10, 50, 10485760, 50, now()),
  ('pro', 'Pro', 2900, 200, 2000, 20971520, 200, now()),
  ('business', 'Business', 9900, 1000, 10000, 52428800, 500, now())
ON CONFLICT (key) DO UPDATE SET
  name = excluded.name,
  monthly_price_cents = excluded.monthly_price_cents,
  included_analyses = excluded.included_analyses,
  included_contracts = excluded.included_contracts,
  max_file_size_bytes = excluded.max_file_size_bytes,
  max_queue_depth = excluded.max_queue_depth;

-- Verify seeding
SELECT 
  key,
  name,
  monthly_price_cents / 100.0 as price_usd,
  included_analyses,
  included_contracts,
  max_file_size_bytes / 1024.0 / 1024.0 as max_file_size_mb,
  max_queue_depth
FROM org_plans 
ORDER BY monthly_price_cents;
