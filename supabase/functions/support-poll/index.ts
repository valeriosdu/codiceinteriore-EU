// support-poll — scheduled ingestion of Zoho support mail (one ticket per
// inbound message). Called by pg_cron (~1/min) with a service-role bearer, or
// manually with x-admin-secret for testing.
//
// Per market (it, es):
//   1. List the newest messages in the support folder (metadata only).
//   2. Diff against zoho_message_ids already stored → only genuinely new ones.
//   3. Denylist filter: automated/non-customer senders (Stripe/PayPal/bounces/
//      our own domains) are stored as status='ignored' WITHOUT an LLM call.
//   4. For real candidates (capped per run) fetch content, store as 'received',
//      and fire-and-forget invoke support-draft.
//
// Idempotency: UNIQUE(market, zoho_message_id) + upsert(ignoreDuplicates) means
// re-polling never duplicates and only freshly-inserted rows trigger a draft.
// Per-market failures are isolated (a missing es secret never blocks it).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import type { MarketId } from "../_shared/markets.ts";
import {
  getZohoConfig,
  zohoAccessToken,
  zohoListFolderMessages,
  zohoGetMessageContent,
} from "../_shared/zoho.ts";
import { isAutomatedSender, parseFromAddress, htmlToPlainText } from "../_shared/support-filters.ts";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

const MARKETS: MarketId[] = ["it", "es", "us"];
const LIST_LIMIT = 25;
const MAX_NEW_PER_RUN = 10; // cap content fetches / drafts per market per tick
const STALE_DRAFTING_MS = 5 * 60 * 1000; // matches support-draft's claim window

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

// Fire-and-forget invoke of support-draft, authenticated with the service-role
// key (a valid JWT for this project that also satisfies the worker's in-code
// service-role check).
const invokeDraft = (ticketId: string) => {
  const promise = (async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/support-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          ...(ADMIN_SECRET ? { "x-admin-secret": ADMIN_SECRET } : {}),
        },
        body: JSON.stringify({ ticketId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[support-poll] draft invoke failed (${res.status}): ${text.slice(0, 200)}`);
      }
    } catch (e) {
      console.error("[support-poll] draft invoke threw:", e instanceof Error ? e.message : String(e));
    }
  })();
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(promise);
  } else {
    promise.catch(() => undefined);
  }
};

type MarketResult = {
  market: MarketId;
  listed?: number;
  inserted?: number;
  ignored?: number;
  drafted?: number;
  skipped?: string;
  error?: string;
};

async function pollMarket(
  admin: ReturnType<typeof createClient>,
  market: MarketId,
): Promise<MarketResult> {
  let cfg;
  try {
    cfg = getZohoConfig(market);
  } catch (e) {
    // Market not configured yet (missing secret) — skip, don't fail the run.
    return { market, skipped: e instanceof Error ? e.message : String(e) };
  }

  const token = await zohoAccessToken(cfg);
  const messages = await zohoListFolderMessages(cfg, token, { limit: LIST_LIMIT });
  if (messages.length === 0) return { market, listed: 0, inserted: 0, ignored: 0, drafted: 0 };

  // Diff against what we already have for this market.
  const ids = messages.map((m) => m.messageId);
  const { data: existingRows } = await admin
    .from("support_tickets")
    .select("zoho_message_id")
    .eq("market", market)
    .in("zoho_message_id", ids);
  const existing = new Set((existingRows || []).map((r: { zoho_message_id: string }) => r.zoho_message_id));

  // Newest-first list; take up to MAX_NEW_PER_RUN genuinely new ones.
  const fresh = messages.filter((m) => !existing.has(m.messageId)).slice(0, MAX_NEW_PER_RUN);

  let inserted = 0;
  let ignored = 0;
  let drafted = 0;
  const freshlyInvoked = new Set<string>();

  for (const msg of fresh) {
    const { name, email } = parseFromAddress(msg.fromAddress);
    const receivedAt = msg.receivedTime ? new Date(msg.receivedTime).toISOString() : null;
    const base = {
      market,
      zoho_account_id: cfg.accountId,
      zoho_folder_id: cfg.folderId,
      zoho_message_id: msg.messageId,
      zoho_thread_id: msg.threadId,
      from_email: email || "(unknown)",
      from_name: name,
      subject: msg.subject || null,
      received_at: receivedAt,
      attachment_count: msg.hasAttachment ? 1 : 0,
    };

    const denylist = isAutomatedSender(email);
    if (denylist.automated) {
      // No content fetch, no LLM — record and move on.
      const { data: ins } = await admin
        .from("support_tickets")
        .upsert(
          { ...base, status: "ignored", category: "automated", triage_reason: denylist.reason },
          { onConflict: "market,zoho_message_id", ignoreDuplicates: true },
        )
        .select("id");
      if (ins && ins.length > 0) ignored += 1;
      continue;
    }

    // Real candidate: fetch content, store as 'received', invoke the drafter.
    let bodyPlain = "";
    try {
      const { html } = await zohoGetMessageContent(cfg, token, msg.messageId);
      bodyPlain = htmlToPlainText(html).slice(0, 100000);
    } catch (e) {
      console.error(
        `[support-poll] content fetch failed (${market}/${msg.messageId}):`,
        e instanceof Error ? e.message : String(e),
      );
      // Insert anyway with empty body; the drafter will flag low confidence.
    }

    const { data: ins } = await admin
      .from("support_tickets")
      .upsert(
        { ...base, body_plain: bodyPlain || null, status: "received" },
        { onConflict: "market,zoho_message_id", ignoreDuplicates: true },
      )
      .select("id");

    if (ins && ins.length > 0) {
      inserted += 1;
      const id = ins[0].id as string;
      invokeDraft(id);
      freshlyInvoked.add(id);
      drafted += 1;
    }
  }

  // Catch-up: re-invoke the drafter for tickets stuck in 'received' or
  // stale-'drafting' (a transient draft failure resets to 'received'). Cheap and
  // bounded; the drafter's atomic claim makes any redundant invoke a no-op.
  const staleISO = new Date(Date.now() - STALE_DRAFTING_MS).toISOString();
  const sinceISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: stuck } = await admin
    .from("support_tickets")
    .select("id, status, updated_at")
    .eq("market", market)
    .gte("created_at", sinceISO)
    .in("status", ["received", "drafting"])
    .order("created_at", { ascending: true })
    .limit(MAX_NEW_PER_RUN);
  for (const t of (stuck || []) as { id: string; status: string; updated_at: string | null }[]) {
    if (freshlyInvoked.has(t.id)) continue;
    if (t.status === "drafting" && new Date(t.updated_at || 0).getTime() >= Date.now() - STALE_DRAFTING_MS) {
      continue; // a draft is actively in flight
    }
    invokeDraft(t.id);
  }

  return { market, listed: messages.length, inserted, ignored, drafted };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Privileged-only: service-role JWT (cron) OR admin secret (manual).
    const isAdmin = Boolean(ADMIN_SECRET && req.headers.get("x-admin-secret") === ADMIN_SECRET);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    const isServiceRole = parseJwtClaims(token)?.role === "service_role";
    if (!isAdmin && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results: MarketResult[] = [];
    for (const market of MARKETS) {
      try {
        results.push(await pollMarket(admin, market));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[support-poll] market ${market} failed:`, msg);
        results.push({ market, error: msg });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[support-poll] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
