// Shared "post-capture" writeback for PayPal payments. Used by both
// capture-paypal-order (browser-driven flow) and paypal-webhook (server-to-
// server safety net). Keeping a single code path here is intentional: the
// previous bug class was "two paths drift, one silently fails to update DB".
//
// Idempotent by construction:
//   - upsert on stripe_session_id ("pp_<orderId>")
//   - claim email uses idempotencyKey "report-claim-<opaqueId>" (queue-side dedup)
//   - Brevo sync uses updateEnabled:true
//   - generate-report only fires if quiz_sessions.full_report is null

import { createClient } from "npm:@supabase/supabase-js@2";
import { sendTransactionalEmailBackground } from "./send-email.ts";
import { syncBrevoContactBackground } from "./sync-brevo.ts";
import { firePurchaseEventBackground } from "./fire-meta-purchase.ts";
import type { PaypalOrder } from "./paypal.ts";
import { paypalToOpaqueId } from "./paypal.ts";
import { getMarket } from "./markets.ts";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

export type FinalizeSource = "capture" | "webhook";

type PurchaseType = "base" | "premium" | "synastry" | "synastry_launch";

export interface FinalizePaypalResult {
  opaqueId: string;
  quizSessionId: string;
  synastrySessionId: string;
  purchaseType: PurchaseType;
  customerEmail: string | null;
  payerName: string | null;
  amountCents: number;
  currency: string;
  completedAt: string;
  alreadyPaid: boolean;
}

export async function finalizePaypalPayment(
  captured: PaypalOrder,
  source: FinalizeSource,
): Promise<FinalizePaypalResult> {
  const purchaseUnit = captured.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];
  const status = capture?.status || captured.status || "";

  if (status !== "COMPLETED" && captured.status !== "COMPLETED") {
    throw new Error(`PayPal order ${captured.id} not COMPLETED (status=${status})`);
  }

  const customId = purchaseUnit?.custom_id || "";
  const [sessionId, purchaseTypeRaw] = customId.split("|");
  const isSynastry = purchaseTypeRaw === "synastry" || purchaseTypeRaw === "synastry_launch";
  const purchaseType: PurchaseType =
    purchaseTypeRaw === "premium" ? "premium"
    : purchaseTypeRaw === "synastry" ? "synastry"
    : purchaseTypeRaw === "synastry_launch" ? "synastry_launch"
    : "base";
  const quizSessionId = isSynastry ? "" : sessionId;
  const synastrySessionId = isSynastry ? sessionId : "";
  const opaqueId = paypalToOpaqueId(captured.id);
  const customerEmail = captured.payer?.email_address?.toLowerCase() || null;

  const completedAt = capture?.create_time
    ? new Date(capture.create_time).toISOString()
    : new Date().toISOString();

  const defaultAmount =
    purchaseType === "premium" ? "29.00"
    : purchaseType === "synastry_launch" ? "14.90"
    : "19.00";
  const captureAmountStr =
    (capture as any)?.amount?.value ||
    purchaseUnit?.amount?.value ||
    defaultAmount;
  const captureCurrency =
    (capture as any)?.amount?.currency_code ||
    purchaseUnit?.amount?.currency_code ||
    "EUR";
  const amountCents = Math.round(parseFloat(captureAmountStr) * 100);

  const payer = captured.payer || {};
  const payerName =
    [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(" ").trim() || null;
  const payerId = (payer as any)?.payer_id || null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Check existing state so we can skip side-effects on idempotent re-runs.
  const { data: existing } = await supabase
    .from("checkout_sessions")
    .select("payment_status, claimed_profile_id, synastry_session_id, market")
    .eq("stripe_session_id", opaqueId)
    .maybeSingle();
  const alreadyPaid = existing?.payment_status === "paid";

  // Il market è stato persistito sulla riga alla creazione dell'ordine.
  const market = getMarket((existing as { market?: string | null } | null)?.market);
  const paypalEnv = (() => {
    const raw = (Deno.env.get(market.paypal.envEnv) || "sandbox").toLowerCase();
    return raw === "live" || raw === "production" ? "live" : "sandbox";
  })();

  const providerMetadata = {
    environment: paypalEnv,
    paypal_order_id: captured.id,
    capture_id: capture?.id || null,
    capture_status: capture?.status || captured.status,
    capture_create_time: capture?.create_time || null,
    payer_email: customerEmail,
    payer_name: payerName,
    payer_id: payerId,
    stage: source === "webhook" ? "captured_via_webhook" : "captured",
    finalized_source: source,
  };

  const productCodeMap: Record<PurchaseType, string> = {
    base: "natal_report_base",
    premium: "natal_report_plus_transits",
    synastry: "synastry_couple_report",
    synastry_launch: "synastry_couple_report_launch",
  };

  const { error: upsertError } = await supabase.from("checkout_sessions").upsert(
    {
      stripe_session_id: opaqueId,
      ...(isSynastry
        ? { synastry_session_id: synastrySessionId || null }
        : { quiz_session_id: quizSessionId || null }),
      purchase_type: purchaseType,
      product_code: productCodeMap[purchaseType],
      includes_transits: purchaseType === "premium",
      transit_months: purchaseType === "premium" ? 1 : 0,
      customer_email: customerEmail,
      payment_status: "paid",
      payment_completed_at: completedAt,
      payment_provider: "paypal",
      provider_payment_id: capture?.id || captured.id,
      amount_total: amountCents,
      currency: captureCurrency,
      provider_metadata: providerMetadata,
    },
    { onConflict: "stripe_session_id" },
  );

  if (upsertError) {
    // Bubble up to the caller — do NOT swallow. Both call sites now treat
    // an upsert failure as a hard error so it surfaces in monitoring.
    throw new Error(`checkout_sessions upsert failed: ${upsertError.message}`);
  }

  // Side-effects: only fire the first time we mark the row as paid. On
  // re-deliveries (alreadyPaid), the email queue + Brevo would be no-ops
  // anyway, but skipping saves the round trips.
  // For synastry, the claim email is owned by generate-synastry-report (it has
  // both partners' names). finalize must NOT send a natal "report-claim" here:
  // on the capture path PayPal returns custom_id nested under the capture, so
  // purchaseUnit.custom_id is empty and isSynastry would misread as false,
  // sending the wrong email (link to /activate instead of /coppia/activate).
  // The checkout row's synastry_session_id (written at order creation) is the
  // reliable signal.
  const isSynastryPurchase = isSynastry || Boolean(existing?.synastry_session_id);
  if (!alreadyPaid && customerEmail) {
    if (!isSynastryPurchase) {
      sendTransactionalEmailBackground({
        templateName: "report-claim",
        recipientEmail: customerEmail,
        idempotencyKey: `report-claim-${opaqueId}`,
        templateData: {
          name: payerName || "",
          sessionId: opaqueId,
          lang: market.language,
          market: market.id,
        },
      });
    }
    syncBrevoContactBackground({
      email: customerEmail,
      eventType: "purchase",
      name: payerName || undefined,
      attributes: {
        PURCHASED: true,
        PURCHASE_DATE: completedAt,
        PRODUCT_CODE: productCodeMap[purchaseType],
        PURCHASE_TYPE: purchaseType,
        LAST_AMOUNT: amountCents / 100,
        CURRENCY: captureCurrency,
        HAS_TRANSITS: purchaseType === "premium",
        HAS_SYNASTRY: Boolean(isSynastry),
        PAYMENT_PROVIDER: "paypal",
      },
    });
  }

  const activeSessionId = isSynastry ? synastrySessionId : quizSessionId;
  if (activeSessionId) {
    const { data: metaFlag } = await supabase
      .from("checkout_sessions")
      .select("meta_purchase_sent_at")
      .eq("stripe_session_id", opaqueId)
      .maybeSingle();
    if (!metaFlag?.meta_purchase_sent_at) {
      const ppNameParts = payerName?.split(" ") || [];
      firePurchaseEventBackground({
        quizSessionId: activeSessionId,
        purchaseType,
        checkoutSessionId: opaqueId,
        value: amountCents / 100,
        currency: captureCurrency,
        email: customerEmail,
        firstName: ppNameParts[0] || null,
        lastName: ppNameParts.length > 1 ? ppNameParts.slice(1).join(" ") : null,
        country: null,
      });
    }
  }

  if (isSynastry && synastrySessionId) {
    const { data: synPreCheck } = await supabase
      .from("synastry_sessions")
      .select("full_report")
      .eq("id", synastrySessionId)
      .maybeSingle();
    if (!synPreCheck?.full_report) {
      kickGenerateSynastryReport(synastrySessionId, customerEmail);
    }
  } else if (quizSessionId) {
    const { data: quizPreCheck } = await supabase
      .from("quiz_sessions")
      .select("full_report")
      .eq("id", quizSessionId)
      .maybeSingle();
    if (!quizPreCheck?.full_report) {
      kickGenerateReport(quizSessionId, customerEmail);
    }
  }

  return {
    opaqueId,
    quizSessionId: quizSessionId || "",
    synastrySessionId: synastrySessionId || "",
    purchaseType,
    customerEmail,
    payerName,
    amountCents,
    currency: captureCurrency,
    completedAt,
    alreadyPaid,
  };
}

