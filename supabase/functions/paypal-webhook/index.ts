// Server-to-server PayPal webhook. Counterpart to stripe-webhook.
//
// Why this exists: capture-paypal-order is browser-driven. If the buyer's
// browser dies between PayPal's capture and our writeback, PayPal has the
// money but our DB stays "open" — the bug we hit in May 2026. This webhook
// is the safety net: PayPal POSTs server-to-server, signed with our
// PAYPAL_WEBHOOK_ID, and we finalize the payment regardless of the browser.
//
// Configure on PayPal Developer Dashboard:
//   - URL: <project>.supabase.co/functions/v1/paypal-webhook
//   - Events: PAYMENT.CAPTURE.COMPLETED (required), PAYMENT.CAPTURE.REFUNDED
//             (optional), PAYMENT.CAPTURE.DENIED (optional)
//   - After creation, copy the Webhook ID into Supabase secret PAYPAL_WEBHOOK_ID.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  getPaypalOrder,
  paypalToOpaqueId,
  resolvePaypalCreds,
  verifyPaypalWebhookSignature,
} from "../_shared/paypal.ts";
import { finalizePaypalPayment } from "../_shared/finalize-paypal-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-time, paypal-cert-url, paypal-auth-algo, paypal-transmission-sig",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface PaypalCaptureResource {
  id?: string;
  status?: string;
  custom_id?: string;
  amount?: { value?: string; currency_code?: string };
  supplementary_data?: { related_ids?: { order_id?: string } };
  links?: Array<{ rel: string; href: string }>;
}

interface PaypalWebhookEvent {
  id?: string;
  event_type?: string;
  resource_type?: string;
  resource?: PaypalCaptureResource;
}

function extractOrderIdFromCaptureResource(resource: PaypalCaptureResource): string | null {
  // Preferred: supplementary_data.related_ids.order_id
  const fromSupp = resource?.supplementary_data?.related_ids?.order_id;
  if (fromSupp) return fromSupp;
  // Fallback: parse the "up" link href like ".../v2/checkout/orders/<orderId>"
  const upLink = resource?.links?.find((l) => l.rel === "up")?.href || "";
  const match = upLink.match(/\/v2\/checkout\/orders\/([^/?]+)/);
  return match?.[1] || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  // Read raw body once — verifyPaypalWebhookSignature needs it byte-for-byte.
  const rawBody = await req.text();

  // Per-market endpoint: nel dashboard PayPal di ogni mercato si registra
  // .../paypal-webhook?market=es — il param seleziona credenziali e webhook id
  // per la verifica firma; l'URL nudo resta il mercato "it" (back-compat).
  // Secret mancanti = 401 pulito (PayPal ritenta), non un 500 opaco.
  let creds;
  try {
    creds = resolvePaypalCreds(new URL(req.url).searchParams.get("market"));
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error(`[paypal-webhook] credentials not configured: ${reason}`);
    return new Response(
      JSON.stringify({ error: "PayPal credentials not configured", reason }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
    );
  }

  const verification = await verifyPaypalWebhookSignature(req, rawBody, creds);
  if (!verification.ok) {
    console.error(`[paypal-webhook] signature verification failed: ${verification.reason}`);
    return new Response(
      JSON.stringify({ error: "Invalid signature", reason: verification.reason }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
    );
  }

  let event: PaypalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaypalWebhookEvent;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const eventType = event.event_type || "";
  const eventId = event.id || "(no id)";
  console.log(`[paypal-webhook] env=${creds.env} event=${eventType} id=${eventId}`);

  try {
    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        // The capture event payload has the capture resource but NOT the
        // payer info (email, name) — those live on the parent order. So we
        // fetch the order to get a complete picture, then hand it to the
        // shared finalize helper.
        const resource = event.resource || {};
        const orderId = extractOrderIdFromCaptureResource(resource);
        if (!orderId) {
          console.error("[paypal-webhook] capture event missing order_id");
          return new Response(
            JSON.stringify({ error: "Cannot determine order_id from capture event" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
          );
        }

        const order = await getPaypalOrder(orderId, creds);
        const result = await finalizePaypalPayment(order, "webhook");
        console.log(
          `[paypal-webhook] finalized order=${orderId} email=${result.customerEmail} alreadyPaid=${result.alreadyPaid}`,
        );
        return new Response(
          JSON.stringify({ ok: true, alreadyPaid: result.alreadyPaid }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }

      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED": {
        // Mark the existing checkout row as refunded. We don't currently do
        // anything else (no refund-email template, no profile state change).
        // The capture id of the original payment is on resource.links[rel=up]
        // for refund events; the simpler path is to look up the checkout via
        // provider_payment_id matching the original capture id passed in
        // resource.supplementary_data.related_ids.capture_id.
        const captureId = (event.resource as any)?.supplementary_data?.related_ids?.capture_id;
        const orderId = extractOrderIdFromCaptureResource(event.resource || {});
        if (!captureId && !orderId) {
          console.warn(`[paypal-webhook] ${eventType} missing capture_id and order_id`);
          return new Response(JSON.stringify({ ok: true, ignored: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const filterCol = captureId ? "provider_payment_id" : "stripe_session_id";
        const filterVal = captureId || paypalToOpaqueId(orderId!);
        const { error } = await supabase
          .from("checkout_sessions")
          .update({
            payment_status: eventType === "PAYMENT.CAPTURE.REFUNDED" ? "refunded" : "reversed",
          })
          .eq(filterCol, filterVal);
        if (error) {
          console.error(`[paypal-webhook] refund/reverse update failed: ${error.message}`);
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "PAYMENT.CAPTURE.DENIED": {
        // Capture failed on PayPal's side. Mark the row so admin tooling
        // doesn't treat it as paid.
        const orderId = extractOrderIdFromCaptureResource(event.resource || {});
        if (!orderId) {
          return new Response(JSON.stringify({ ok: true, ignored: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { error } = await supabase
          .from("checkout_sessions")
          .update({ payment_status: "failed" })
          .eq("stripe_session_id", paypalToOpaqueId(orderId));
        if (error) {
          console.error(`[paypal-webhook] denied update failed: ${error.message}`);
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default: {
        // Subscribe at PayPal-level only to events we handle, but still ack
        // any other event with 200 so PayPal doesn't retry indefinitely.
        console.log(`[paypal-webhook] ignoring event_type=${eventType}`);
        return new Response(JSON.stringify({ ok: true, ignored: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[paypal-webhook] handler error for ${eventType}:`, msg);
    // Return 500 so PayPal retries (they back off on failures). This is the
    // explicit "make the failure loud" choice — the previous bug was caused
    // by silent success-on-failure.
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
