// One-shot recovery for transit subscriptions paid on Stripe but never
// provisioned in the database (because stripe-subscription-webhook was not
// subscribed to checkout.session.completed at the time).
//
// Mirrors handleCheckoutCompleted from stripe-subscription-webhook, but:
//   - is triggered manually with a subscription_id
//   - supports skipEmail to avoid resending "transits activated" emails / Brevo events
//   - is idempotent (upserts on natural keys)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendTransactionalEmailBackground } from "../_shared/send-email.ts";
import { syncBrevoContactBackground } from "../_shared/sync-brevo.ts";
import { getSubscriptionPeriod } from "../_shared/stripe-basil.ts";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

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
          console.error(`[admin-recover-sub] ${functionName} ${res.status}: ${text.slice(0, 400)}`);
        }
      } catch (err) {
        console.error(`[admin-recover-sub] ${functionName} err:`, err instanceof Error ? err.message : String(err));
      }
    })(),
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const provided = req.headers.get("x-admin-secret") || "";
  if (!ADMIN_SECRET || provided !== ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { subscription_id?: string; skipEmail?: boolean } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const subscriptionId = (body.subscription_id || "").trim();
  const skipEmail = body.skipEmail === true;
  if (!subscriptionId) {
    return new Response(JSON.stringify({ error: "subscription_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["customer"] });
    const customer = subscription.customer as Stripe.Customer | string;
    const customerId = typeof customer === "string" ? customer : customer.id;
    const customerEmail =
      (typeof customer === "object" && (customer as Stripe.Customer)?.email) ||
      (subscription.metadata?.email as string | undefined) ||
      null;

    // Resolve quiz session / profile via the matching paid checkout_session row.
    let profileId: string | null = (subscription.metadata?.profile_id as string) || null;
    let quizSessionId: string | null = (subscription.metadata?.quiz_session_id as string) || null;

    if (!profileId || !quizSessionId) {
      const { data: cs } = await supabaseAdmin
        .from("checkout_sessions")
        .select("quiz_session_id, claimed_profile_id, customer_email")
        .eq("purchase_type", "transits_subscription")
        .eq("payment_status", "paid")
        .ilike("customer_email", customerEmail || "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cs) {
        profileId = profileId || cs.claimed_profile_id;
        quizSessionId = quizSessionId || cs.quiz_session_id;
      }
    }

    if (!profileId && customerEmail) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, quiz_session_id")
        .ilike("email", customerEmail)
        .maybeSingle();
      if (profile?.id) {
        profileId = profile.id;
        quizSessionId = quizSessionId || profile.quiz_session_id;
      }
    }

    if (!profileId || !quizSessionId) {
      return new Response(JSON.stringify({
        error: "could not resolve profile/quiz_session", subscriptionId, customerEmail, profileId, quizSessionId,
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: quizSession, error: quizErr } = await supabaseAdmin
      .from("quiz_sessions")
      .select("id, user_name, birth_timezone")
      .eq("id", quizSessionId)
      .maybeSingle();
    if (quizErr || !quizSession?.id) {
      return new Response(JSON.stringify({ error: "quiz session not found", quizSessionId }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { periodStart, periodEnd } = getSubscriptionPeriod(subscription);
    const priceId = subscription.items.data[0]?.price?.id || null;
    const syntheticSessionId = `sub_${subscriptionId}__${Math.floor(periodStart.getTime() / 1000)}`;

    // 1. transit_subscriptions
    await supabaseAdmin.from("transit_subscriptions").upsert(
      {
        profile_id: profileId,
        quiz_session_id: quizSessionId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        status: subscription.status,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
      },
      { onConflict: "stripe_subscription_id" },
    );

    // 2. user_entitlements
    const { data: entitlement, error: entErr } = await supabaseAdmin
      .from("user_entitlements")
      .upsert(
        {
          profile_id: profileId,
          quiz_session_id: quizSessionId,
          stripe_session_id: syntheticSessionId,
          entitlement_type: "monthly_transits",
          status: "active",
          starts_at: periodStart.toISOString(),
          ends_at: periodEnd.toISOString(),
          source: "transit_subscription",
        },
        { onConflict: "profile_id,stripe_session_id,entitlement_type" },
      )
      .select("id")
      .single();
    if (entErr || !entitlement?.id) {
      return new Response(JSON.stringify({ error: "entitlement upsert failed", details: entErr?.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. transit_cycles
    const purchaseLocalDateTime = formatLocalDateTime(periodStart, quizSession.birth_timezone);
    const purchaseTimezone = formatTimezoneOffset(quizSession.birth_timezone);

    const { data: cycle, error: cycErr } = await supabaseAdmin
      .from("transit_cycles")
      .upsert(
        {
          profile_id: profileId,
          quiz_session_id: quizSessionId,
          entitlement_id: entitlement.id,
          stripe_session_id: syntheticSessionId,
          period_start: purchaseLocalDateTime.slice(0, 10),
          period_end: addMonthsToLocalDateOnly(purchaseLocalDateTime, 1),
          premium_purchase_at: periodStart.toISOString(),
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
    if (cycErr) console.error("[admin-recover-sub] transit_cycles upsert err:", cycErr.message);

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

    if (!skipEmail && customerEmail) {
      sendTransactionalEmailBackground({
        templateName: "transits-activated",
        recipientEmail: customerEmail,
        idempotencyKey: `transits-activated-${syntheticSessionId}`,
        templateData: { name: quizSession.user_name || "", isRenewal: false },
      });
      syncBrevoContactBackground({
        email: customerEmail,
        eventType: "transits_subscribed",
        name: quizSession.user_name || undefined,
        attributes: {
          HAS_TRANSITS: true,
          TRANSITS_STATUS: "active",
          TRANSITS_PERIOD_END: periodEnd.toISOString(),
          TRANSITS_SOURCE: "subscription",
          TRANSITS_IS_RENEWAL: false,
        },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      subscriptionId,
      profileId,
      quizSessionId,
      entitlementId: entitlement.id,
      cycleId,
      skipEmail,
      customerEmail,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-recover-sub] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
