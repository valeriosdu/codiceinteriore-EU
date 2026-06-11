-- =====================================================================
-- Low-risk security hardening (linter follow-ups)
-- =====================================================================

-- 1. profiles UPDATE policy had USING but no WITH CHECK, so a user could
--    update their own row to a different user_id (re-parenting the row).
--    Add the WITH CHECK so the post-update row must still belong to them.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Pin search_path on the two trigger helpers the linter flagged as
--    "Function Search Path Mutable". Bodies are reproduced verbatim; only
--    `SET search_path` is added. (update_updated_at_column already has it.)
CREATE OR REPLACE FUNCTION public.synastry_sessions_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_astrology_guide_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
