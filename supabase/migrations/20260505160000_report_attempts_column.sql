-- Telemetry column: how many Gemini Pro attempts generate-report made for this
-- session. Mirrors the existing `transit_cycles.retry_count` so we can measure
-- the LLM retry rate via SQL (instead of digging through edge function logs).
--
-- Semantics: set on terminal outcome only.
--   - On success: equals the 1-based attempt number that produced the report.
--   - On failure (after exhausting MAX_ATTEMPTS): equals MAX_ATTEMPTS.
--   - 0 means no LLM call was made (function bailed before the retry loop).
--
-- Read it with:
--   SELECT report_attempts, COUNT(*)
--   FROM public.quiz_sessions
--   WHERE report_attempts > 0
--   GROUP BY report_attempts;

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS report_attempts INTEGER NOT NULL DEFAULT 0;
