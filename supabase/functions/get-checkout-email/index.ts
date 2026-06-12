import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getPaypalOrder, isPaypalOpaqueId, opaqueIdToPaypal, resolvePaypalCreds } from "../_shared/paypal.ts";
import { getMarket, getStripeKey } from "../_shared/markets.ts";

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
    const { sessionId } = await req.json();

    if (!sessionId || typeof sessionId !== "string") {
      return new Response(JSON.stringify({ error: "Missing session ID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // PayPal branch — sessionId is our opaque pp_<orderId>.
    if (isPaypalOpaqueId(sessionId)) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      );
      const { data: row } = await supabaseAdmin
        .from("checkout_sessions")
        .select("quiz_session_id, purchase_type, customer_email, payment_status, amount_total, currency, market")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (!row || row.payment_status !== "paid") {
        return new Response(JSON.stringify({ error: "Payment not completed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 402,
        });
      }

      // Fetch live email from PayPal if not yet stored.
      let email = row.customer_email || "";
      if (!email) {
        try {
          const order = await getPaypalOrder(
            opaqueIdToPaypal(sessionId),
            resolvePaypalCreds((row as { market?: string | null }).market),
          );
          email = order.payer?.email_address || "";
        } catch (e) {
          console.warn("get-checkout-email: paypal lookup failed:", e);
        }
      }

      const purchaseType = row.purchase_type || "";
      const amountTotal =
        typeof row.amount_total === "number"
          ? row.amount_total / 100
          : purchaseType === "premium"
            ? 29
            : 19;

      return new Response(
        JSON.stringify({
          email,
          quizSessionId: row.quiz_session_id || "",
          purchaseType,
          amountTotal,
          currency: row.currency || "EUR",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // Stripe branch: il market della riga checkout sceglie l'account.
    const supabaseAdminStripe = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );
    const { data: stripeRow } = await supabaseAdminStripe
      .from("checkout_sessions")
      .select("market")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    const market = getMarket((stripeRow as { market?: string | null } | null)?.market);

    const stripe = new Stripe(getStripeKey(market), {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 402,
      });
    }

    const purchaseType = session.metadata?.purchase_type || "";
    const amountTotal = typeof session.amount_total === "number" ? session.amount_total / 100 : null;

    return new Response(
      JSON.stringify({
        email: session.customer_details?.email || session.customer_email || "",
        quizSessionId: session.metadata?.quiz_session_id || "",
        purchaseType,
        amountTotal,
        currency: session.currency?.toUpperCase() || "EUR",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("get-checkout-email error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
