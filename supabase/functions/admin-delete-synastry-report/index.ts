// Admin helper: soft-delete una sinastria. Cancella full_report e marca lo
// stato come 'deleted'. Auth via x-admin-secret o service-role bearer.

// @ts-ignore deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminSecretHeader = req.headers.get("x-admin-secret") || "";
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    const isAdminSecret = Boolean(ADMIN_SECRET && adminSecretHeader === ADMIN_SECRET);
    const isServiceRole = Boolean(
      SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY,
    );

    if (!isAdminSecret && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const synastrySessionId =
      typeof body.synastrySessionId === "string" ? body.synastrySessionId : "";
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : "";

    if (!synastrySessionId) {
      return new Response(
        JSON.stringify({ error: "synastrySessionId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const deletedAt = new Date().toISOString();
    const errorNote = reason
      ? `Deleted by admin at ${deletedAt} - ${reason}`
      : `Deleted by admin at ${deletedAt}`;

    const { error: updateErr } = await supabase
      .from("synastry_sessions")
      .update({
        full_report: null,
        synastry_data: null,
        bi_wheel_svg: null,
        chart_a: null,
        chart_b: null,
        teaser_highlight: null,
        brief: null,
        llm_input: null,
        llm_output: null,
        processing_status: "deleted",
        processing_error: errorNote,
      })
      .eq("id", synastrySessionId);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: `update_failed: ${updateErr.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, synastrySessionId, deletedAt }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[admin-delete-synastry-report] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
