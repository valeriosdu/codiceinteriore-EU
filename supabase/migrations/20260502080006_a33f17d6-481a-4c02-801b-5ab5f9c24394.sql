-- Retry job per transit_cycles bloccati / falliti.
-- Usa il vault secret 'email_queue_service_role_key' già configurato.
SELECT cron.schedule(
  'retry-stuck-transit-cycles',
  '*/5 * * * *',
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