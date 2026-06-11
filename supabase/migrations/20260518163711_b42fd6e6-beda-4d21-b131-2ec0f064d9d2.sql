-- One-shot rescue: re-enqueue DLQ messages for marte1000@libero.it back into the main queue,
-- refreshing queued_at so the TTL check in process-email-queue passes.
DO $$
DECLARE
  r RECORD;
  v_new_id BIGINT;
BEGIN
  FOR r IN
    SELECT msg_id, message
    FROM pgmq.q_transactional_emails_dlq
    WHERE message->>'to' = 'marte1000@libero.it'
  LOOP
    SELECT pgmq.send(
      'transactional_emails',
      r.message || jsonb_build_object('queued_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    ) INTO v_new_id;
    PERFORM pgmq.delete('transactional_emails_dlq', r.msg_id);
    RAISE NOTICE 'Re-enqueued % as new msg %', r.message->>'message_id', v_new_id;
  END LOOP;
END $$;