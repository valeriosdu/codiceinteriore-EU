// Dettaglio singolo cliente per la scheda /admin/clienti/:email.
//
// Il lavoro di aggregazione (profile + quiz_sessions + checkouts + transiti +
// feedback + contacts_log) avviene interamente nella RPC
// public.admin_customer_detail in una sola query. Questa edge function è solo
// il wrapper HTTP con auth via ADMIN_SECRET.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

interface RequestBody {
  email?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    if (!ADMIN_SECRET || adminSecret !== ADMIN_SECRET) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    let body: RequestBody = {};
    if (req.method === "POST") {
      try {
        body = (await req.json()) as RequestBody;
      } catch {
        body = {};
      }
    } else {
      const u = new URL(req.url);
      body = { email: u.searchParams.get("email") ?? undefined };
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email) {
      return jsonResponse({ error: "Missing email" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await admin.rpc("admin_customer_detail", {
      p_email: email,
    });

    if (error) {
      console.error("[admin-customer-detail] rpc error:", error);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-customer-detail] error:", msg);
    return jsonResponse({ error: msg }, 500);
  }
});
