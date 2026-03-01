-- =========================
-- M3: Contract Constraints
-- =========================
-- Run this after M3_Storage_RLS.sql

-- 1) Add unique constraint on file_path to prevent orphaned references
-- This ensures each storage file is referenced by only one contract
alter table public.contracts 
add constraint unique_contract_file_path 
unique (file_url);

-- 2) Add soft delete column (if not exists via migration)
-- Note: This should be handled by Drizzle migration in production
alter table public.contracts 
add column if not exists deleted_at timestamp;

-- 3) Create index for soft delete queries
create index if not exists idx_contracts_not_deleted 
on public.contracts (id) 
where deleted_at is null;

-- 4) Verify constraints
select 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu 
  on tc.constraint_name = kcu.constraint_name
where tc.table_name = 'contracts' 
  and tc.table_schema = 'public'
order by tc.constraint_type, tc.constraint_name;
