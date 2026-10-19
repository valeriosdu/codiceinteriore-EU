-- =====================================================================
-- MULTI-MARKET: allowlist mercato `fi` / lingua `fi`
--
-- Quinto mercato (Finlandia, finlandese, EUR) accanto a it, es, us e nl.
-- Come per nl (20260820120000): le due RPC SECURITY DEFINER di creazione
-- sessione validano language/market contro un'allowlist DENTRO la funzione, e
-- finche' l'allowlist non conosce fi una sessione finlandese degrada in
-- SILENZIO a it (report, PDF, email in italiano, price ID italiani).
--
--   language -> (it, es, en, nl, fi)   market -> (it, es, us, nl, fi)
--
-- Il corpo delle funzioni e' quello della 20260820120000, verificato identico
-- alla definizione in produzione il 19/10/2026: cambiano solo le quattro
-- liste IN. Allargamento puro, nessun mercato esistente cambia comportamento.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.create_quiz_session(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_id uuid;
  v_language text := CASE
    WHEN p_payload->>'language' IN ('it', 'es', 'en', 'nl', 'fi') THEN p_payload->>'language'
    ELSE 'it'
  END;
  v_market text := CASE
    WHEN p_payload->>'market' IN ('it', 'es', 'us', 'nl', 'fi') THEN p_payload->>'market'
    ELSE 'it'
  END;
BEGIN
  INSERT INTO public.quiz_sessions (
    user_name,
    birth_date,
    birth_time,
    birth_place,
    birth_lat,
    birth_lng,
    birth_timezone,
    birth_timezone_iana,
    processing_status,
    funnel_slug,
    quiz_answers,
    attachment_response,
    focus_area,
    language,
    market
  ) VALUES (
    p_payload->>'user_name',
    p_payload->'birth_date',
    p_payload->'birth_time',
    p_payload->>'birth_place',
    (p_payload->>'birth_lat')::double precision,
    (p_payload->>'birth_lng')::double precision,
    (p_payload->>'birth_timezone')::double precision,
    p_payload->>'birth_timezone_iana',
    COALESCE(p_payload->>'processing_status', 'pending'),
    COALESCE(p_payload->>'funnel_slug', 'classica'),
    COALESCE(p_payload->'quiz_answers', '{}'::jsonb),
    p_payload->>'attachment_response',
    p_payload->>'focus_area',
    v_language,
    v_market
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_quiz_session(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_quiz_session(jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_synastry_session(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_id uuid;
  v_language text := CASE
    WHEN p_payload->>'language' IN ('it', 'es', 'en', 'nl', 'fi') THEN p_payload->>'language'
    ELSE 'it'
  END;
  v_market text := CASE
    WHEN p_payload->>'market' IN ('it', 'es', 'us', 'nl', 'fi') THEN p_payload->>'market'
    ELSE 'it'
  END;
BEGIN
  INSERT INTO public.synastry_sessions (
    funnel_slug,
    processing_status,
    client_name,
    focus_relational,
    relationship_duration,
    person_a_name,
    person_a_birth_date,
    person_a_birth_time,
    person_a_time_known,
    person_a_birth_place,
    person_a_birth_lat,
    person_a_birth_lng,
    person_a_birth_timezone,
    person_a_birth_timezone_iana,
    person_b_name,
    person_b_birth_date,
    person_b_birth_time,
    person_b_time_known,
    person_b_birth_place,
    person_b_birth_lat,
    person_b_birth_lng,
    person_b_birth_timezone,
    person_b_birth_timezone_iana,
    language,
    market
  ) VALUES (
    COALESCE(p_payload->>'funnel_slug', 'coppia'),
    COALESCE(p_payload->>'processing_status', 'pending'),
    p_payload->>'client_name',
    p_payload->>'focus_relational',
    p_payload->>'relationship_duration',
    p_payload->>'person_a_name',
    p_payload->'person_a_birth_date',
    p_payload->'person_a_birth_time',
    COALESCE((p_payload->>'person_a_time_known')::boolean, true),
    p_payload->>'person_a_birth_place',
    (p_payload->>'person_a_birth_lat')::double precision,
    (p_payload->>'person_a_birth_lng')::double precision,
    (p_payload->>'person_a_birth_timezone')::double precision,
    p_payload->>'person_a_birth_timezone_iana',
    p_payload->>'person_b_name',
    p_payload->'person_b_birth_date',
    p_payload->'person_b_birth_time',
    COALESCE((p_payload->>'person_b_time_known')::boolean, true),
    p_payload->>'person_b_birth_place',
    (p_payload->>'person_b_birth_lat')::double precision,
    (p_payload->>'person_b_birth_lng')::double precision,
    (p_payload->>'person_b_birth_timezone')::double precision,
    p_payload->>'person_b_birth_timezone_iana',
    v_language,
    v_market
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_synastry_session(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_synastry_session(jsonb) TO anon, authenticated;
