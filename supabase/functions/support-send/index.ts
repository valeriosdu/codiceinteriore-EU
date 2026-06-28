// support-send — send the (admin-reviewed) reply to a support ticket via Zoho.
// Body: { ticketId, text? }. Auth: x-admin-secret.
//
// Safety:
//   - Phase-1 kill switch: unless SUPPORT_SEND_ENABLED='true', this is a dry run
//     (returns { dryRun:true } and changes nothing). Enable in Phase 2.
//   - Compare-and-swap to 'answered' BEFORE sending guards against double-send;
//     on a Zoho failure we revert to 'drafted' so the admin can retry.
//   - The reply goes from the market's support address back through Zoho so the
//     thread stays in the mailbox.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getMarket, type MarketId } from "../_shared/markets.ts";
import { getZohoConfig, zohoAccessToken, zohoSendReply } from "../_shared/zoho.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";
const SEND_ENABLED = Deno.env.get("SUPPORT_SEND_ENABLED") === "true";

const MAX_REPLY_CHARS = 50000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    if (!ADMIN_SECRET || adminSecret !== ADMIN_SECRET) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const ticketId = typeof body.ticketId === "string" ? body.ticketId.trim() : "";
    const editedText = typeof body.text === "string" ? body.text : "";
    if (!ticketId) return json({ error: "ticketId is required" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: row, error: loadErr } = await admin
      .from("support_tickets")
      .select("id, market, status, from_email, subject, zoho_message_id, draft_body")
      .eq("id", ticketId)
      .maybeSingle();
    if (loadErr) throw loadErr;
    if (!row) return json({ error: "ticket_not_found" }, 404);

    const ticket = row as {
      id: string;
      market: string | null;
      status: string;
      from_email: string;
      subject: string | null;
      zoho_message_id: string;
      draft_body: string | null;
    };

    if (ticket.status === "answered") return json({ error: "already_answered" }, 409);

    const text = (editedText || ticket.draft_body || "").trim();
    if (!text) return json({ error: "empty_reply" }, 400);
    if (text.length > MAX_REPLY_CHARS) return json({ error: "reply_too_long" }, 400);
    if (!ticket.from_email || ticket.from_email === "(unknown)") {
      return json({ error: "no_recipient_address" }, 400);
    }

    const marketId: MarketId = ticket.market === "es" ? "es" : "it";
    const market = getMarket(marketId);
    const subject = ticket.subject?.toLowerCase().startsWith("re:")
      ? ticket.subject
      : `Re: ${ticket.subject || ""}`.trim();

    // Phase-1 dry run: do not send, do not mutate state.
    if (!SEND_ENABLED) {
      return json({
        dryRun: true,
        message: "SUPPORT_SEND_ENABLED is not 'true' — reply not sent.",
        wouldSendTo: ticket.from_email,
        from: market.contactEmail,
        subject,
        chars: text.length,
      });
    }

    // Compare-and-swap claim BEFORE sending → no double-send under concurrency.
    const { data: claimed } = await admin
      .from("support_tickets")
      .update({ status: "answered", answered_at: new Date().toISOString(), answered_by: "admin" })
      .eq("id", ticketId)
      .neq("status", "answered")
      .select("id")
      .maybeSingle();
    if (!claimed) return json({ error: "already_answered" }, 409);

    try {
      const cfg = getZohoConfig(marketId);
      const token = await zohoAccessToken(cfg);
      const { sentMessageId } = await zohoSendReply(cfg, token, {
        originalMessageId: ticket.zoho_message_id,
        fromAddress: market.contactEmail,
        toAddress: ticket.from_email,
        subject,
        contentPlain: text,
      });
      await admin
        .from("support_tickets")
        .update({ sent_body: text, zoho_sent_message_id: sentMessageId })
        .eq("id", ticketId);
      return json({ ok: true, ticketId, sentMessageId });
    } catch (sendErr) {
      // Revert the claim so the admin can retry.
      const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
      await admin
        .from("support_tickets")
        .update({ status: "drafted", answered_at: null, error: msg.slice(0, 500) })
        .eq("id", ticketId);
      console.error("[support-send] send failed, reverted:", msg);
      return json({ error: `send_failed: ${msg}` }, 502);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[support-send] error:", msg);
    return json({ error: msg }, 500);
  }
});
