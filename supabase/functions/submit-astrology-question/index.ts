// Submit a new astrology guide question.
// Body: { quizSessionId, question, sectionId? }
// Auth: user JWT. Caller must own the quiz_session via their profile.
//
// Flow:
//   1. Verify ownership (profile.user_id = auth.uid() AND owns quiz_session).
//   2. Atomically consume one credit via RPC.
//   3. Insert question row with scheduled_for = now() + random(2h, 6h),
//      bumped past the 19:00–09:00 Europe/Rome quiet window.
//   4. Fire-and-forget invoke process-astrology-questions to GENERATE the
//      answer right now. The answer is stored in DB but the row stays
//      'ready' (not visible / not emailed) until scheduled_for. This way
//      generation failures surface within seconds (we can refund the
//      credit if Gemini truly broke), while the human-friendly delay is
//      preserved on the user-visible side.
//   5. Return { id, scheduled_for, credits_remaining }.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";
const PUBLISHABLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaG1yanV2aGN6aWltdXhvaG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzI3NDgsImV4cCI6MjA5MTM0ODc0OH0.XvxstZWj7olqIDwJjZWjNaSQPuLrzftlSthno_NvNAY";

// Fire-and-forget invoke of the worker so the answer is generated right
// after the row is inserted, instead of waiting for the cron.
const invokeWorkerImmediate = (questionId: string) => {
  const promise = (async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/process-astrology-questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${PUBLISHABLE_JWT}`,
            apikey: PUBLISHABLE_JWT,
            ...(ADMIN_SECRET ? { "x-admin-secret": ADMIN_SECRET } : {}),
          },
          body: JSON.stringify({ questionId }),
        },
      );
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        console.error(
          `[submit-astrology-question] immediate worker invoke failed (${res.status}): ${text.slice(0, 300)}`,
        );
      }
    } catch (e) {
      console.error(
        "[submit-astrology-question] immediate worker invoke threw:",
        e instanceof Error ? e.message : String(e),
      );
    }
  })();
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(promise);
  } else {
    promise.catch(() => undefined);
  }
};

const MIN_DELAY_MS = 2 * 60 * 60 * 1000; // 2h
const MAX_DELAY_MS = 6 * 60 * 60 * 1000; // 6h
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h: block exact resubmits within a day

// Loose-equality normalization for duplicate detection. Catches accidental
// double-submits and trivial typo variants (extra spaces, trailing
// punctuation, casing) without false-positive on legitimate rephrasings.
const normalizeQuestion = (q: string) =>
  q
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[?!.,;:'"`«»“”‘’]+$/g, "");
// Active delivery window: 09:00–19:00 Europe/Rome ("orari lavorativi"). Anything
// computed outside that range is bumped to the next morning. Keeps the UX copy
// honest ("in orari lavorativi") and avoids late-evening / early-morning emails.
const QUIET_HOUR_START = 19; // 19:00 Rome
const QUIET_HOUR_END = 9; // 09:00 Rome
const MORNING_JITTER_MS = 90 * 60 * 1000; // up to +90min after 09:00

const romeHour = (d: Date): number =>
  parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      hour12: false,
    }).format(d),
    10,
  );

const isQuietRome = (d: Date) => {
  const h = romeHour(d);
  return h >= QUIET_HOUR_START || h < QUIET_HOUR_END;
};

// If scheduled_for falls in 22:00–08:00 Rome, push to the next 08:00–09:30
// Rome morning (08:00 + random 0–90min jitter so a queue of pending questions
// doesn't all fire at the same minute).
const bumpOutOfQuietHours = (d: Date): Date => {
  if (!isQuietRome(d)) return d;
  let cursor = new Date(d.getTime());
  for (let i = 0; i < 24; i++) {
    if (romeHour(cursor) === QUIET_HOUR_END) {
      return new Date(cursor.getTime() + Math.floor(Math.random() * MORNING_JITTER_MS));
    }
    cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
  }
  return d;
};

