-- =========================
-- M3: Storage RLS Policies
-- =========================
-- Run this after M2_RLS_Core_Pack.sql

-- 1) Create contracts bucket (if not exists) - keep it PRIVATE
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contracts',
  'contracts',
  false,
  20971520, -- 20MB limit
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

-- 2) Storage RLS policies for contracts bucket
-- Path format: contracts/{orgId}/{contractId}/{originalFileName}

-- SELECT: Users can only list/access files from their own orgs
create policy "contracts_select_own_org"
on storage.objects
for select
using (
  bucket_id = 'contracts'
  and exists (
    select 1 
    from public.org_members m 
    where m.org_id = (split_part(name, '/', 1))::uuid 
      and m.user_id = auth.uid()
  )
);

-- INSERT: Users can only upload to their own orgs
create policy "contracts_insert_own_org"
on storage.objects
for insert
with check (
  bucket_id = 'contracts'
  and exists (
    select 1 
    from public.org_members m 
    where m.org_id = (split_part(name, '/', 1))::uuid 
      and m.user_id = auth.uid()
  )
);

-- UPDATE: Users can only update files in their own orgs
create policy "contracts_update_own_org"
on storage.objects
for update
using (
  bucket_id = 'contracts'
  and exists (
    select 1 
    from public.org_members m 
    where m.org_id = (split_part(name, '/', 1))::uuid 
      and m.user_id = auth.uid()
  )
);

-- DELETE: Users can only delete files in their own orgs
create policy "contracts_delete_own_org"
on storage.objects
for delete
using (
  bucket_id = 'contracts'
  and exists (
    select 1 
    from public.org_members m 
    where m.org_id = (split_part(name, '/', 1))::uuid 
      and m.user_id = auth.uid()
  )
);

-- 3) Verify policies are in place
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  substr(qual, 1, 100) as policy_preview
from pg_policies 
where schemaname = 'storage' 
  and tablename = 'objects'
  and policyname like 'contracts_%'
order by policyname;
