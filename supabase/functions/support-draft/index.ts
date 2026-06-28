// support-draft — generate an AI draft reply for one support ticket.
// Body: { ticketId }. Auth: service-role JWT (poll) or x-admin-secret (regenerate).
//
// Flow:
//   1. Atomic claim: received | stale-drafting -> drafting (retry budget).
//   2. One Gemini call returns triage `category` + draft + detected language.
//      If category != 'support' -> store category, status='ignored', stop.
//   3. Resolve the sender to a customer (resolve-profile.ts). If unmatched,
//      build candidate_matches via admin_customers_search (name + emails found
//      in the body) and flag for a human; the draft carries NO account specifics.
//   4. When matched, pull admin_customer_detail, compact to order/account status,
//      and that compact object is BOTH the model's data block and the panel's
//      data_summary. Never ship report/natal content.
//   5. Persist draft + confidence + flag + data_summary, status='drafted'.
//
// Nothing is ever sent here — a human reviews and sends from /admin/support.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { recordAiMetric } from "../_shared/ai-metrics.ts";
import { getMarket, type MarketId } from "../_shared/markets.ts";
import { resolvePromptLang } from "../_shared/prompts/lang.ts";
import {
  supportSystemPrompt,
  CUSTOMER_EMAIL_OPEN,
  CUSTOMER_EMAIL_CLOSE,
} from "../_shared/prompts/support.ts";
import { resolveProfileByEmail } from "../_shared/resolve-profile.ts";
import { extractEmails } from "../_shared/support-filters.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

const MODEL = "gemini-3.1-flash-lite";
const MAX_RETRIES = 3;
const STALE_DRAFTING_MS = 5 * 60 * 1000;
const MAX_CANDIDATES = 5;

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

type ClaimResult =
  | { claimed: true; retry: number }
  | { claimed: false; reason: string };

