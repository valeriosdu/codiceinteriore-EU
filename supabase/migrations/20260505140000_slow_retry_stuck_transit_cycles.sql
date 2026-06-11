-- Slow `retry-stuck-transit-cycles` cron from every 5 min to every 15 min.
-- Why: transit cycles are monthly, and a 5-min retry cadence costs ~120
-- cron firings/hour (plus up to 10 fan-out invocations of process-transit-cycle
-- per tick). 15 min cuts that 3x with negligible UX impact: a stuck cycle now
-- recovers within ~15 min instead of ~5 min.
--
-- The per-row backoff inside the job (`interval '5 minutes' * (1 + retry_count)`)
-- is left untouched — it controls retry spacing for an individual row, not
-- cron frequency. With a 15-min tick, that backoff effectively becomes the
-- minimum retry spacing for retry_count=0..1.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retry-stuck-transit-cycles') THEN
    PERFORM cron.unschedule('retry-stuck-transit-cycles');
  END IF;
END $$;

SELECT cron.schedule(
  'retry-stuck-transit-cycles',
  '*/15 * * * *',
  $$
  WITH candidates AS (
    SELECT tc.id, tc.retry_count, tc.updated_at
    FROM public.transit_cycles tc
    JOIN public.user_entitlements ue ON ue.id = tc.entitlement_id
    WHERE tc.status IN ('failed', 'pending', 'processing')
      AND COALESCE(tc.retry_count, 0) < 6
      AND tc.updated_at < now() - (interval '5 minutes' * (1 + COALESCE(tc.retry_count, 0)))
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
