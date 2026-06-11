ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS recovery_invite_count INTEGER NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS public.idx_checkout_sessions_orphan_recovery;

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_orphan_recovery
  ON public.checkout_sessions (payment_completed_at)
  WHERE payment_status = 'paid'
    AND claimed_profile_id IS NULL
    AND recovery_invite_count < 2;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invite-orphan-checkouts') THEN
    PERFORM cron.unschedule('invite-orphan-checkouts');
  END IF;
END $$;

SELECT cron.schedule(
  'invite-orphan-checkouts',
  '0 * * * *',
  $$
  WITH candidates AS (
    SELECT cs.stripe_session_id
    FROM public.checkout_sessions cs
    WHERE cs.payment_status = 'paid'
      AND cs.claimed_profile_id IS NULL
      AND cs.customer_email IS NOT NULL
      AND cs.recovery_invite_count < 2
      AND cs.payment_completed_at > now() - interval '30 days'
      AND (
        (cs.recovery_invite_count = 0
          AND cs.payment_completed_at < now() - interval '2 hours')
        OR
        (cs.recovery_invite_count = 1
          AND cs.recovery_invited_at IS NOT NULL
          AND cs.recovery_invited_at < now() - interval '7 days')
      )
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