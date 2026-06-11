import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    const isAdminSecret = Boolean(ADMIN_SECRET && adminSecret === ADMIN_SECRET);
    const isServiceRole = Boolean(SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY);

    if (!isAdminSecret && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    let transitCycleId: string | null =
      typeof body.transitCycleId === "string" ? body.transitCycleId : null;
    const entitlementId: string | null =
      typeof body.entitlementId === "string" ? body.entitlementId : null;
    const quizSessionId: string | null =
      typeof body.quizSessionId === "string"
        ? body.quizSessionId
        : typeof body.quiz_session_id === "string"
          ? body.quiz_session_id
          : null;
    const reset = body.reset === true;
    const forceInterpretation = body.forceInterpretation === true;
    // fullReset: clear raw_transits + interpreted_transits and re-fetch
    // from FreeAstroAPI from scratch. Use when the API has been called with
    // stale birth data, or when we want the entire pipeline rerun from zero.
    // Distinct from forceInterpretation which reuses cached raw_transits.
    const fullReset = body.fullReset === true;

    if (!transitCycleId && !entitlementId && !quizSessionId) {
      return new Response(
        JSON.stringify({ error: "transitCycleId, entitlementId or quizSessionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve cycle from entitlement if needed
    if (!transitCycleId && !entitlementId && quizSessionId) {
      const { data: entitlement } = await supabaseAdmin
        .from("user_entitlements")
        .select("id")
        .eq("quiz_session_id", quizSessionId)
        .eq("entitlement_type", "monthly_transits")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!entitlement?.id) {
        return new Response(
          JSON.stringify({ error: "no active monthly_transits entitlement found for this quiz session" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      body.entitlementId = entitlement.id;
    }

    const resolvedEntitlementId = entitlementId || body.entitlementId || null;

    if (!transitCycleId && resolvedEntitlementId) {
      const { data: cycle } = await supabaseAdmin
        .from("transit_cycles")
        .select("id")
        .eq("entitlement_id", resolvedEntitlementId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      transitCycleId = cycle?.id || null;
      if (!transitCycleId) {
        return new Response(
          JSON.stringify({
            error:
              "no transit_cycle found for this entitlement — manual recovery via DB required",
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { data: existingCycle } = transitCycleId
      ? await supabaseAdmin
          .from("transit_cycles")
          .select("raw_transits, interpreted_transits")
          .eq("id", transitCycleId)
          .maybeSingle()
      : { data: null };

    if (
      !forceInterpretation &&
      !fullReset &&
      existingCycle?.raw_transits &&
      existingCycle?.interpreted_transits
    ) {
      await supabaseAdmin
        .from("transit_cycles")
        .update({
          status: "completed",
          fetch_status: "completed",
          interpretation_status: "completed",
          processing_error: null,
        })
        .eq("id", transitCycleId);

      return new Response(
        JSON.stringify({ triggered: false, completed: true, transitCycleId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // fullReset: wipe raw_transits + interpreted_transits + llm_input so
    // process-transit-cycle re-fetches FreeAstroAPI from scratch and re-runs
    // the LLM. Used when birth data has been updated or to start over clean.
    if (fullReset && transitCycleId) {
      await supabaseAdmin
        .from("transit_cycles")
        .update({
          raw_transits: null,
          interpreted_transits: null,
          llm_input: null,
          status: "pending",
          fetch_status: "pending",
          interpretation_status: "pending",
          processing_error: null,
        })
        .eq("id", transitCycleId);
    } else if ((reset || forceInterpretation) && transitCycleId) {
      // Optional reset: clear stuck status before triggering. When forceInterpretation
      // is set, reset interpretation_status so process-transit-cycle can claim the
      // row and re-run the LLM (raw_transits is preserved).
      await supabaseAdmin
        .from("transit_cycles")
        .update({
          status: "pending",
          fetch_status: forceInterpretation ? "completed" : "pending",
          interpretation_status: "pending",
          processing_error: null,
        })
        .eq("id", transitCycleId);
    }

    // Invoke process-transit-cycle in background using admin secret.
    // fullReset is consumed entirely here (we already wiped the cycle row),
    // so we pass forceInterpretation=true to make process-transit-cycle
    // re-run the LLM even if it re-reads stale state from another path.
    const url = `${SUPABASE_URL}/functions/v1/process-transit-cycle`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({
        transitCycleId,
        forceInterpretation: forceInterpretation || fullReset,
      }),
    }).catch((e) => {
      console.error("[admin-trigger-transit-cycle] background invoke error:", e);
    });

    return new Response(
      JSON.stringify({ triggered: true, transitCycleId, forceInterpretation, fullReset }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[admin-trigger-transit-cycle] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
