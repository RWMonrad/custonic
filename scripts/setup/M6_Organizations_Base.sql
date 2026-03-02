-- M6: Base Organizations Schema (prerequisite for M8)
-- Run this BEFORE M8_Invite_Onboarding.sql

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members (many-to-many)
CREATE TABLE IF NOT EXISTS org_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One membership per user per org
    UNIQUE(org_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view orgs they belong to
CREATE POLICY "Users can view their orgs" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- Owners can update their orgs
CREATE POLICY "Owners can update org" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Users can view org members
CREATE POLICY "Users can view org members" ON org_members
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- Owners/admins can manage members
CREATE POLICY "Owners/admins can insert members" ON org_members
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners/admins can update members" ON org_members
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can delete members" ON org_members
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );
