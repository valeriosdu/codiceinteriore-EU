// Admin helper: create a new quiz_sessions row from manually-entered data.
// Default mode runs the full generation pipeline (chart + teaser + full report)
// against an admin-comped checkout. With `skipGeneration: true` it only
// registers the customer (anagrafica): inserts the row as a "draft" + a non-paid
// registration checkout so the customer appears in /admin/clienti, and runs no
// chart and no Gemini — the report is generated later from the customer page.
// Auth via x-admin-secret OR service-role bearer.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveProfileByEmail } from "../_shared/resolve-profile.ts";

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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeBirthDate(value: unknown): { day: number; month: number; year: number } | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const day = Number(v.day);
  const month = Number(v.month);
  const year = Number(v.year);
  if (![day, month, year].every(Number.isFinite)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;
  return { day, month, year };
}

function sanitizeBirthTime(value: unknown): { hour: number; minute: number } | null {
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

async function orchestrate(quizSessionId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

  const reportResp = await fetch(`${SUPABASE_URL}/functions/v1/generate-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "x-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({ quizSessionId, skipEmail: true }),
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

    // Two modes:
    //  - default: insert + run the full generation pipeline (chart + Gemini).
    //  - skipGeneration: register the customer (anagrafica) only. Birth data is
    //    optional; email is required (it's what makes the customer show up in the
    //    /admin/clienti list). No chart, no Gemini — the report is generated
    //    later from the customer page ("Modifica dati" / "Genera report").
    const skipGeneration = body.skipGeneration === true;

    const userName = typeof body.userName === "string" ? body.userName.trim() : "";
    if (!userName) {
      return new Response(JSON.stringify({ error: "userName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (skipGeneration && !customerEmail) {
      return new Response(
        JSON.stringify({ error: "email is required when skipGeneration is set" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // In skipGeneration mode birth data is optional, but if the admin entered any
    // of it we validate the full set so the draft is generatable later.
    const hasAnyBirth =
      body.birthDate != null ||
      body.birthTime != null ||
      (typeof body.birthPlace === "string" && body.birthPlace.trim() !== "") ||
      isFiniteNumber(body.birthLat) ||
      isFiniteNumber(body.birthLng) ||
      isFiniteNumber(body.birthTimezone);
    const requireBirth = !skipGeneration || hasAnyBirth;

    let birthDate: { day: number; month: number; year: number } | null = null;
    let birthTime: { hour: number; minute: number } | null = null;
    let birthPlace = "";

    if (requireBirth) {
      birthDate = sanitizeBirthDate(body.birthDate);
      if (!birthDate) {
        return new Response(JSON.stringify({ error: "Invalid birthDate (expected { day, month, year })" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      birthTime = sanitizeBirthTime(body.birthTime);
      if (!birthTime) {
        return new Response(JSON.stringify({ error: "Invalid birthTime (expected { hour, minute })" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      birthPlace = typeof body.birthPlace === "string" ? body.birthPlace.trim() : "";
      if (!birthPlace) {
        return new Response(JSON.stringify({ error: "birthPlace is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!isFiniteNumber(body.birthLat) || !isFiniteNumber(body.birthLng) || !isFiniteNumber(body.birthTimezone)) {
        return new Response(
          JSON.stringify({
            error: "birthLat, birthLng, birthTimezone are required (resolve via place autocomplete)",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const focusArea = typeof body.focusArea === "string" ? body.focusArea.trim() || null : null;
    const attachmentResponse =
      typeof body.attachmentResponse === "string" ? body.attachmentResponse.trim() || null : null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: inserted, error: insertErr } = await supabase
      .from("quiz_sessions")
      .insert({
        user_name: userName,
        birth_date: birthDate,
        birth_time: birthTime,
        birth_place: birthPlace || null,
        birth_lat: isFiniteNumber(body.birthLat) ? body.birthLat : null,
        birth_lng: isFiniteNumber(body.birthLng) ? body.birthLng : null,
        birth_timezone: isFiniteNumber(body.birthTimezone) ? body.birthTimezone : null,
        focus_area: focusArea,
        attachment_response: attachmentResponse,
        processing_status: skipGeneration ? "draft" : "pending",
      })
      .select("id")
      .single();

    if (insertErr || !inserted?.id) {
      return new Response(
        JSON.stringify({ error: `insert_failed: ${insertErr?.message || "unknown"}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const quizSessionId = inserted.id as string;

    if (customerEmail) {
      const profile = await resolveProfileByEmail(supabase, customerEmail);

      const now = new Date().toISOString();
      // skipGeneration: a non-paid "registration" marker so the customer shows up
      // in the CRM list (which aggregates any checkout with an email) without
      // counting as a payment or looking like an orphan. Otherwise the usual
      // comped-paid checkout that records the admin-generated report.
      const checkoutRow = skipGeneration
        ? {
            stripe_session_id: `admin_manual_${quizSessionId}`,
            quiz_session_id: quizSessionId,
            customer_email: customerEmail,
            purchase_type: "one_time",
            product_code: "customer_registration",
            payment_provider: "admin_manual",
            payment_status: "unpaid",
            amount_total: 0,
            currency: "EUR",
            provider_metadata: { stage: "admin_manual_registration" },
            claimed_profile_id: profile?.id ?? null,
            claimed_at: profile?.id ? now : null,
          }
        : {
            stripe_session_id: `admin_comp_natal_${quizSessionId}`,
            quiz_session_id: quizSessionId,
            customer_email: customerEmail,
            purchase_type: "one_time",
            product_code: "natal_report_comped",
            payment_provider: "admin_comp",
            payment_status: "paid",
            payment_completed_at: now,
            amount_total: 0,
            currency: "EUR",
            provider_metadata: { stage: "admin_comp" },
            claimed_profile_id: profile?.id ?? null,
            claimed_at: profile?.id ? now : null,
          };

      const { error: checkoutErr } = await supabase
        .from("checkout_sessions")
        .insert(checkoutRow);

      if (checkoutErr) {
        console.error(
          "[admin-create-quiz-session] checkout_sessions insert failed:",
          checkoutErr.message,
        );
      }
    }

    if (skipGeneration) {
      // Anagrafica-only: no chart, no Gemini. The report is generated later from
      // the customer page.
      return new Response(
        JSON.stringify({ ok: true, quizSessionId, skipped: true }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // @ts-expect-error EdgeRuntime is provided by the Supabase deno runtime
    EdgeRuntime.waitUntil(
      orchestrate(quizSessionId).catch((err) => {
        console.error(`[admin-create-quiz-session] orchestration failed for ${quizSessionId}:`, err);
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
      JSON.stringify({ ok: true, quizSessionId }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[admin-create-quiz-session] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
