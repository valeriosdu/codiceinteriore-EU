// Server-side trigger handler for new contact form submissions.
// Called by a Postgres AFTER INSERT trigger on public.contact_submissions
// (via pg_net) so that the notification email is guaranteed to be sent
// even if the user's browser is interrupted between insert and email invoke.
//
// Auth: deployed with verify_jwt = true. The DB trigger authenticates with
// the project's service_role key, so only the trigger (or a service-role
// caller) can reach this function.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[notify-contact-submission] Missing env vars");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let submissionId: string | null = null;
  try {
    const body = await req.json();
    submissionId = body?.submission_id ?? body?.id ?? null;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!submissionId || typeof submissionId !== "string") {
    return new Response(JSON.stringify({ error: "submission_id required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Load the submission
  const { data: submission, error } = await supabase
    .from("contact_submissions")
    .select("id, name, email, reason, message, market")
    .eq("id", submissionId)
    .maybeSingle();

  if (error || !submission) {
    console.error("[notify-contact-submission] Submission not found", {
      submissionId,
      error,
    });
    return new Response(
      JSON.stringify({ error: "Submission not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Idempotent: same key as the client-side path => exactly one email per submission.
  const idempotencyKey = `contact-${submission.id}`;

  // Call send-transactional-email via direct fetch — using the service-role
  // key as a Bearer JWT, which the Supabase gateway accepts.
  const sendUrl = `${supabaseUrl}/functions/v1/send-transactional-email`;
  let result: unknown;
  try {
    const resp = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // send-transactional-email is verify_jwt=false and validates this
        // Bearer in-code (must equal SUPABASE_SERVICE_ROLE_KEY). No apikey
        // header is needed — same pattern as _shared/send-email.ts.
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        templateName: "contact-notification",
        recipientEmail: submission.email, // template overrides this with the fixed `to:` info@
        idempotencyKey,
        templateData: {
          name: submission.name,
          email: submission.email,
          reason: submission.reason ?? undefined,
          message: submission.message,
          market: submission.market ?? "it",
        },
      }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error("[notify-contact-submission] send failed", {
        submissionId,
        status: resp.status,
        body: text,
      });
      return new Response(
        JSON.stringify({ error: "Failed to enqueue notification email" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    try {
      result = JSON.parse(text);
    } catch {
      result = text;
    }
  } catch (err) {
    console.error("[notify-contact-submission] send threw", {
      submissionId,
      err: String(err),
    });
    return new Response(
      JSON.stringify({ error: "Failed to enqueue notification email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  console.log("[notify-contact-submission] enqueued", {
    submissionId,
    result,
  });

  return new Response(
    JSON.stringify({ success: true, submissionId, result }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
