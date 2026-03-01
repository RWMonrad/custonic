-- =========================
-- Custonic RLS Core Pack
-- =========================
-- Run this in Supabase SQL Editor (once)
-- Safe: won't crash if tables don't exist yet

-- 0) Optional: make sure you have UUID generator available (Supabase usually has pgcrypto)
-- create extension if not exists pgcrypto;

-- 1) Helper: "is member of org" and "is owner of org"
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_members m
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_owner(p_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_members m
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- 2) Enable RLS on core tables (only if tables exist)
do $$
begin
  if to_regclass('public.users') is not null then
    execute 'alter table public.users enable row level security';
  end if;

  if to_regclass('public.organizations') is not null then
    execute 'alter table public.organizations enable row level security';
  end if;

  if to_regclass('public.org_members') is not null then
    execute 'alter table public.org_members enable row level security';
  end if;
end $$;

-- 3) USERS policies (self access only)
do $$
begin
  if to_regclass('public.users') is not null then
    execute 'drop policy if exists users_select_self on public.users';
    execute 'create policy users_select_self on public.users for select using (id = auth.uid())';

    execute 'drop policy if exists users_update_self on public.users';
    execute 'create policy users_update_self on public.users for update using (id = auth.uid()) with check (id = auth.uid())';
  end if;
end $$;

-- 4) ORG_MEMBERS policies
-- - Members can read all members in org(s) they belong to
-- - Insert: only allow inserting yourself (used rarely; prefer RPC below)
-- - Update/Delete: owners only
do $$
begin
  if to_regclass('public.org_members') is not null then
    execute 'drop policy if exists org_members_select_same_org on public.org_members';
    execute '
      create policy org_members_select_same_org
      on public.org_members
      for select
      using (
        exists (
          select 1 from public.org_members me
          where me.org_id = org_members.org_id
            and me.user_id = auth.uid()
        )
      )
    ';

    execute 'drop policy if exists org_members_insert_self on public.org_members';
    execute '
      create policy org_members_insert_self
      on public.org_members
      for insert
      with check (user_id = auth.uid())
    ';

    execute 'drop policy if exists org_members_update_owner_only on public.org_members';
    execute '
      create policy org_members_update_owner_only
      on public.org_members
      for update
      using (public.is_org_owner(org_id))
      with check (public.is_org_owner(org_id))
    ';

    execute 'drop policy if exists org_members_delete_owner_only on public.org_members';
    execute '
      create policy org_members_delete_owner_only
      on public.org_members
      for delete
      using (public.is_org_owner(org_id))
    ';
  end if;
end $$;

-- 5) ORGANIZATIONS policies
-- - Select: only if member
-- - Insert: authenticated can create
-- - Update/Delete: owners only
do $$
begin
  if to_regclass('public.organizations') is not null then
    execute 'drop policy if exists organizations_select_if_member on public.organizations';
    execute '
      create policy organizations_select_if_member
      on public.organizations
      for select
      using (public.is_org_member(id))
    ';

    execute 'drop policy if exists organizations_insert_authenticated on public.organizations';
    execute '
      create policy organizations_insert_authenticated
      on public.organizations
      for insert
      with check (auth.uid() is not null)
    ';

    execute 'drop policy if exists organizations_update_owner_only on public.organizations';
    execute '
      create policy organizations_update_owner_only
      on public.organizations
      for update
      using (public.is_org_owner(id))
      with check (public.is_org_owner(id))
    ';

    execute 'drop policy if exists organizations_delete_owner_only on public.organizations';
    execute '
      create policy organizations_delete_owner_only
      on public.organizations
      for delete
      using (public.is_org_owner(id))
    ';
  end if;
end $$;

-- 6) RPC: create org + make caller owner (recommended onboarding path)
create or replace function public.create_org_and_make_owner(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if org_name is null or length(trim(org_name)) < 2 then
    raise exception 'Organization name too short';
  end if;

  insert into public.organizations (name, created_at)
  values (trim(org_name), now())
  returning id into new_org_id;

  insert into public.org_members (org_id, user_id, role, created_at)
  values (new_org_id, auth.uid(), 'owner', now());

  return new_org_id;
end;
$$;

revoke all on function public.create_org_and_make_owner(text) from public;
grant execute on function public.create_org_and_make_owner(text) to authenticated;

-- 7) ORG-SCOPED TABLES: enable RLS + select/insert/update/delete policies based on org_id
-- Safe: only applies if table exists
do $$
declare
  t text;
begin
  foreach t in array array[
    'contracts',
    'analyses',
    'risk_findings',
    'alerts',
    'contract_embeddings',
    'regulation_rules',
    'audit_log'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);

      execute format('drop policy if exists %I_select_if_member on public.%I', t, t);
      execute format($p$
        create policy %I_select_if_member
        on public.%I
        for select
        using (public.is_org_member(org_id))
      $p$, t, t);

      execute format('drop policy if exists %I_insert_if_member on public.%I', t, t);
      execute format($p$
        create policy %I_insert_if_member
        on public.%I
        for insert
        with check (public.is_org_member(org_id))
      $p$, t, t);

      execute format('drop policy if exists %I_update_if_member on public.%I', t, t);
      execute format($p$
        create policy %I_update_if_member
        on public.%I
        for update
        using (public.is_org_member(org_id))
        with check (public.is_org_member(org_id))
      $p$, t, t);

      execute format('drop policy if exists %I_delete_owner_only on public.%I', t, t);
      execute format($p$
        create policy %I_delete_owner_only
        on public.%I
        for delete
        using (public.is_org_owner(org_id))
      $p$, t, t);
    end if;
  end loop;
end $$;
