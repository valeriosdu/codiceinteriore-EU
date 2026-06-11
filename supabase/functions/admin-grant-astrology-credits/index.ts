// Admin: manually grant astrology guide credits to a user/quiz_session.
// Gated by ADMIN_SECRET (header x-admin-secret).
//
// Body params:
//   - email (required): customer email
//   - quizSessionId (optional): if omitted, grants to the user's most-recent active report
//   - amount (required): positive integer of credits to add
//   - reason (optional): free-text note for audit (logged to console only for now)

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    if (!ADMIN_SECRET || adminSecret !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const requestedQuizSessionId =
      typeof body?.quizSessionId === "string" && body.quizSessionId.trim().length > 0
        ? body.quizSessionId.trim()
        : null;
    const amount = Number(body?.amount);
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";

    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100) {
      return new Response(
        JSON.stringify({ error: "amount must be a positive integer ≤ 100" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile?.id) {
      return new Response(
        JSON.stringify({ error: `Nessun profilo trovato per ${email}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve quiz_session_id: explicit > most recent active report.
    let quizSessionId: string | null = null;
    if (requestedQuizSessionId) {
      const { data: report } = await admin
        .from("user_reports")
        .select("quiz_session_id")
        .eq("profile_id", profile.id)
        .eq("quiz_session_id", requestedQuizSessionId)
        .maybeSingle();
      if (report?.quiz_session_id) quizSessionId = report.quiz_session_id;
    }
    if (!quizSessionId) {
      const { data: reports } = await admin
        .from("user_reports")
        .select("quiz_session_id, is_active, created_at")
        .eq("profile_id", profile.id)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);
      quizSessionId = reports?.[0]?.quiz_session_id || null;
    }
    if (!quizSessionId) {
      return new Response(
        JSON.stringify({ error: "Nessun report trovato per questo utente" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: granted, error: rpcErr } = await admin.rpc("grant_astrology_credits", {
      p_profile_id: profile.id,
      p_quiz_session_id: quizSessionId,
      p_amount: Math.floor(amount),
    });
    if (rpcErr) throw rpcErr;

    console.log(
      `[admin-grant-astrology-credits] +${amount} to profile=${profile.id} session=${quizSessionId} (reason: ${reason || "—"})`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        profile_id: profile.id,
        quiz_session_id: quizSessionId,
        granted_amount: Math.floor(amount),
        new_balance: (granted as { balance?: number } | null)?.balance ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-grant-astrology-credits] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
