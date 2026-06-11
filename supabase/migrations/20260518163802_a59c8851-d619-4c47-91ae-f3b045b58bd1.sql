DO $$
DECLARE
  r RECORD;
  v_new_id BIGINT;
  v_count INT := 0;
BEGIN
  FOR r IN
    SELECT msg_id, message FROM pgmq.q_transactional_emails_dlq
  LOOP
    SELECT pgmq.send(
      'transactional_emails',
      r.message || jsonb_build_object('queued_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    ) INTO v_new_id;
    PERFORM pgmq.delete('transactional_emails_dlq', r.msg_id);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Re-enqueued % messages from transactional DLQ', v_count;
END $$;