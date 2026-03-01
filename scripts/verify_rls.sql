-- ============================================
-- RLS VERIFICATION SCRIPT
-- ============================================
-- Run this to verify that RLS is working correctly
-- Execute as different authenticated users to test

-- 1. CHECK RLS STATUS
-- Should show 'true' for all core tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'organizations', 'org_members')
ORDER BY tablename;

-- 2. CHECK POLICIES
-- Should show policies for each table
SELECT 
  tablename,
  policyname,
  permissive,
  cmd as operation,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. CHECK RPC FUNCTION
-- Should show the function with security definer
SELECT 
  proname,
  prosecdef as security_definer,
  array_to_string(proacl, ', ') as permissions
FROM pg_proc 
WHERE proname = 'create_org_and_make_owner';

-- 4. TEST USER ACCESS PATTERNS
-- Run these queries as different authenticated users

-- Test: Users can only see their own memberships
-- SELECT * FROM public.org_members WHERE user_id = auth.uid();

-- Test: Users can only see orgs they're members of  
-- SELECT o.* FROM public.organizations o
-- JOIN public.org_members m ON o.id = m.org_id
-- WHERE m.user_id = auth.uid();

-- Test: Try to access org you're not member of (should return empty)
-- SELECT * FROM public.organizations 
-- WHERE id = 'some-other-org-id'
--   AND NOT EXISTS (
--     SELECT 1 FROM public.org_members 
--     WHERE org_id = id AND user_id = auth.uid()
--   );

-- 5. TEST RPC FUNCTION
-- Test creating org via RPC (should work for authenticated users)
-- SELECT public.create_org_and_make_owner('Test Org via RPC');

-- 6. SECURITY TESTS
-- These should fail/be empty for regular users:

-- Try to read all memberships (should only show yours)
-- SELECT COUNT(*) as total_memberships FROM public.org_members;

-- Try to update someone else's membership (should fail)
-- UPDATE public.org_members SET role = 'admin' WHERE user_id != auth.uid();

-- Try to delete org you don't own (should fail)
-- DELETE FROM public.organizations WHERE id IN (
--   SELECT org_id FROM public.org_members 
--   WHERE user_id = auth.uid() AND role != 'owner'
-- );

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- 1. All 3 tables should have rls_enabled = true
-- 2. Should see 8+ policies total across the tables
-- 3. RPC function should have security_definer = true
-- 4. Users should only see their own data
-- 5. Unauthorized access should return empty/fail
