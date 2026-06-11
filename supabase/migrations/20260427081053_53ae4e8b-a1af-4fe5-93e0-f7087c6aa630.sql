UPDATE public.transit_cycles
SET status = 'pending',
    fetch_status = 'pending',
    interpretation_status = 'pending',
    processing_error = NULL,
    updated_at = now()
WHERE id = '0b05c2ec-6858-442c-b57d-42cd5c61dba1'
  AND status = 'processing';