function kickGenerateReport(quizSessionId: string, email: string | null) {
  if (!ADMIN_SECRET) {
    console.warn("[finalize-paypal] cannot invoke generate-report: ADMIN_SECRET not set");
    return;
  }
  const promise = (async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ quizSessionId, email }),
      });
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        console.error(
          `[finalize-paypal] generate-report responded ${res.status}: ${text.slice(0, 300)}`,
        );
      } else {
        console.log(
          `[finalize-paypal] generate-report accepted: ${text.slice(0, 200)}`,
        );
      }
    } catch (err) {
      console.error(
        "[finalize-paypal] generate-report background invoke error:",
        err instanceof Error ? err.message : String(err),
      );
    }
  })();
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(promise);
  } else {
    promise.catch(() => undefined);
  }
}

function kickGenerateSynastryReport(synastrySessionId: string, email: string | null) {
  if (!ADMIN_SECRET) {
    console.warn("[finalize-paypal] cannot invoke generate-synastry-report: ADMIN_SECRET not set");
    return;
  }
  const promise = (async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-synastry-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ synastrySessionId, email }),
      });
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        console.error(
          `[finalize-paypal] generate-synastry-report responded ${res.status}: ${text.slice(0, 300)}`,
        );
      } else {
        console.log(
          `[finalize-paypal] generate-synastry-report accepted: ${text.slice(0, 200)}`,
        );
      }
    } catch (err) {
      console.error(
        "[finalize-paypal] generate-synastry-report background invoke error:",
        err instanceof Error ? err.message : String(err),
      );
    }
  })();
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(promise);
  } else {
    promise.catch(() => undefined);
  }
}
