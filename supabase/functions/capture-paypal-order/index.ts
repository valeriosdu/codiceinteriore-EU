import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { capturePaypalOrder, paypalToOpaqueId, resolvePaypalCreds } from "../_shared/paypal.ts";
import { finalizePaypalPayment } from "../_shared/finalize-paypal-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== "string") {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Il market arriva dalla riga checkout persistita alla creazione ordine:
    // seleziona le credenziali PayPal (azienda) giuste per la capture.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );
    const { data: checkoutRow } = await supabaseAdmin
      .from("checkout_sessions")
      .select("market")
      .eq("stripe_session_id", paypalToOpaqueId(orderId))
      .maybeSingle();
    const creds = resolvePaypalCreds((checkoutRow as { market?: string | null } | null)?.market);

    console.log(`[capture-paypal-order] env=${creds.env} orderId=${orderId}`);

    const captured = await capturePaypalOrder(orderId, creds);
    const status =
      captured.purchase_units?.[0]?.payments?.captures?.[0]?.status || captured.status || "";

    if (status !== "COMPLETED" && captured.status !== "COMPLETED") {
      return new Response(
        JSON.stringify({ error: "Payment not completed", status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 },
      );
    }

    // Single source of truth for the writeback. If finalize throws (e.g. DB
    // upsert error), we now return 500 instead of a fake-success — that is
    // exactly what bit us before, where the row stayed `open` while the
    // browser saw the success page.
    const result = await finalizePaypalPayment(captured, "capture");

    return new Response(
      JSON.stringify({
        sessionId: result.opaqueId,
        orderId: captured.id,
        captureId:
          captured.purchase_units?.[0]?.payments?.captures?.[0]?.id || null,
        quizSessionId: result.quizSessionId,
        purchaseType: result.purchaseType,
        amountTotal: result.amountCents / 100,
        currency: result.currency,
        status: "paid",
        alreadyFinalized: result.alreadyPaid,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[capture-paypal-order] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
