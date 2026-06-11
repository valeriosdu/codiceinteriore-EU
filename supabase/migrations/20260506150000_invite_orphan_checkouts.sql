-- Schedule recovery invites for paid checkouts that are still orphan after 24h.
--
-- Why: today, if a customer pays but never creates an account, the only safety
-- net is the initial `report-claim` email (sent right after payment). If they
-- miss/delete it, they're stuck. This cron runs every hour, picks paid checkouts
-- whose `claimed_profile_id` is still NULL after >24h, and calls
-- admin-recover-orphan-checkout to send a Supabase Auth invite (magic-link).
--
-- The edge function is idempotent: it only calls inviteUserByEmail when the
-- Auth user does not yet exist, and the cron query filters out any checkout
-- already marked `recovery_invited_at`.
--
-- To revert:
--   SELECT cron.unschedule('invite-orphan-checkouts');
--   ALTER TABLE public.checkout_sessions DROP COLUMN IF EXISTS recovery_invited_at;

-- 1. Tracking column on checkout_sessions
ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS recovery_invited_at TIMESTAMPTZ;

-- Partial index keeps the cron query cheap as the table grows.
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_orphan_recovery
  ON public.checkout_sessions (payment_completed_at)
  WHERE payment_status = 'paid'
    AND claimed_profile_id IS NULL
    AND recovery_invited_at IS NULL;

-- 2. Cron job
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invite-orphan-checkouts') THEN
    PERFORM cron.unschedule('invite-orphan-checkouts');
  END IF;
END $$;

SELECT cron.schedule(
  'invite-orphan-checkouts',
  '0 * * * *',  -- top of every hour
  $$
  WITH candidates AS (
    SELECT cs.stripe_session_id
    FROM public.checkout_sessions cs
    WHERE cs.payment_status = 'paid'
      AND cs.claimed_profile_id IS NULL
      AND cs.recovery_invited_at IS NULL
      AND cs.customer_email IS NOT NULL
      AND cs.payment_completed_at < now() - interval '24 hours'
      AND cs.payment_completed_at > now() - interval '30 days'
    ORDER BY cs.payment_completed_at ASC
    LIMIT 20
  )
  SELECT net.http_post(
    url := 'https://bphmrjuvhcziimuxohnc.supabase.co/functions/v1/admin-recover-orphan-checkout',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object(
      'stripeSessionId', stripe_session_id,
      'sendInvite', true
    ),
    timeout_milliseconds := 30000
  )
  FROM candidates;
  $$
);
