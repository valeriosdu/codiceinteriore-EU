// Admin helper: soft-delete a report. Used when a customer is refunded — we
// remove their access to the report content while preserving payment history
// for audit/accounting. Reversible by re-running admin-update-quiz-session.
//
// What gets cleared on quiz_sessions:
//   full_report, natal_chart, natal_chart_svg, natal_chart_png,
//   teaser_insights, llm_input, llm_output, insights_started_at,
//   insights_completed_at; processing_status = 'deleted'.
// What gets revoked:
//   user_reports.is_active = false (so customer-facing dashboard hides it)
//   user_entitlements.status = 'revoked' (blocks further transit access)
// What is preserved:
//   checkout_sessions rows (payment audit trail), profiles, contact_submissions.
//
// Auth: x-admin-secret OR service-role bearer token.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminSecretHeader = req.headers.get("x-admin-secret") || "";
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    const isAdminSecret = Boolean(ADMIN_SECRET && adminSecretHeader === ADMIN_SECRET);
    const isServiceRole = Boolean(SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY);

    if (!isAdminSecret && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const quizSessionId = typeof body.quizSessionId === "string" ? body.quizSessionId : "";
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : "";

    if (!quizSessionId) {
      return new Response(JSON.stringify({ error: "quizSessionId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: session, error: loadErr } = await supabase
      .from("quiz_sessions")
      .select("id, processing_status")
      .eq("id", quizSessionId)
      .maybeSingle();

    if (loadErr) {
      return new Response(JSON.stringify({ error: `lookup_failed: ${loadErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!session) {
      return new Response(JSON.stringify({ error: "Quiz session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deletedAt = new Date().toISOString();
    const errorNote = reason
      ? `Deleted by admin at ${deletedAt} — ${reason}`
      : `Deleted by admin at ${deletedAt}`;

    const { error: updateErr } = await supabase
      .from("quiz_sessions")
      .update({
        full_report: null,
        natal_chart: null,
        natal_chart_svg: null,
        natal_chart_png: null,
        teaser_insights: null,
        llm_input: null,
        llm_output: null,
        processing_status: "deleted",
        processing_error: errorNote,
        insights_started_at: null,
        insights_completed_at: null,
      })
      .eq("id", quizSessionId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: `update_failed: ${updateErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hide the report from the customer's dashboard.
    const { error: reportsErr } = await supabase
      .from("user_reports")
      .update({ is_active: false, updated_at: deletedAt })
      .eq("quiz_session_id", quizSessionId);

    if (reportsErr) {
      console.warn(`[admin-delete-report] user_reports update failed: ${reportsErr.message}`);
    }

    // Revoke any entitlements tied to this session (natal_report, monthly_transits, etc.)
    // so further pipeline runs and transit fetches refuse to operate on them.
    const { error: entitlementsErr } = await supabase
      .from("user_entitlements")
      .update({ status: "revoked", updated_at: deletedAt })
      .eq("quiz_session_id", quizSessionId)
      .neq("status", "revoked");

    if (entitlementsErr) {
      console.warn(
        `[admin-delete-report] user_entitlements update failed: ${entitlementsErr.message}`,
      );
    }

    return new Response(
      JSON.stringify({ ok: true, quizSessionId, deletedAt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[admin-delete-report] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
