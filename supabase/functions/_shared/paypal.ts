// Shared PayPal helpers for Orders v2 API.
// Honors PAYPAL_ENV ("sandbox" or "live"); defaults to sandbox for safety.

export const PAYPAL_ENV: "sandbox" | "live" = (() => {
  const env = (Deno.env.get("PAYPAL_ENV") || "sandbox").toLowerCase();
  return env === "live" || env === "production" ? "live" : "sandbox";
})();

export const PAYPAL_BASE_URL =
  PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export async function getPaypalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET") || "";
  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is not configured");
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PayPal auth failed [${res.status}]: ${text}`);
  }

  const data = await res.json();
  if (!data?.access_token) throw new Error("PayPal auth response missing access_token");
  return data.access_token as string;
}

export interface PaypalOrder {
  id: string;
  status: string;
  purchase_units?: Array<{
    custom_id?: string;
    reference_id?: string;
    amount?: { value?: string; currency_code?: string };
    payments?: { captures?: Array<{ id: string; status: string; create_time?: string }> };
  }>;
  payer?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
}

export async function createPaypalOrder(args: {
  amount: string; // e.g., "19.00"
  currency: string; // e.g., "EUR"
  customId: string; // packed metadata: quizSessionId|purchaseType
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approvalUrl: string }> {
  const token = await getPaypalAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: args.customId.slice(0, 127),
          description: args.description.slice(0, 127),
          amount: {
            currency_code: args.currency,
            value: args.amount,
          },
        },
      ],
      application_context: {
        brand_name: "Codice Interiore",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: args.returnUrl,
        cancel_url: args.cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PayPal create order failed [${res.status}]: ${text}`);
  }

  const order = (await res.json()) as PaypalOrder & { links?: Array<{ rel: string; href: string }> };
  const approvalLink = order.links?.find((l) => l.rel === "approve")?.href;
  if (!order.id || !approvalLink) {
    throw new Error("PayPal order response missing id or approval link");
  }
  return { id: order.id, approvalUrl: approvalLink };
}

export async function capturePaypalOrder(orderId: string): Promise<PaypalOrder> {
  const token = await getPaypalAccessToken();
  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  // 422 with ORDER_ALREADY_CAPTURED is non-fatal — fall back to GET.
  if (res.status === 422) {
    const text = await res.text().catch(() => "");
    if (text.includes("ORDER_ALREADY_CAPTURED")) {
      return await getPaypalOrder(orderId);
    }
    throw new Error(`PayPal capture failed [${res.status}]: ${text}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PayPal capture failed [${res.status}]: ${text}`);
  }

  return (await res.json()) as PaypalOrder;
}

export async function getPaypalOrder(orderId: string): Promise<PaypalOrder> {
  const token = await getPaypalAccessToken();
  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PayPal get order failed [${res.status}]: ${text}`);
  }
  return (await res.json()) as PaypalOrder;
}

// Internal stripe_session_id-like opaque identifier for PayPal orders.
// We reuse the existing column to avoid a major schema/code refactor.
export const paypalToOpaqueId = (orderId: string) => `pp_${orderId}`;
export const isPaypalOpaqueId = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("pp_");
export const opaqueIdToPaypal = (value: string) =>
  value.startsWith("pp_") ? value.slice(3) : value;

// Verifies a PayPal webhook delivery using the official verify-webhook-signature
// endpoint. Requires PAYPAL_WEBHOOK_ID to be set in function secrets, matching
// the webhook configured in the PayPal Developer Dashboard.
//
// The caller MUST pass the exact raw request body that was received — the
// verification depends on byte-for-byte equality with what PayPal signed.
export interface PaypalWebhookVerifyResult {
  ok: boolean;
  reason?: string;
}

export async function verifyPaypalWebhookSignature(
  req: Request,
  rawBody: string,
): Promise<PaypalWebhookVerifyResult> {
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID") || "";
  if (!webhookId) return { ok: false, reason: "PAYPAL_WEBHOOK_ID not configured" };

  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionTime = req.headers.get("paypal-transmission-time");
  const certUrl = req.headers.get("paypal-cert-url");
  const authAlgo = req.headers.get("paypal-auth-algo");
  const transmissionSig = req.headers.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return { ok: false, reason: "missing PayPal signature headers" };
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return { ok: false, reason: "request body is not valid JSON" };
  }

  const token = await getPaypalAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: parsedBody,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      reason: `PayPal verify endpoint ${res.status}: ${text.slice(0, 200)}`,
    };
  }

  const data = (await res.json().catch(() => ({}))) as { verification_status?: string };
  return {
    ok: data.verification_status === "SUCCESS",
    reason: data.verification_status,
  };
}
