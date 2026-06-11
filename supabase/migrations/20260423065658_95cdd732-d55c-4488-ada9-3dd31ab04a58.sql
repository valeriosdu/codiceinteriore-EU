CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text NOT NULL UNIQUE,
  quiz_session_id uuid NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  purchase_type text NOT NULL,
  customer_email text,
  payment_status text NOT NULL DEFAULT 'open',
  claimed_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage checkout sessions" ON public.checkout_sessions;
CREATE POLICY "Service role can manage checkout sessions"
ON public.checkout_sessions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view their checkout sessions" ON public.checkout_sessions;
CREATE POLICY "Users can view their checkout sessions"
ON public.checkout_sessions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = checkout_sessions.claimed_profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND lower(p.email) = lower(checkout_sessions.customer_email)
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_quiz_session_id ON public.checkout_sessions(quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_customer_email ON public.checkout_sessions(lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_payment_status ON public.checkout_sessions(payment_status);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_claimed_profile_id ON public.checkout_sessions(claimed_profile_id);

DROP TRIGGER IF EXISTS update_checkout_sessions_updated_at ON public.checkout_sessions;
CREATE TRIGGER update_checkout_sessions_updated_at
BEFORE UPDATE ON public.checkout_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();