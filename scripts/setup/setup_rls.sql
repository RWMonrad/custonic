-- ============================================
-- MILESTONE M2: DATABASE-LEVEL SECURITY (RLS)
-- ============================================
-- Run this script in Supabase SQL Editor
-- This implements complete Row Level Security for Custonic

-- STEP 1: Connect public.users to auth.users
\i 01_auth_user_trigger.sql

-- STEP 2: Enable RLS on core tables
\i 02_enable_rls.sql

-- STEP 3: org_members policies (foundation)
\i 03_org_members_policies.sql

-- STEP 4: organizations policies
\i 04_organizations_policies.sql

-- STEP 5: Safe onboarding RPC function
\i 05_create_org_rpc.sql

-- ============================================
-- VERIFICATION QUERIES (run after setup)
-- ============================================

-- Check that RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'organizations', 'org_members');

-- Check that policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check that RPC function exists and is secured
SELECT proname, prosecdef, proacl 
FROM pg_proc 
WHERE proname = 'create_org_and_make_owner';

-- Test the function (requires authenticated session)
-- SELECT public.create_org_and_make_owner('Test Org');

-- ============================================
-- NEXT STEPS FOR FUTURE TABLES
-- ============================================

-- When you add contracts, analyses, alerts, etc.
-- Use this pattern for each table:

-- alter table public.contracts enable row level security;

-- create policy "contracts_select_if_member"
-- on public.contracts
-- for select
-- using (
--   exists (
--     select 1 from public.org_members m
--     where m.org_id = contracts.org_id
--       and m.user_id = auth.uid()
--   )
-- );

-- create policy "contracts_insert_if_member"
-- on public.contracts
-- for insert
-- with check (
--   exists (
--     select 1 from public.org_members m
--     where m.org_id = contracts.org_id
--       and m.user_id = auth.uid()
--   )
-- );
