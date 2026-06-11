import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { capturePaypalOrder, getPaypalOrder, opaqueIdToPaypal, PAYPAL_ENV } from "../_shared/paypal.ts";
import { reconcilePaidStripeSession } from "../_shared/stripe-reconcile.ts";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

const hasCheckoutSessionId = (value: unknown): value is string =>
  typeof value === "string" && (/^cs_(test|live)_/.test(value) || value.startsWith("pp_"));

const isPaypalOpaque = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("pp_");

const getStripeSecret = (sessionId?: string) =>
  sessionId?.startsWith("cs_test_")
    ? Deno.env.get("STRIPE_SECRET_KEY_TEST") || Deno.env.get("STRIPE_SECRET_KEY") || ""
    : Deno.env.get("STRIPE_SECRET_KEY") || "";

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

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
  const local = Number.isFinite(hours) ? new Date(date.getTime() + hours * 60 * 60 * 1000) : date;
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
  return toDateOnly(next);
};

const getPaymentCompletedAt = async (stripe: Stripe, session: Stripe.Checkout.Session) => {
  const fallbackSeconds = session.created;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) return new Date(fallbackSeconds * 1000);

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
    const latestCharge = paymentIntent.latest_charge;
    const chargeCreated = typeof latestCharge === "object" && latestCharge?.created ? latestCharge.created : null;
    return new Date((chargeCreated || paymentIntent.created || fallbackSeconds) * 1000);
  } catch (error) {
    console.error("payment intent timestamp lookup error:", error instanceof Error ? error.message : String(error));
    return new Date(fallbackSeconds * 1000);
  }
};

