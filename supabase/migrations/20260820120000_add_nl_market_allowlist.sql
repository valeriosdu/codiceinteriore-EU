-- =====================================================================
-- MULTI-MARKET: allowlist mercato `nl` / lingua `nl`
--
-- Quarto mercato (Paesi Bassi, olandese, EUR) accanto a `it` (default), `es`
-- e `us`. Le due RPC SECURITY DEFINER di creazione sessione validano
-- language/market contro unallowlist DENTRO la funzione (vedi 20260611170000
-- e 20260701120000). Finche lallowlist non conosce nl, una sessione olandese
-- degrada in SILENZIO a it: report, PDF ed email uscirebbero in italiano e il
-- checkout finirebbe sui price ID sbagliati. Nessun CHECK constraint sulle
-- colonne fa da rete: queste due funzioni sono lunico punto di controllo.
--
--   language -> (it, es, en, nl)   market -> (it, es, us, nl)
--
-- Il resto delle funzioni (whitelist di colonne, default it, search_path,
-- grants) e identico alla 20260701120000: cambiano solo le quattro CASE.
-- Allargamento puro: nessun chiamante attuale invia nl, quindi il
-- comportamento dei mercati esistenti non cambia.
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
    WHEN p_payload->>'language' IN ('it', 'es', 'en', 'nl') THEN p_payload->>'language'
    ELSE 'it'
  END;
  v_market text := CASE
    WHEN p_payload->>'market' IN ('it', 'es', 'us', 'nl') THEN p_payload->>'market'
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
    WHEN p_payload->>'language' IN ('it', 'es', 'en', 'nl') THEN p_payload->>'language'
    ELSE 'it'
  END;
  v_market text := CASE
    WHEN p_payload->>'market' IN ('it', 'es', 'us', 'nl') THEN p_payload->>'market'
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
