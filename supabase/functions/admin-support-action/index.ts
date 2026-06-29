// Admin: ignore or delete a support ticket. Auth: x-admin-secret.
// Body: { ticketId, action: "ignore" | "delete" }
//   - ignore: move it out of the active queue (status='ignored', manual reason).
//   - delete: remove the row entirely.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!ADMIN_SECRET || req.headers.get("x-admin-secret") !== ADMIN_SECRET) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const ticketId = typeof body.ticketId === "string" ? body.ticketId.trim() : "";
    const action = typeof body.action === "string" ? body.action : "";
    if (!ticketId || (action !== "ignore" && action !== "delete")) {
      return json({ error: "ticketId and action ('ignore'|'delete') are required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existing } = await admin
      .from("support_tickets")
      .select("id, status, category")
      .eq("id", ticketId)
      .maybeSingle();
    if (!existing) return json({ error: "ticket_not_found" }, 404);
    const cur = existing as { status: string; category: string | null };

    if (action === "delete") {
      const { error } = await admin.from("support_tickets").delete().eq("id", ticketId);
      if (error) throw error;
      return json({ ok: true, ticketId, action: "delete" });
    }

    // ignore
    const { error } = await admin
      .from("support_tickets")
      .update({
        status: "ignored",
        category: cur.category || "other",
        triage_reason: "manual",
        flag_for_human: false,
      })
      .eq("id", ticketId);
    if (error) throw error;
    return json({ ok: true, ticketId, action: "ignore" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-support-action] error:", msg);
    return json({ error: msg }, 500);
  }
});
