
CREATE OR REPLACE FUNCTION public.admin_set_vault_secret(p_name text, p_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = p_name LIMIT 1;
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(p_value, p_name, NULL);
  ELSE
    PERFORM vault.update_secret(v_id, p_value, p_name, NULL);
  END IF;
  RETURN p_name;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_vault_secret(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_vault_secret(text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_vault_secret(text, text) TO service_role;
