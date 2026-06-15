// Self-service account recovery entry point.
//
// Called from the "Password dimenticata?" form on /activate. Logged out, so
// verify_jwt = false in config.toml.
//
// Logic:
// 1. Lookup auth user by email.
// 2a. If user exists → trigger Supabase recovery email (template "recovery").
// 2b. If user does NOT exist → check checkout_sessions for an unclaimed paid
//     row matching this email. If found, fire admin-recover-orphan-checkout
//     (uses inviteUserByEmail + claims the report). Bypasses the 24h cron wait.
// 3. Always return the same neutral 200 — never leak whether the email exists.
//
// Body: { email: string }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { getMarket } from "../_shared/markets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

const neutralResponse = () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function findAuthUserId(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("[request-account-recovery] listUsers error:", error);
      return null;
    }
    const found = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 1000) return null;
    page += 1;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // On abuse, return the same neutral response without doing the expensive
  // listUsers scan / sending an email — this preserves anti-enumeration
  // neutrality (an attacker can't tell they're being limited).
  const { allowed } = await checkRateLimit(req, {
    bucket: "request-account-recovery",
    max: 5,
    windowSeconds: 60,
  });
  if (!allowed) return neutralResponse();

  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const email = rawEmail.trim().toLowerCase();
    // Il mercato arriva dal frontend (il form vive su un dominio specifico):
    // determina il dominio del link di recovery. getMarket valida e ripiega su it.
    const market = getMarket(typeof body.market === "string" ? body.market : null);

    if (!email || !email.includes("@") || email.length > 254) {
      // Always return neutral; don't validate-leak.
      return neutralResponse();
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authUserId = await findAuthUserId(admin, email);

    if (authUserId) {
      const { error } = await admin.auth.resetPasswordForEmail(email, {
        redirectTo: `${market.siteUrl}/activate?intent=signin`,
      });
      if (error) {
        console.error("[request-account-recovery] resetPasswordForEmail error:", error);
      } else {
        console.log("[request-account-recovery] recovery email triggered for existing user");
      }
      return neutralResponse();
    }

    // No auth user — check for an orphan paid checkout we can recover.
    const { data: orphan, error: orphanErr } = await admin
      .from("checkout_sessions")
      .select("stripe_session_id, payment_completed_at, recovery_invited_at")
      .ilike("customer_email", email)
      .eq("payment_status", "paid")
      .is("claimed_profile_id", null)
      .order("payment_completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orphanErr) {
      console.error("[request-account-recovery] orphan lookup error:", orphanErr);
      return neutralResponse();
    }

    if (!orphan?.stripe_session_id) {
      console.log("[request-account-recovery] no auth user and no orphan checkout — silent ok");
      return neutralResponse();
    }

    // Fire admin-recover-orphan-checkout. This creates the auth user via
    // inviteUserByEmail (sends "invite" email), claims the report, and marks
    // recovery_invited_at — bypassing the 24h cron wait.
    fetch(`${SUPABASE_URL}/functions/v1/admin-recover-orphan-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        stripeSessionId: orphan.stripe_session_id,
        sendInvite: true,
      }),
    })
      .then(async (res) => {
        const txt = await res.text().catch(() => "");
        console.log(
          `[request-account-recovery] orphan recover -> ${res.status}: ${txt.slice(0, 200)}`,
        );
      })
      .catch((e) => {
        console.error("[request-account-recovery] orphan recover fetch failed:", e);
      });

    return neutralResponse();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[request-account-recovery] unexpected error:", msg);
    // Still neutral — never leak.
    return neutralResponse();
  }
});
