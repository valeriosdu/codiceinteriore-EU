// Lightweight GET endpoint for astrology guide feedback from email links.
// URL: /functions/v1/astrology-guide-feedback?id=<questionId>&f=up|down
// No auth required — question UUIDs are unguessable. Updates the feedback
// column and redirects to /report with a toast-friendly query param.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getMarket } from "../_shared/markets.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// baseUrl per-mercato: il default (it) copre i link malformati (senza domanda
// da cui dedurre il mercato); il caso valido passa il siteUrl del mercato giusto.
const redirect = (path: string, baseUrl: string = getMarket(null).siteUrl) =>
  new Response(null, {
    status: 302,
    headers: { Location: `${baseUrl}${path}` },
  });

serve(async (req) => {
  const url = new URL(req.url);
  const questionId = url.searchParams.get("id") || "";
  const feedback = url.searchParams.get("f") || "";

  if (!questionId || (feedback !== "up" && feedback !== "down")) {
    return redirect("/report");
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: updatedRows } = await supabaseAdmin
    .from("astrology_guide_questions")
    .update({ feedback })
    .eq("id", questionId)
    .eq("status", "completed")
    .select("quiz_session_id");

  let marketId: string | null = null;
  const quizSessionId = updatedRows?.[0]?.quiz_session_id as string | undefined;
  if (quizSessionId) {
    const { data: qs } = await supabaseAdmin
      .from("quiz_sessions")
      .select("market")
      .eq("id", quizSessionId)
      .maybeSingle();
    marketId = (qs as { market?: string | null } | null)?.market ?? null;
  }

  return redirect(`/report?guideFeedback=${feedback}`, getMarket(marketId).siteUrl);
});
