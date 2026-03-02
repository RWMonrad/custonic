-- M8: RLS policies for org_invites table

-- Enable RLS on org_invites
ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

-- Org members can view invites for their org
CREATE POLICY "Org members can view org invites" ON org_invites
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- Only owners/admins can create invites
CREATE POLICY "Owners/admins can create invites" ON org_invites
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Only owners/admins can update invites (revoke)
CREATE POLICY "Owners/admins can update invites" ON org_invites
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Only owners/admins can delete invites
CREATE POLICY "Owners/admins can delete invites" ON org_invites
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view audit logs for their org
CREATE POLICY "Users can view org audit logs" ON audit_logs
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);
