CREATE INDEX IF NOT EXISTS checkout_sessions_paid_completed_at_idx
  ON public.checkout_sessions (payment_status, payment_completed_at DESC);

CREATE INDEX IF NOT EXISTS checkout_sessions_email_completed_at_idx
  ON public.checkout_sessions (customer_email, payment_completed_at);

CREATE INDEX IF NOT EXISTS checkout_sessions_provider_payment_id_idx
  ON public.checkout_sessions (provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;