const computeScheduledFor = (now: Date): Date => {
  const delta = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
  return bumpOutOfQuietHours(new Date(now.getTime() + delta));
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const quizSessionId = String(body?.quizSessionId || "").trim();
    const question = String(body?.question || "").trim();
    const sectionId = body?.sectionId ? String(body.sectionId).slice(0, 64) : null;

    if (!quizSessionId) {
      return new Response(JSON.stringify({ error: "quizSessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!question || question.length > 250) {
      return new Response(
        JSON.stringify({ error: "question must be between 1 and 250 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authData.user?.id) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (!profile?.id) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the quiz_session is reachable by this profile (paid report).
    const { data: report } = await supabaseAdmin
      .from("user_reports")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("quiz_session_id", quizSessionId)
      .maybeSingle();

    if (!report?.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Duplicate-question guard: block exact resubmits within the last 24h on
    // the same session. Runs BEFORE consume so accidental double-clicks /
    // re-taps don't burn a credit. Loose normalization on both sides.
    const normalizedNew = normalizeQuestion(question);
    const { data: recentQuestions } = await supabaseAdmin
      .from("astrology_guide_questions")
      .select("id, question, status")
      .eq("quiz_session_id", quizSessionId)
      .gte("created_at", new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString());

    const duplicate = (recentQuestions || []).find(
      (r: { question: string }) => normalizeQuestion(r.question) === normalizedNew,
    );
    if (duplicate) {
      return new Response(
        JSON.stringify({
          error: "duplicate_question",
          message:
            "Hai già fatto questa domanda di recente. Vai a leggere la risposta nel pannello.",
          existing_id: (duplicate as { id: string }).id,
          existing_status: (duplicate as { status: string }).status,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Atomically consume one credit. RPC returns false if balance was 0.
    const { data: consumed, error: consumeErr } = await supabaseAdmin.rpc(
      "consume_astrology_credit",
      { p_profile_id: profile.id, p_quiz_session_id: quizSessionId },
    );
    if (consumeErr) throw consumeErr;
    if (!consumed) {
      return new Response(
        JSON.stringify({ error: "no_credits", message: "Hai esaurito le tue domande." }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: creditsRow } = await supabaseAdmin
      .from("astrology_guide_credits")
      .select("balance, total_used")
      .eq("profile_id", profile.id)
      .eq("quiz_session_id", quizSessionId)
      .maybeSingle();

    // The first 2 questions for a given session are included free. We detect
    // by total_used after consume(): values 1 or 2 ⇒ this question used a
    // free credit (assumes no pack purchases happened before the free ones
    // are exhausted, which matches normal funnel order).
    const INCLUDED_FREE_CREDITS = 2;
    const isFree = (creditsRow?.total_used ?? 0) <= INCLUDED_FREE_CREDITS;

    const scheduledFor = computeScheduledFor(new Date());

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("astrology_guide_questions")
      .insert({
        profile_id: profile.id,
        quiz_session_id: quizSessionId,
        section_id: sectionId,
        question,
        status: "pending",
        scheduled_for: scheduledFor.toISOString(),
        is_free: isFree,
      })
      .select("id, scheduled_for, status")
      .single();

    if (insertErr || !inserted) {
      // Best-effort credit refund on insert failure.
      await supabaseAdmin.rpc("restore_astrology_credit", {
        p_profile_id: profile.id,
        p_quiz_session_id: quizSessionId,
      });
      throw insertErr || new Error("insert_failed");
    }

    // Kick off generation immediately. The worker stores the answer in DB
    // and parks the row at status='ready' until scheduled_for; cron releases
    // it (email + status='completed') at the human-friendly time.
    invokeWorkerImmediate(inserted.id);

    return new Response(
      JSON.stringify({
        id: inserted.id,
        scheduled_for: inserted.scheduled_for,
        status: inserted.status,
        credits_remaining: creditsRow?.balance ?? 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[submit-astrology-question] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
