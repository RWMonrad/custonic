-- M7.1: Stripe-Ready Extensions for Future Integration
-- These fields enable drop-in Stripe webhook handling without breaking existing billing

-- Add Stripe fields to org_subscriptions
ALTER TABLE org_subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Create indexes for Stripe webhook lookups
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_stripe_customer ON org_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_stripe_subscription ON org_subscriptions(stripe_subscription_id);

-- Add comments for documentation
COMMENT ON COLUMN org_subscriptions.stripe_customer_id IS 'Stripe customer ID for webhook correlation';
COMMENT ON COLUMN org_subscriptions.stripe_subscription_id IS 'Stripe subscription ID for webhook updates';
COMMENT ON COLUMN org_subscriptions.stripe_price_id IS 'Stripe price ID for plan identification';

-- Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'org_subscriptions' 
    AND column_name LIKE 'stripe_%'
ORDER BY column_name;
