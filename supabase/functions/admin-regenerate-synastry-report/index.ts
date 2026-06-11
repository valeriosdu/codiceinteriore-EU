// Admin helper: rigenera completamente una synastry_session.
// Archivia il PDF corrente come "previous", azzera tutti i dati calcolati,
// rilancia la pipeline completa (synastry-chart → teaser → report).
// Auth via x-admin-secret o service-role bearer.

// @ts-ignore deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};
declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

const CHART_TIMEOUT_MS = 90_000;
const REPORT_TIMEOUT_MS = 240_000;
const POLL_INTERVAL_MS = 2_000;

async function pollUntil(
  supabase: ReturnType<typeof createClient>,
  synastrySessionId: string,
  predicate: (row: Record<string, unknown>) => boolean,
  failPredicate: (row: Record<string, unknown>) => string | null,
  selectColumns: string,
  timeoutMs: number,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const { data, error } = await supabase
      .from("synastry_sessions")
      .select(selectColumns)
      .eq("id", synastrySessionId)
      .maybeSingle();
    if (error) throw new Error(`poll_failed: ${error.message}`);
    const row = (data || {}) as Record<string, unknown>;
    const failure = failPredicate(row);
    if (failure) throw new Error(failure);
    if (predicate(row)) return row;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("poll_timeout");
}

async function archivePreviousPdf(
  supabase: ReturnType<typeof createClient>,
  synastrySessionId: string,
) {
  const { data: versions } = await supabase.storage
    .from("report-pdfs")
    .list("admin", { search: `synastry-${synastrySessionId}-` });
  const current = versions?.find(
    (f: any) =>
      f.name.startsWith(`synastry-${synastrySessionId}-`) &&
      !f.name.includes("-previous"),
  );
  if (!current) return;
  const { data: blob } = await supabase.storage
    .from("report-pdfs")
    .download(`admin/${current.name}`);
  if (!blob) return;
  await supabase.storage
    .from("report-pdfs")
    .upload(`admin/synastry-${synastrySessionId}-previous.pdf`, blob, {
      contentType: "application/pdf",
      upsert: true,
    });
}

async function orchestrateRegeneration(synastrySessionId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Step 1: archivia PDF corrente
  try {
    await archivePreviousPdf(supabase, synastrySessionId);
  } catch (e) {
    console.warn("[admin-regenerate-synastry] PDF archive failed:", e);
  }

  // Step 2: azzera tutti i dati calcolati
  await supabase
    .from("synastry_sessions")
    .update({
      synastry_data: null,
      bi_wheel_svg: null,
      chart_a: null,
      chart_b: null,
      archetype: null,
      archetype_label: null,
      score_overall: null,
      scores: null,
      teaser_highlight: null,
      full_report: null,
      brief: null,
      llm_input: null,
      llm_output: null,
      processing_status: "pending",
      processing_error: null,
    })
    .eq("id", synastrySessionId);

  // Step 3: synastry-chart + teaser via process-synastry-insights
  const insightsResp = await fetch(
    `${SUPABASE_URL}/functions/v1/process-synastry-insights`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({ synastrySessionId }),
    },
  );
  if (!insightsResp.ok && insightsResp.status !== 202) {
    const txt = await insightsResp.text();
    throw new Error(
      `process-synastry-insights failed: ${insightsResp.status} ${txt.slice(0, 200)}`,
    );
  }

  // Step 4: poll finche synastry_data e' pronto
  await pollUntil(
    supabase,
    synastrySessionId,
    (row) => Boolean(row.synastry_data),
    (row) =>
      row.processing_status === "failed"
        ? `chart_failed: ${row.processing_error || "unknown"}`
        : null,
    "synastry_data, processing_status, processing_error",
    CHART_TIMEOUT_MS,
  );

  // Step 5: full report
  const reportResp = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-synastry-report`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({ synastrySessionId, skipEmail: true }),
    },
  );
  if (!reportResp.ok && reportResp.status !== 202) {
    const txt = await reportResp.text();
    throw new Error(
      `generate-synastry-report failed: ${reportResp.status} ${txt.slice(0, 200)}`,
    );
  }

  // Step 6: poll finche full_report e' pronto
  await pollUntil(
    supabase,
    synastrySessionId,
    (row) => Boolean(row.full_report),
    (row) =>
      row.processing_status === "failed"
        ? `report_failed: ${row.processing_error || "unknown"}`
        : null,
    "full_report, processing_status, processing_error",
    REPORT_TIMEOUT_MS,
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const adminSecretHeader = req.headers.get("x-admin-secret") || "";

    const isAdminSecret = Boolean(ADMIN_SECRET && adminSecretHeader === ADMIN_SECRET);
    const isServiceRole = Boolean(
      SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY,
    );

    if (!isAdminSecret && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const synastrySessionId =
      typeof body.synastrySessionId === "string" ? body.synastrySessionId : "";

    if (!synastrySessionId) {
      return new Response(
        JSON.stringify({ error: "synastrySessionId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    EdgeRuntime.waitUntil(
      orchestrateRegeneration(synastrySessionId).catch((err) => {
        console.error(
          `[admin-regenerate-synastry] orchestration failed for ${synastrySessionId}:`,
          err,
        );
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        return supabase
          .from("synastry_sessions")
          .update({
            processing_status: "failed",
            processing_error: (err instanceof Error ? err.message : String(err)).slice(0, 500),
          })
          .eq("id", synastrySessionId);
      }),
    );

    return new Response(
      JSON.stringify({ ok: true, synastrySessionId, status: "regeneration_queued" }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
