-- Force RLS on core tables (optional but strict)
-- Run only if create_org_and_make_owner() still works

-- Force RLS - ensures no table can bypass RLS
alter table public.organizations force row level security;
alter table public.org_members force row level security;
alter table public.users force row level security;

-- Verify RLS is forced
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  forcerlspolicy as rls_forced
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'organizations', 'org_members')
ORDER BY tablename;
