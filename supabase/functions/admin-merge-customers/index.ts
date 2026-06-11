// Fusione/scissione di due email dello stesso cliente per /admin/clienti.
//
// Wrapper HTTP attorno alle RPC public.admin_merge_customers /
// public.admin_unmerge_customer (vedi migration 20260605120000). Auth via
// ADMIN_SECRET, come le altre admin function. Gira in service role.
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
  action?: "merge" | "unmerge";
  primaryEmail?: string;
  secondaryEmail?: string;
  note?: string;
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
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      body = {};
    }

    const action = body.action ?? "merge";
    const secondary =
      typeof body.secondaryEmail === "string" ? body.secondaryEmail.trim() : "";
    if (!secondary) {
      return jsonResponse({ error: "Missing secondaryEmail" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "unmerge") {
      const { data, error } = await admin.rpc("admin_unmerge_customer", {
        p_secondary: secondary,
      });
      if (error) {
        console.error("[admin-merge-customers] unmerge error:", error);
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse(data);
    }

    const primary =
      typeof body.primaryEmail === "string" ? body.primaryEmail.trim() : "";
    if (!primary) {
      return jsonResponse({ error: "Missing primaryEmail" }, 400);
    }

    const { data, error } = await admin.rpc("admin_merge_customers", {
      p_primary: primary,
      p_secondary: secondary,
      p_note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
      p_merged_by: "admin",
    });

    if (error) {
      console.error("[admin-merge-customers] merge error:", error);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-merge-customers] error:", msg);
    return jsonResponse({ error: msg }, 500);
  }
});
