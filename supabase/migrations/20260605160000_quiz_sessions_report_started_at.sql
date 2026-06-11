-- Track when the report-generation phase actually (re)started, so the
-- recover-pending-reports watchdog can distinguish a freshly (re)started
-- generation from one whose background worker died.
--
-- Why: the watchdog (supabase/functions/recover-pending-reports) measures how
-- long a row has been in `report_processing` using the entitlement's created_at.
-- That timestamp is ancient for an admin regeneration of an old report, so the
-- watchdog instantly flagged the regeneration as "stuck > 10 min" and reset it
-- to failed. admin-regenerate-report now stamps report_started_at = now() when
-- it kicks off a regen; the watchdog uses COALESCE(report_started_at,
-- entitlement.created_at) as its clock. First-time generations leave this NULL
-- and fall back to the old behaviour (entitlement.created_at ~= start).

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS report_started_at TIMESTAMPTZ;
