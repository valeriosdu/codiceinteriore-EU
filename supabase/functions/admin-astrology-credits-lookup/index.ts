// Admin: lookup astrology guide credits for a customer by email (partial match).
// Gated by ADMIN_SECRET (header x-admin-secret).
//
// Body: { email }  // substring, case-insensitive
// Response: { matches: Array<{ profile: {...}, sessions: [{ quiz_session_id, balance,
//   total_granted, total_used, last_question_at, ... }] }> }
// Limit: 25 profili.

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

const MATCH_LIMIT = 25;

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
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profiles, error: profilesErr } = await admin
      .from("profiles")
      .select("id, email, created_at")
      .ilike("email", `%${email}%`)
      .order("created_at", { ascending: false })
      .limit(MATCH_LIMIT);
    if (profilesErr) throw profilesErr;

    const profileRows = (profiles || []) as Array<{
      id: string;
      email: string | null;
      created_at: string;
    }>;

    if (profileRows.length === 0) {
      return new Response(
        JSON.stringify({ error: `Nessun profilo trovato per ${email}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const profileIds = profileRows.map((p) => p.id);

    // Batched fetch: tutti i crediti per i profili matchati.
    const { data: credits } = await admin
      .from("astrology_guide_credits")
      .select("profile_id, quiz_session_id, balance, total_granted, total_used, updated_at")
      .in("profile_id", profileIds)
      .order("updated_at", { ascending: false });

    const creditRows = (credits || []) as Array<{
      profile_id: string;
      quiz_session_id: string;
      balance: number;
      total_granted: number;
      total_used: number;
      updated_at: string;
    }>;

    const sessionIds = Array.from(new Set(creditRows.map((c) => c.quiz_session_id)));

    const [sessionsInfo, lastQuestions] = await Promise.all([
      sessionIds.length
        ? admin
            .from("quiz_sessions")
            .select("id, user_name, birth_place, created_at")
            .in("id", sessionIds)
        : Promise.resolve({ data: [] }),
      sessionIds.length
        ? admin
            .from("astrology_guide_questions")
            .select("profile_id, quiz_session_id, created_at, status")
            .in("profile_id", profileIds)
            .in("quiz_session_id", sessionIds)
            .order("created_at", { ascending: false })
            .limit(2000)
        : Promise.resolve({ data: [] }),
    ]);

    const sessionMeta = new Map<
      string,
      { user_name: string | null; birth_place: string | null; created_at: string }
    >();
    for (const s of (sessionsInfo.data || []) as Array<{
      id: string;
      user_name: string | null;
      birth_place: string | null;
      created_at: string;
    }>) {
      sessionMeta.set(s.id, {
        user_name: s.user_name,
        birth_place: s.birth_place,
        created_at: s.created_at,
      });
    }

    // Chiave composta profile_id + quiz_session_id: l'admin_grant può creare
    // record di crediti per profili diversi sullo stesso quiz_session.
    const lastQByKey = new Map<string, { created_at: string; status: string }>();
    const questionCountByKey = new Map<string, number>();
    for (const q of (lastQuestions.data || []) as Array<{
      profile_id: string;
      quiz_session_id: string;
      created_at: string;
      status: string;
    }>) {
      const key = `${q.profile_id}:${q.quiz_session_id}`;
      if (!lastQByKey.has(key)) {
        lastQByKey.set(key, { created_at: q.created_at, status: q.status });
      }
      questionCountByKey.set(key, (questionCountByKey.get(key) || 0) + 1);
    }

    const matches = profileRows.map((p) => {
      const profileCredits = creditRows.filter((c) => c.profile_id === p.id);
      const sessions = profileCredits.map((s) => {
        const key = `${p.id}:${s.quiz_session_id}`;
        return {
          quiz_session_id: s.quiz_session_id,
          balance: s.balance,
          total_granted: s.total_granted,
          total_used: s.total_used,
          updated_at: s.updated_at,
          user_name: sessionMeta.get(s.quiz_session_id)?.user_name || null,
          birth_place: sessionMeta.get(s.quiz_session_id)?.birth_place || null,
          session_created_at: sessionMeta.get(s.quiz_session_id)?.created_at || null,
          last_question_at: lastQByKey.get(key)?.created_at || null,
          last_question_status: lastQByKey.get(key)?.status || null,
          total_questions: questionCountByKey.get(key) || 0,
        };
      });
      return {
        profile: { id: p.id, email: p.email, created_at: p.created_at },
        sessions,
      };
    });

    return new Response(
      JSON.stringify({ matches }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-astrology-credits-lookup] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
