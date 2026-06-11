-- Speed up recovery of failed/stuck transit cycles from ~15 min to ~1 min.
--
-- Why: process-transit-cycle fetches its 10 FreeAstroAPI snapshots and, on any
-- single failure, marks the whole cycle 'failed' (no per-call retry). With the
-- previous cadence (tick every 15 min + per-row backoff of 5 min * (1+retry_count))
-- a transient rate-limit blip kept the user waiting ~15 min for the retry.
--
-- This reschedules the same 'retry-stuck-transit-cycles' job with two changes:
--   * tick: '*/15 * * * *' -> '* * * * *' (every minute)
--   * per-row backoff: interval '5 minutes' * (1 + retry_count)
--                   -> interval '1 minute'  * retry_count
-- A once-failed cycle has retry_count = 1 (the handler's claim increments it),
-- so it becomes eligible again after ~1 min. Later retries space out (2, 3, 4,
-- 5 min) as retry_count grows, up to the existing '< 6' cap, so a longer outage
-- does not burn every attempt in seconds. Empty ticks are a cheap SELECT, and
-- the 5-min stale-lock in the handler prevents a still-processing cycle from
-- being double-invoked.
--
-- Everything else (candidates CTE, fan-out LIMIT 10, net.http_post with the
-- vault service-role key, timeout) is copied verbatim from
-- 20260505140000_slow_retry_stuck_transit_cycles.sql.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retry-stuck-transit-cycles') THEN
    PERFORM cron.unschedule('retry-stuck-transit-cycles');
  END IF;
END $$;

SELECT cron.schedule(
  'retry-stuck-transit-cycles',
  '* * * * *',
  $$
  WITH candidates AS (
    SELECT tc.id, tc.retry_count, tc.updated_at
    FROM public.transit_cycles tc
    JOIN public.user_entitlements ue ON ue.id = tc.entitlement_id
    WHERE tc.status IN ('failed', 'pending', 'processing')
      AND COALESCE(tc.retry_count, 0) < 6
      AND tc.updated_at < now() - (interval '1 minute' * COALESCE(tc.retry_count, 0))
      AND ue.entitlement_type = 'monthly_transits'
      AND ue.status = 'active'
      AND (ue.ends_at IS NULL OR ue.ends_at > now())
    ORDER BY tc.updated_at ASC
    LIMIT 10
  )
  SELECT net.http_post(
    url := 'https://bphmrjuvhcziimuxohnc.supabase.co/functions/v1/process-transit-cycle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object('transitCycleId', id),
    timeout_milliseconds := 5000
  )
  FROM candidates;
  $$
);
