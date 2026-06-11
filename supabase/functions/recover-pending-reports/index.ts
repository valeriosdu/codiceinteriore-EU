import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { reconcilePaidStripeSession } from "../_shared/stripe-reconcile.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = parts[1]
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Safety net runner. Performs two idempotent sweeps:
 *
 *   A) Stripe reconciliation sweep (admin-only): lists recent paid Stripe
 *      checkout sessions and replays them through the same logic as the
 *      stripe-webhook. This auto-heals any session that is missing or stuck
 *      "unpaid" in our DB (covers webhook misses and historical orphans).
 *
 *   B) Entitlement sweep: finds every active natal_report entitlement whose
 *      quiz_session has no full_report yet, and triggers `generate-report`.
 *
 * Auth: x-admin-secret (recommended for cron / manual invocation) OR a
 * logged-in user (only the user's own reports are recovered in that case;
 * the Stripe reconciliation sweep is admin-only).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const claims = parseJwtClaims(token);
    // verify_jwt=true at the gateway guarantees JWT signatures before this
    // role check runs. Do not compare against SUPABASE_SERVICE_ROLE_KEY: under
    // signing keys that env can be a short sb_secret_* while cron uses a JWT.
    const isAdmin = Boolean(
      (ADMIN_SECRET && adminSecret === ADMIN_SECRET) ||
      claims?.role === "service_role",
    );

    if (!isAdmin && !token) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let profileFilter: string | null = null;
    if (!isAdmin) {
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: authData } = await supabaseAuth.auth.getUser(token);
      if (!authData?.user) {
        return new Response(JSON.stringify({ error: "Invalid session" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", authData.user.id)
        .maybeSingle();
      if (!profile?.id) {
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      profileFilter = profile.id;
    }

    // ---- Sweep A: Stripe reconciliation (admin-only) ----
    const reconciliation: Array<{ sessionId: string; status: string; reason?: string }> = [];
    if (isAdmin && STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

        // Window: last 30 days. Stripe paginates, but for our volume one page
        // of 100 covers the period comfortably; keep the loop in case it grows.
        const sinceSeconds = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30;
        let startingAfter: string | undefined = undefined;
        let pages = 0;
        const MAX_PAGES = 5;

        while (pages < MAX_PAGES) {
          pages += 1;
          const list = await stripe.checkout.sessions.list({
            limit: 100,
            created: { gte: sinceSeconds },
            ...(startingAfter ? { starting_after: startingAfter } : {}),
          });

          for (const session of list.data) {
            if (session.payment_status !== "paid") continue;

            // Skip if already paid+claimed in our DB.
            const { data: row } = await supabaseAdmin
              .from("checkout_sessions")
              .select("payment_status, claimed_profile_id")
              .eq("stripe_session_id", session.id)
              .maybeSingle();
            if (row?.payment_status === "paid" && row?.claimed_profile_id) {
              continue;
            }

            try {
              const result = await reconcilePaidStripeSession(stripe, session);
              reconciliation.push({ sessionId: session.id, ...result });
            } catch (e) {
              reconciliation.push({
                sessionId: session.id,
                status: "error",
                reason: e instanceof Error ? e.message : String(e),
              });
            }
          }

          if (!list.has_more) break;
          startingAfter = list.data[list.data.length - 1]?.id;
          if (!startingAfter) break;
        }
      } catch (e) {
        console.error(
          "[recover-pending-reports] Stripe reconciliation sweep failed:",
          e instanceof Error ? e.message : String(e),
        );
      }
    }

    // ---- Sweep B: entitlement sweep ----
    let query = supabaseAdmin
      .from("user_entitlements")
      .select(
        "profile_id, quiz_session_id, stripe_session_id, created_at, profiles!inner(email), quiz_sessions!inner(id, full_report, processing_status, natal_chart, report_started_at)",
      )
      .eq("entitlement_type", "natal_report")
      .eq("status", "active");
    if (profileFilter) query = query.eq("profile_id", profileFilter);

    const { data: rows, error } = await query;
    if (error) throw error;

    // Watchdog threshold: a session in `report_processing` whose entitlement was
    // created more than this long ago is presumed to have lost its background
    // worker (Deno EdgeRuntime.waitUntil dies silently on shutdown). We reset it
    // to 'failed' so generate-report's CAS lock (which excludes report_processing)
    // can re-claim it on the next invocation.
    const STUCK_THRESHOLD_MS = 10 * 60 * 1000;
    const nowMs = Date.now();

    const candidates = (rows || []).filter((row: any) => {
      const qs = row.quiz_sessions;
      if (!qs) return false;
      if (qs.full_report) return false;
      if (!qs.natal_chart) return false;
      if (qs.processing_status === "report_processing") {
        // Measure staleness from when this generation actually (re)started, not
        // from the entitlement's creation. An admin regenerate of an old report
        // has an ancient entitlement.created_at, so without report_started_at the
        // watchdog would instantly flag the fresh regen as stuck and kill it.
        // Falls back to entitlement.created_at for rows generated before the
        // column existed (and for first-time generations, where they coincide).
        const startedAt = qs.report_started_at ? Date.parse(qs.report_started_at) : NaN;
        const entitlementAt = row.created_at ? Date.parse(row.created_at) : NaN;
        const clock = Number.isFinite(startedAt) ? startedAt : entitlementAt;
        if (!Number.isFinite(clock)) return false;
        if (nowMs - clock < STUCK_THRESHOLD_MS) return false;
        row.__needsReset = true;
        return true;
      }
      return true;
    });

    console.log(`[recover-pending-reports] candidates: ${candidates.length}`);

    const results: Array<{ quizSessionId: string; email: string; status: string; detail?: string }> = [];

    for (const row of candidates) {
      const quizSessionId = (row as any).quiz_session_id as string;
      const email = ((row as any).profiles?.email as string) || "";

      if ((row as any).__needsReset) {
        const { error: resetErr } = await supabaseAdmin
          .from("quiz_sessions")
          .update({
            processing_status: "failed",
            processing_error: "watchdog: stuck in report_processing > 10 min",
          })
          .eq("id", quizSessionId)
          .eq("processing_status", "report_processing")
          .is("full_report", null);
        if (resetErr) {
          results.push({
            quizSessionId,
            email,
            status: "reset_failed",
            detail: resetErr.message.slice(0, 200),
          });
          continue;
        }
        console.log(`[recover-pending-reports] watchdog reset stuck session ${quizSessionId}`);
      }

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-report`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "x-admin-secret": ADMIN_SECRET,
          },
          body: JSON.stringify({ quizSessionId, email }),
        });
        const text = await response.text().catch(() => "");
        results.push({
          quizSessionId,
          email,
          status: response.ok ? "started" : `error_${response.status}`,
          detail: text.slice(0, 200),
        });
      } catch (e) {
        results.push({
          quizSessionId,
          email,
          status: "exception",
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // ---- Sweep C: synastry sessions ----
    // Trova synastry_sessions con checkout paid ma full_report mancante.
    const synastryResults: Array<{
      synastrySessionId: string;
      status: string;
      detail?: string;
    }> = [];

    const { data: synRows } = await supabaseAdmin
      .from("checkout_sessions")
      .select(
        "synastry_session_id, synastry_sessions!inner(id, full_report, processing_status, synastry_data)",
      )
      .in("purchase_type", ["synastry", "synastry_launch"])
      .eq("payment_status", "paid")
      .not("synastry_session_id", "is", null);

    const synCandidates = (synRows || []).filter((row: any) => {
      const ss = row.synastry_sessions;
      if (!ss) return false;
      if (ss.full_report) return false;
      // Sia "synastry_ready" sia "failed" sia altri stati che non sono "report_ready"
      // sono candidati per il retry, purche non siano "report_processing" recente
      // (controllo gestito dal CAS lock di generate-synastry-report).
      return true;
    });

    for (const row of synCandidates) {
      const synId = (row as any).synastry_session_id as string;
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/generate-synastry-report`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              "x-admin-secret": ADMIN_SECRET,
            },
            body: JSON.stringify({ synastrySessionId: synId }),
          },
        );
        const text = await response.text().catch(() => "");
        synastryResults.push({
          synastrySessionId: synId,
          status: response.ok ? "started" : `error_${response.status}`,
          detail: text.slice(0, 200),
        });
      } catch (e) {
        synastryResults.push({
          synastrySessionId: synId,
          status: "exception",
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return new Response(
      JSON.stringify({
        reconciled: reconciliation.length,
        reconciliation,
        recovered: results.length,
        results,
        synastry_recovered: synastryResults.length,
        synastry_results: synastryResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[recover-pending-reports] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
