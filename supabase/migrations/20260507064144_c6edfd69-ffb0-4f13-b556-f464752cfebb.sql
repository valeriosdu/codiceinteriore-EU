-- Migration 1: transit_failure_history
alter table public.transit_cycles
  add column if not exists failure_history jsonb not null default '[]'::jsonb;

comment on column public.transit_cycles.failure_history is
  'Append-only log of failed attempts. Each entry: {at, attempt, stage, error}. Survives successful retries so we can analyze failure patterns post-hoc.';

create or replace function public.append_transit_failure(
  p_cycle_id uuid,
  p_entry jsonb
) returns void
language sql
security definer
set search_path = public
as $$
  update public.transit_cycles
  set failure_history = coalesce(failure_history, '[]'::jsonb) || jsonb_build_array(p_entry)
  where id = p_cycle_id;
$$;

revoke all on function public.append_transit_failure(uuid, jsonb) from public;
grant execute on function public.append_transit_failure(uuid, jsonb) to service_role;

-- Migration 2: invite_orphan_checkouts
ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS recovery_invited_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_orphan_recovery
  ON public.checkout_sessions (payment_completed_at)
  WHERE payment_status = 'paid'
    AND claimed_profile_id IS NULL
    AND recovery_invited_at IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invite-orphan-checkouts') THEN
    PERFORM cron.unschedule('invite-orphan-checkouts');
  END IF;
END $$;

SELECT cron.schedule(
  'invite-orphan-checkouts',
  '0 * * * *',
  $CRON$
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
  $CRON$
);

-- Migration 3: ai_generation_metrics
CREATE TABLE IF NOT EXISTS public.ai_generation_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  function_name TEXT NOT NULL,
  model TEXT,
  quiz_session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE SET NULL,
  transit_cycle_id UUID,
  attempt SMALLINT NOT NULL DEFAULT 1,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  http_status INTEGER,
  error_code TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_metrics_created_at
ON public.ai_generation_metrics (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generation_metrics_function
ON public.ai_generation_metrics (function_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generation_metrics_session
ON public.ai_generation_metrics (quiz_session_id)
WHERE quiz_session_id IS NOT NULL;

ALTER TABLE public.ai_generation_metrics ENABLE ROW LEVEL SECURITY;