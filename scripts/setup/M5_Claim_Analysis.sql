-- =========================
-- M5: Claim Analysis Job RPC
-- =========================
-- Run this after schema migrations for M5

-- 1) Create index for efficient job polling
create index if not exists idx_analyses_status_created_at 
on public.analyses (status, created_at);

-- 2) Atomic job claiming function
create or replace function public.claim_next_analysis_job()
returns table (
    analysis_id uuid,
    org_id uuid,
    contract_id uuid,
    analysis_type text
)
language plpgsql
security definer
as $$
declare
    claimed_analysis record;
begin
    -- Atomically claim one queued analysis job
    update public.analyses 
    set 
        status = 'processing',
        started_at = now(),
        updated_at = now()
    where id = (
        select id 
        from public.analyses 
        where status = 'queued' 
        order by created_at asc 
        limit 1 
        for update skip locked
    )
    returning id, org_id, contract_id, type into claimed_analysis;
    
    -- Return the claimed job details
    if claimed_analysis is not null then
        analysis_id := claimed_analysis.id;
        org_id := claimed_analysis.org_id;
        contract_id := claimed_analysis.contract_id;
        analysis_type := claimed_analysis.type;
        return next;
    end if;
    
    -- No jobs available
    return;
end;
$$;

-- 3) Grant execute to service role (or remove if using service key)
-- Note: When using service role key, no explicit grants needed
-- grant execute on function public.claim_next_analysis_job to service_role;

-- 4) Verification: Test the function
-- select * from public.claim_next_analysis_job();

-- 5) Check for queued jobs
-- select count(*) as queued_jobs 
-- from public.analyses 
-- where status = 'queued';
