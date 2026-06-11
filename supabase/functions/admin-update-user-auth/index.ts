// Aggiorna email e/o invia link di recovery per un utente auth.
//
// Auth: gated da ADMIN_SECRET (header x-admin-secret) o service-role Bearer.
//
// Body atteso:
//   { userId: string, newEmail?: string, sendRecovery?: boolean }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";
const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://codiceinteriore.it";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    const authHeader = req.headers.get("Authorization") || "";
    const bearerToken = authHeader.replace("Bearer ", "").trim();

    const isAdminSecret = Boolean(ADMIN_SECRET && adminSecret === ADMIN_SECRET);
    const isServiceRole = Boolean(
      SUPABASE_SERVICE_ROLE_KEY && bearerToken === SUPABASE_SERVICE_ROLE_KEY,
    );

    if (!isAdminSecret && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const newEmail = typeof body.newEmail === "string" ? body.newEmail.trim().toLowerCase() : "";
    const sendRecovery = body.sendRecovery !== false;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!newEmail && !sendRecovery) {
      return new Response(
        JSON.stringify({ error: "Specificare newEmail e/o sendRecovery" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let currentEmail = "";

    if (newEmail) {
      if (!newEmail.includes("@") || newEmail.length > 254) {
        return new Response(
          JSON.stringify({ error: "Formato email non valido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: updated, error: updateErr } = await admin.auth.admin.updateUserById(userId, {
        email: newEmail,
        email_confirm: true,
      });

      if (updateErr) {
        console.error("[admin-update-user-auth] updateUserById error:", updateErr);
        return new Response(
          JSON.stringify({ error: updateErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error: profileErr } = await admin
        .from("profiles")
        .update({ email: newEmail, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (profileErr) {
        console.error("[admin-update-user-auth] profiles update error:", profileErr);
      }

      currentEmail = newEmail;
      console.log(`[admin-update-user-auth] email updated to ${newEmail} for user ${userId}`);
    }

    if (sendRecovery) {
      if (!currentEmail) {
        const { data: userData, error: getUserErr } = await admin.auth.admin.getUserById(userId);
        if (getUserErr || !userData?.user?.email) {
          console.error("[admin-update-user-auth] getUserById error:", getUserErr);
          return new Response(
            JSON.stringify({ error: "Utente non trovato" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        currentEmail = userData.user.email;
      }

      const { error: recoveryErr } = await admin.auth.resetPasswordForEmail(currentEmail, {
        redirectTo: `${PUBLIC_SITE_URL}/activate?intent=signin`,
      });

      if (recoveryErr) {
        console.error("[admin-update-user-auth] resetPasswordForEmail error:", recoveryErr);
        return new Response(
          JSON.stringify({ error: `Recovery fallita: ${recoveryErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      console.log(`[admin-update-user-auth] recovery email sent to ${currentEmail}`);
    }

    return new Response(
      JSON.stringify({ ok: true, email: currentEmail || undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[admin-update-user-auth] unexpected error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
