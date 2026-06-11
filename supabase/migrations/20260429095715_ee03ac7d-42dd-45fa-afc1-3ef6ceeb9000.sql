-- Reset stuck transit cycles and trigger reprocessing
UPDATE public.transit_cycles
SET status='pending',
    fetch_status='pending',
    interpretation_status='pending',
    processing_error=NULL,
    updated_at=now()
WHERE interpretation_status != 'completed'
  AND id IN (
    '5d6916c7-2544-4a80-926c-9028bc950204',
    '8d429ec7-0afe-46ca-87f1-2c6833b2ad76',
    '94224c7f-e851-4028-8b4a-3e21123a635f',
    '0b05c2ec-6858-442c-b57d-42cd5c61dba1',
    'bb2c1221-48e3-4cfb-a2d9-12cff59f2a67',
    '17265bcc-2e70-471f-b0b7-592203564152',
    '86e3d365-0d65-425e-9bca-f249e5a1a293',
    '13b9fdcc-7293-4482-a7d5-26b3bdfaff68'
  );

-- Trigger reprocessing via pg_net using the admin secret stored in vault.
-- We rely on the existing 'email_queue_service_role_key' pattern: try to read
-- admin_secret if present, otherwise just leave the rows reset (admin can click
-- "Genera transito" in the dashboard and the new fix will make it work).
DO $$
DECLARE
  admin_secret text;
  cid uuid;
BEGIN
  SELECT decrypted_secret INTO admin_secret
  FROM vault.decrypted_secrets
  WHERE name = 'admin_secret' OR name = 'ADMIN_SECRET'
  LIMIT 1;

  IF admin_secret IS NULL THEN
    RAISE NOTICE 'admin_secret not in vault — cycles reset; trigger manually from admin UI.';
    RETURN;
  END IF;

  FOR cid IN SELECT id FROM public.transit_cycles
    WHERE interpretation_status != 'completed'
      AND id IN (
        '5d6916c7-2544-4a80-926c-9028bc950204',
        '8d429ec7-0afe-46ca-87f1-2c6833b2ad76',
        '94224c7f-e851-4028-8b4a-3e21123a635f',
        '0b05c2ec-6858-442c-b57d-42cd5c61dba1',
        'bb2c1221-48e3-4cfb-a2d9-12cff59f2a67',
        '17265bcc-2e70-471f-b0b7-592203564152',
        '86e3d365-0d65-425e-9bca-f249e5a1a293',
        '13b9fdcc-7293-4482-a7d5-26b3bdfaff68'
      )
  LOOP
    PERFORM net.http_post(
      url := 'https://bphmrjuvhcziimuxohnc.supabase.co/functions/v1/process-transit-cycle',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-admin-secret', admin_secret
      ),
      body := jsonb_build_object('transitCycleId', cid::text),
      timeout_milliseconds := 60000
    );
  END LOOP;
END $$;