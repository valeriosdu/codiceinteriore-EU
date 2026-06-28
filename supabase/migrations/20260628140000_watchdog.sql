-- Watchdog: read-only health-collector RPC + a 30-min pg_cron tick that calls
-- the `watchdog` edge function. No business tables or RLS are touched.
--
-- `watchdog_collect()` is SECURITY DEFINER for one reason: it reads
-- `cron.job_run_details` (not exposed to the service_role via PostgREST) to tell
-- whether the recovery cron is still running. Everything else it reads, the
-- service_role could read directly; bundling it into one RPC keeps the edge
-- function to a single round-trip and lets the checks be expressed as SQL.
-- It only ever SELECTs. Counts are uncapped (for accurate surge detection);
-- sample arrays are capped at 10 rows for the alert email body.

create or replace function public.watchdog_collect()
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
with llm as (
  select count(*)::int as attempts,
         count(*) filter (where success)::int as successes
  from public.ai_generation_metrics
  where created_at > now() - interval '60 minutes'
    and function_name in ('generate-report','generate-synastry-report','process-transit-cycle')
),
paid as (
  select cs.id, cs.market, cs.customer_email,
         round(extract(epoch from (now() - cs.payment_completed_at)) / 60.0)::int as age_min
  from public.checkout_sessions cs
  left join public.quiz_sessions qs on qs.id = cs.quiz_session_id
  left join public.synastry_sessions ss on ss.id = cs.synastry_session_id
  where cs.payment_status = 'paid'
    and cs.claimed_profile_id is null
    and cs.payment_completed_at between now() - interval '24 hours' and now() - interval '15 minutes'
    and coalesce(qs.full_report, ss.full_report) is null
),
failing as (
  select id, market, 'natal' as kind
  from public.quiz_sessions
  where processing_status = 'failed' and full_report is null
    and coalesce(report_started_at, created_at) > now() - interval '60 minutes'
  union all
  select id, market, 'synastry' as kind
  from public.synastry_sessions
  where processing_status = 'failed' and full_report is null
    and coalesce(updated_at, created_at) > now() - interval '60 minutes'
),
silent as (
  select ur.quiz_session_id as id, qs.market
  from public.user_reports ur
  join public.quiz_sessions qs on qs.id = ur.quiz_session_id
  where ur.is_active = true
    and ur.created_at between now() - interval '24 hours' and now() - interval '15 minutes'
    and qs.full_report is not null
    and not exists (
      select 1 from public.email_send_log esl
      where esl.message_id = 'report-ready-' || qs.id::text
        and esl.status in ('sent','pending','suppressed')
    )
),
transits as (
  select tc.id, tc.status, tc.fetch_status, tc.interpretation_status,
         coalesce(tc.retry_count, 0) as retry_count
  from public.transit_cycles tc
  where tc.updated_at > now() - interval '24 hours'
    and (
      (tc.status = 'failed' and coalesce(tc.retry_count, 0) >= 5)
      or (tc.fetch_status = 'processing' and tc.updated_at < now() - interval '15 minutes')
      or (tc.interpretation_status = 'processing' and tc.updated_at < now() - interval '15 minutes')
    )
),
recovery as (
  select max(jr.start_time) as last_run
  from cron.job_run_details jr
  join cron.job j on j.jobid = jr.jobid
  where j.jobname = 'recover-pending-reports'
    and jr.start_time > now() - interval '2 hours'
)
select jsonb_build_object(
  'generated_at', now(),
  'llm', (select jsonb_build_object('attempts', attempts, 'successes', successes) from llm),
  'paid_no_report', jsonb_build_object(
    'count', (select count(*) from paid),
    'samples', coalesce((select jsonb_agg(to_jsonb(x)) from (select * from paid order by age_min asc limit 10) x), '[]'::jsonb)),
  'reports_failing', jsonb_build_object(
    'count', (select count(*) from failing),
    'samples', coalesce((select jsonb_agg(to_jsonb(x)) from (select * from failing limit 10) x), '[]'::jsonb)),
  'email_silent_drop', jsonb_build_object(
    'count', (select count(*) from silent),
    'samples', coalesce((select jsonb_agg(to_jsonb(x)) from (select * from silent limit 10) x), '[]'::jsonb)),
  'transits_stuck', jsonb_build_object(
    'count', (select count(*) from transits),
    'samples', coalesce((select jsonb_agg(to_jsonb(x)) from (select * from transits limit 10) x), '[]'::jsonb)),
  'recovery', jsonb_build_object(
    'last_run', (select last_run from recovery),
    'age_min', (select round(extract(epoch from (now() - last_run)) / 60.0, 1) from recovery))
);
$$;

revoke all on function public.watchdog_collect() from public;
grant execute on function public.watchdog_collect() to service_role;

-- 30-min tick → watchdog edge function. verify_jwt=true: the gateway validates
-- the service-role JWT below, and the function checks the role claim
-- (claims.role = 'service_role') — same auth pattern as recover-pending-reports.
select cron.schedule(
  'watchdog',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/watchdog',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'email_queue_service_role_key'
      ),
      'x-admin-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'admin_secret')
    ),
    body := jsonb_build_object('source', 'cron'),
    timeout_milliseconds := 30000
  );
  $$
);

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'admin_secret') then
    raise warning 'Vault secret ''admin_secret'' missing: the watchdog cron will 401 until it is set.';
  end if;
  if not exists (select 1 from vault.decrypted_secrets where name = 'project_url') then
    raise warning 'Vault secret ''project_url'' missing: the watchdog cron cannot resolve the function URL.';
  end if;
end $$;
