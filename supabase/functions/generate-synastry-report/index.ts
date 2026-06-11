// generate-synastry-report: genera il full_report Gemini Pro per una synastry_session.
//
// Pattern parallelo a generate-report ma semplificato:
// - 3 modi auth: user JWT, service role, x-admin-secret
// - Verifica payment via checkout_sessions (semplice: 1 tier)
// - Idempotency guard .is("full_report", null)
// - Brief italiano preprocessato server-side (no raw JSON nel prompt)
// - Modello: google/gemini-3.1-pro-preview
// - Background via EdgeRuntime.waitUntil
//
// Plan: lazy-wishing-kay.md sez. B3.

// @ts-ignore deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { recordAiMetric } from "../_shared/ai-metrics.ts";
import { buildSynastryBrief, BirthData } from "../_shared/synastry-brief.ts";
import {
  buildSynastrySystemPrompt,
  buildSynastryUserPrompt,
  SYNASTRY_REPORT_TOOL,
} from "../_shared/synastry-system-prompt.ts";
import { sendTransactionalEmailBackground } from "../_shared/send-email.ts";

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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") ?? "";

const MAX_ATTEMPTS = 2;
const FETCH_TIMEOUT_MS = 180_000;
const RETRY_BACKOFF_MS = 1500;

interface SynastryRow {
  id: string;
  person_a_name: string | null;
  person_a_birth_date: any;
  person_a_birth_time: any;
  person_a_time_known: boolean;
  person_b_name: string | null;
  person_b_birth_date: any;
  person_b_birth_time: any;
  person_b_time_known: boolean;
  chart_a: any;
  chart_b: any;
  synastry_data: any;
  full_report: any;
  processing_status: string | null;
  relationship_duration: string | null;
}

async function verifyAuthOrPayment(
  req: Request,
  supabaseAdmin: any,
  synastrySessionId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const adminHeader = req.headers.get("x-admin-secret") ?? "";
  if (ADMIN_SECRET && adminHeader === ADMIN_SECRET) {
    return { allowed: true };
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "");
  if (bearer && bearer === SERVICE_ROLE) {
    return { allowed: true };
  }

  // Verifica payment: deve esistere un checkout_sessions paid per questa synastry_session.
  // Accetta sia "synastry" (prezzo pieno) sia "synastry_launch" (sconto lancio).
  const { data: paid } = await supabaseAdmin
    .from("checkout_sessions")
    .select("payment_status, purchase_type")
    .eq("synastry_session_id", synastrySessionId)
    .eq("payment_status", "paid")
    .in("purchase_type", ["synastry", "synastry_launch"])
    .limit(1)
    .maybeSingle();

  if (paid) return { allowed: true };

  return { allowed: false, reason: "No paid checkout for this synastry session" };
}

function parseToolCallArgs(json: any): any | null {
  const choice = json?.choices?.[0];
  const toolCall = choice?.message?.tool_calls?.[0];
  const args = toolCall?.function?.arguments;
  if (typeof args === "string") {
    try {
      return JSON.parse(args);
    } catch {
      return null;
    }
  }
  if (args && typeof args === "object") return args;
  return null;
}

