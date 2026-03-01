-- Policies for org_members table (the foundation of org security)

-- Users can only read their own memberships
create policy "org_members_select_own"
on public.org_members
for select
using (user_id = auth.uid());

-- Users can insert their own membership (needed for onboarding)
create policy "org_members_insert_self"
on public.org_members
for insert
with check (user_id = auth.uid());

-- Users can update their own membership
create policy "org_members_update_own"
on public.org_members
for update
using (user_id = auth.uid());

-- Users can delete their own membership
create policy "org_members_delete_own"
on public.org_members
for delete
using (user_id = auth.uid());
