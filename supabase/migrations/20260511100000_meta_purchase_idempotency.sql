-- Idempotency flag for server-side Meta Conversions API Purchase events.
--
-- Set by stripe-reconcile and finalize-paypal-payment after a successful CAPI
-- Purchase fire. Pre-check on subsequent webhook redeliveries (Stripe retries,
-- PayPal redeliveries) skips the duplicate call to graph.facebook.com.
--
-- Meta's deterministic event_id dedup remains the backup if a race lets two
-- fires through before either updates this column.

ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS meta_purchase_sent_at timestamptz NULL;
