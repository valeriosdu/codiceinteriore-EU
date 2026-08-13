import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  getMarket,
  getStripeKey,
  getStripePrice,
  type StripeProduct,
} from "../_shared/markets.ts";
import { captureBrowserContext } from "../_shared/browser-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ProductDef = {
  stripeProduct: StripeProduct;
  productCode: string;
  includesTransits: boolean;
  transitMonths: number;
  amountCents: number;
  /** "natal" usa quiz_session_id; "synastry" usa synastry_session_id */
  sessionKind: "natal" | "synastry";
  successPath?: string;
  cancelPath?: string;
};

const PRODUCTS: Record<string, ProductDef> = {
  base: {
    stripeProduct: "base",
    productCode: "natal_report_base",
    includesTransits: false,
    transitMonths: 0,
    amountCents: 1900,
    sessionKind: "natal",
  },
  premium: {
    stripeProduct: "premium",
    productCode: "natal_report_plus_transits",
    includesTransits: true,
    transitMonths: 1,
    amountCents: 2900,
    sessionKind: "natal",
  },
  synastry: {
    stripeProduct: "synastry",
    productCode: "synastry_couple_report",
    includesTransits: false,
    transitMonths: 0,
    amountCents: 1900,
    sessionKind: "synastry",
    successPath: "/coppia/success?session_id={CHECKOUT_SESSION_ID}",
    cancelPath: "/coppia/offer",
  },
  synastry_launch: {
    stripeProduct: "synastryLaunch",
    productCode: "synastry_couple_report_launch",
    includesTransits: false,
    transitMonths: 0,
    amountCents: 1490,
    sessionKind: "synastry",
    successPath: "/coppia/success?session_id={CHECKOUT_SESSION_ID}",
    cancelPath: "/coppia/offer",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const purchaseType: string = body?.purchaseType;
    const product = PRODUCTS[purchaseType];

    if (!product) {
      return new Response(JSON.stringify({ error: "Invalid purchase type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Per il natale: campo "sessionId" -> quiz_session_id
    // Per la sinastria: campo "synastrySessionId" -> synastry_session_id
    const sessionId: string | undefined =
      product.sessionKind === "synastry"
        ? body?.synastrySessionId
        : body?.sessionId;

    if (typeof sessionId !== "string" || !sessionId) {
      return new Response(
        JSON.stringify({
          error:
            product.sessionKind === "synastry"
              ? "synastrySessionId required"
              : "sessionId required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );

    // Il market si legge SEMPRE dalla riga di sessione, mai dal body: il
    // body è controllato dal client e sceglierebbe account Stripe e prezzi.
    const sessionTable =
      product.sessionKind === "synastry" ? "synastry_sessions" : "quiz_sessions";
    const { data: sessionRow, error: sessionErr } = await supabaseAdmin
      .from(sessionTable)
      .select("market")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionErr || !sessionRow) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const market = getMarket((sessionRow as { market?: string | null }).market);

    const stripe = new Stripe(getStripeKey(market), {
      apiVersion: "2025-08-27.basil",
    });
    const priceId = getStripePrice(market, product.stripeProduct);

    const origin = req.headers.get("origin") || market.siteUrl;
    const successUrl = `${origin}${product.successPath ?? "/success?session_id={CHECKOUT_SESSION_ID}"}`;
    const cancelUrl = `${origin}${product.cancelPath ?? "/offer"}`;

    const metadata: Record<string, string> = {
      purchase_type: purchaseType,
      product_code: product.productCode,
      includes_transits: String(product.includesTransits),
      transit_months: String(product.transitMonths),
      market: market.id,
    };
    if (product.sessionKind === "synastry") {
      metadata.synastry_session_id = sessionId;
    } else {
      metadata.quiz_session_id = sessionId;
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      phone_number_collection: { enabled: true },
    });

    const checkoutRow: Record<string, unknown> = {
      stripe_session_id: session.id,
      purchase_type: purchaseType,
      product_code: product.productCode,
      includes_transits: product.includesTransits,
      transit_months: product.transitMonths,
      payment_status: session.payment_status || "open",
      payment_provider: "stripe",
      amount_total: product.amountCents,
      currency: market.currency,
      market: market.id,
      provider_metadata: {
        stripe_mode: "payment",
        stage: "created",
        browser_context: captureBrowserContext(req, body),
      },
    };
    if (product.sessionKind === "synastry") {
      checkoutRow.synastry_session_id = sessionId;
    } else {
      checkoutRow.quiz_session_id = sessionId;
    }

    const { error: checkoutError } = await supabaseAdmin
      .from("checkout_sessions")
      .upsert(checkoutRow, { onConflict: "stripe_session_id" });

    if (checkoutError) {
      console.error("checkout_sessions upsert error:", checkoutError.message);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("create-checkout error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
