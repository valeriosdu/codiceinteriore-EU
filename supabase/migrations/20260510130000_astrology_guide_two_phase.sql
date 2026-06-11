-- Follow-up to 20260510120000_astrology_guide.sql.
--
-- Brings the live schema in line with the post-refactor design:
--   1. Adds 'ready' status to the CHECK constraint (two-phase pipeline:
--      generate-now → park as 'ready' → release at scheduled_for).
--   2. Refreshes the partial index to cover 'ready' rows.
--   3. Updates grant_initial_astrology_credit() to grant 2 free credits
--      instead of 1 (idempotent: CREATE OR REPLACE).
--   4. Reschedules the cron at every 5 minutes (was every 2) with the
--      updated 3-branch query that drives the two-phase pipeline.
--
-- Idempotent: safe to run regardless of whether the original migration was
-- applied in its 1-credit / 4-status / 2-minute form, the intermediate
-- 2-credit form, or the final form. It always converges to the latter.
--
-- NOTE: this migration does NOT retroactively top up customers who were
-- granted 1 free credit under the old policy. See the SQL note at the
-- bottom of the file for a one-shot top-up command if you want to handle
-- existing beta users.

-- ============================================================================
-- 1. Allow 'ready' in status.
-- ============================================================================

ALTER TABLE public.astrology_guide_questions
  DROP CONSTRAINT IF EXISTS astrology_guide_questions_status_check;

ALTER TABLE public.astrology_guide_questions
  ADD CONSTRAINT astrology_guide_questions_status_check
    CHECK (status IN ('pending', 'processing', 'ready', 'completed', 'failed'));

-- ============================================================================
-- 2. Refresh partial index to include 'ready'.
-- ============================================================================

DROP INDEX IF EXISTS public.idx_astrology_guide_questions_pending;

CREATE INDEX idx_astrology_guide_questions_pending
  ON public.astrology_guide_questions (status, scheduled_for)
  WHERE status IN ('pending', 'processing', 'ready');

-- ============================================================================
-- 3. Trigger function: 2 free credits on new user_reports row.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.grant_initial_astrology_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.profile_id IS NOT NULL AND NEW.quiz_session_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.astrology_guide_credits
      WHERE profile_id = NEW.profile_id
        AND quiz_session_id = NEW.quiz_session_id
    ) THEN
      PERFORM public.grant_astrology_credits(NEW.profile_id, NEW.quiz_session_id, 2);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. Reschedule the cron at 5 min with the 3-branch query.
-- Drops the existing schedule (if any) before re-creating, so this is safe
-- regardless of the prior cron state.
-- ============================================================================

DO $$
BEGIN
  PERFORM cron.unschedule('process-astrology-questions');
EXCEPTION WHEN OTHERS THEN
  -- Job was never scheduled, that's fine.
  NULL;
END
$$;

SELECT cron.schedule(
  'process-astrology-questions',
  '*/5 * * * *',
  $$
  WITH candidates AS (
    -- A) Safety net: pending rows not generated within 1 minute of insert
    -- (immediate fire-and-forget invoke from submit failed or was lost).
    SELECT id
    FROM public.astrology_guide_questions
    WHERE status = 'pending'
      AND created_at < now() - interval '1 minute'
      AND retry_count < 3
    UNION ALL
    -- B) Stale processing: function timed out mid-generation.
    SELECT id
    FROM public.astrology_guide_questions
    WHERE status = 'processing'
      AND updated_at < now() - interval '5 minutes'
      AND retry_count < 3
    UNION ALL
    -- C) Release time: answer is generated, scheduled_for has arrived.
    SELECT id
    FROM public.astrology_guide_questions
    WHERE status = 'ready'
      AND scheduled_for <= now()
    ORDER BY 1
    LIMIT 20
  )
  SELECT net.http_post(
    url := 'https://bphmrjuvhcziimuxohnc.supabase.co/functions/v1/process-astrology-questions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object('questionId', id),
    timeout_milliseconds := 5000
  )
  FROM candidates;
  $$
);

-- ============================================================================
-- Optional retroactive top-up (NOT executed by this migration).
--
-- If you want to bring early customers (granted 1 free credit under the old
-- policy) up to the new 2-credit baseline, run this SQL manually. It targets
-- rows whose granted total is "1 + multiples of 10", i.e. the natural
-- signature of "1 free + N packs":
--
--   UPDATE public.astrology_guide_credits
--   SET balance = balance + 1,
--       total_granted = total_granted + 1,
--       updated_at = now()
--   WHERE (total_granted % 10) = 1;
--
-- Heuristic, not perfect — admin-granted custom amounts can throw it off.
-- For surgical control, use the admin tool ("/admin/astrology-guide" →
-- "Crediti cliente" → "Concedi") to top up specific customers.
-- ============================================================================
