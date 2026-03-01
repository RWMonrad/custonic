-- Policies for organizations table

-- Users can only read organizations they are members of
create policy "organizations_select_if_member"
on public.organizations
for select
using (
  exists (
    select 1
    from public.org_members m
    where m.org_id = organizations.id
      and m.user_id = auth.uid()
  )
);

-- All authenticated users can create organizations
create policy "organizations_insert_authenticated"
on public.organizations
for insert
with check (auth.uid() is not null);

-- Users can update organizations they are members of (owners/admins only in practice)
create policy "organizations_update_if_member"
on public.organizations
for update
using (
  exists (
    select 1
    from public.org_members m
    where m.org_id = organizations.id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
);

-- Users can delete organizations they own
create policy "organizations_delete_if_owner"
on public.organizations
for delete
using (
  exists (
    select 1
    from public.org_members m
    where m.org_id = organizations.id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  )
);
