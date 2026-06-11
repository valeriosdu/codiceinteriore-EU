// Admin one-shot: send "report-claim" email to every paid checkout_session
// from the last N days that has not received any of (report-claim, report-ready)
// yet. Idempotency on `report-claim-<provider_payment_id_or_session_id>`
// guarantees we don't double-send if invoked multiple times.
//
// Auth: x-admin-secret header OR service-role bearer token.
//
// Body: { days?: number (default 30), dryRun?: boolean (default false) }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendTransactionalEmailBackground } from "../_shared/send-email.ts";

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
    const days = Math.min(Math.max(Number(body.days) || 30, 1), 365);
    const dryRun = body.dryRun === true;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Pull paid checkouts in the window.
    const { data: paidRows, error: paidError } = await supabase
      .from("checkout_sessions")
      .select("stripe_session_id, customer_email, payment_completed_at")
      .eq("payment_status", "paid")
      .gte("payment_completed_at", since)
      .not("customer_email", "is", null);

    if (paidError) {
      return new Response(JSON.stringify({ error: paidError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Pull all sent emails in the window so we can skip already-contacted recipients.
    const { data: sentRows } = await supabase
      .from("email_send_log")
      .select("recipient_email, template_name, status, created_at")
      .gte("created_at", since)
      .in("template_name", ["report-claim", "report-ready"])
      .in("status", ["pending", "sent"]);

    const contacted = new Set(
      (sentRows || [])
        .map((r) => (r.recipient_email || "").toLowerCase().trim())
        .filter(Boolean),
    );

    const candidates = (paidRows || []).filter((row) => {
      const email = (row.customer_email || "").toLowerCase().trim();
      return email && !contacted.has(email);
    });

    const sent: { email: string; sessionId: string }[] = [];
    if (!dryRun) {
      for (const row of candidates) {
        sendTransactionalEmailBackground({
          templateName: "report-claim",
          recipientEmail: row.customer_email!,
          idempotencyKey: `report-claim-${row.stripe_session_id}`,
          templateData: { sessionId: row.stripe_session_id, name: "" },
        });
        sent.push({ email: row.customer_email!, sessionId: row.stripe_session_id });
      }
    }

    return new Response(
      JSON.stringify({
        windowDays: days,
        dryRun,
        paidCount: paidRows?.length || 0,
        alreadyContacted: (paidRows?.length || 0) - candidates.length,
        toSendCount: candidates.length,
        enqueued: sent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-backfill-claim-emails] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
