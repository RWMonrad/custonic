-- Connect public.users to auth.users
-- This trigger automatically creates/updates a user record when someone signs up

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
