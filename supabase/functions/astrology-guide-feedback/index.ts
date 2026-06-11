// Lightweight GET endpoint for astrology guide feedback from email links.
// URL: /functions/v1/astrology-guide-feedback?id=<questionId>&f=up|down
// No auth required — question UUIDs are unguessable. Updates the feedback
// column and redirects to /report with a toast-friendly query param.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://codiceinteriore.it";

const redirect = (path: string) =>
  new Response(null, {
    status: 302,
    headers: { Location: `${SITE_URL}${path}` },
  });

serve(async (req) => {
  const url = new URL(req.url);
  const questionId = url.searchParams.get("id") || "";
  const feedback = url.searchParams.get("f") || "";

  if (!questionId || (feedback !== "up" && feedback !== "down")) {
    return redirect("/report");
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  await supabaseAdmin
    .from("astrology_guide_questions")
    .update({ feedback })
    .eq("id", questionId)
    .eq("status", "completed");

  return redirect(`/report?guideFeedback=${feedback}`);
});
