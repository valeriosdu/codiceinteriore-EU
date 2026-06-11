// Admin: force-rerun a single astrology guide question.
// Gated by ADMIN_SECRET (header x-admin-secret).
//
// Body params:
//   - questionId (required)
//   - immediate (optional, default true): if true, also invokes
//     process-astrology-questions in background so the answer regenerates now
//     instead of waiting for the cron.
//
// Effect:
//   - Resets status='pending', answer=null, error=null, processed_at=null,
//     email_sent_at=null, retry_count=0
//   - Preserves the original scheduled_for. Consequence:
//       * If scheduled_for is still in the future, the worker re-generates
//         and parks the row at 'ready'; the natural release happens at the
//         originally scheduled time (cron releases). This is the common
//         case: admin notices a bad answer early and just wants a redo.
//       * If scheduled_for is already in the past (the question was already
//         released as 'completed' to the user), the worker re-generates and
//         immediately re-releases the row. The send-transactional-email
//         idempotency key blocks duplicate emails, so the panel updates
//         silently via realtime.
//   - Optionally fires the worker function in the background.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";
const PUBLISHABLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaG1yanV2aGN6aWltdXhvaG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzI3NDgsImV4cCI6MjA5MTM0ODc0OH0.XvxstZWj7olqIDwJjZWjNaSQPuLrzftlSthno_NvNAY";

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
    const questionId =
      typeof body?.questionId === "string" ? body.questionId.trim() : "";
    const immediate = body?.immediate !== false;

    if (!questionId) {
      return new Response(JSON.stringify({ error: "questionId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Confirm row exists.
    const { data: existing, error: lookupErr } = await admin
      .from("astrology_guide_questions")
      .select("id, status")
      .eq("id", questionId)
      .maybeSingle();
    if (lookupErr) throw lookupErr;
    if (!existing) {
      return new Response(JSON.stringify({ error: "question_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateErr } = await admin
      .from("astrology_guide_questions")
      .update({
        status: "pending",
        answer: null,
        error: null,
        processed_at: null,
        email_sent_at: null,
        retry_count: 0,
        // NOTE: deliberately NOT resetting scheduled_for. We want the
        // re-generated answer to respect the original release time so the
        // user doesn't suddenly get an early "in arrivo → arrivata" jump.
      })
      .eq("id", questionId);
    if (updateErr) throw updateErr;

    if (immediate) {
      // Fire-and-forget background invoke. Cron would also catch this within
      // 2 minutes, but immediate=true gives instant feedback in the admin UI.
      const triggerPromise = fetch(
        `${SUPABASE_URL}/functions/v1/process-astrology-questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${PUBLISHABLE_JWT}`,
            apikey: PUBLISHABLE_JWT,
            "x-admin-secret": ADMIN_SECRET,
          },
          body: JSON.stringify({ questionId }),
        },
      )
        .then(async (res) => {
          const text = await res.text().catch(() => "");
          if (!res.ok) {
            console.error(
              `[admin-regenerate-astrology-question] worker invoke failed (${res.status}): ${text.slice(0, 300)}`,
            );
          } else {
            console.log(
              `[admin-regenerate-astrology-question] worker accepted: ${text.slice(0, 200)}`,
            );
          }
        })
        .catch((e) => {
          console.error(
            "[admin-regenerate-astrology-question] worker invoke threw:",
            e instanceof Error ? e.message : String(e),
          );
        });

      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(triggerPromise);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        questionId,
        previousStatus: existing.status,
        newStatus: "pending",
        immediate,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-regenerate-astrology-question] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
