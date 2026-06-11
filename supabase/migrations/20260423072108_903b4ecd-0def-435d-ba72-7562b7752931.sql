CREATE TABLE public.user_entitlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  entitlement_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_entitlements_type_check CHECK (entitlement_type IN ('natal_report', 'monthly_transits')),
  CONSTRAINT user_entitlements_status_check CHECK (status IN ('active', 'expired', 'cancelled', 'revoked')),
  CONSTRAINT user_entitlements_source_check CHECK (source IN ('base_purchase', 'premium_purchase', 'transit_renewal', 'manual_admin'))
);

CREATE TABLE public.transit_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  entitlement_id UUID NOT NULL REFERENCES public.user_entitlements(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  fetch_status TEXT NOT NULL DEFAULT 'pending',
  interpretation_status TEXT NOT NULL DEFAULT 'pending',
  raw_transits JSONB,
  interpreted_transits JSONB,
  processing_error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT transit_cycles_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT transit_cycles_fetch_status_check CHECK (fetch_status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT transit_cycles_interpretation_status_check CHECK (interpretation_status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT transit_cycles_period_check CHECK (period_end >= period_start)
);

CREATE UNIQUE INDEX user_entitlements_natal_unique
ON public.user_entitlements(profile_id, quiz_session_id, entitlement_type)
WHERE entitlement_type = 'natal_report' AND quiz_session_id IS NOT NULL;

CREATE UNIQUE INDEX user_entitlements_transits_payment_unique
ON public.user_entitlements(profile_id, stripe_session_id, entitlement_type)
WHERE entitlement_type = 'monthly_transits' AND stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX transit_cycles_entitlement_period_unique
ON public.transit_cycles(entitlement_id, period_start, period_end);

CREATE INDEX idx_user_entitlements_profile_type_status ON public.user_entitlements(profile_id, entitlement_type, status);
CREATE INDEX idx_user_entitlements_stripe_session ON public.user_entitlements(stripe_session_id);
CREATE INDEX idx_transit_cycles_profile_status ON public.transit_cycles(profile_id, status);
CREATE INDEX idx_transit_cycles_quiz_session ON public.transit_cycles(quiz_session_id);
CREATE INDEX idx_transit_cycles_entitlement ON public.transit_cycles(entitlement_id);

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entitlements"
ON public.user_entitlements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_entitlements.profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage entitlements"
ON public.user_entitlements
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view their own transit cycles"
ON public.transit_cycles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = transit_cycles.profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage transit cycles"
ON public.transit_cycles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_user_entitlements_updated_at
BEFORE UPDATE ON public.user_entitlements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transit_cycles_updated_at
BEFORE UPDATE ON public.transit_cycles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();