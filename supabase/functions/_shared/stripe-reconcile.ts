// Shared logic for reconciling a paid Stripe Checkout Session against our
// internal DB. Used by both:
//   - supabase/functions/stripe-webhook (real-time, signed by Stripe)
//   - supabase/functions/recover-pending-reports (admin safety-net sweep)
//
// The function is fully idempotent.
//
// Behaviour:
//   - Always upserts the matching `checkout_sessions` row to payment_status='paid'
//     with all the payment details (email, payment_intent, amount, currency,
//     payment_completed_at, provider metadata).
//   - If a `profiles` row exists for the customer's email, it ALSO completes
//     the user-side claim:
//        * sets claimed_profile_id / claimed_at on checkout_sessions
//        * updates profiles.stripe_session_id / quiz_session_id
//        * upserts user_reports (active)
//        * upserts user_entitlements (natal_report and, for premium,
//          monthly_transits) and the corresponding transit_cycles row
//        * triggers `generate-report` (and `process-transit-cycle` for premium)
//   - If no profile exists yet, the row is left paid+unclaimed. The user's
//     later /activate flow will pick it up via sync-checkout-session.

import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendTransactionalEmailBackground } from "./send-email.ts";
import { syncBrevoContactBackground } from "./sync-brevo.ts";
import { syncAstrologyGuideStatusBackground } from "./astrology-guide-brevo.ts";
import { computeHasTransits } from "./compute-has-transits.ts";
import { firePurchaseEventBackground } from "./fire-meta-purchase.ts";
import {
  ASTROLOGY_GUIDE_PACK_CREDITS,
  ASTROLOGY_GUIDE_PRODUCT_CODE,
  ASTROLOGY_GUIDE_PURCHASE_TYPE,
} from "./astrology-products.ts";
import {
  TRANSIT_ONE_TIME_PRICE_ID,
  TRANSIT_ONE_TIME_PRODUCT_ID,
} from "./transit-products.ts";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const pad = (value: number) => String(value).padStart(2, "0");

const formatTimezoneOffset = (offsetHours: unknown) => {
  const hours = Number(offsetHours);
  if (!Number.isFinite(hours)) return "AUTO";
  const sign = hours >= 0 ? "+" : "-";
  const absolute = Math.abs(hours);
  const wholeHours = Math.floor(absolute);
  const minutes = Math.round((absolute - wholeHours) * 60);
  return `${sign}${pad(wholeHours)}:${pad(minutes)}`;
};

const toLocalParts = (date: Date, offsetHours: unknown) => {
  const hours = Number(offsetHours);
  const local = Number.isFinite(hours)
    ? new Date(date.getTime() + hours * 60 * 60 * 1000)
    : date;
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
  };
};

const formatLocalDateTime = (date: Date, offsetHours: unknown) => {
  const parts = toLocalParts(date, offsetHours);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
};

const addMonthsToLocalDateOnly = (localDateTime: string, months: number) => {
  const [datePart, timePart = "00:00"] = localDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0));
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
};

