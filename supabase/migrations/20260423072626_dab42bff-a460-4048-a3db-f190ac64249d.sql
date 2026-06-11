CREATE UNIQUE INDEX user_entitlements_natal_upsert_unique
ON public.user_entitlements(profile_id, quiz_session_id, entitlement_type);

CREATE UNIQUE INDEX user_entitlements_transits_upsert_unique
ON public.user_entitlements(profile_id, stripe_session_id, entitlement_type);