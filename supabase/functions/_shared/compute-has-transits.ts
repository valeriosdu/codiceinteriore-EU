// Returns true when a profile currently has an active transit entitlement,
// either via a one-time premium/addon purchase (user_entitlements row of type
// monthly_transits that's still within its validity window) or via an active
// recurring subscription (transit_subscriptions in active/trialing).
//
// Used to drive the Brevo HAS_TRANSITS attribute so we never overwrite a
// legitimate true with a false just because the user made an unrelated
// subsequent purchase (base report, astrology pack, etc.).

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export async function computeHasTransits(
  profileId: string,
  client?: SupabaseClient,
): Promise<boolean> {
  if (!profileId) return false;
  const supabase = client ?? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const nowIso = new Date().toISOString();
  const { data: ents } = await supabase
    .from("user_entitlements")
    .select("id, ends_at")
    .eq("profile_id", profileId)
    .eq("entitlement_type", "monthly_transits")
    .eq("status", "active")
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .limit(1);
  if (ents && ents.length > 0) return true;

  const { data: subs } = await supabase
    .from("transit_subscriptions")
    .select("id")
    .eq("profile_id", profileId)
    .in("status", ["active", "trialing"])
    .limit(1);
  if (subs && subs.length > 0) return true;

  return false;
}