const invokeBackground = (functionName: string, body: Record<string, unknown>) => {
  if (!ADMIN_SECRET) {
    console.warn(`[stripe-reconcile] cannot invoke ${functionName}: ADMIN_SECRET not set`);
    return;
  }
  console.log(`[stripe-reconcile] invoking ${functionName}`, JSON.stringify(body));
  EdgeRuntime.waitUntil(
    (async () => {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "x-admin-secret": ADMIN_SECRET,
          },
          body: JSON.stringify(body),
        });
        const text = await response.text().catch(() => "");
        if (!response.ok) {
          console.error(
            `[stripe-reconcile] ${functionName} responded ${response.status}: ${text.slice(0, 500)}`,
          );
        } else {
          console.log(`[stripe-reconcile] ${functionName} accepted: ${text.slice(0, 200)}`);
        }
      } catch (error) {
        console.error(
          `[stripe-reconcile] ${functionName} background invoke error:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    })(),
  );
};

const getPaymentCompletedAt = async (stripe: Stripe, session: Stripe.Checkout.Session) => {
  const fallbackSeconds = session.created;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId) return new Date(fallbackSeconds * 1000);
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const latestCharge = paymentIntent.latest_charge;
    const chargeCreated =
      typeof latestCharge === "object" && latestCharge?.created ? latestCharge.created : null;
    return new Date((chargeCreated || paymentIntent.created || fallbackSeconds) * 1000);
  } catch (error) {
    console.error(
      "[stripe-reconcile] payment intent timestamp lookup error:",
      error instanceof Error ? error.message : String(error),
    );
    return new Date(fallbackSeconds * 1000);
  }
};

export type ReconcileResult = { status: string; reason?: string };

export async function reconcilePaidStripeSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<ReconcileResult> {
  if (session.payment_status !== "paid") {
    return { status: "skipped", reason: `not_paid:${session.payment_status}` };
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const rawPurchaseType = session.metadata?.purchase_type || "base";
  const isSynastry = rawPurchaseType === "synastry" || rawPurchaseType === "synastry_launch";

  // ── Synastry (coppia): handled separately. Niente user_reports,
  // niente user_entitlements, niente transit_cycles. Solo upsert checkout +
  // invoke generate-synastry-report.
  // Sia "synastry" (prezzo pieno 19,00) sia "synastry_launch" (sconto lancio 14,90)
  // cadono qui: il flusso di provisioning e' identico, cambia solo il price_id.
  if (isSynastry) {
    const synastrySessionId = session.metadata?.synastry_session_id || "";
    if (!synastrySessionId) {
      return { status: "skipped", reason: "missing_synastry_session_id" };
    }

    const customerEmailSyn =
      session.customer_details?.email || session.customer_email || null;
    const paymentCompletedAtSyn = await getPaymentCompletedAt(stripe, session);
    const stripePaymentIntentIdSyn =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

    const synCheckoutPayload: Record<string, unknown> = {
      stripe_session_id: session.id,
      synastry_session_id: synastrySessionId,
      // rawPurchaseType vale "synastry" o "synastry_launch": preserviamo la
      // distinzione in DB per poter contare separatamente i buyer del lancio.
      purchase_type: rawPurchaseType,
      product_code: session.metadata?.product_code || "synastry_couple_report",
      includes_transits: false,
      transit_months: 0,
      customer_email: customerEmailSyn,
      payment_status: "paid",
      payment_completed_at: paymentCompletedAtSyn.toISOString(),
      payment_provider: "stripe",
      provider_payment_id: stripePaymentIntentIdSyn,
      currency: (session.currency || "eur").toUpperCase(),
      provider_metadata: {
        stripe_mode: session.mode,
        stripe_customer:
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id || null,
        payment_method_types: session.payment_method_types || [],
        stage: "captured_via_reconcile_synastry",
      },
    };
    if (typeof session.amount_total === "number") {
      synCheckoutPayload.amount_total = session.amount_total;
    }

    // Risolvi profilo per email (creazione opzionale post-claim)
    let synProfileId: string | null = null;
    if (customerEmailSyn) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .ilike("email", customerEmailSyn)
        .maybeSingle();
      if (profile?.id) {
        synProfileId = profile.id;
        synCheckoutPayload.claimed_profile_id = synProfileId;
        synCheckoutPayload.claimed_at = new Date().toISOString();
      }
    }

    await supabaseAdmin
      .from("checkout_sessions")
      .upsert(synCheckoutPayload, { onConflict: "stripe_session_id" });

    if (customerEmailSyn) {
      syncBrevoContactBackground({
        email: customerEmailSyn,
        eventType: "purchase",
        name: session.customer_details?.name || undefined,
        attributes: {
          PURCHASED: true,
          PURCHASE_DATE: paymentCompletedAtSyn.toISOString(),
          PRODUCT_CODE: session.metadata?.product_code || "synastry_couple_report",
          PURCHASE_TYPE: rawPurchaseType,
          LAST_AMOUNT:
            typeof session.amount_total === "number" ? session.amount_total / 100 : null,
          CURRENCY: (session.currency || "eur").toUpperCase(),
          HAS_SYNASTRY: true,
        },
      });
    }

    // Invoca background generate-synastry-report
    invokeBackground("generate-synastry-report", { synastrySessionId });

    return {
      status: synProfileId ? "paid_claimed_synastry" : "paid_unclaimed_synastry",
    };
  }

  const quizSessionId = session.metadata?.quiz_session_id || "";
  if (!quizSessionId) {
    return { status: "skipped", reason: "missing_quiz_session_id" };
  }
  const isTransitsAddon = rawPurchaseType === "transits_addon";
  const isTransitsSubscription = rawPurchaseType === "transits_subscription";
  const isAstrologyPack = rawPurchaseType === ASTROLOGY_GUIDE_PURCHASE_TYPE;
  // IMPORTANT: transits_subscription is handled exclusively by
  // stripe-subscription-webhook. We must NOT fall through to the base/premium
  // branch below — doing so would clobber profiles.stripe_session_id, upsert a
  // duplicate user_reports row, and create a spurious natal_report entitlement.
  // Same applies if mode === "subscription" but metadata is missing.
  if (isTransitsSubscription || session.mode === "subscription") {
    console.log(
      `[stripe-reconcile] delegating subscription session ${session.id} to stripe-subscription-webhook (mode=${session.mode}, purchase_type=${rawPurchaseType})`,
    );
    return { status: "delegated_to_subscription_webhook" };
  }
  const purchaseType =
    rawPurchaseType === "premium"
      ? "premium"
      : isTransitsAddon
        ? "transits_addon"
        : isAstrologyPack
          ? ASTROLOGY_GUIDE_PURCHASE_TYPE
          : "base";
  let includesTransits =
    purchaseType === "premium" || isTransitsAddon || session.metadata?.includes_transits === "true";

  // Stripe Checkout upsell / optional item: a Base checkout can include the
  // transit add-on line item without it ever touching metadata.purchase_type
  // (the upsell is configured in the Stripe Dashboard, so create-checkout never
  // sees it). Detect it from the real line items so transits get provisioned
  // anyway. Only Base can reach here without transits already flagged.
  if (purchaseType === "base" && !includesTransits) {
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const hasTransitLineItem = lineItems.data.some((li) => {
        const price = li.price;
        const productId =
          typeof price?.product === "string" ? price.product : price?.product?.id;
        return price?.id === TRANSIT_ONE_TIME_PRICE_ID || productId === TRANSIT_ONE_TIME_PRODUCT_ID;
      });
      if (hasTransitLineItem) {
        includesTransits = true;
        console.warn(
          "[stripe-reconcile] transit line item present but metadata had no transits; provisioning transits",
          { sessionId: session.id, metadataPT: rawPurchaseType, amount: session.amount_total },
        );
      }
    } catch (e) {
      console.error(
        "[stripe-reconcile] listLineItems failed during transit upsell detection:",
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  const transitMonths = includesTransits
    ? Math.max(1, Number(session.metadata?.transit_months || 1))
    : 0;
  const productCode =
    session.metadata?.product_code ||
    (purchaseType === "premium"
      ? "natal_report_plus_transits"
      : isTransitsAddon
        ? "transits_one_month_addon"
        : isAstrologyPack
          ? ASTROLOGY_GUIDE_PRODUCT_CODE
          : "natal_report_base");
  const customerEmail =
    session.customer_details?.email || session.customer_email || null;
  const paymentCompletedAt = await getPaymentCompletedAt(stripe, session);
  const stripePaymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  // 1) Upsert checkout_sessions row (always).
  const checkoutPayload: Record<string, unknown> = {
    stripe_session_id: session.id,
    quiz_session_id: quizSessionId,
    purchase_type: purchaseType,
    product_code: productCode,
    includes_transits: includesTransits,
    transit_months: transitMonths,
    customer_email: customerEmail,
    payment_status: "paid",
    payment_completed_at: paymentCompletedAt.toISOString(),
    payment_provider: "stripe",
    provider_payment_id: stripePaymentIntentId,
    currency: (session.currency || "eur").toUpperCase(),
    provider_metadata: {
      stripe_mode: session.mode,
      stripe_customer:
        typeof session.customer === "string" ? session.customer : session.customer?.id || null,
      payment_method_types: session.payment_method_types || [],
      stage: "captured_via_reconcile",
    },
  };
  if (typeof session.amount_total === "number") {
    checkoutPayload.amount_total = session.amount_total;
  }

  // 2) Try to find an existing profile for this email.
  let profileId: string | null = null;
  let profileEmail: string | null = null;
  if (customerEmail) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .ilike("email", customerEmail)
      .maybeSingle();
    if (profile?.id) {
      profileId = profile.id;
      profileEmail = profile.email || customerEmail;
    }
  }

  if (profileId) {
    checkoutPayload.claimed_profile_id = profileId;
    checkoutPayload.claimed_at = new Date().toISOString();
  }

  await supabaseAdmin
    .from("checkout_sessions")
    .upsert(checkoutPayload, { onConflict: "stripe_session_id" });

  // ── Transits one-time addon: handled separately. Does NOT touch user_reports
  // and does NOT generate a new natal report. Adds a monthly_transits
  // entitlement (30 days) and triggers a transit cycle.
  if (isTransitsAddon) {
    // Best-effort: if we still don't have a profile (e.g. customer_email was
    // null on the Stripe session because it was attached to a Stripe customer
    // object instead), resolve via the Stripe customer's email.
    let resolvedEmail = customerEmail;
    if (!profileId && !resolvedEmail && session.customer) {
      try {
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer.id;
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && !("deleted" in customer && customer.deleted)) {
          resolvedEmail = (customer as Stripe.Customer).email || null;
        }
      } catch (e) {
        console.error(
          "[stripe-reconcile] stripe customer lookup failed:",
          e instanceof Error ? e.message : String(e),
        );
      }
    }
    if (!profileId && resolvedEmail) {
      const { data: retryProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .ilike("email", resolvedEmail)
        .maybeSingle();
      if (retryProfile?.id) {
        profileId = retryProfile.id;
        profileEmail = retryProfile.email || resolvedEmail;
        console.log(
          `[stripe-reconcile] transits_addon: recovered profile via email lookup (session=${session.id}, email=${resolvedEmail})`,
        );
      }
    }
    if (!profileId) {
      console.error(
        `[stripe-reconcile] CRITICAL transits_addon paid but no profile found (session=${session.id}, email=${resolvedEmail || "null"}). Will be reclaimed at next user login by sync-checkout-session.`,
      );
      return { status: "paid_unclaimed_transits_addon" };
    }
    // Make sure customerEmail used downstream reflects the resolved value.
    if (!customerEmail && resolvedEmail) {
      // Update the row we just upserted so future sweeps can match by email.
      await supabaseAdmin
        .from("checkout_sessions")
        .update({ customer_email: resolvedEmail })
        .eq("stripe_session_id", session.id);
    }
    const effectiveCustomerEmail = customerEmail || resolvedEmail;

    const { data: quizSession } = await supabaseAdmin
      .from("quiz_sessions")
      .select("id, user_name, birth_timezone")
      .eq("id", quizSessionId)
      .maybeSingle();
    if (!quizSession?.id) {
      return { status: "paid_no_quiz_session" };
    }
    const periodStart = paymentCompletedAt;
    const periodEnd = addMonths(periodStart, 1);
    const purchaseLocalDateTime = formatLocalDateTime(periodStart, quizSession.birth_timezone);
    const purchaseTimezone = formatTimezoneOffset(quizSession.birth_timezone);

    const { data: entitlement } = await supabaseAdmin
      .from("user_entitlements")
      .upsert(
        {
          profile_id: profileId,
          quiz_session_id: quizSessionId,
          stripe_session_id: session.id,
          entitlement_type: "monthly_transits",
          status: "active",
          starts_at: periodStart.toISOString(),
          ends_at: periodEnd.toISOString(),
          source: "transit_renewal",
        },
        { onConflict: "profile_id,stripe_session_id,entitlement_type" },
      )
      .select("id")
      .single();

    if (entitlement?.id) {
      const { data: cycle } = await supabaseAdmin
        .from("transit_cycles")
        .upsert(
          {
            profile_id: profileId,
            quiz_session_id: quizSessionId,
            entitlement_id: entitlement.id,
            stripe_session_id: session.id,
            period_start: purchaseLocalDateTime.slice(0, 10),
            period_end: addMonthsToLocalDateOnly(purchaseLocalDateTime, 1),
            premium_purchase_at: paymentCompletedAt.toISOString(),
            premium_purchase_local_datetime: purchaseLocalDateTime,
            premium_purchase_timezone: purchaseTimezone,
            snapshot_count: 10,
            snapshot_step_days: 3.3,
            status: "pending",
            fetch_status: "pending",
            interpretation_status: "pending",
            processing_error: null,
          },
          { onConflict: "entitlement_id,period_start,period_end" },
        )
        .select("id")
        .maybeSingle();
      if (cycle?.id) invokeBackground("process-transit-cycle", { transitCycleId: cycle.id });
    }

    // Mark the checkout_session as claimed by this profile so future sweeps
    // (and the admin orphan view) don't re-pick it.
    await supabaseAdmin
      .from("checkout_sessions")
      .update({ claimed_profile_id: profileId, claimed_at: new Date().toISOString() })
      .eq("stripe_session_id", session.id)
      .is("claimed_profile_id", null);

    if (effectiveCustomerEmail) {
      sendTransactionalEmailBackground({
        templateName: "transits-activated",
        recipientEmail: effectiveCustomerEmail,
        idempotencyKey: `transits-activated-${session.id}`,
        templateData: { name: quizSession.user_name || "", isRenewal: false },
      });
      syncBrevoContactBackground({
        email: effectiveCustomerEmail,
        eventType: "transits_subscribed",
        name: quizSession.user_name || undefined,
        attributes: {
          HAS_TRANSITS: true,
          TRANSITS_STATUS: "active",
          TRANSITS_PERIOD_END: periodEnd.toISOString(),
          TRANSITS_SOURCE: "addon",
        },
      });
    }
    return { status: "paid_transits_addon" };
  }

  // ── Astrology Guide pack: 10 question credits, one-time. Does NOT touch
  // user_reports, user_entitlements, or transit_cycles. Just grants credits.
  if (isAstrologyPack) {
    let resolvedEmail = customerEmail;
    if (!profileId && !resolvedEmail && session.customer) {
      try {
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer.id;
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && !("deleted" in customer && customer.deleted)) {
          resolvedEmail = (customer as Stripe.Customer).email || null;
        }
      } catch (e) {
        console.error(
          "[stripe-reconcile] astrology_pack: stripe customer lookup failed:",
          e instanceof Error ? e.message : String(e),
        );
      }
    }
    if (!profileId && resolvedEmail) {
      const { data: retryProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .ilike("email", resolvedEmail)
        .maybeSingle();
      if (retryProfile?.id) {
        profileId = retryProfile.id;
        profileEmail = retryProfile.email || resolvedEmail;
        console.log(
          `[stripe-reconcile] astrology_pack: recovered profile via email lookup (session=${session.id}, email=${resolvedEmail})`,
        );
      }
    }
    if (!profileId) {
      console.error(
        `[stripe-reconcile] astrology_pack paid but no profile found (session=${session.id}, email=${resolvedEmail || "null"}). Will be reclaimed at next user login.`,
      );
      return { status: "paid_unclaimed_astrology_pack" };
    }
    if (!customerEmail && resolvedEmail) {
      await supabaseAdmin
        .from("checkout_sessions")
        .update({ customer_email: resolvedEmail })
        .eq("stripe_session_id", session.id);
    }

    // Idempotency: tracciamo l'avvenuto grant tramite
    // provider_metadata.credits_granted_at sulla riga checkout_sessions.
    // NON possiamo usare claimed_at perché viene già impostato nell'upsert
    // iniziale (riga 252-259) durante questo stesso request → era un bug:
    // ogni grant veniva saltato e i clienti non ricevevano i 10 crediti.
    const { data: existingRow } = await supabaseAdmin
      .from("checkout_sessions")
      .select("provider_metadata")
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    const existingMetadata =
      (existingRow?.provider_metadata as Record<string, unknown> | null) || {};
    const alreadyGranted = Boolean(existingMetadata.credits_granted_at);

    if (!alreadyGranted) {
      const creditsToGrant = Math.max(
        1,
        Number(session.metadata?.astrology_guide_credits || ASTROLOGY_GUIDE_PACK_CREDITS),
      );
      const { error: grantErr } = await supabaseAdmin.rpc("grant_astrology_credits", {
        p_profile_id: profileId,
        p_quiz_session_id: quizSessionId,
        p_amount: creditsToGrant,
      });
      if (grantErr) {
        console.error(
          `[stripe-reconcile] astrology_pack grant failed (session=${session.id}):`,
          grantErr.message,
        );
        // Don't mark granted; let Stripe retry the webhook.
        throw new Error(`astrology_pack_grant_failed: ${grantErr.message}`);
      }
      await supabaseAdmin
        .from("checkout_sessions")
        .update({
          provider_metadata: {
            ...existingMetadata,
            credits_granted_at: new Date().toISOString(),
            credits_granted_amount: creditsToGrant,
          },
        })
        .eq("stripe_session_id", session.id);
    }

    await supabaseAdmin
      .from("checkout_sessions")
      .update({ claimed_profile_id: profileId, claimed_at: new Date().toISOString() })
      .eq("stripe_session_id", session.id)
      .is("claimed_profile_id", null);

    const effectiveCustomerEmail = customerEmail || resolvedEmail || profileEmail;
    if (effectiveCustomerEmail) {
      syncBrevoContactBackground({
        email: effectiveCustomerEmail,
        eventType: "purchase",
        attributes: {
          PURCHASED: true,
          PURCHASE_DATE: paymentCompletedAt.toISOString(),
          PRODUCT_CODE: ASTROLOGY_GUIDE_PRODUCT_CODE,
          PURCHASE_TYPE: ASTROLOGY_GUIDE_PURCHASE_TYPE,
          LAST_AMOUNT:
            typeof session.amount_total === "number" ? session.amount_total / 100 : null,
          CURRENCY: (session.currency || "eur").toUpperCase(),
          ASTROLOGY_GUIDE_CREDITS: ASTROLOGY_GUIDE_PACK_CREDITS,
        },
      });
      // Bump GUIDA_STATUS to its lifetime value (will resolve to
      // "pack_purchased" now that the checkout_sessions row is claimed+paid).
      syncAstrologyGuideStatusBackground(profileId, effectiveCustomerEmail);
    }

    return { status: "paid_astrology_pack" };
  }

  // Send "report-claim" email — this is the safety net so every paying
  // customer always gets a link back to /activate, even if they close the
  // browser before completing signup. Idempotency key derived from the
  // immutable Stripe session id ensures retries (Stripe webhook redelivery,
  // recover-pending-reports sweep) never duplicate the email.
  if (customerEmail) {
    sendTransactionalEmailBackground({
      templateName: "report-claim",
      recipientEmail: customerEmail,
      idempotencyKey: `report-claim-${session.id}`,
      templateData: {
        name: session.customer_details?.name || "",
        sessionId: session.id,
      },
    });
    // HAS_TRANSITS must reflect cumulative state, not just this checkout —
    // otherwise a subsequent base/pack purchase would overwrite the `true`
    // set by an earlier premium/transit-addon purchase.
    const hasTransitsAttr = profileId
      ? (await computeHasTransits(profileId, supabaseAdmin)) || includesTransits
      : includesTransits;
    syncBrevoContactBackground({
      email: customerEmail,
      eventType: "purchase",
      name: session.customer_details?.name || undefined,
      attributes: {
        PURCHASED: true,
        PURCHASE_DATE: paymentCompletedAt.toISOString(),
        PRODUCT_CODE: productCode,
        PURCHASE_TYPE: purchaseType,
        LAST_AMOUNT:
          typeof session.amount_total === "number" ? session.amount_total / 100 : null,
        CURRENCY: (session.currency || "eur").toUpperCase(),
        HAS_TRANSITS: hasTransitsAttr,
      },
    });
  }

  // Server-side Meta CAPI Purchase: backfills the client-side fire from
  // PaymentSuccess when the buyer closes the tab before /success loads. The
  // event_id matches useMetaConversions.buildEventId so Meta dedups when both
  // sides reach Graph. Local idempotency via meta_purchase_sent_at avoids
  // redundant fetches on Stripe webhook redeliveries.
  if (purchaseType === "base" || purchaseType === "premium") {
    const { data: metaFlag } = await supabaseAdmin
      .from("checkout_sessions")
      .select("meta_purchase_sent_at")
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    if (!metaFlag?.meta_purchase_sent_at) {
      const purchaseValue =
        typeof session.amount_total === "number"
          ? session.amount_total / 100
          : purchaseType === "premium"
            ? 29
            : 19;
      const nameParts = session.customer_details?.name?.split(" ") || [];
      firePurchaseEventBackground({
        quizSessionId,
        purchaseType,
        checkoutSessionId: session.id,
        value: purchaseValue,
        currency: (session.currency || "eur").toUpperCase(),
        email: customerEmail,
        firstName: nameParts[0] || null,
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : null,
        country: session.customer_details?.address?.country || null,
        phone: session.customer_details?.phone || null,
        zip: session.customer_details?.address?.postal_code || null,
      });
    }
  }

  if (!profileId) {
    // Pre-claim: kick off report generation immediately, even though no
    // profile exists yet. This way the LLM works while the buyer signs up,
    // so when they reach /report-processing the report is often already
    // ready. sync-checkout-session will do the profile linking at claim
    // time. Transit cycles still wait for the claim because they require
    // profile_id.
    const { data: quizPreCheck } = await supabaseAdmin
      .from("quiz_sessions")
      .select("full_report")
      .eq("id", quizSessionId)
      .maybeSingle();
    if (!quizPreCheck?.full_report) {
      invokeBackground("generate-report", { quizSessionId, email: customerEmail });
    }
    console.log(
      `[stripe-reconcile] paid+unclaimed (no profile yet) session=${session.id} email=${customerEmail} — generation kicked off`,
    );
    return { status: "paid_unclaimed" };
  }

  // 3) Profile exists — complete the claim + trigger generation.
  const { data: quizSession, error: quizError } = await supabaseAdmin
    .from("quiz_sessions")
    .select("id, user_name, birth_place, birth_timezone, full_report")
    .eq("id", quizSessionId)
    .maybeSingle();

  if (quizError || !quizSession?.id) {
    console.error(
      `[stripe-reconcile] quiz session not found: ${quizSessionId} for stripe session ${session.id}`,
    );
    return { status: "paid_no_quiz_session" };
  }

  const label =
    [quizSession.user_name, quizSession.birth_place].filter(Boolean).join(" · ") ||
    "Lettura personale";

  await supabaseAdmin
    .from("profiles")
    .update({ stripe_session_id: session.id, quiz_session_id: quizSessionId })
    .eq("id", profileId);

  await supabaseAdmin.from("user_reports").upsert(
    {
      profile_id: profileId,
      quiz_session_id: quizSessionId,
      stripe_session_id: session.id,
      purchase_type: purchaseType,
      label,
      is_active: true,
    },
    { onConflict: "profile_id,quiz_session_id" },
  );

  const now = paymentCompletedAt;
  const baseSource = purchaseType === "premium" ? "premium_purchase" : "base_purchase";
  await supabaseAdmin.from("user_entitlements").upsert(
    {
      profile_id: profileId,
      quiz_session_id: quizSessionId,
      stripe_session_id: session.id,
      entitlement_type: "natal_report",
      status: "active",
      starts_at: now.toISOString(),
      ends_at: null,
      source: baseSource,
    },
    { onConflict: "profile_id,stripe_session_id,entitlement_type" },
  );

  let transitCycleId: string | null = null;
  if (includesTransits) {
    const periodStart = now;
    const periodEnd = addMonths(now, transitMonths);
    const purchaseLocalDateTime = formatLocalDateTime(
      paymentCompletedAt,
      quizSession.birth_timezone,
    );
    const purchaseTimezone = formatTimezoneOffset(quizSession.birth_timezone);
    const { data: transitEntitlement, error: entitlementError } = await supabaseAdmin
      .from("user_entitlements")
      .upsert(
        {
          profile_id: profileId,
          quiz_session_id: quizSessionId,
          stripe_session_id: session.id,
          entitlement_type: "monthly_transits",
          status: "active",
          starts_at: periodStart.toISOString(),
          ends_at: periodEnd.toISOString(),
          source: purchaseType === "premium" ? "premium_purchase" : "transit_renewal",
        },
        { onConflict: "profile_id,stripe_session_id,entitlement_type" },
      )
      .select("id")
      .single();
    if (!entitlementError && transitEntitlement?.id) {
      const { data: transitCycle, error: transitCycleError } = await supabaseAdmin
        .from("transit_cycles")
        .upsert(
          {
            profile_id: profileId,
            quiz_session_id: quizSessionId,
            entitlement_id: transitEntitlement.id,
            stripe_session_id: session.id,
            period_start: purchaseLocalDateTime.slice(0, 10),
            period_end: addMonthsToLocalDateOnly(purchaseLocalDateTime, transitMonths),
            premium_purchase_at: paymentCompletedAt.toISOString(),
            premium_purchase_local_datetime: purchaseLocalDateTime,
            premium_purchase_timezone: purchaseTimezone,
            snapshot_count: 10,
            snapshot_step_days: 3.3,
            status: "pending",
            fetch_status: "pending",
            interpretation_status: "pending",
            processing_error: null,
          },
          { onConflict: "entitlement_id,period_start,period_end" },
        )
        .select("id")
        .maybeSingle();
      if (transitCycleError) {
        console.error(
          "[stripe-reconcile] transit_cycles upsert error:",
          transitCycleError.message,
        );
      }
      transitCycleId = transitCycle?.id || null;
      if (!transitCycleId) {
        const { data: existingCycle } = await supabaseAdmin
          .from("transit_cycles")
          .select("id")
          .eq("entitlement_id", transitEntitlement.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        transitCycleId = existingCycle?.id || null;
      }
    } else if (entitlementError) {
      console.error(
        "[stripe-reconcile] monthly_transits entitlement error:",
        entitlementError.message,
      );
    }
  }

  if (includesTransits && !transitCycleId) {
    console.warn(
      `[stripe-reconcile] WARNING: includesTransits=true but no transit_cycle for session=${session.id}`,
    );
  }

  // Trigger generation if there is no full report yet.
  if (!quizSession.full_report) {
    invokeBackground("generate-report", { quizSessionId, email: profileEmail });
  }
  if (transitCycleId) invokeBackground("process-transit-cycle", { transitCycleId });

  // Set initial Astrology Guide status on Brevo. The helper computes the
  // lifetime status, so on first purchase it resolves to "none"; on a
  // re-purchase by a customer who already has higher status (e.g. bought a
  // pack on a previous report), it preserves that higher value.
  syncAstrologyGuideStatusBackground(profileId, profileEmail);

  console.log(
    `[stripe-reconcile] paid+claimed session=${session.id} profile=${profileId}`,
  );
  return { status: "paid_claimed" };
}
