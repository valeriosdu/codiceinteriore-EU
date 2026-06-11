// Admin helper: dato un quiz_session esistente con report natale completo,
// crea un user_entitlement comped (monthly_transits) + transit_cycle row e
// invoca process-transit-cycle in background. Pensato per "regalare" transiti
// a un cliente senza pagamento. Auth via x-admin-secret OR service-role bearer.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

const pad = (n: number) => String(n).padStart(2, "0");

const formatTimezoneOffset = (offsetHours: unknown) => {
  const hours = Number(offsetHours);
  if (!Number.isFinite(hours)) return "AUTO";
  const sign = hours >= 0 ? "+" : "-";
  const absolute = Math.abs(hours);
  const wholeHours = Math.floor(absolute);
  const minutes = Math.round((absolute - wholeHours) * 60);
  return `${sign}${pad(wholeHours)}:${pad(minutes)}`;
};

const formatLocalDateTime = (date: Date, offsetHours: unknown) => {
  const hours = Number(offsetHours);
  const local = Number.isFinite(hours)
    ? new Date(date.getTime() + hours * 60 * 60 * 1000)
    : date;
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
};

const addMonthsToLocalDateOnly = (localDateTime: string, months: number) => {
  const [datePart, timePart = "00:00"] = localDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0));
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
};

async function resolveProfileId(
  supabase: ReturnType<typeof createClient>,
  quizSessionId: string,
): Promise<string | null> {
  const { data: profileByQuiz } = await supabase
    .from("profiles")
    .select("id")
    .eq("quiz_session_id", quizSessionId)
    .maybeSingle();
  if (profileByQuiz?.id) return profileByQuiz.id as string;

  const { data: checkoutClaimed } = await supabase
    .from("checkout_sessions")
    .select("claimed_profile_id")
    .eq("quiz_session_id", quizSessionId)
    .not("claimed_profile_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (checkoutClaimed?.claimed_profile_id) {
    return checkoutClaimed.claimed_profile_id as string;
  }

  const { data: reportRow } = await supabase
    .from("user_reports")
    .select("profile_id")
    .eq("quiz_session_id", quizSessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (reportRow?.profile_id) return reportRow.profile_id as string;

  return null;
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
    const quizSessionId =
      typeof body.quizSessionId === "string" ? body.quizSessionId : "";
    if (!quizSessionId) {
      return new Response(JSON.stringify({ error: "quizSessionId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional override: admin può specificare un periodStart custom (YYYY-MM-DD).
    // Usato dal dialog "Nuovo ciclo transiti" → opzione "continua dall'ultimo ciclo"
    // per cucire il nuovo cycle al period_end del precedente senza gap.
    // Se omesso, calcoliamo "oggi" come prima.
    const periodStartOverride =
      typeof body.periodStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.periodStart)
        ? body.periodStart
        : null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: quiz, error: quizErr } = await supabase
      .from("quiz_sessions")
      .select("id, full_report, birth_timezone")
      .eq("id", quizSessionId)
      .maybeSingle();

    if (quizErr || !quiz) {
      return new Response(
        JSON.stringify({ error: `quiz_session not found: ${quizErr?.message || "missing"}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!quiz.full_report) {
      return new Response(
        JSON.stringify({
          error:
            "Il report natale non è ancora pronto. Aspetta che la generazione del natale finisca prima di creare i transiti.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const profileId = await resolveProfileId(supabase, quizSessionId);
    if (!profileId) {
      return new Response(
        JSON.stringify({
          error:
            "Nessun profilo collegato a questo report natale. Recupera prima il checkout orphan o crea un profilo manualmente.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const now = new Date();
    const nowLocalDateTime = formatLocalDateTime(now, quiz.birth_timezone);
    // baseLocalDateTime guida le date-snapshot reali in process-transit-cycle,
    // che legge premium_purchase_local_datetime per primo. Con una data scelta
    // dall'admin la ancoriamo a mezzogiorno di quel giorno (stessa convenzione
    // del fallback period_start lato process-transit-cycle); altrimenti usiamo
    // l'ora reale "now". Senza questo, periodStart cambiava solo i metadata e i
    // transiti partivano comunque da oggi.
    const baseLocalDateTime = periodStartOverride
      ? `${periodStartOverride}T12:00`
      : nowLocalDateTime;
    const periodStart = baseLocalDateTime.slice(0, 10);
    const periodEnd = addMonthsToLocalDateOnly(baseLocalDateTime, 1);
    const purchaseTimezone = formatTimezoneOffset(quiz.birth_timezone);

    // Upsert entitlement monthly_transits comped. Senza stripe_session_id l'unique
    // partial index user_entitlements_transits_payment_unique non si applica, quindi
    // controllo manualmente l'esistenza per evitare duplicati per lo stesso quiz_session.
    const { data: existingEntitlement } = await supabase
      .from("user_entitlements")
      .select("id, status, ends_at")
      .eq("profile_id", profileId)
      .eq("quiz_session_id", quizSessionId)
      .eq("entitlement_type", "monthly_transits")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let entitlementId: string;
    if (existingEntitlement?.id) {
      entitlementId = existingEntitlement.id as string;
    } else {
      const { data: insertedEnt, error: entErr } = await supabase
        .from("user_entitlements")
        .insert({
          profile_id: profileId,
          quiz_session_id: quizSessionId,
          stripe_session_id: null,
          entitlement_type: "monthly_transits",
          status: "active",
          starts_at: now.toISOString(),
          ends_at: new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          source: "manual_admin",
        })
        .select("id")
        .single();

      if (entErr || !insertedEnt?.id) {
        return new Response(
          JSON.stringify({ error: `entitlement_insert_failed: ${entErr?.message || "unknown"}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      entitlementId = insertedEnt.id as string;
    }

    const { data: cycle, error: cycleErr } = await supabase
      .from("transit_cycles")
      .upsert(
        {
          profile_id: profileId,
          quiz_session_id: quizSessionId,
          entitlement_id: entitlementId,
          stripe_session_id: null,
          period_start: periodStart,
          period_end: periodEnd,
          premium_purchase_at: now.toISOString(),
          premium_purchase_local_datetime: baseLocalDateTime,
          premium_purchase_timezone: purchaseTimezone,
          snapshot_count: 10,
          snapshot_step_days: 3.3,
          status: "pending",
          fetch_status: "pending",
          interpretation_status: "pending",
          processing_error: null,
        },
        { onConflict: "entitlement_id,period_start,period_end" },
      )
      .select("id")
      .maybeSingle();

    if (cycleErr || !cycle?.id) {
      return new Response(
        JSON.stringify({ error: `cycle_insert_failed: ${cycleErr?.message || "unknown"}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const transitCycleId = cycle.id as string;

    // @ts-expect-error EdgeRuntime is provided by the Supabase deno runtime
    EdgeRuntime.waitUntil(
      fetch(`${SUPABASE_URL}/functions/v1/process-transit-cycle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ transitCycleId }),
      }).catch((err) => {
        console.error("[admin-create-transit-cycle] background invoke error:", err);
      }),
    );

    return new Response(
      JSON.stringify({
        ok: true,
        transitCycleId,
        entitlementId,
        profileId,
        periodStart,
        periodEnd,
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[admin-create-transit-cycle] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
