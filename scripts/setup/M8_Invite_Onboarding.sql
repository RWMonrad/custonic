-- M8: Invite-only onboarding + abuse protection
-- Create org_invites table with proper RLS

CREATE TABLE IF NOT EXISTS org_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('member', 'admin')),
    token_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    
    -- Ensure one pending invite per email per org
    UNIQUE(org_id, email, status) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_invites_org_status ON org_invites(org_id, status);
CREATE INDEX IF NOT EXISTS idx_org_invites_token_hash ON org_invites(token_hash);
CREATE INDEX IF NOT EXISTS idx_org_invites_expires_at ON org_invites(expires_at);

-- Rate limiting table for abuse protection
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_window ON rate_limits(key, window_start);

-- Audit log for invite lifecycle
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_user ON audit_logs(org_id, user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at);
