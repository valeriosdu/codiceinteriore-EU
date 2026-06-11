DELETE FROM public.user_reports ur
USING public.profiles p, public.quiz_sessions q
WHERE ur.profile_id = p.id
  AND ur.quiz_session_id = q.id
  AND lower(p.email) = lower('valerios.ducci@gmail.com')
  AND trim(q.user_name) = 'Deborah'
  AND ur.stripe_session_id IS NULL;

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