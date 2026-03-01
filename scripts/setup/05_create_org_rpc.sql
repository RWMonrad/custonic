-- Safe onboarding: Atomic RPC function to create org + membership
-- This is the recommended approach for creating organizations

create or replace function public.create_org_and_make_owner(org_name text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Create the organization
  insert into public.organizations (name, slug, created_at)
  values (
    org_name, 
    lower(regexp_replace(org_name, '[^a-zA-Z0-9\s]', '', 'g')), -- Basic slug generation
    now()
  )
  returning id into new_org_id;

  -- Add user as owner
  insert into public.org_members (org_id, user_id, role, created_at)
  values (new_org_id, auth.uid(), 'owner', now());

  return new_org_id;
end;
$$;

-- Secure the function
revoke all on function public.create_org_and_make_owner(text) from public;
grant execute on function public.create_org_and_make_owner(text) to authenticated;
