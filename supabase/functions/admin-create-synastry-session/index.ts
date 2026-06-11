// Admin helper: crea una synastry_session "comped" a partire da 2 set di
// dati di nascita inseriti a mano, la lega al cliente via checkout_sessions
// (purchase_type='synastry', payment_provider='admin_comp', amount_total=0) e
// avvia la pipeline: synastry-chart -> process-synastry-insights ->
// generate-synastry-report. Auth via x-admin-secret OR service-role bearer.

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

interface PersonInput {
  name: string;
  birthDate: { day: number; month: number; year: number };
  birthTime: { hour: number; minute: number } | null;
  timeKnown: boolean;
  birthPlace: string;
  birthLat: number;
  birthLng: number;
  birthTimezone: number;
  birthTimezoneIana?: string | null;
}

function sanitizePerson(raw: unknown): { person?: PersonInput; error?: string } {
  if (!raw || typeof raw !== "object") return { error: "person payload missing" };
  const p = raw as Record<string, unknown>;

  const name = typeof p.name === "string" ? p.name.trim() : "";
  if (!name) return { error: "name is required" };

  const birthDate = sanitizeBirthDate(p.birthDate);
  if (!birthDate) return { error: "invalid birthDate" };

  const timeKnown = p.timeKnown !== false;
  let birthTime: { hour: number; minute: number } | null = null;
  if (timeKnown) {
    birthTime = sanitizeBirthTime(p.birthTime);
    if (!birthTime) return { error: "invalid birthTime (timeKnown=true)" };
  }

  const birthPlace = typeof p.birthPlace === "string" ? p.birthPlace.trim() : "";
  if (!birthPlace) return { error: "birthPlace is required" };

  if (!isFiniteNumber(p.birthLat) || !isFiniteNumber(p.birthLng) || !isFiniteNumber(p.birthTimezone)) {
    return { error: "birthLat, birthLng, birthTimezone are required (resolve via place autocomplete)" };
  }

  return {
    person: {
      name,
      birthDate,
      birthTime,
      timeKnown,
      birthPlace,
      birthLat: p.birthLat as number,
      birthLng: p.birthLng as number,
      birthTimezone: p.birthTimezone as number,
      birthTimezoneIana:
        typeof p.birthTimezoneIana === "string" && p.birthTimezoneIana.trim()
          ? p.birthTimezoneIana.trim()
          : null,
    },
  };
}

function personInsertPayload(prefix: "a" | "b", p: PersonInput) {
  return {
    [`person_${prefix}_name`]: p.name,
    [`person_${prefix}_birth_date`]: p.birthDate,
    [`person_${prefix}_birth_time`]: p.timeKnown ? p.birthTime : null,
    [`person_${prefix}_time_known`]: p.timeKnown,
    [`person_${prefix}_birth_place`]: p.birthPlace,
    [`person_${prefix}_birth_lat`]: p.birthLat,
    [`person_${prefix}_birth_lng`]: p.birthLng,
    [`person_${prefix}_birth_timezone`]: p.birthTimezone,
    [`person_${prefix}_birth_timezone_iana`]: p.birthTimezoneIana,
  };
}

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

async function orchestrate(synastrySessionId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Step 1: synastry-chart + teaser via process-synastry-insights
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

  // Step 2: full report
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

    const customerEmail =
      typeof body.customerEmail === "string" ? body.customerEmail.trim().toLowerCase() : "";
    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "customerEmail is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const personA = sanitizePerson(body.personA);
    if (personA.error || !personA.person) {
      return new Response(JSON.stringify({ error: `personA: ${personA.error}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const personB = sanitizePerson(body.personB);
    if (personB.error || !personB.person) {
      return new Response(JSON.stringify({ error: `personB: ${personB.error}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const relationshipDuration =
      typeof body.relationshipDuration === "string" && body.relationshipDuration.trim()
        ? body.relationshipDuration.trim()
        : null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: inserted, error: insertErr } = await supabase
      .from("synastry_sessions")
      .insert({
        funnel_slug: "coppia",
        processing_status: "pending",
        relationship_duration: relationshipDuration,
        ...personInsertPayload("a", personA.person),
        ...personInsertPayload("b", personB.person),
      })
      .select("id")
      .single();

    if (insertErr || !inserted?.id) {
      return new Response(
        JSON.stringify({ error: `insert_failed: ${insertErr?.message || "unknown"}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const synastrySessionId = inserted.id as string;

    // Risolvi profile_id dall'email per evitare che il checkout risulti orfano
    // (is_orphan = payment_status='paid' AND claimed_profile_id IS NULL).
    const profile = await resolveProfileByEmail(supabase, customerEmail);

    const stripeSessionIdComp = `admin_comp_synastry_${synastrySessionId}`;
    const now = new Date().toISOString();
    const { error: checkoutErr } = await supabase
      .from("checkout_sessions")
      .insert({
        stripe_session_id: stripeSessionIdComp,
        quiz_session_id: null,
        synastry_session_id: synastrySessionId,
        customer_email: customerEmail,
        purchase_type: "synastry",
        product_code: "synastry_couple_report_comped",
        payment_provider: "admin_comp",
        payment_status: "paid",
        payment_completed_at: now,
        amount_total: 0,
        currency: "EUR",
        provider_metadata: { stage: "admin_comp" },
        claimed_profile_id: profile?.id ?? null,
        claimed_at: profile?.id ? now : null,
      });

    if (checkoutErr) {
      console.error(
        "[admin-create-synastry-session] checkout_sessions insert failed:",
        checkoutErr.message,
      );
      // Non blocco: la sinastria è stata creata e la pipeline puo girare.
      // L'amministratore puo creare il link manualmente in seguito.
    }

    // @ts-expect-error EdgeRuntime is provided by the Supabase deno runtime
    EdgeRuntime.waitUntil(
      orchestrate(synastrySessionId).catch((err) => {
        console.error(
          `[admin-create-synastry-session] orchestration failed for ${synastrySessionId}:`,
          err,
        );
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
      JSON.stringify({
        ok: true,
        synastrySessionId,
        stripeSessionIdComp,
        checkoutLinked: !checkoutErr,
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[admin-create-synastry-session] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
