// Admin: manually link a support ticket to a customer, then re-draft.
// Body: { ticketId, email }. Auth: x-admin-secret.
//
// Used when the sender email didn't resolve and the admin picks the right
// customer (from the candidate list or a manual search). Sets the pinned
// customer, marks the ticket as a real support ticket, clears the old draft, and
// fire-and-forget invokes support-draft so it re-drafts with that customer's data.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveProfileByEmail } from "../_shared/resolve-profile.ts";

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
        console.error(`[admin-link-customer] draft invoke failed (${res.status}): ${text.slice(0, 200)}`);
      }
    })
    .catch((e) => console.error("[admin-link-customer] draft invoke threw:", e instanceof Error ? e.message : String(e)));
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
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!ticketId || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "ticketId and a valid email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existing } = await admin
      .from("support_tickets")
      .select("id")
      .eq("id", ticketId)
      .maybeSingle();
    if (!existing) {
      return new Response(JSON.stringify({ error: "ticket_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve to the canonical profile when possible (handles cross-email).
    const profile = await resolveProfileByEmail(admin, email);
    const resolvedEmail = profile?.email || email;
    const resolvedProfileId = profile?.id || null;

    const { error: updateErr } = await admin
      .from("support_tickets")
      .update({
        resolved_email: resolvedEmail,
        resolved_profile_id: resolvedProfileId,
        manually_linked: true,
        force_support: true,
        candidate_matches: [],
        status: "received",
        draft_body: null,
        error: null,
        retry_count: 0,
      })
      .eq("id", ticketId);
    if (updateErr) throw updateErr;

    invokeDraft(ticketId);

    return new Response(
      JSON.stringify({ success: true, ticketId, resolvedEmail, resolvedProfileId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-link-customer] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
