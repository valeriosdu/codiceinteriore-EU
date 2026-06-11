// Stripe webhook: source of truth for payment status.
//
// Listens for:
//   - checkout.session.completed
//   - checkout.session.async_payment_succeeded
// and reconciles the matching `checkout_sessions` row in our DB. This is the
// only server-side path that does not depend on the buyer returning to /success.
//
// Deployed with verify_jwt = false (see supabase/config.toml). Requests are
// authenticated by Stripe's signature header.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { reconcilePaidStripeSession } from "../_shared/stripe-reconcile.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_SECRET_KEY_TEST =
  Deno.env.get("STRIPE_SECRET_KEY_TEST") || STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const STRIPE_WEBHOOK_SECRET_TEST =
  Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST") || STRIPE_WEBHOOK_SECRET;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();

  // Try live secret first, then test secret. In practice you should configure
  // two separate Stripe webhooks (one per mode), each with its own signing
  // secret — but we accept either to be forgiving.
  const candidateSecrets = [STRIPE_WEBHOOK_SECRET, STRIPE_WEBHOOK_SECRET_TEST].filter(Boolean);
  if (candidateSecrets.length === 0) {
    console.error("[stripe-webhook] no STRIPE_WEBHOOK_SECRET configured");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // The verifier only needs *some* API key; the secret it actually checks
  // against is the webhook signing secret, not the API key.
  const stripeForVerify = new Stripe(STRIPE_SECRET_KEY || STRIPE_SECRET_KEY_TEST, {
    apiVersion: "2025-08-27.basil",
  });

  let event: Stripe.Event | null = null;
  let lastError: unknown = null;
  for (const secret of candidateSecrets) {
    try {
      event = await stripeForVerify.webhooks.constructEventAsync(rawBody, signature, secret);
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!event) {
    console.error(
      "[stripe-webhook] signature verification failed:",
      lastError instanceof Error ? lastError.message : String(lastError),
    );
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Live events use the live key, test events use the test key.
  const stripe = new Stripe(
    event.livemode ? STRIPE_SECRET_KEY : STRIPE_SECRET_KEY_TEST,
    { apiVersion: "2025-08-27.basil" },
  );

  console.log(
    `[stripe-webhook] event ${event.type} id=${event.id} livemode=${event.livemode}`,
  );

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      // Subscription sessions are owned exclusively by stripe-subscription-webhook.
      // Even if both webhooks happen to be subscribed to this event, we
      // short-circuit here to avoid double processing (which previously caused
      // duplicate user_reports + spurious natal_report entitlements for users
      // buying the recurring transits product).
      if (session.mode === "subscription") {
        console.log(
          `[stripe-webhook] ignoring subscription-mode session ${session.id}; handled by stripe-subscription-webhook`,
        );
        return new Response(
          JSON.stringify({ received: true, ignored: "subscription_mode" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      // Re-fetch to be sure customer_details is fully populated (relevant for
      // async flows where the original payload is partial).
      const fresh = await stripe.checkout.sessions.retrieve(session.id);
      const result = await reconcilePaidStripeSession(stripe, fresh);
      return new Response(JSON.stringify({ received: true, ...result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ received: true, ignored: event.type }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] handler error:", msg);
    // Return 500 so Stripe retries.
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