async function claimTicket(
  admin: ReturnType<typeof createClient>,
  ticketId: string,
): Promise<ClaimResult> {
  const { data: existing } = await admin
    .from("support_tickets")
    .select("status, retry_count, updated_at")
    .eq("id", ticketId)
    .maybeSingle();
  if (!existing) return { claimed: false, reason: "not_found" };

  const row = existing as { status: string; retry_count: number | null; updated_at: string | null };
  const isReceived = row.status === "received";
  const isStaleDrafting =
    row.status === "drafting" &&
    new Date(row.updated_at || 0).getTime() < Date.now() - STALE_DRAFTING_MS;
  if (!isReceived && !isStaleDrafting) {
    return { claimed: false, reason: `not_claimable:${row.status}` };
  }

  const nextRetry = (row.retry_count || 0) + 1;
  if (nextRetry > MAX_RETRIES) {
    await admin
      .from("support_tickets")
      .update({ status: "draft_failed", error: "max_retries_exceeded" })
      .eq("id", ticketId);
    return { claimed: false, reason: "max_retries_exceeded" };
  }

  const staleISO = new Date(Date.now() - STALE_DRAFTING_MS).toISOString();
  const { data: claimed } = await admin
    .from("support_tickets")
    .update({ status: "drafting", retry_count: nextRetry, updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .or(`status.eq.received,and(status.eq.drafting,updated_at.lt.${staleISO})`)
    .select("id")
    .maybeSingle();
  if (!claimed) return { claimed: false, reason: "race_lost" };
  return { claimed: true, retry: nextRetry };
}

// Compact admin_customer_detail to order/account status only. Never report or
// natal-chart content. This object is both the model's data block and the panel.
function compactCustomerData(detail: Record<string, unknown> | null): Record<string, unknown> {
  if (!detail || typeof detail !== "object") return { matched: false };
  const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
  const profile = (detail.profile ?? null) as Record<string, unknown> | null;
  const sessions = arr(detail.quiz_sessions);
  const name = sessions.map((s) => s.user_name).find((n) => typeof n === "string" && n) ?? null;
  const sub = (detail.transit_subscription ?? null) as Record<string, unknown> | null;
  const cycles = arr(detail.transit_cycles);
  const latestCycle = cycles[0] ?? null;
  const feedback = arr(detail.feedback);
  const contacts = (detail.contacts_log ?? null) as Record<string, unknown> | null;

  return {
    matched: true,
    name,
    email: profile?.email ?? detail.email ?? null,
    orders: arr(detail.checkouts).map((c) => ({
      product: c.product_code ?? null,
      purchase_type: c.purchase_type ?? null,
      status: c.payment_status ?? null,
      provider: c.payment_provider ?? null,
      amount_total: c.amount_total ?? null,
      currency: c.currency ?? null,
      paid_at: c.payment_completed_at ?? null,
      created_at: c.created_at ?? null,
      is_orphan: c.is_orphan ?? false,
    })),
    reports: sessions.map((s) => ({
      name: s.user_name ?? null,
      status: s.processing_status ?? null,
      ready: s.has_full_report ?? false,
      error: s.processing_error ?? null,
    })),
    synastry: arr(detail.synastry_sessions).map((s) => ({
      status: s.processing_status ?? null,
      ready: s.has_full_report ?? false,
    })),
    transit_subscription: sub
      ? {
          status: sub.status ?? null,
          current_period_end: sub.current_period_end ?? null,
          cancel_at_period_end: sub.cancel_at_period_end ?? null,
        }
      : null,
    latest_transit_cycle: latestCycle
      ? {
          period_start: latestCycle.period_start ?? null,
          status: latestCycle.status ?? null,
          interpretation_status: latestCycle.interpretation_status ?? null,
        }
      : null,
    feedback_count: feedback.length,
    latest_feedback_rating: (feedback[0]?.rating as unknown) ?? null,
    prior_contacts: contacts?.count ?? 0,
  };
}

type DraftResult = {
  category: string;
  reply_language: string;
  draft: string;
  confidence: string;
  flagForHuman: boolean;
  summary: string;
};

async function callGemini(
  admin: ReturnType<typeof createClient>,
  messages: { role: string; content: string }[],
  attempt: number,
): Promise<DraftResult> {
  if (!GEMINI_API_KEY) throw new Error("AI not configured");

  const aiRequestBody = {
    model: MODEL,
    reasoning_effort: "low",
    max_tokens: 1000,
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: "return_support_draft",
          description: "Return the triage category and the draft support reply.",
          parameters: {
            type: "object",
            properties: {
              category: { type: "string", enum: ["support", "spam", "automated", "other"] },
              reply_language: { type: "string" },
              draft: { type: "string" },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              flagForHuman: { type: "boolean" },
              summary: { type: "string" },
            },
            required: ["category", "reply_language", "draft", "confidence", "flagForHuman", "summary"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "return_support_draft" } },
  };

  const t0 = Date.now();
  const metricBase = { functionName: "support-draft", model: MODEL, attempt };

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(aiRequestBody),
  });

  if (!response.ok) {
    const errText = (await response.text()).slice(0, 240);
    recordAiMetric(admin, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: `http_${response.status}`,
    });
    throw new Error(`gemini_http_${response.status}: ${errText}`);
  }

  const completion = await response.json();
  const argsString = completion.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "";
  if (!argsString) {
    recordAiMetric(admin, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: "missing_tool_call",
      usage: completion?.usage,
    });
    throw new Error("gemini_missing_tool_call");
  }

  let parsed: Partial<DraftResult>;
  try {
    parsed = JSON.parse(String(argsString));
  } catch (e) {
    recordAiMetric(admin, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: "json_parse_error",
      usage: completion?.usage,
    });
    throw new Error(`gemini_json_parse: ${e}`);
  }

  recordAiMetric(admin, {
    ...metricBase,
    durationMs: Date.now() - t0,
    success: true,
    httpStatus: response.status,
    usage: completion?.usage,
  });

  return {
    category: typeof parsed.category === "string" ? parsed.category : "other",
    reply_language: typeof parsed.reply_language === "string" ? parsed.reply_language : "",
    draft: typeof parsed.draft === "string" ? parsed.draft.trim() : "",
    confidence: typeof parsed.confidence === "string" ? parsed.confidence : "low",
    flagForHuman: Boolean(parsed.flagForHuman),
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let ticketId = "";

  try {
    const body = await req.json().catch(() => ({}));
    ticketId = typeof body.ticketId === "string" ? body.ticketId : "";
    if (!ticketId) throw new Error("ticketId is required");

    const isAdmin = Boolean(ADMIN_SECRET && req.headers.get("x-admin-secret") === ADMIN_SECRET);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    const isServiceRole = parseJwtClaims(token)?.role === "service_role";
    if (!isAdmin && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const claim = await claimTicket(admin, ticketId);
    if (!claim.claimed) {
      return new Response(JSON.stringify({ skipped: claim.reason }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: row, error: loadErr } = await admin
      .from("support_tickets")
      .select(
        "id, market, from_email, from_name, subject, body_plain, " +
          "resolved_email, resolved_profile_id, manually_linked, force_support",
      )
      .eq("id", ticketId)
      .maybeSingle();
    if (loadErr) throw loadErr;
    if (!row) throw new Error("ticket_not_found_after_claim");

    const ticket = row as {
      id: string;
      market: string | null;
      from_email: string;
      from_name: string | null;
      subject: string | null;
      body_plain: string | null;
      resolved_email: string | null;
      resolved_profile_id: string | null;
      manually_linked: boolean | null;
      force_support: boolean | null;
    };

    const marketId: MarketId = ticket.market === "es" ? "es" : "it";
    const market = getMarket(marketId);
    const lang = resolvePromptLang(market.language);

    // ── Resolve the sender, or build candidate matches ──────────────────────
    let resolvedEmail: string | null = null;
    let resolvedProfileId: string | null = null;
    let candidateMatches: { email: string; name: string | null; score: number }[] = [];

    if (ticket.manually_linked && ticket.resolved_email) {
      // Admin pinned a customer — honour it, skip auto-resolution.
      resolvedEmail = ticket.resolved_email;
      resolvedProfileId = ticket.resolved_profile_id;
    } else {
      const directProfile = await resolveProfileByEmail(admin, ticket.from_email);
      if (directProfile?.id) {
        resolvedEmail = directProfile.email;
        resolvedProfileId = directProfile.id;
      } else {
        // Fallback: search by sender name and by any emails mentioned in the body.
        const queries: string[] = [];
        if (ticket.from_name && ticket.from_name.trim().length >= 2) queries.push(ticket.from_name.trim());
        for (const e of extractEmails(`${ticket.subject || ""}\n${ticket.body_plain || ""}`)) {
          if (e !== ticket.from_email.toLowerCase()) queries.push(e);
        }
        const seen = new Set<string>();
        for (const q of queries) {
          if (candidateMatches.length >= MAX_CANDIDATES) break;
          try {
            const { data: searchRes } = await admin.rpc("admin_customers_search", {
              p_q: q,
              p_page: 1,
              p_page_size: 3,
            });
            const items = ((searchRes as { items?: Record<string, unknown>[] } | null)?.items) || [];
            for (const it of items) {
              const email = typeof it.email === "string" ? it.email : "";
              if (!email || seen.has(email)) continue;
              seen.add(email);
              candidateMatches.push({
                email,
                name: (it.display_name as string) || null,
                score: 1,
              });
              if (candidateMatches.length >= MAX_CANDIDATES) break;
            }
          } catch (e) {
            console.error("[support-draft] candidate search failed:", e instanceof Error ? e.message : String(e));
          }
        }
      }
    }

    // ── Customer data (only when matched) ───────────────────────────────────
    let compact: Record<string, unknown> = { matched: false };
    if (resolvedEmail) {
      const { data: detail, error: detailErr } = await admin.rpc("admin_customer_detail", {
        p_email: resolvedEmail,
      });
      if (detailErr) {
        console.error("[support-draft] admin_customer_detail error:", detailErr);
      } else {
        compact = compactCustomerData(detail as Record<string, unknown>);
      }
    }

    // ── Build the prompt ────────────────────────────────────────────────────
    const dataBlock = compact.matched
      ? `CUSTOMER DATA (matched customer — account/order status only, no report content):\n${JSON.stringify(compact)}`
      : `CUSTOMER DATA: the sender (${ticket.from_email}) was NOT matched to any customer in our records. Include NO account specifics in the reply.${
          candidateMatches.length ? " Unconfirmed possible matches exist; a human will link the right one." : ""
        }`;

    const emailBlock =
      `Subject: ${ticket.subject || "(no subject)"}\n` +
      `${CUSTOMER_EMAIL_OPEN}\n${ticket.body_plain || "(empty body)"}\n${CUSTOMER_EMAIL_CLOSE}`;

    const messages = [
      { role: "system", content: supportSystemPrompt(lang, market.siteName) },
      { role: "system", content: dataBlock },
      { role: "user", content: emailBlock },
    ];

    const result = await callGemini(admin, messages, claim.retry);
    const forceSupport = Boolean(ticket.force_support);
    const category = forceSupport ? "support" : result.category;

    // ── Persist ─────────────────────────────────────────────────────────────
    if (category !== "support") {
      await admin
        .from("support_tickets")
        .update({
          status: "ignored",
          category: result.category,
          triage_reason: `ai:${result.category}`,
          ai_note: result.summary || null,
          model_used: MODEL,
          error: null,
        })
        .eq("id", ticketId);
      return new Response(JSON.stringify({ ticketId, category: result.category, status: "ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Empty draft is only acceptable when the admin forced support on something
    // the model judged non-support — leave the textarea blank for the human.
    if (!result.draft && !forceSupport) throw new Error("empty_draft_for_support_category");

    const aiNote =
      forceSupport && result.category !== "support"
        ? `[forzato come support; l'AI aveva classificato: ${result.category}] ${result.summary}`.trim()
        : result.summary;

    await admin
      .from("support_tickets")
      .update({
        status: "drafted",
        category: "support",
        draft_body: result.draft,
        reply_language: result.reply_language || lang,
        ai_confidence: result.confidence,
        flag_for_human: result.flagForHuman || !compact.matched || (forceSupport && !result.draft),
        ai_note: aiNote || null,
        data_summary: compact,
        resolved_email: resolvedEmail,
        resolved_profile_id: resolvedProfileId,
        candidate_matches: candidateMatches,
        model_used: MODEL,
        error: null,
      })
      .eq("id", ticketId);

    return new Response(
      JSON.stringify({ ticketId, status: "drafted", matched: Boolean(resolvedEmail), candidates: candidateMatches.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[support-draft] error:", message);
    if (ticketId) {
      const { data: row } = await admin
        .from("support_tickets")
        .select("retry_count")
        .eq("id", ticketId)
        .maybeSingle();
      const retries = (row as { retry_count?: number } | null)?.retry_count ?? 0;
      // Reset to 'received' so the poll catch-up re-invokes; give up after MAX_RETRIES.
      await admin
        .from("support_tickets")
        .update({
          status: retries >= MAX_RETRIES ? "draft_failed" : "received",
          error: message.slice(0, 500),
        })
        .eq("id", ticketId);
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
