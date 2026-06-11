// Brevo contact attribute sync for the Astrology Guide lifecycle.
//
// One attribute, three values, monotonic by construction (we compute the
// lifetime status from DB state each time, so we never regress):
//
//   - "none"            never asked a question
//   - "free_used"       used at least one free question
//   - "pack_purchased"  purchased an additional question pack
//
// The helper is fire-and-forget: it reads checkout_sessions and
// astrology_guide_questions, picks the highest-priority status, and pushes
// the value to Brevo via the existing sync-brevo-contact function. Failures
// are logged and swallowed; they never block the caller.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { syncBrevoContactBackground } from "./sync-brevo.ts";
import { ASTROLOGY_GUIDE_PURCHASE_TYPE } from "./astrology-products.ts";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export type AstrologyGuideStatus = "none" | "free_used" | "pack_purchased";

const BREVO_ATTRIBUTE = "GUIDA_STATUS";

async function computeStatus(profileId: string): Promise<AstrologyGuideStatus> {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // pack_purchased: any paid checkout_session of the pack purchase_type.
  const { data: packs } = await admin
    .from("checkout_sessions")
    .select("id")
    .eq("claimed_profile_id", profileId)
    .eq("purchase_type", ASTROLOGY_GUIDE_PURCHASE_TYPE)
    .eq("payment_status", "paid")
    .limit(1);
  if (packs && packs.length > 0) return "pack_purchased";

  // free_used: any completed (released) question for this profile.
  const { data: completed } = await admin
    .from("astrology_guide_questions")
    .select("id")
    .eq("profile_id", profileId)
    .eq("status", "completed")
    .limit(1);
  if (completed && completed.length > 0) return "free_used";

  return "none";
}

export function syncAstrologyGuideStatusBackground(
  profileId: string,
  email: string | null | undefined,
) {
  if (!email || !profileId) return;
  const promise = (async () => {
    try {
      const status = await computeStatus(profileId);
      syncBrevoContactBackground({
        email,
        eventType: "attribute_update",
        attributes: { [BREVO_ATTRIBUTE]: status },
      });
    } catch (e) {
      console.warn(
        "[astrology-guide-brevo] sync failed:",
        e instanceof Error ? e.message : String(e),
      );
    }
  })();
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(promise);
  } else {
    promise.catch(() => undefined);
  }
}
