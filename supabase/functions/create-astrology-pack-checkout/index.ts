// Create a Stripe Checkout Session for the Astrology Guide pack
// (10 questions, €7,90, one-time).
//
// Body: { quizSessionId? }  — optional; if omitted we pick the user's
//                             most recent active paid report.
// Auth: requires a valid Supabase JWT. The user must already have a paid
// report (so we don't surface the upsell to non-buyers).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  ASTROLOGY_GUIDE_PACK_PRICE_ID,
  ASTROLOGY_GUIDE_PACK_AMOUNT_CENTS,
  ASTROLOGY_GUIDE_PACK_CREDITS,
  ASTROLOGY_GUIDE_PRODUCT_CODE,
  ASTROLOGY_GUIDE_PURCHASE_TYPE,
} from "../_shared/astrology-products.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (ASTROLOGY_GUIDE_PACK_PRICE_ID === "REPLACE_WITH_STRIPE_PRICE_ID") {
      console.error(
        "[create-astrology-pack-checkout] price not configured — see _shared/astrology-products.ts",
      );
      return new Response(
        JSON.stringify({ error: "Astrology guide pack price not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const requestedQuizSessionId =
      typeof body?.quizSessionId === "string" && body.quizSessionId.trim().length > 0
        ? body.quizSessionId.trim()
        : null;

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authData.user?.email) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userEmail = authData.user.email;
    const userId = authData.user.id;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, quiz_session_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile?.id) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let quizSessionId: string | null = null;
    if (requestedQuizSessionId) {
      const { data: report } = await supabaseAdmin
        .from("user_reports")
        .select("quiz_session_id")
        .eq("profile_id", profile.id)
        .eq("quiz_session_id", requestedQuizSessionId)
        .maybeSingle();
      if (report?.quiz_session_id) quizSessionId = report.quiz_session_id;
    }
    if (!quizSessionId) {
      const { data: reports } = await supabaseAdmin
        .from("user_reports")
        .select("quiz_session_id, is_active, created_at")
        .eq("profile_id", profile.id)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);
      quizSessionId = reports?.[0]?.quiz_session_id || profile.quiz_session_id || null;
    }

    if (!quizSessionId) {
      return new Response(JSON.stringify({ error: "No paid report found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length > 0) customerId = customers.data[0].id;

    const origin = req.headers.get("origin") || "https://codiceinteriore.it";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [{ price: ASTROLOGY_GUIDE_PACK_PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/report?guide=activated&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/report`,
      metadata: {
        quiz_session_id: quizSessionId,
        profile_id: profile.id,
        user_id: userId,
        purchase_type: ASTROLOGY_GUIDE_PURCHASE_TYPE,
        product_code: ASTROLOGY_GUIDE_PRODUCT_CODE,
        astrology_guide_credits: String(ASTROLOGY_GUIDE_PACK_CREDITS),
      },
    });

    await supabaseAdmin.from("checkout_sessions").upsert(
      {
        stripe_session_id: session.id,
        quiz_session_id: quizSessionId,
        purchase_type: ASTROLOGY_GUIDE_PURCHASE_TYPE,
        product_code: ASTROLOGY_GUIDE_PRODUCT_CODE,
        customer_email: userEmail,
        payment_status: session.payment_status || "open",
        payment_provider: "stripe",
        amount_total: ASTROLOGY_GUIDE_PACK_AMOUNT_CENTS,
        currency: "EUR",
        provider_metadata: {
          stripe_mode: "payment",
          stage: "created",
          source: "astrology_guide_upsell",
          credits: ASTROLOGY_GUIDE_PACK_CREDITS,
        },
      },
      { onConflict: "stripe_session_id" },
    );

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[create-astrology-pack-checkout] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
