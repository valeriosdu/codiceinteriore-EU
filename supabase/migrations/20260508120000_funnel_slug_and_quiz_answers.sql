-- Add columns to support multi-angle funnel routing on quiz_sessions.
--
--   funnel_slug   which marketing angle/funnel this session belongs to.
--                 Drives teaser prompt and report sections in the edge
--                 functions (process-session-insights, generate-report).
--                 Default 'classica' so existing rows backfill cleanly.
--
--   quiz_answers  bag of angle-specific quiz responses (e.g. symptom +
--                 narrative for attivazione). New angles write here
--                 instead of adding columns. Classica still uses the
--                 dedicated columns attachment_response / focus_area
--                 for back-compat.
--
-- ADD COLUMN ... NOT NULL DEFAULT in Postgres 11+ is a fast metadata-only
-- operation: existing rows do not get rewritten, they read the default
-- value at scan time. Safe to run on a populated table.

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS funnel_slug TEXT NOT NULL DEFAULT 'classica',
  ADD COLUMN IF NOT EXISTS quiz_answers JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.quiz_sessions.funnel_slug IS
  'Marketing-angle slug (classica, attivazione, ...). Drives teaser prompt and report config.';

COMMENT ON COLUMN public.quiz_sessions.quiz_answers IS
  'Angle-specific quiz answers as JSONB. Classica stays on attachment_response/focus_area for back-compat; new angles write here.';
