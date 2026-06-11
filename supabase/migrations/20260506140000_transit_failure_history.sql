-- Persist a permanent record of every failed transit attempt so we can
-- analyze failure patterns even after a successful retry clears
-- processing_error.
--
-- The cron-based retry mechanism (slow_retry_stuck_transit_cycles) heals
-- transient failures, but in doing so wipes processing_error on the next
-- successful run. That makes it impossible to answer "why did most of our
-- recent cycles need a retry?" from current DB state alone.
--
-- failure_history is append-only and survives successful runs. Each entry:
--   { at: ISO timestamp, attempt: int, stage: string, error: string }
-- Stages: "interpretation" (LLM step), "fetch" (freeastroapi step).

alter table public.transit_cycles
  add column if not exists failure_history jsonb not null default '[]'::jsonb;

comment on column public.transit_cycles.failure_history is
  'Append-only log of failed attempts. Each entry: {at, attempt, stage, error}. Survives successful retries so we can analyze failure patterns post-hoc.';

-- Atomic append helper. Doing the read-modify-write from JS would risk
-- silently dropping entries if two paths happened to update the same row
-- (the per-cycle lock should prevent this, but defense in depth costs us
-- nothing here).
create or replace function public.append_transit_failure(
  p_cycle_id uuid,
  p_entry jsonb
) returns void
language sql
security definer
set search_path = public
as $$
  update public.transit_cycles
  set failure_history = coalesce(failure_history, '[]'::jsonb) || jsonb_build_array(p_entry)
  where id = p_cycle_id;
$$;

revoke all on function public.append_transit_failure(uuid, jsonb) from public;
grant execute on function public.append_transit_failure(uuid, jsonb) to service_role;