const invokeBackground = (functionName: string, body: Record<string, unknown>) => {
  if (!ADMIN_SECRET) {
    console.warn(`[sync-checkout-session] cannot invoke ${functionName}: ADMIN_SECRET not set`);
    return;
  }
  console.log(`[sync-checkout-session] invoking ${functionName} with body:`, JSON.stringify(body));
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
          console.error(`[sync-checkout-session] ${functionName} responded ${response.status}: ${text.slice(0, 500)}`);
        } else {
          console.log(`[sync-checkout-session] ${functionName} accepted: ${text.slice(0, 300)}`);
        }
      } catch (error) {
        console.error(
          `[sync-checkout-session] ${functionName} background invoke error:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    })(),
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const providedSessionId = hasCheckoutSessionId(body.sessionId) ? body.sessionId : "";
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const isAdminRequest = Boolean(ADMIN_SECRET && req.headers.get("x-admin-secret") === ADMIN_SECRET);

    if (!token && !isAdminRequest) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const profileQuery = supabaseAdmin.from("profiles").select("id, user_id, email, quiz_session_id, stripe_session_id");
    const { data: profile, error: profileError } = isAdminRequest
      ? await profileQuery.eq("email", String(body.email || "").toLowerCase()).maybeSingle()
      : await (async () => {
          const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
          if (authError || !authData.user) return { data: null, error: authError || new Error("Invalid session") };
          return profileQuery.eq("user_id", authData.user.id).maybeSingle();
        })();

    if (profileError || !profile?.id || !profile.email) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Background sweep: reclaim any paid-but-unclaimed transits checkouts
    // (transits_addon or transits_subscription) for this profile's email.
    // The webhook may have failed to attach a profile at the time of payment
    // (race with the /activate signup flow, or no customer_email on the
    // session). reconcilePaidStripeSession is idempotent so this is safe.
    EdgeRuntime.waitUntil((async () => {
      try {
        const { data: orphans } = await supabaseAdmin
          .from("checkout_sessions")
          .select("stripe_session_id, purchase_type, payment_provider")
          .ilike("customer_email", profile.email!)
          .eq("payment_status", "paid")
          .is("claimed_profile_id", null)
          .in("purchase_type", ["transits_addon", "transits_subscription"]);
        if (!orphans?.length) return;
        for (const orphan of orphans) {
          if (orphan.payment_provider !== "stripe") continue;
          const sessionId = orphan.stripe_session_id;
          if (!sessionId || !/^cs_(test|live)_/.test(sessionId)) continue;
          try {
            const stripeForOrphan = new Stripe(getStripeSecret(sessionId), {
              apiVersion: "2025-08-27.basil",
            });
            const session = await stripeForOrphan.checkout.sessions.retrieve(sessionId);
            const result = await reconcilePaidStripeSession(stripeForOrphan, session);
            console.log(
              `[sync-checkout-session] orphan reclaim ${sessionId}: ${JSON.stringify(result)}`,
            );
          } catch (e) {
            console.error(
              `[sync-checkout-session] orphan reclaim failed for ${sessionId}:`,
              e instanceof Error ? e.message : String(e),
            );
          }
        }
      } catch (e) {
        console.error(
          "[sync-checkout-session] orphan sweep error:",
          e instanceof Error ? e.message : String(e),
        );
      }
    })());

    // Unified checkout descriptor (works for both Stripe and PayPal).
    interface UnifiedCheckout {
      id: string;
      paymentStatus: string;
      paymentCompletedAt: Date;
      customerEmail: string;
      quizSessionId: string;
      purchaseType: string;
      includesTransits: boolean;
      transitMonths: number;
      productCode: string;
      paymentProvider: "stripe" | "paypal";
      providerPaymentId: string | null;
      amountTotal: number | null; // cents
      currency: string;
      providerMetadata: Record<string, unknown>;
      // True when capture-paypal-order or a previous sync already wrote the
      // authoritative timestamp; we MUST NOT overwrite in that case.
      paymentCompletedAtFromRow: boolean;
    }

    let checkout: UnifiedCheckout | null = null;

    // ---- PAYPAL BRANCH ----
    const paypalIdHint = isPaypalOpaque(providedSessionId)
      ? providedSessionId
      : isPaypalOpaque(profile.stripe_session_id)
        ? profile.stripe_session_id
        : null;

    if (paypalIdHint) {
      const { data: row } = await supabaseAdmin
        .from("checkout_sessions")
        .select(
          "stripe_session_id, quiz_session_id, purchase_type, product_code, includes_transits, transit_months, customer_email, payment_status, payment_completed_at, payment_provider, provider_payment_id, amount_total, currency, provider_metadata",
        )
        .eq("stripe_session_id", paypalIdHint)
        .maybeSingle();

      const checkoutSelectCols =
        "stripe_session_id, quiz_session_id, purchase_type, product_code, includes_transits, transit_months, customer_email, payment_status, payment_completed_at, payment_provider, provider_payment_id, amount_total, currency, provider_metadata";

      // Helper: search for any paid PayPal checkout sharing the same
      // quiz_session_id. Covers the "double PayPal order" scenario where
      // PayPal redirects with the token of the unpaid sibling while the
      // actual payment was captured via webhook on a different order.
      const findPaidSiblingByQuizSession = async (quizSessionId: string | null) => {
        if (!quizSessionId) return null;
        const { data: sibling } = await supabaseAdmin
          .from("checkout_sessions")
          .select(checkoutSelectCols)
          .eq("quiz_session_id", quizSessionId)
          .eq("payment_status", "paid")
          .eq("payment_provider", "paypal")
          .order("payment_completed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (sibling?.stripe_session_id) {
          console.log(
            `[sync-checkout-session] found paid sibling ${sibling.stripe_session_id} for quiz_session ${quizSessionId}`,
          );
        }
        return sibling;
      };

      let effectiveRow: any = null;

      if (!row?.stripe_session_id) {
        const siblingRow = await findPaidSiblingByQuizSession(profile.quiz_session_id);
        if (!siblingRow) {
          return new Response(JSON.stringify({ error: "No paid checkout session found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        effectiveRow = siblingRow;
      } else {
        effectiveRow = row;
      }

      // If the row is still open (because the buyer never returned to /success
      // and capture-paypal-order never ran), reconcile against PayPal NOW:
      // try to capture; if already captured, GET the order. Persist all the
      // payment details on the same row so the rest of the flow works.
      if (effectiveRow.payment_status !== "paid") {
        try {
          const paypalOrderId = opaqueIdToPaypal(effectiveRow.stripe_session_id);
          let order;
          try {
            order = await capturePaypalOrder(paypalOrderId);
          } catch (e) {
            console.warn("[sync-checkout-session] capture failed, falling back to GET:", e instanceof Error ? e.message : String(e));
            order = await getPaypalOrder(paypalOrderId);
          }
          const purchaseUnit = order.purchase_units?.[0];
          const capture = purchaseUnit?.payments?.captures?.[0];
          const status = capture?.status || order.status || "";
          if (status === "COMPLETED" || order.status === "COMPLETED") {
            const customId = purchaseUnit?.custom_id || "";
            const [quizSessionIdFromCustom, purchaseTypeRaw] = customId.split("|");
            const purchaseType = purchaseTypeRaw === "premium" ? "premium" : (effectiveRow.purchase_type || "base");
            const completedAt = capture?.create_time
              ? new Date(capture.create_time).toISOString()
              : new Date().toISOString();
            const captureAmountStr =
              (capture as any)?.amount?.value ||
              purchaseUnit?.amount?.value ||
              (purchaseType === "premium" ? "29.00" : "19.00");
            const captureCurrency =
              (capture as any)?.amount?.currency_code ||
              purchaseUnit?.amount?.currency_code ||
              "EUR";
            const amountCents = Math.round(parseFloat(captureAmountStr) * 100);
            const payer = order.payer || {};
            const payerName = [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(" ").trim() || null;
            const payerId = (payer as any)?.payer_id || null;
            const payerEmail = payer.email_address || (order as any)?.payment_source?.paypal?.email_address || null;

            const reconciledMetadata = {
              ...(effectiveRow.provider_metadata || {}),
              environment: PAYPAL_ENV,
              paypal_order_id: order.id,
              capture_id: capture?.id || null,
              capture_status: capture?.status || order.status,
              capture_create_time: capture?.create_time || null,
              payer_email: payerEmail,
              payer_name: payerName,
              payer_id: payerId,
              stage: "captured_via_sync",
              reconciled_at: new Date().toISOString(),
            };

            const reconcilePayload: Record<string, unknown> = {
              stripe_session_id: effectiveRow.stripe_session_id,
              quiz_session_id: effectiveRow.quiz_session_id || quizSessionIdFromCustom || null,
              purchase_type: purchaseType,
              product_code:
                effectiveRow.product_code ||
                (purchaseType === "premium" ? "natal_report_plus_transits" : "natal_report_base"),
              includes_transits: purchaseType === "premium",
              transit_months: purchaseType === "premium" ? 1 : 0,
              customer_email: payerEmail || effectiveRow.customer_email || null,
              payment_status: "paid",
              payment_completed_at: completedAt,
              payment_provider: "paypal",
              provider_payment_id: capture?.id || order.id,
              amount_total: amountCents,
              currency: captureCurrency,
              provider_metadata: reconciledMetadata,
            };

            await supabaseAdmin
              .from("checkout_sessions")
              .upsert(reconcilePayload, { onConflict: "stripe_session_id" });

            // Re-read after reconciliation.
            const { data: refreshed } = await supabaseAdmin
              .from("checkout_sessions")
              .select(checkoutSelectCols)
              .eq("stripe_session_id", effectiveRow.stripe_session_id)
              .maybeSingle();
            if (refreshed) effectiveRow = refreshed;
          }
        } catch (e) {
          console.error("[sync-checkout-session] PayPal reconciliation failed:", e instanceof Error ? e.message : String(e));
        }
      }

      // If still not paid after direct reconciliation, search for a paid
      // sibling checkout with the same quiz_session_id. This is the main fix
      // for the "double PayPal order" bug: PayPal redirected with the token
      // of an uncaptured order, but a sibling order was already paid via
      // webhook.
      if (effectiveRow.payment_status !== "paid") {
        const siblingQuizId = effectiveRow.quiz_session_id || profile.quiz_session_id;
        const paidSibling = await findPaidSiblingByQuizSession(siblingQuizId);
        if (paidSibling) {
          effectiveRow = paidSibling;
        }
      }

      if (effectiveRow.payment_status !== "paid") {
        return new Response(JSON.stringify({ error: "Payment not completed" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const purchaseType = effectiveRow.purchase_type || "base";
      const includesTransits = Boolean(effectiveRow.includes_transits) || purchaseType === "premium";
      const hasCompletedAt = Boolean(effectiveRow.payment_completed_at);
      checkout = {
        id: effectiveRow.stripe_session_id,
        paymentStatus: effectiveRow.payment_status,
        paymentCompletedAt: hasCompletedAt ? new Date(effectiveRow.payment_completed_at!) : new Date(),
        customerEmail: effectiveRow.customer_email || profile.email!,
        quizSessionId: effectiveRow.quiz_session_id || "",
        purchaseType,
        includesTransits,
        transitMonths: includesTransits ? Math.max(1, Number(effectiveRow.transit_months || 1)) : 0,
        productCode: effectiveRow.product_code || (includesTransits ? "natal_report_plus_transits" : "natal_report_base"),
        paymentProvider: "paypal",
        providerPaymentId: effectiveRow.provider_payment_id || null,
        amountTotal: typeof effectiveRow.amount_total === "number" ? effectiveRow.amount_total : null,
        currency: effectiveRow.currency || "EUR",
        providerMetadata: (effectiveRow.provider_metadata as Record<string, unknown>) || {},
        paymentCompletedAtFromRow: hasCompletedAt,
      };
    } else {
      // ---- STRIPE BRANCH ----
      const stripe = new Stripe(getStripeSecret(providedSessionId), { apiVersion: "2025-08-27.basil" });
      let session: Stripe.Checkout.Session | null = null;

      if (providedSessionId) {
        session = await stripe.checkout.sessions.retrieve(providedSessionId);
      } else if (hasCheckoutSessionId(profile.stripe_session_id)) {
        session = await stripe.checkout.sessions.retrieve(profile.stripe_session_id);
      } else {
        const sessions = await stripe.checkout.sessions.list({ limit: 100 });
        session =
          sessions.data.find((candidate) => {
            const email = (candidate.customer_details?.email || candidate.customer_email || "").toLowerCase();
            return (
              email === profile.email!.toLowerCase() &&
              candidate.payment_status === "paid" &&
              Boolean(candidate.metadata?.quiz_session_id)
            );
          }) || null;
      }

      if (!session?.id) {
        return new Response(JSON.stringify({ error: "No paid checkout session found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (session.payment_status !== "paid") {
        await supabaseAdmin.from("checkout_sessions").upsert(
          {
            stripe_session_id: session.id,
            quiz_session_id: session.metadata?.quiz_session_id,
            purchase_type: session.metadata?.purchase_type || "base",
            customer_email: session.customer_details?.email || session.customer_email || profile.email,
            payment_status: session.payment_status || "open",
            payment_provider: "stripe",
          },
          { onConflict: "stripe_session_id" },
        );
        return new Response(JSON.stringify({ error: "Payment not completed" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const purchaseType = session.metadata?.purchase_type || "base";
      const quizSessionId = session.metadata?.quiz_session_id || session.metadata?.synastry_session_id || "";
      if (!quizSessionId) throw new Error("Checkout session is missing session_id metadata");
      const includesTransits = purchaseType === "premium" || session.metadata?.includes_transits === "true";
      const transitMonths = Math.max(1, Number(session.metadata?.transit_months || 1));
      const productCode =
        session.metadata?.product_code ||
        (includesTransits ? "natal_report_plus_transits" : "natal_report_base");
      const paymentCompletedAt = await getPaymentCompletedAt(stripe, session);
      const customerEmail = session.customer_details?.email || session.customer_email || profile.email!;

      const stripePaymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

      checkout = {
        id: session.id,
        paymentStatus: session.payment_status,
        paymentCompletedAt,
        customerEmail,
        quizSessionId,
        purchaseType,
        includesTransits,
        transitMonths: includesTransits ? transitMonths : 0,
        productCode,
        paymentProvider: "stripe",
        providerPaymentId: stripePaymentIntentId,
        amountTotal: typeof session.amount_total === "number" ? session.amount_total : null,
        currency: (session.currency || "eur").toUpperCase(),
        providerMetadata: {
          stripe_mode: session.mode,
          stripe_customer: typeof session.customer === "string" ? session.customer : session.customer?.id || null,
          payment_method_types: session.payment_method_types || [],
          stage: "captured",
        },
        paymentCompletedAtFromRow: false,
      };
    }

    if (!checkout) {
      return new Response(JSON.stringify({ error: "Could not resolve checkout session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- SYNASTRY EARLY RETURN ----
    // Synastry checkouts don't use quiz_sessions, user_reports, user_entitlements,
    // or transit_cycles. We claim the checkout and trigger report generation, then return.
    const isSynastryCheckout = checkout.purchaseType === "synastry" || checkout.purchaseType === "synastry_launch";
    if (isSynastryCheckout) {
      // Read synastry_session_id from the checkout_sessions row.
      const { data: checkoutRow } = await supabaseAdmin
        .from("checkout_sessions")
        .select("synastry_session_id")
        .eq("stripe_session_id", checkout.id)
        .maybeSingle();
      const synastrySessionId = checkoutRow?.synastry_session_id || "";

      // Claim the checkout for this profile.
      await supabaseAdmin.from("checkout_sessions").update({
        claimed_profile_id: profile.id,
        claimed_at: new Date().toISOString(),
        customer_email: checkout.customerEmail || profile.email,
      }).eq("stripe_session_id", checkout.id);

      // Link profile to synastry session.
      await supabaseAdmin.from("profiles").update({
        stripe_session_id: checkout.id,
      }).eq("id", profile.id);

      // Check if report is ready.
      let reportReady = false;
      if (synastrySessionId) {
        const { data: synSession } = await supabaseAdmin
          .from("synastry_sessions")
          .select("full_report")
          .eq("id", synastrySessionId)
          .maybeSingle();
        reportReady = Boolean(synSession?.full_report);

        if (!reportReady) {
          invokeBackground("generate-synastry-report", { synastrySessionId, email: profile.email });
        }
      }

      return new Response(JSON.stringify({
        synced: true,
        stripeSessionId: checkout.id,
        synastrySessionId,
        purchaseType: checkout.purchaseType,
        reportReady,
        isSynastry: true,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- TRANSIT SUBSCRIPTION DELEGATION ----
    // Subscription checkouts are provisioned exclusively by stripe-subscription-webhook.
    // Running the natal+transit provisioning here would create a DUPLICATE transit_cycle
    // (different stripe_session_id => different entitlement => the (entitlement_id,
    // period_start, period_end) unique key cannot dedupe) and pollute the natal rows.
    // We still claim the checkout so the orphan sweep doesn't reprocess it.
    const isTransitsSubscription =
      checkout.purchaseType === "transits_subscription" ||
      checkout.providerMetadata?.stripe_mode === "subscription";
    if (isTransitsSubscription) {
      await supabaseAdmin.from("checkout_sessions").update({
        claimed_profile_id: profile.id,
        claimed_at: new Date().toISOString(),
        customer_email: checkout.customerEmail || profile.email,
      }).eq("stripe_session_id", checkout.id);
      return new Response(JSON.stringify({
        synced: true,
        stripeSessionId: checkout.id,
        purchaseType: checkout.purchaseType,
        delegatedToSubscriptionWebhook: true,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { quizSessionId, purchaseType, includesTransits, transitMonths, productCode, customerEmail, paymentCompletedAt } = checkout;
    if (!quizSessionId) throw new Error("Checkout session is missing quiz_session_id");

    const { data: quizSession, error: quizError } = await supabaseAdmin
      .from("quiz_sessions")
      .select("id, user_name, birth_place, birth_timezone, full_report, processing_status")
      .eq("id", quizSessionId)
      .maybeSingle();

    if (quizError || !quizSession?.id) throw new Error("Quiz session not found for checkout");

    const label = [quizSession.user_name, quizSession.birth_place].filter(Boolean).join(" · ") || "Lettura personale";

    const upsertPayload: Record<string, unknown> = {
      stripe_session_id: checkout.id,
      quiz_session_id: quizSessionId,
      purchase_type: purchaseType,
      product_code: productCode,
      includes_transits: includesTransits,
      transit_months: includesTransits ? transitMonths : 0,
      customer_email: customerEmail,
      payment_status: checkout.paymentStatus,
      claimed_profile_id: profile.id,
      claimed_at: new Date().toISOString(),
      payment_provider: checkout.paymentProvider,
      provider_payment_id: checkout.providerPaymentId,
      currency: checkout.currency,
      provider_metadata: checkout.providerMetadata,
    };

    // Only set amount_total if we resolved one (avoid clobbering with NULL).
    if (typeof checkout.amountTotal === "number") {
      upsertPayload.amount_total = checkout.amountTotal;
    }

    // Never overwrite the authoritative PayPal capture timestamp.
    if (!checkout.paymentCompletedAtFromRow) {
      upsertPayload.payment_completed_at = paymentCompletedAt.toISOString();
    }

    await supabaseAdmin.from("checkout_sessions").upsert(upsertPayload, { onConflict: "stripe_session_id" });

    await supabaseAdmin.from("profiles").update({
      stripe_session_id: checkout.id,
      quiz_session_id: quizSessionId,
    }).eq("id", profile.id);

    await supabaseAdmin.from("user_reports").upsert(
      {
        profile_id: profile.id,
        quiz_session_id: quizSessionId,
        stripe_session_id: checkout.id,
        purchase_type: purchaseType,
        label,
        is_active: true,
      },
      { onConflict: "profile_id,quiz_session_id" },
    );

    const now = paymentCompletedAt;
    const source = purchaseType === "premium" ? "premium_purchase" : "base_purchase";
    await supabaseAdmin.from("user_entitlements").upsert(
      {
        profile_id: profile.id,
        quiz_session_id: quizSessionId,
        stripe_session_id: checkout.id,
        entitlement_type: "natal_report",
        status: "active",
        starts_at: now.toISOString(),
        ends_at: null,
        source,
      },
      { onConflict: "profile_id,stripe_session_id,entitlement_type" },
    );

    let transitCycleId: string | null = null;

    if (includesTransits) {
      const periodStart = now;
      const periodEnd = addMonths(now, transitMonths);
      const purchaseLocalDateTime = formatLocalDateTime(paymentCompletedAt, quizSession.birth_timezone);
      const purchaseTimezone = formatTimezoneOffset(quizSession.birth_timezone);
      const { data: transitEntitlement, error: entitlementError } = await supabaseAdmin
        .from("user_entitlements")
        .upsert(
          {
            profile_id: profile.id,
            quiz_session_id: quizSessionId,
            stripe_session_id: checkout.id,
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
              profile_id: profile.id,
              quiz_session_id: quizSessionId,
              entitlement_id: transitEntitlement.id,
              stripe_session_id: checkout.id,
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
            "[sync-checkout-session] transit_cycles upsert error:",
            transitCycleError.message,
          );
        }
        transitCycleId = transitCycle?.id || null;
        // Fallback: if upsert returned no row (rare driver edge case), look it up.
        if (!transitCycleId) {
          const { data: existingCycle, error: lookupError } = await supabaseAdmin
            .from("transit_cycles")
            .select("id")
            .eq("entitlement_id", transitEntitlement.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (lookupError) {
            console.error(
              "[sync-checkout-session] transit_cycles lookup fallback error:",
              lookupError.message,
            );
          }
          transitCycleId = existingCycle?.id || null;
        }
      } else if (entitlementError) {
        console.error("monthly_transits entitlement error:", entitlementError.message);
      }
    }

    if (includesTransits && !transitCycleId) {
      console.warn(
        `[sync-checkout-session] WARNING: includesTransits=true but no transit_cycle was created/found for checkout=${checkout.id}`,
      );
    }

    invokeBackground("generate-report", { quizSessionId, email: profile.email });
    if (transitCycleId) invokeBackground("process-transit-cycle", { transitCycleId });

    return new Response(JSON.stringify({
      synced: true,
      stripeSessionId: checkout.id,
      quizSessionId,
      purchaseType,
      transitCycleId,
      reportReady: Boolean(quizSession.full_report),
      processingStatus: quizSession.processing_status,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("sync-checkout-session error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});