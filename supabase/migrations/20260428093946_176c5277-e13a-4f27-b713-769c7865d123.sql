CREATE TABLE public.transit_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  quiz_session_id UUID NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  last_invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transit_subscriptions_profile ON public.transit_subscriptions(profile_id);
CREATE INDEX idx_transit_subscriptions_customer ON public.transit_subscriptions(stripe_customer_id);
CREATE INDEX idx_transit_subscriptions_status ON public.transit_subscriptions(status);

ALTER TABLE public.transit_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage transit subscriptions"
ON public.transit_subscriptions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view their own transit subscriptions"
ON public.transit_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = transit_subscriptions.profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE TRIGGER update_transit_subscriptions_updated_at
BEFORE UPDATE ON public.transit_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();