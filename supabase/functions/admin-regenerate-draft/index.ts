// Admin: re-run the AI draft for a support ticket.
// Body: { ticketId, forceSupport? }. Auth: x-admin-secret.
//
//   - Resets status='received', draft_body=null, error=null, retry_count=0 and
//     fire-and-forget invokes support-draft.
//   - forceSupport=true sets force_support so the drafter won't file it as
//     spam/automated (used to "promote" an ignored mail into a real ticket).
//   - A manual customer link (manually_linked/resolved_email) is preserved so a
//     plain regenerate re-drafts with the pinned customer's data.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

const invokeDraft = (ticketId: string) => {
  const promise = fetch(`${SUPABASE_URL}/functions/v1/support-draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "x-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({ ticketId }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[admin-regenerate-draft] draft invoke failed (${res.status}): ${text.slice(0, 200)}`);
      }
    })
    .catch((e) => console.error("[admin-regenerate-draft] draft invoke threw:", e instanceof Error ? e.message : String(e)));
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(promise);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    if (!ADMIN_SECRET || adminSecret !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const ticketId = typeof body.ticketId === "string" ? body.ticketId.trim() : "";
    const forceSupport = body.forceSupport === true;
    if (!ticketId) {
      return new Response(JSON.stringify({ error: "ticketId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existing, error: lookupErr } = await admin
      .from("support_tickets")
      .select("id, status")
      .eq("id", ticketId)
      .maybeSingle();
    if (lookupErr) throw lookupErr;
    if (!existing) {
      return new Response(JSON.stringify({ error: "ticket_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const update: Record<string, unknown> = {
      status: "received",
      draft_body: null,
      error: null,
      retry_count: 0,
    };
    if (forceSupport) update.force_support = true;

    const { error: updateErr } = await admin.from("support_tickets").update(update).eq("id", ticketId);
    if (updateErr) throw updateErr;

    invokeDraft(ticketId);

    return new Response(
      JSON.stringify({ success: true, ticketId, previousStatus: (existing as { status: string }).status, forceSupport }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-regenerate-draft] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
