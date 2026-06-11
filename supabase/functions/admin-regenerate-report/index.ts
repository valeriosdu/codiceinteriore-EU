// Admin helper: re-trigger generate-report and process-transit-cycle for a given
// quiz_session_id, bypassing the user authentication path. Auth happens via
// either x-admin-secret header or service-role bearer token.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const adminSecretHeader = req.headers.get("x-admin-secret") || "";

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
    const includeTransits = body.includeTransits !== false; // default true
    const email = typeof body.email === "string" ? body.email : undefined;

    if (!quizSessionId) {
      return new Response(JSON.stringify({ error: "quizSessionId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, unknown> = {};

    // Force-regenerate: wipe the existing report and reset the row to a clean
    // `pending` state so generate-report actually re-runs. Without this it
    // short-circuits — it returns `alreadyExists` when full_report is set, and
    // its CAS lock only claims rows where full_report IS NULL. Clearing
    // full_report is the whole point of "Rigenera"; this also unsticks rows
    // wedged in `report_processing` by a dead worker. `pending` is the column
    // default; a non-null value is required so generate-report's CAS filter
    // (`.neq(processing_status, 'report_processing')`) still matches the row.
    // report_started_at stamps the moment this regen kicks off so the
    // recover-pending-reports watchdog gives it a fresh 10-min window instead of
    // measuring from the (ancient) entitlement.created_at and killing it.
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: resetErr } = await supabaseAdmin
      .from("quiz_sessions")
      .update({
        full_report: null,
        processing_status: "pending",
        processing_error: null,
        report_started_at: new Date().toISOString(),
      })
      .eq("id", quizSessionId);
    if (resetErr) {
      console.warn(`[admin-regenerate-report] reset failed for ${quizSessionId}: ${resetErr.message}`);
      return new Response(JSON.stringify({ error: `Reset failed: ${resetErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    results.reset = { cleared: true };

    // 1. Trigger generate-report with admin secret.
    const reportResp = await fetch(`${SUPABASE_URL}/functions/v1/generate-report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({ quizSessionId, skipEmail: true, ...(email ? { email } : {}) }),
    });
    const reportText = await reportResp.text();
    results.generate_report = {
      status: reportResp.status,
      body: reportText.slice(0, 500),
    };

    // 2. Trigger process-transit-cycle if requested.
    if (includeTransits) {
      const transitResp = await fetch(`${SUPABASE_URL}/functions/v1/admin-trigger-transit-cycle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ quiz_session_id: quizSessionId }),
      });
      const transitText = await transitResp.text();
      results.transit_cycle = {
        status: transitResp.status,
        body: transitText.slice(0, 500),
      };
    }

    // 3. Invalidate cached PDFs so the next download reflects the regenerated
    // report. Both the admin and the customer download functions cache the PDF
    // in the `report-pdfs` bucket keyed by session id; without clearing them the
    // stale file keeps being served (this is why a regenerated report still
    // downloaded as the old PDF). Remove every PDF for this session (any
    // version) under the flat `admin/` prefix and the customer `${userId}/${id}/`
    // folder. Best-effort: never fail the regen because of cache cleanup.
    try {
      const toRemove: string[] = [];
      const { data: adminFiles } = await supabaseAdmin.storage
        .from("report-pdfs")
        .list("admin", { search: quizSessionId });
      for (const f of adminFiles ?? []) {
        if (f.name.startsWith(quizSessionId)) toRemove.push(`admin/${f.name}`);
      }
      const { data: ownerReport } = await supabaseAdmin
        .from("user_reports")
        .select("profiles!inner(user_id)")
        .eq("quiz_session_id", quizSessionId)
        .limit(1)
        .maybeSingle();
      const owner = ownerReport as { profiles?: { user_id?: string } } | null;
      const ownerUserId = owner?.profiles?.user_id;
      if (ownerUserId) {
        const { data: custFiles } = await supabaseAdmin.storage
          .from("report-pdfs")
          .list(`${ownerUserId}/${quizSessionId}`);
        for (const f of custFiles ?? []) {
          toRemove.push(`${ownerUserId}/${quizSessionId}/${f.name}`);
        }
      }
      if (toRemove.length > 0) {
        await supabaseAdmin.storage.from("report-pdfs").remove(toRemove);
      }
      results.pdf_cache = { cleared: toRemove.length };
    } catch (e) {
      console.warn(
        `[admin-regenerate-report] pdf cache clear warning for ${quizSessionId}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }

    return new Response(JSON.stringify({ ok: true, quizSessionId, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
