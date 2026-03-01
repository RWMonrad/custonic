-- Enable Row Level Security on core tables
-- This ensures all data access goes through policies

alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.users enable row level security;