async function generateReportJob(synastrySessionId: string, skipEmail = false): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Idempotency lock atomico: setta status solo se full_report e null
  const { data: locked, error: lockErr } = await supabase
    .from("synastry_sessions")
    .update({ processing_status: "report_processing" })
    .eq("id", synastrySessionId)
    .is("full_report", null)
    .select("id")
    .maybeSingle();

  if (lockErr) {
    console.warn("[generate-synastry-report] lock error:", lockErr);
  }
  if (!locked) {
    console.log("[generate-synastry-report] already has full_report or lock failed, skipping");
    return;
  }

  const { data: session, error } = await supabase
    .from("synastry_sessions")
    .select(
      "id, person_a_name, person_a_birth_date, person_a_birth_time, person_a_time_known, person_b_name, person_b_birth_date, person_b_birth_time, person_b_time_known, chart_a, chart_b, synastry_data, full_report, processing_status, relationship_duration",
    )
    .eq("id", synastrySessionId)
    .maybeSingle<SynastryRow>();

  if (error || !session) {
    throw new Error(`session not found: ${error?.message}`);
  }

  if (!session.synastry_data) {
    throw new Error("synastry_data missing: synastry-chart must run first");
  }

  // Costruisci brief italiano
  const personA: BirthData = {
    name: session.person_a_name || "Persona A",
    birthDate: session.person_a_birth_date ?? { day: 1, month: 1, year: 1990 },
    timeKnown: session.person_a_time_known !== false,
  };
  const personB: BirthData = {
    name: session.person_b_name || "Persona B",
    birthDate: session.person_b_birth_date ?? { day: 1, month: 1, year: 1990 },
    timeKnown: session.person_b_time_known !== false,
  };
  const brief = buildSynastryBrief({
    personA,
    personB,
    chartA: session.chart_a,
    chartB: session.chart_b,
    synastryData: session.synastry_data,
    relationshipDuration: session.relationship_duration,
  });

  const systemPrompt = buildSynastrySystemPrompt(brief);
  const userPrompt = buildSynastryUserPrompt(brief);

  const aiRequestBody = {
    model: "google/gemini-3.1-pro-preview",
    max_tokens: 16384,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    tools: [SYNASTRY_REPORT_TOOL],
    tool_choice: {
      type: "function",
      function: { name: "return_synastry_report" },
    },
  };

  let parsed: any = null;
  let lastError = "";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
    }
    const t0 = Date.now();
    const metricBase = {
      functionName: "generate-synastry-report",
      model: aiRequestBody.model,
      // ai_generation_metrics non ha synastry_session_id column; tracciamo
      // tutto tramite functionName + functionName logs. La session e' nel log.
      quizSessionId: null as string | null,
      attempt: attempt + 1,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(aiRequestBody),
          signal: controller.signal,
        },
      );
    } catch (err: any) {
      clearTimeout(timer);
      const name = err?.name;
      if (name === "AbortError") {
        lastError = `client timeout after ${FETCH_TIMEOUT_MS}ms`;
        recordAiMetric(supabase, {
          ...metricBase,
          durationMs: Date.now() - t0,
          success: false,
          errorCode: `client_timeout_${FETCH_TIMEOUT_MS}ms`,
        });
        continue;
      }
      throw err;
    }
    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      lastError = `gateway ${response.status}: ${errText.slice(0, 500)}`;
      recordAiMetric(supabase, {
        ...metricBase,
        durationMs: Date.now() - t0,
        success: false,
        httpStatus: response.status,
        errorCode: `http_${response.status}`,
      });
      continue;
    }

    const json = await response.json();
    const args = parseToolCallArgs(json);
    if (!args) {
      lastError = "no tool call in response";
      recordAiMetric(supabase, {
        ...metricBase,
        durationMs: Date.now() - t0,
        success: false,
        httpStatus: response.status,
        errorCode: "no_tool_call",
      });
      continue;
    }

    recordAiMetric(supabase, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: true,
      httpStatus: response.status,
      usage: json?.usage,
    });

    parsed = args;
    break;
  }

  if (!parsed) {
    throw new Error(`gemini failed after ${MAX_ATTEMPTS} attempts: ${lastError}`);
  }

  // Salva brief e full_report
  await supabase
    .from("synastry_sessions")
    .update({
      brief,
      full_report: parsed,
      llm_input: { system: systemPrompt, user: userPrompt },
      llm_output: parsed,
      processing_status: "report_ready",
    })
    .eq("id", synastrySessionId);

  // Email transazionale (skip quando chiamato con skipEmail: true dagli admin endpoints)
  const { data: checkout } = await supabase
    .from("checkout_sessions")
    .select("customer_email, stripe_session_id")
    .eq("synastry_session_id", synastrySessionId)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (checkout?.customer_email && !skipEmail) {
    sendTransactionalEmailBackground({
      templateName: "synastry-claim",
      recipientEmail: checkout.customer_email,
      idempotencyKey: `synastry-claim-${synastrySessionId}`,
      templateData: {
        name: session.person_a_name || "",
        sessionId: checkout.stripe_session_id || undefined,
      },
    });
    sendTransactionalEmailBackground({
      templateName: "synastry-ready",
      recipientEmail: checkout.customer_email,
      idempotencyKey: `synastry-ready-${synastrySessionId}`,
      templateData: {
        name: session.person_a_name || "",
        sessionId: checkout.stripe_session_id || undefined,
      },
    });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const synastrySessionId = body?.synastrySessionId;
    const skipEmail = body?.skipEmail === true;
    if (!synastrySessionId) {
      return new Response(JSON.stringify({ error: "synastrySessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const auth = await verifyAuthOrPayment(req, supabaseAdmin, synastrySessionId);
    if (!auth.allowed) {
      return new Response(JSON.stringify({ error: auth.reason }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    EdgeRuntime.waitUntil(
      generateReportJob(synastrySessionId, skipEmail).catch(async (err) => {
        console.error("[generate-synastry-report] background job failed:", err);
        try {
          await supabaseAdmin
            .from("synastry_sessions")
            .update({
              processing_status: "failed",
              processing_error: String(err).slice(0, 1000),
            })
            .eq("id", synastrySessionId);
        } catch {
          // ignore
        }
      }),
    );

    return new Response(JSON.stringify({ ok: true, status: "queued" }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-synastry-report] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
