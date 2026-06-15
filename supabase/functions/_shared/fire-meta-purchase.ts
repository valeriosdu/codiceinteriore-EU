// Server-side Meta Conversions API Purchase fire, shared by stripe-reconcile
// and finalize-paypal-payment.
//
// Why this exists: the client-side Purchase in PaymentSuccess.tsx only fires
// if the buyer returns to /success. Buyers on mobile, in embedded browsers, or
// who close the tab right after Stripe/PayPal redirect were invisible to
// Meta — degrading both attribution and the optimization signal.
//
// Idempotency: relies on a local flag (checkout_sessions.meta_purchase_sent_at)
// to avoid re-firing on webhook redeliveries (Stripe retries on slow webhooks,
// PayPal redelivers on transient errors). Meta's deterministic event_id dedup
// is a backup for the race window between fire and flag update.
//
// Performance: backgrounded via EdgeRuntime.waitUntil — zero added latency on
// the webhook handler, same pattern as Brevo sync and generate-report.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getMarket } from "./markets.ts";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export type ServerPurchaseType = "base" | "premium";

export interface FireMetaPurchaseArgs {
  quizSessionId: string;
  purchaseType: ServerPurchaseType;
  checkoutSessionId: string;
  value: number;
  currency: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  phone?: string | null;
  zip?: string | null;
  sourceUrl?: string;
}

async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function buildEventId(quizSessionId: string, purchaseType: ServerPurchaseType): string {
  // Mirror useMetaConversions.ts buildEventId — same format so Meta dedups
  // when both server- and client-side fires reach Graph within the 48h window.
  return `purchase:${quizSessionId}:${purchaseType}`;
}

const PRODUCT_NAMES: Record<ServerPurchaseType, string> = {
  base: "Lettura completa",
  premium: "Lettura completa + transiti",
};

export function firePurchaseEventBackground(args: FireMetaPurchaseArgs) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("[fire-meta-purchase] missing supabase env; skipping");
    return;
  }
  if (typeof EdgeRuntime === "undefined" || !EdgeRuntime.waitUntil) {
    // Running outside the edge runtime (e.g. local script) — fire detached.
    void fireAndPersist(args).catch((err) =>
      console.error("[fire-meta-purchase] detached error:", err instanceof Error ? err.message : String(err)),
    );
    return;
  }
  EdgeRuntime.waitUntil(
    fireAndPersist(args).catch((err) =>
      console.error("[fire-meta-purchase] waitUntil error:", err instanceof Error ? err.message : String(err)),
    ),
  );
}

async function fireAndPersist(args: FireMetaPurchaseArgs): Promise<void> {
  const eventId = buildEventId(args.quizSessionId, args.purchaseType);

  // Mercato di default `it`; sovrascritto dalla riga sessione sotto. Determina
  // event_source_url e country quando il chiamante non li passa esplicitamente.
  let market = getMarket(null);

  const userData: Record<string, unknown> = {};
  if (args.email) userData.em = args.email;
  if (args.firstName) userData.fn = args.firstName;
  if (args.lastName) userData.ln = args.lastName;
  if (args.phone) userData.ph = args.phone;
  if (args.zip) userData.zp = args.zip;
  userData.external_id = args.quizSessionId;

  if (SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: qs } = await sb
        .from("quiz_sessions")
        .select("birth_date, user_name, market")
        .eq("id", args.quizSessionId)
        .maybeSingle();
      if (qs?.market) market = getMarket(qs.market as string);
      if (qs?.birth_date) {
        const bd = qs.birth_date as { day: number; month: number; year: number };
        userData.db = `${bd.year}${String(bd.month).padStart(2, "0")}${String(bd.day).padStart(2, "0")}`;
      }
      if (!userData.fn && qs?.user_name) userData.fn = qs.user_name;
    } catch (err) {
      console.warn("[fire-meta-purchase] quiz session lookup failed:", err instanceof Error ? err.message : String(err));
    }
  }

  userData.country = args.country?.trim() || market.countryCode.toLowerCase();

  const customData = {
    value: args.value,
    currency: args.currency,
    content_category: args.purchaseType,
    content_name: PRODUCT_NAMES[args.purchaseType],
  };

  const body = {
    event_name: "Purchase",
    event_id: eventId,
    event_source_url: args.sourceUrl || `${market.siteUrl}/success`,
    user_data: userData,
    custom_data: customData,
    skip_request_ip: true,
  };

  let invokeOk = false;
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/meta-conversions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const text = await response.text().catch(() => "");
    if (!response.ok) {
      console.error(
        `[fire-meta-purchase] meta-conversions responded ${response.status}: ${text.slice(0, 300)}`,
      );
    } else {
      console.log(
        `[fire-meta-purchase] Purchase fired event_id=${eventId} response=${text.slice(0, 200)}`,
      );
      invokeOk = true;
    }
  } catch (err) {
    console.error(
      "[fire-meta-purchase] meta-conversions fetch error:",
      err instanceof Error ? err.message : String(err),
    );
  }

  if (!invokeOk) return;
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[fire-meta-purchase] SERVICE_ROLE_KEY missing; cannot persist meta_purchase_sent_at");
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase
      .from("checkout_sessions")
      .update({ meta_purchase_sent_at: new Date().toISOString() })
      .eq("stripe_session_id", args.checkoutSessionId);
    if (error) {
      console.error("[fire-meta-purchase] meta_purchase_sent_at update failed:", error.message);
    }
  } catch (err) {
    console.error(
      "[fire-meta-purchase] DB update error:",
      err instanceof Error ? err.message : String(err),
    );
  }
}
