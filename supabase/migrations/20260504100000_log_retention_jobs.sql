-- Daily retention DELETE jobs for log tables that would otherwise grow
-- linearly forever. Each table has a different retention horizon based on
-- how far back it's actually useful for debugging or analytics.
--
-- Retention rationale:
--   funnel_events    : 90 days  (analytics retrospettive: trend a 3 mesi)
--   email_send_log   : 60 days  (debug deliverability + bounce tracking)
--   brevo_sync_log   : 60 days  (debug sync Brevo, errori transient)
--
-- Cron times (UTC) staggered to avoid running all DELETEs simultaneously:
--   funnel_events    : 02:00 UTC
--   email_send_log   : 03:00 UTC
--   brevo_sync_log   : 04:00 UTC
--
-- All DELETEs target an indexed `created_at` predicate, so a daily run is
-- a fast index range scan and not a full table scan.
--
-- To revert the entire migration:
--   SELECT cron.unschedule('cleanup-funnel-events');
--   SELECT cron.unschedule('cleanup-email-send-log');
--   SELECT cron.unschedule('cleanup-brevo-sync-log');
--   DROP INDEX IF EXISTS public.idx_brevo_sync_log_created;

-- ============================================================
-- 0. Index needed for fast DELETE on brevo_sync_log.created_at
--    (the existing composite (email, created_at DESC) is not optimal
--    for a `WHERE created_at < X` scan because email is leading.)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_brevo_sync_log_created
  ON public.brevo_sync_log (created_at);

-- ============================================================
-- 1. funnel_events  →  90 days
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-funnel-events') THEN
    PERFORM cron.unschedule('cleanup-funnel-events');
  END IF;
END $$;

SELECT cron.schedule(
  'cleanup-funnel-events',
  '0 2 * * *',
  $$
  DELETE FROM public.funnel_events
  WHERE created_at < now() - interval '90 days'
  $$
);

-- ============================================================
-- 2. email_send_log  →  60 days
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-email-send-log') THEN
    PERFORM cron.unschedule('cleanup-email-send-log');
  END IF;
END $$;

SELECT cron.schedule(
  'cleanup-email-send-log',
  '0 3 * * *',
  $$
  DELETE FROM public.email_send_log
  WHERE created_at < now() - interval '60 days'
  $$
);

-- ============================================================
-- 3. brevo_sync_log  →  60 days
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-brevo-sync-log') THEN
    PERFORM cron.unschedule('cleanup-brevo-sync-log');
  END IF;
END $$;

SELECT cron.schedule(
  'cleanup-brevo-sync-log',
  '0 4 * * *',
  $$
  DELETE FROM public.brevo_sync_log
  WHERE created_at < now() - interval '60 days'
  $$
);
