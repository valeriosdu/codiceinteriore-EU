// Admin helper: rewrite the editable quiz_session fields (birth data + quiz
// answers) and re-run the entire generation pipeline against the new data.
// Pipeline: clear cached artifacts → process-session-insights (chart + teaser)
// → generate-report (full LLM report) → admin-trigger-transit-cycle (when the
// session has a transit entitlement). Auth via x-admin-secret OR service-role.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

type BirthDate = { day?: number; month?: number; year?: number };
type BirthTime = { hour?: number; minute?: number };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeBirthDate(value: unknown): BirthDate | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const day = Number(v.day);
  const month = Number(v.month);
  const year = Number(v.year);
  if (![day, month, year].every(Number.isFinite)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;
  return { day, month, year };
}

function sanitizeBirthTime(value: unknown): BirthTime | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const hour = Number(v.hour);
  const minute = Number(v.minute);
  if (![hour, minute].every(Number.isFinite)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

async function pollUntil(
  supabase: ReturnType<typeof createClient>,
  quizSessionId: string,
  predicate: (row: Record<string, unknown>) => boolean,
  failPredicate: (row: Record<string, unknown>) => string | null,
  selectColumns: string,
  timeoutMs: number,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const { data, error } = await supabase
      .from("quiz_sessions")
      .select(selectColumns)
      .eq("id", quizSessionId)
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

async function orchestrate(quizSessionId: string, includeTransits: boolean) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Step 1 — chart + teaser via process-session-insights.
  const insightsResp = await fetch(`${SUPABASE_URL}/functions/v1/process-session-insights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sessionId: quizSessionId }),
  });
  if (!insightsResp.ok && insightsResp.status !== 202) {
    const txt = await insightsResp.text();
    throw new Error(`process-session-insights failed: ${insightsResp.status} ${txt.slice(0, 200)}`);
  }

  await pollUntil(
    supabase,
    quizSessionId,
    (row) => Boolean(row.natal_chart),
    (row) => (row.processing_status === "failed" ? `chart_failed: ${row.processing_error || "unknown"}` : null),
    "natal_chart, processing_status, processing_error",
    CHART_TIMEOUT_MS,
  );

  // Step 2 — full report via generate-report (admin secret bypasses payment check).
  const reportResp = await fetch(`${SUPABASE_URL}/functions/v1/generate-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "x-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({ quizSessionId }),
  });
  if (!reportResp.ok && reportResp.status !== 202) {
    const txt = await reportResp.text();
    throw new Error(`generate-report failed: ${reportResp.status} ${txt.slice(0, 200)}`);
  }

  await pollUntil(
    supabase,
    quizSessionId,
    (row) => Boolean(row.full_report),
    (row) => (row.processing_status === "failed" ? `report_failed: ${row.processing_error || "unknown"}` : null),
    "full_report, processing_status, processing_error",
    REPORT_TIMEOUT_MS,
  );

  // Step 3 — transits, when this session has an entitlement. We already cleared
  // the cycle artifacts before kicking off so the trigger won't short-circuit.
  if (includeTransits) {
    const { data: entitlement } = await supabase
      .from("user_entitlements")
      .select("id")
      .eq("quiz_session_id", quizSessionId)
      .eq("entitlement_type", "monthly_transits")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (entitlement?.id) {
      const transitResp = await fetch(`${SUPABASE_URL}/functions/v1/admin-trigger-transit-cycle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ entitlementId: entitlement.id, reset: true }),
      });
      if (!transitResp.ok) {
        const txt = await transitResp.text();
        console.warn(`[admin-update-quiz-session] transit trigger non-fatal error: ${transitResp.status} ${txt.slice(0, 200)}`);
      }
    } else {
      console.log(`[admin-update-quiz-session] no transit entitlement for ${quizSessionId}; skipping transits`);
    }
  }
}

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
    if (!quizSessionId) {
      return new Response(JSON.stringify({ error: "quizSessionId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const includeTransits = body.includeTransits !== false;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: session, error: loadErr } = await supabase
      .from("quiz_sessions")
      .select("id, birth_place")
      .eq("id", quizSessionId)
      .maybeSingle();
    if (loadErr || !session) {
      return new Response(JSON.stringify({ error: "Quiz session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the patch out of fields the caller actually provided. Anything
    // omitted stays as-is.
    const update: Record<string, unknown> = {};

    if (typeof body.userName === "string") update.user_name = body.userName.trim() || null;
    if (typeof body.focusArea === "string") update.focus_area = body.focusArea.trim() || null;
    if (typeof body.attachmentResponse === "string") {
      update.attachment_response = body.attachmentResponse.trim() || null;
    }

    if (body.birthDate !== undefined) {
      const bd = sanitizeBirthDate(body.birthDate);
      if (!bd) {
        return new Response(JSON.stringify({ error: "Invalid birthDate (expected { day, month, year })" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      update.birth_date = bd;
    }

    if (body.birthTime !== undefined) {
      const bt = sanitizeBirthTime(body.birthTime);
      if (!bt) {
        return new Response(JSON.stringify({ error: "Invalid birthTime (expected { hour, minute })" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      update.birth_time = bt;
    }

    if (typeof body.birthPlace === "string") {
      const newPlace = body.birthPlace.trim();
      if (!newPlace) {
        return new Response(JSON.stringify({ error: "birthPlace cannot be empty" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      update.birth_place = newPlace;
      // When place changes, coords must come along — chart generation needs them.
      if (newPlace !== session.birth_place) {
        if (!isFiniteNumber(body.birthLat) || !isFiniteNumber(body.birthLng) || !isFiniteNumber(body.birthTimezone)) {
          return new Response(
            JSON.stringify({
              error: "When birthPlace changes, birthLat / birthLng / birthTimezone must all be provided",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        update.birth_lat = body.birthLat;
        update.birth_lng = body.birthLng;
        update.birth_timezone = body.birthTimezone;
      }
    } else if (
      isFiniteNumber(body.birthLat) || isFiniteNumber(body.birthLng) || isFiniteNumber(body.birthTimezone)
    ) {
      // Allow updating coords without changing the place string (rare, but legal).
      if (isFiniteNumber(body.birthLat)) update.birth_lat = body.birthLat;
      if (isFiniteNumber(body.birthLng)) update.birth_lng = body.birthLng;
      if (isFiniteNumber(body.birthTimezone)) update.birth_timezone = body.birthTimezone;
    }

    // Always clear cached generation artifacts so the pipeline re-runs.
    update.natal_chart = null;
    update.natal_chart_svg = null;
    update.natal_chart_png = null;
    update.teaser_insights = null;
    update.full_report = null;
    update.llm_input = null;
    update.llm_output = null;
    update.processing_status = "pending";
    update.processing_error = null;
    update.insights_started_at = null;
    update.insights_completed_at = null;

    const { error: updateErr } = await supabase
      .from("quiz_sessions")
      .update(update)
      .eq("id", quizSessionId);
    if (updateErr) {
      return new Response(JSON.stringify({ error: `update_failed: ${updateErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If this session has an existing transit cycle, clear its computed payload
    // so admin-trigger-transit-cycle won't short-circuit on the stale data.
    if (includeTransits) {
      const { data: entitlement } = await supabase
        .from("user_entitlements")
        .select("id")
        .eq("quiz_session_id", quizSessionId)
        .eq("entitlement_type", "monthly_transits")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (entitlement?.id) {
        await supabase
          .from("transit_cycles")
          .update({
            raw_transits: null,
            interpreted_transits: null,
            status: "pending",
            fetch_status: "pending",
            interpretation_status: "pending",
            processing_error: null,
          })
          .eq("entitlement_id", entitlement.id);
      }
    }

    // Fire-and-forget the orchestration. The function returns 202 immediately;
    // the UI polls the list endpoint to observe completion.
    // @ts-expect-error EdgeRuntime is provided by the Supabase deno runtime
    EdgeRuntime.waitUntil(
      orchestrate(quizSessionId, includeTransits).catch((err) => {
        console.error(`[admin-update-quiz-session] orchestration failed for ${quizSessionId}:`, err);
        return supabase
          .from("quiz_sessions")
          .update({
            processing_status: "failed",
            processing_error: (err instanceof Error ? err.message : String(err)).slice(0, 500),
          })
          .eq("id", quizSessionId);
      }),
    );

    return new Response(
      JSON.stringify({ ok: true, quizSessionId, includeTransits }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[admin-update-quiz-session] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
