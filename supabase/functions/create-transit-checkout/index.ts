// Create a Stripe Checkout Session for the transits upsell.
// Body: { mode: "one_time" | "subscription" }
// Auth: requires a valid Supabase JWT. The user must already have a profile
// with at least one paid report (so we don't surface upsell to non-buyers).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  TRANSIT_PURCHASE_TYPES,
  TRANSIT_PRODUCT_CODES,
  TRANSIT_ONE_TIME_AMOUNT_CENTS,
  TRANSIT_SUBSCRIPTION_AMOUNT_CENTS,
  type TransitCheckoutMode,
} from "../_shared/transit-products.ts";
import { getMarket, getStripeKey, getStripePrice } from "../_shared/markets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rawMode = String(body?.mode || "");
    if (rawMode !== "one_time" && rawMode !== "subscription") {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const mode: TransitCheckoutMode = rawMode;

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authData.user?.email) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userEmail = authData.user.email;
    const userId = authData.user.id;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, quiz_session_id, email")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile?.id) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick the most recent active quiz session linked to a paid report.
    const { data: reports } = await supabaseAdmin
      .from("user_reports")
      .select("quiz_session_id, is_active, created_at")
      .eq("profile_id", profile.id)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);

    const quizSessionId = reports?.[0]?.quiz_session_id || profile.quiz_session_id;
    if (!quizSessionId) {
      return new Response(JSON.stringify({ error: "No paid report found" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Il market si legge dalla sessione quiz della riga, mai dal body.
    const { data: qsMarket } = await supabaseAdmin
      .from("quiz_sessions")
      .select("market")
      .eq("id", quizSessionId)
      .maybeSingle();
    const market = getMarket((qsMarket as { market?: string | null } | null)?.market);

    const stripe = new Stripe(getStripeKey(market), { apiVersion: "2025-08-27.basil" });

    // Reuse existing Stripe customer for this email if any (to avoid duplicates
    // and keep the same payment methods / portal access).
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length > 0) customerId = customers.data[0].id;

    const origin = req.headers.get("origin") || market.siteUrl;
    const isSubscription = mode === "subscription";

    // Phase 2 (estendi invece di sovrapporre): if the customer still has an
    // active transit window (e.g. from a premium natal+transits purchase),
    // defer the subscription's first charge to its end via trial_end, so the
    // subscription EXTENDS the existing coverage instead of overlapping and
    // recomputing days already paid. The first transit cycle is then provisioned
    // when the trial ends and the first real invoice is paid.
    let trialEnd: number | undefined;
    if (isSubscription) {
      const { data: activeTransit } = await supabaseAdmin
        .from("user_entitlements")
        .select("ends_at")
        .eq("profile_id", profile.id)
        .eq("entitlement_type", "monthly_transits")
        .eq("status", "active")
        .not("ends_at", "is", null)
        .order("ends_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const endsAtMs = activeTransit?.ends_at
        ? new Date(activeTransit.ends_at as string).getTime()
        : 0;
      // Only defer when the window ends at least 2 days out (avoids Stripe
      // trial_end edge cases and negligible sub-2-day overlaps).
      if (endsAtMs >= Date.now() + 2 * 24 * 60 * 60 * 1000) {
        trialEnd = Math.floor(endsAtMs / 1000);
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: getStripePrice(market, isSubscription ? "transitSubscription" : "transitOneTime"),
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${origin}/report?transits=activated&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/report`,
      metadata: {
        quiz_session_id: quizSessionId,
        profile_id: profile.id,
        user_id: userId,
        purchase_type: TRANSIT_PURCHASE_TYPES[mode],
        product_code: TRANSIT_PRODUCT_CODES[mode],
        includes_transits: "true",
        transit_months: "1",
        market: market.id,
      },
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: {
                quiz_session_id: quizSessionId,
                profile_id: profile.id,
                user_id: userId,
                product_code: TRANSIT_PRODUCT_CODES.subscription,
              },
              ...(trialEnd ? { trial_end: trialEnd } : {}),
            },
          }
        : {}),
    });

    // Pre-create a checkout_sessions row so we can correlate later.
    await supabaseAdmin.from("checkout_sessions").upsert(
      {
        stripe_session_id: session.id,
        quiz_session_id: quizSessionId,
        purchase_type: TRANSIT_PURCHASE_TYPES[mode],
        product_code: TRANSIT_PRODUCT_CODES[mode],
        includes_transits: true,
        transit_months: 1,
        customer_email: userEmail,
        payment_status: session.payment_status || "open",
        payment_provider: "stripe",
        amount_total: isSubscription ? TRANSIT_SUBSCRIPTION_AMOUNT_CENTS : TRANSIT_ONE_TIME_AMOUNT_CENTS,
        currency: market.currency,
        market: market.id,
        provider_metadata: {
          stripe_mode: isSubscription ? "subscription" : "payment",
          stage: "created",
          source: "transit_upsell",
        },
      },
      { onConflict: "stripe_session_id" },
    );

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[create-transit-checkout] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
