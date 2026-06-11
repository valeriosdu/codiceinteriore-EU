UPDATE public.user_reports ur
SET is_active = false,
    updated_at = now()
FROM public.profiles p, public.quiz_sessions q
WHERE ur.profile_id = p.id
  AND ur.quiz_session_id = q.id
  AND lower(p.email) = lower('valerios.ducci@gmail.com')
  AND q.user_name = 'Deborah';

DELETE FROM public.user_reports ur
USING public.profiles p, public.quiz_sessions q
WHERE ur.profile_id = p.id
  AND ur.quiz_session_id = q.id
  AND lower(p.email) = lower('valerios.ducci@gmail.com')
  AND q.user_name = 'Deborah'
  AND coalesce(ur.stripe_session_id, '') = '';

UPDATE public.user_reports ur
SET is_active = (ur.quiz_session_id = 'ec476442-68c5-4c4c-b0a4-0063bc32685f'::uuid),
    updated_at = now()
FROM public.profiles p
WHERE ur.profile_id = p.id
  AND lower(p.email) = lower('valerios.ducci@gmail.com');

UPDATE public.profiles
SET quiz_session_id = 'ec476442-68c5-4c4c-b0a4-0063bc32685f'::uuid,
    stripe_session_id = 'cs_live_a1rHeg0NndUah03vOIpwcZH7TUqe1QGGdYZKrhUNAsjwJHRdtbadOcD0yA',
    updated_at = now()
WHERE lower(email) = lower('valerios.ducci@gmail.com');

CREATE OR REPLACE FUNCTION public.validate_paid_user_report_link()
RETURNS TRIGGER AS $$
BEGIN
  IF coalesce(NEW.stripe_session_id, '') = '' THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'A paid checkout session is required to link a new report';
    END IF;

    IF TG_OP = 'UPDATE'
      AND OLD.stripe_session_id IS NULL
      AND NEW.quiz_session_id IS DISTINCT FROM OLD.quiz_session_id THEN
      RAISE EXCEPTION 'A paid checkout session is required to change a report link';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS validate_paid_user_report_link_trigger ON public.user_reports;
CREATE TRIGGER validate_paid_user_report_link_trigger
BEFORE INSERT OR UPDATE OF quiz_session_id, stripe_session_id ON public.user_reports
FOR EACH ROW
EXECUTE FUNCTION public.validate_paid_user_report_link();