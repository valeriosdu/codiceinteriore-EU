DO $$
DECLARE
  service_key text;
  cid uuid;
  req_id bigint;
BEGIN
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF service_key IS NULL THEN
    RAISE EXCEPTION 'service role key not found in vault';
  END IF;

  FOR cid IN SELECT id FROM public.transit_cycles
    WHERE interpretation_status != 'completed'
      AND status = 'pending'
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
    SELECT net.http_post(
      url := 'https://bphmrjuvhcziimuxohnc.supabase.co/functions/v1/process-transit-cycle',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('transitCycleId', cid::text),
      timeout_milliseconds := 120000
    ) INTO req_id;
    RAISE NOTICE 'triggered cycle % (req %)', cid, req_id;
  END LOOP;
END $$;