// Stripe webhook for the transit-subscription product (recurring 7,90€/mo).
// Separate from the main `stripe-webhook` so it can be wired to a different
// Stripe webhook endpoint with its own signing secret. We also gracefully
// fall back to the main webhook secret to keep operations simple.
//
// Events handled:
//   - checkout.session.completed (mode=subscription) → first activation
//   - invoice.paid                                   → recurring renewal
//   - customer.subscription.updated                  → status / cancellation
//   - customer.subscription.deleted                  → final cancel
//
// All handlers are idempotent. Entitlements/cycles are keyed on
// (profile_id, stripe_session_id, entitlement_type) where stripe_session_id
// is a synthetic per-period id `sub_<id>__<period_start>` so renewals don't
// clash with the initial activation.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendTransactionalEmailBackground } from "../_shared/send-email.ts";
import { syncBrevoContactBackground } from "../_shared/sync-brevo.ts";
import { getMarket } from "../_shared/markets.ts";
import { getInvoiceSubscriptionId, getSubscriptionPeriod } from "../_shared/stripe-basil.ts";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

// I secret Stripe si risolvono per-mercato dentro il handler (?market=…).

const pad = (n: number) => String(n).padStart(2, "0");

const formatTimezoneOffset = (offsetHours: unknown) => {
  const hours = Number(offsetHours);
  if (!Number.isFinite(hours)) return "AUTO";
  const sign = hours >= 0 ? "+" : "-";
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${sign}${pad(h)}:${pad(m)}`;
};

const formatLocalDateTime = (date: Date, offsetHours: unknown) => {
  const hours = Number(offsetHours);
  const local = Number.isFinite(hours) ? new Date(date.getTime() + hours * 3600 * 1000) : date;
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
};

const addMonthsToLocalDateOnly = (localDateTime: string, months: number) => {
  const [datePart, timePart = "00:00"] = localDateTime.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  const next = new Date(Date.UTC(y, mo - 1, d, h || 0, mi || 0));
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
};

const invokeBackground = (functionName: string, body: Record<string, unknown>) => {
  if (!ADMIN_SECRET) {
    console.warn(`[stripe-sub-webhook] cannot invoke ${functionName}: ADMIN_SECRET not set`);
    return;
  }
  EdgeRuntime.waitUntil(
    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "x-admin-secret": ADMIN_SECRET,
          },
          body: JSON.stringify(body),
        });
        const text = await res.text().catch(() => "");
        if (!res.ok) {
          console.error(`[stripe-sub-webhook] ${functionName} ${res.status}: ${text.slice(0, 400)}`);
        }
      } catch (err) {
        console.error(
          `[stripe-sub-webhook] ${functionName} background err:`,
          err instanceof Error ? err.message : String(err),
        );
      }
    })(),
  );
};

interface ProvisionParams {
  profileId: string;
  quizSessionId: string;
  customerEmail: string | null;
  stripeSessionId: string; // synthetic per-period id
  stripeSubscriptionId: string;
  periodStart: Date;
  periodEnd: Date;
  source: string;
  isRenewal: boolean;
}

async function provisionTransitCycle(
  supabaseAdmin: ReturnType<typeof createClient>,
  params: ProvisionParams,
) {
  const { data: quizSession, error: quizErr } = await supabaseAdmin
    .from("quiz_sessions")
    .select("id, user_name, birth_timezone, language, market")
    .eq("id", params.quizSessionId)
    .maybeSingle();
  if (quizErr || !quizSession?.id) {
    console.error("[stripe-sub-webhook] quiz session not found:", params.quizSessionId);
    return null;
  }

  const purchaseLocalDateTime = formatLocalDateTime(params.periodStart, quizSession.birth_timezone);
  const purchaseTimezone = formatTimezoneOffset(quizSession.birth_timezone);

  // Upsert entitlement (one row per period via synthetic stripe_session_id).
  const { data: entitlement, error: entErr } = await supabaseAdmin
    .from("user_entitlements")
    .upsert(
      {
        profile_id: params.profileId,
        quiz_session_id: params.quizSessionId,
        stripe_session_id: params.stripeSessionId,
        entitlement_type: "monthly_transits",
        status: "active",
        starts_at: params.periodStart.toISOString(),
        ends_at: params.periodEnd.toISOString(),
        source: params.source,
      },
      { onConflict: "profile_id,stripe_session_id,entitlement_type" },
    )
    .select("id")
    .single();
  if (entErr || !entitlement?.id) {
    console.error("[stripe-sub-webhook] entitlement upsert error:", entErr?.message);
    return null;
  }

  const { data: cycle, error: cycErr } = await supabaseAdmin
    .from("transit_cycles")
    .upsert(
      {
        profile_id: params.profileId,
        quiz_session_id: params.quizSessionId,
        entitlement_id: entitlement.id,
        stripe_session_id: params.stripeSessionId,
        period_start: purchaseLocalDateTime.slice(0, 10),
        period_end: addMonthsToLocalDateOnly(purchaseLocalDateTime, 1),
        premium_purchase_at: params.periodStart.toISOString(),
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
  if (cycErr) {
    console.error("[stripe-sub-webhook] transit_cycles upsert err:", cycErr.message);
  }

  let cycleId = cycle?.id || null;
  if (!cycleId) {
    const { data: existing } = await supabaseAdmin
      .from("transit_cycles")
      .select("id")
      .eq("entitlement_id", entitlement.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    cycleId = existing?.id || null;
  }

  if (cycleId) invokeBackground("process-transit-cycle", { transitCycleId: cycleId });

  if (params.customerEmail) {
    sendTransactionalEmailBackground({
      templateName: "transits-activated",
      recipientEmail: params.customerEmail,
      idempotencyKey: `transits-activated-${params.stripeSessionId}`,
      templateData: {
        name: quizSession.user_name || "",
        isRenewal: params.isRenewal,
        lang: (quizSession as { language?: string | null }).language === "es" ? "es" : "it",
        market: (quizSession as { market?: string | null }).market === "es" ? "es" : "it",
      },
    });
    syncBrevoContactBackground({
      email: params.customerEmail,
      eventType: "transits_subscribed",
      name: quizSession.user_name || undefined,
      attributes: {
        HAS_TRANSITS: true,
        TRANSITS_STATUS: "active",
        TRANSITS_PERIOD_END: params.periodEnd.toISOString(),
        TRANSITS_SOURCE: "subscription",
        TRANSITS_IS_RENEWAL: params.isRenewal,
      },
    });
  }

  return cycleId;
}

async function findProfileForSubscription(
  supabaseAdmin: ReturnType<typeof createClient>,
  subscriptionId: string,
  fallbackEmail: string | null,
  fallbackProfileId: string | null,
) {
  // 1. existing transit_subscriptions row
  const { data: existing } = await supabaseAdmin
    .from("transit_subscriptions")
    .select("profile_id, quiz_session_id, stripe_customer_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  if (existing?.profile_id) return existing;

  if (fallbackProfileId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, quiz_session_id")
      .eq("id", fallbackProfileId)
      .maybeSingle();
    if (profile?.id) {
      return {
        profile_id: profile.id,
        quiz_session_id: profile.quiz_session_id || null,
        stripe_customer_id: null,
      };
    }
  }

  if (fallbackEmail) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, quiz_session_id")
      .ilike("email", fallbackEmail)
      .maybeSingle();
    if (profile?.id) {
      return {
        profile_id: profile.id,
        quiz_session_id: profile.quiz_session_id || null,
        stripe_customer_id: null,
      };
    }
  }
  return null;
}

async function handleCheckoutCompleted(
  supabaseAdmin: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
) {
  if (session.mode !== "subscription") {
    return { skipped: "not_subscription_mode" };
  }
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) return { skipped: "no_subscription_id" };

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const customerEmail =
    session.customer_details?.email ||
    session.customer_email ||
    (subscription.metadata?.email as string | undefined) ||
    null;

  const quizSessionId =
    session.metadata?.quiz_session_id || subscription.metadata?.quiz_session_id || null;
  const metadataProfileId =
    session.metadata?.profile_id || subscription.metadata?.profile_id || null;

  const ownership = await findProfileForSubscription(
    supabaseAdmin,
    subscriptionId,
    customerEmail,
    metadataProfileId,
  );
  if (!ownership?.profile_id) {
    console.error(`[stripe-sub-webhook] no profile resolved for sub=${subscriptionId}`);
    return { skipped: "no_profile" };
  }
  const effectiveQuizSessionId = quizSessionId || ownership.quiz_session_id;
  if (!effectiveQuizSessionId) {
    console.error(`[stripe-sub-webhook] no quiz_session_id for sub=${subscriptionId}`);
    return { skipped: "no_quiz_session" };
  }

  const { periodStart, periodEnd } = getSubscriptionPeriod(subscription);
  const priceId = subscription.items.data[0]?.price?.id || null;

  // language/market viaggiano sulla riga: il ciclo transiti gira su cron
  // senza contesto frontend e li legge da qui.
  const { data: qsLocale } = await supabaseAdmin
    .from("quiz_sessions")
    .select("language, market")
    .eq("id", effectiveQuizSessionId)
    .maybeSingle();

  await supabaseAdmin.from("transit_subscriptions").upsert(
    {
      profile_id: ownership.profile_id,
      quiz_session_id: effectiveQuizSessionId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      language: (qsLocale as { language?: string | null } | null)?.language === "es" ? "es" : "it",
      market: (qsLocale as { market?: string | null } | null)?.market === "es" ? "es" : "it",
    },
    { onConflict: "stripe_subscription_id" },
  );

  // Phase 2 (estendi invece di sovrapporre): if the subscription starts in a
  // trial (set by create-transit-checkout when the customer still had an active
  // transit window), do NOT provision a cycle now. The first cycle is created
  // when the trial ends and the first real invoice is paid (invoice.paid,
  // billing_reason=subscription_cycle), so the new period extends the existing
  // window instead of overlapping/recomputing it. The transit_subscriptions row
  // is already upserted above, so the subscription is recorded during the trial.
  if (subscription.status === "trialing") {
    console.log(
      `[stripe-sub-webhook] sub ${subscriptionId} trialing until ${subscription.trial_end}; first transit cycle deferred to trial end`,
    );
    return { handled: "checkout_completed", deferredToTrialEnd: true };
  }

  await provisionTransitCycle(supabaseAdmin, {
    profileId: ownership.profile_id,
    quizSessionId: effectiveQuizSessionId,
    customerEmail,
    stripeSessionId: `sub_${subscriptionId}__${Math.floor(periodStart.getTime() / 1000)}`,
    stripeSubscriptionId: subscriptionId,
    periodStart,
    periodEnd,
    source: "transit_subscription",
    isRenewal: false,
  });

  return { handled: "checkout_completed" };
}

async function handleInvoicePaid(
  supabaseAdmin: ReturnType<typeof createClient>,
  stripe: Stripe,
  invoice: Stripe.Invoice,
) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return { skipped: "no_subscription_on_invoice" };

  // Skip the very first invoice — already handled by checkout.session.completed.
  if (invoice.billing_reason === "subscription_create") {
    return { skipped: "first_invoice_handled_by_checkout" };
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerEmail =
    invoice.customer_email ||
    (typeof invoice.customer === "object" ? (invoice.customer as Stripe.Customer)?.email : null) ||
    null;

  const ownership = await findProfileForSubscription(
    supabaseAdmin,
    subscriptionId,
    customerEmail,
    (subscription.metadata?.profile_id as string | undefined) || null,
  );
  if (!ownership?.profile_id || !ownership.quiz_session_id) {
    console.error(`[stripe-sub-webhook] invoice.paid: no ownership for sub=${subscriptionId}`);
    return { skipped: "no_ownership" };
  }

  const { periodStart, periodEnd } = getSubscriptionPeriod(subscription);

  await supabaseAdmin
    .from("transit_subscriptions")
    .update({
      status: subscription.status,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      last_invoice_id: invoice.id,
    })
    .eq("stripe_subscription_id", subscriptionId);

  await provisionTransitCycle(supabaseAdmin, {
    profileId: ownership.profile_id,
    quizSessionId: ownership.quiz_session_id,
    customerEmail,
    stripeSessionId: `sub_${subscriptionId}__${Math.floor(periodStart.getTime() / 1000)}`,
    stripeSubscriptionId: subscriptionId,
    periodStart,
    periodEnd,
    source: "transit_subscription",
    isRenewal: true,
  });

  return { handled: "invoice_paid" };
}

async function handleSubscriptionUpdated(
  supabaseAdmin: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
) {
  const { periodStart: ps, periodEnd: pe } = getSubscriptionPeriod(subscription);
  const periodStart = ps.toISOString();
  const periodEnd = pe.toISOString();
  await supabaseAdmin
    .from("transit_subscriptions")
    .update({
      status: subscription.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    })
    .eq("stripe_subscription_id", subscription.id);
  return { handled: "subscription_updated" };
}

async function handleSubscriptionDeleted(
  supabaseAdmin: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
) {
  await supabaseAdmin
    .from("transit_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: false,
    })
    .eq("stripe_subscription_id", subscription.id);

  // Sync Brevo: marca il contatto come ex-iscritto ai transiti per segmentazione churn.
  try {
    const { data: sub } = await supabaseAdmin
      .from("transit_subscriptions")
      .select("profile_id")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();
    if (sub?.profile_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", sub.profile_id)
        .maybeSingle();
      if (profile?.email) {
        syncBrevoContactBackground({
          email: profile.email,
          eventType: "transits_canceled",
          attributes: {
            HAS_TRANSITS: false,
            TRANSITS_STATUS: "canceled",
            TRANSITS_CANCELED_AT: new Date().toISOString(),
          },
        });
      }
    }
  } catch (e) {
    console.error("[stripe-sub-webhook] brevo sync on delete failed:", e);
  }

  // Existing entitlement keeps its ends_at and naturally expires.
  return { handled: "subscription_deleted" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();

  // Per-market endpoint (?market=es); URL nudo = mercato "it" (back-compat).
  const market = getMarket(new URL(req.url).searchParams.get("market"));
  const STRIPE_SECRET_KEY = Deno.env.get(market.stripe.secretKeyEnv) || "";
  const STRIPE_SECRET_KEY_TEST =
    Deno.env.get(market.stripe.secretKeyTestEnv) || STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = Deno.env.get(market.stripe.webhookSecretEnv) || "";
  const STRIPE_SUB_WEBHOOK_SECRET =
    Deno.env.get(market.stripe.subscriptionWebhookSecretEnv) || STRIPE_WEBHOOK_SECRET;

  const candidateSecrets = [STRIPE_SUB_WEBHOOK_SECRET, STRIPE_WEBHOOK_SECRET].filter(
    (s, i, arr) => s && arr.indexOf(s) === i,
  );
  if (candidateSecrets.length === 0) {
    console.error(`[stripe-sub-webhook] no signing secret configured for market "${market.id}"`);
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
      "[stripe-sub-webhook] signature verification failed:",
      lastError instanceof Error ? lastError.message : String(lastError),
    );
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(
    event.livemode ? STRIPE_SECRET_KEY : STRIPE_SECRET_KEY_TEST,
    { apiVersion: "2025-08-27.basil" },
  );

  console.log(`[stripe-sub-webhook] event ${event.type} id=${event.id} livemode=${event.livemode}`);
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    let result: Record<string, unknown> = { ignored: event.type };
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          const fresh = await stripe.checkout.sessions.retrieve(session.id);
          result = await handleCheckoutCompleted(supabaseAdmin, stripe, fresh);
        }
        break;
      }
      case "invoice.paid": {
        // Only invoice.paid is handled (Stripe also fires invoice.payment_succeeded
        // for the same invoice; handling both would run handleInvoicePaid twice).
        const invoice = event.data.object as Stripe.Invoice;
        result = await handleInvoicePaid(supabaseAdmin, stripe, invoice);
        break;
      }
      case "customer.subscription.updated": {
        result = await handleSubscriptionUpdated(supabaseAdmin, event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        result = await handleSubscriptionDeleted(supabaseAdmin, event.data.object as Stripe.Subscription);
        break;
      }
    }
    return new Response(JSON.stringify({ received: true, ...result }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-sub-webhook] handler error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
