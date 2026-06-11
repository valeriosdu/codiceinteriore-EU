-- Enrich checkout_sessions with full payment metadata for both Stripe and PayPal.
ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS provider_payment_id text,
  ADD COLUMN IF NOT EXISTS provider_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS amount_total integer,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_provider_payment_id
  ON public.checkout_sessions (provider_payment_id);
