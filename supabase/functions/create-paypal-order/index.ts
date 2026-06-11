import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createPaypalOrder, getPaypalOrder, opaqueIdToPaypal, paypalToOpaqueId, PAYPAL_ENV } from "../_shared/paypal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProductDef {
  amount: string;
  amountCents: number;
  description: string;
  productCode: string;
  includesTransits: boolean;
  transitMonths: number;
  sessionKind: "natal" | "synastry";
  successPath?: string;
  cancelPath?: string;
}

const PRODUCTS: Record<string, ProductDef> = {
  base: {
    amount: "19.00",
    amountCents: 1900,
    description: "Lettura Completa del Tema Natale",
    productCode: "natal_report_base",
    includesTransits: false,
    transitMonths: 0,
    sessionKind: "natal",
  },
  premium: {
    amount: "29.00",
    amountCents: 2900,
    description: "Lettura Completa + 1 Mese di Transiti",
    productCode: "natal_report_plus_transits",
    includesTransits: true,
    transitMonths: 1,
    sessionKind: "natal",
  },
  synastry: {
    amount: "19.00",
    amountCents: 1900,
    description: "Sinastria di Coppia",
    productCode: "synastry_couple_report",
    includesTransits: false,
    transitMonths: 0,
    sessionKind: "synastry",
    successPath: "/coppia/success",
    cancelPath: "/coppia/offer",
  },
  synastry_launch: {
    amount: "14.90",
    amountCents: 1490,
    description: "Sinastria di Coppia (Lancio)",
    productCode: "synastry_couple_report_launch",
    includesTransits: false,
    transitMonths: 0,
    sessionKind: "synastry",
    successPath: "/coppia/success",
    cancelPath: "/coppia/offer",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { purchaseType } = body;
    const product = PRODUCTS[purchaseType];

    const sessionId: string | undefined =
      product?.sessionKind === "synastry"
        ? body?.synastrySessionId
        : body?.sessionId;

    if (!product || typeof sessionId !== "string" || !sessionId) {
      return new Response(JSON.stringify({ error: "Invalid purchase type or session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const isSynastry = product.sessionKind === "synastry";
    console.log(`[create-paypal-order] env=${PAYPAL_ENV} purchaseType=${purchaseType} sessionKind=${product.sessionKind} sessionId=${sessionId}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );

    // Prevent duplicate open orders for the same quiz session.
    // If one already exists and is still valid on PayPal, reuse it.
    const sessionCol = isSynastry ? "synastry_session_id" : "quiz_session_id";
    const { data: existingOpen } = await supabaseAdmin
      .from("checkout_sessions")
      .select("stripe_session_id, payment_status, provider_metadata")
      .eq(sessionCol, sessionId)
      .eq("payment_provider", "paypal")
      .eq("purchase_type", purchaseType)
      .eq("payment_status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingOpen?.stripe_session_id) {
      const existingOrderId = (existingOpen.provider_metadata as any)?.paypal_order_id;
      if (existingOrderId) {
        try {
          const existingOrder = await getPaypalOrder(existingOrderId) as any;
          if (existingOrder.status === "CREATED") {
            const approvalLink = existingOrder.links?.find((l: any) => l.rel === "approve")?.href;
            if (approvalLink) {
              console.log(`[create-paypal-order] reusing existing open order ${existingOrderId}`);
              return new Response(JSON.stringify({ url: approvalLink, orderId: existingOrderId }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
              });
            }
          }
        } catch (e) {
          console.warn(`[create-paypal-order] existing order ${existingOrderId} stale, creating new`);
        }
      }
    }

    const origin = req.headers.get("origin") || Deno.env.get("PUBLIC_SITE_URL") || "https://www.codiceinteriore.it";
    const customId = `${sessionId}|${purchaseType}`;
    const successPath = product.successPath || "/success";
    const cancelPath = product.cancelPath || "/offer";

    const order = await createPaypalOrder({
      amount: product.amount,
      currency: "EUR",
      customId,
      description: product.description,
      returnUrl: `${origin}${successPath}`,
      cancelUrl: `${origin}${cancelPath}`,
    });

    const opaqueId = paypalToOpaqueId(order.id);

    const { error: insertError } = await supabaseAdmin.from("checkout_sessions").upsert(
      {
        stripe_session_id: opaqueId,
        ...(isSynastry
          ? { synastry_session_id: sessionId }
          : { quiz_session_id: sessionId }),
        purchase_type: purchaseType,
        product_code: product.productCode,
        includes_transits: product.includesTransits,
        transit_months: product.transitMonths,
        payment_status: "open",
        payment_provider: "paypal",
        amount_total: product.amountCents,
        currency: "EUR",
        provider_metadata: {
          environment: PAYPAL_ENV,
          paypal_order_id: order.id,
          stage: "created",
        },
      },
      { onConflict: "stripe_session_id" },
    );

    if (insertError) {
      console.error("[create-paypal-order] checkout_sessions upsert error:", insertError.message);
    }

    return new Response(JSON.stringify({ url: order.approvalUrl, orderId: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[create-paypal-order] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
