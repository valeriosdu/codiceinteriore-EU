// Recupera un checkout pagato che non è mai stato "claimed" da un utente registrato.
// 1. Crea (o trova) un utente Supabase Auth con la mail del checkout.
// 2. Esegue lo stesso "claim" di sync-checkout-session: crea profilo (via trigger),
//    user_reports, user_entitlements, transit_cycles.
// 3. Invoca generate-report e (se bundle) process-transit-cycle.
// 4. Opzionalmente reinvia l'email di "report-claim" / invito Supabase.
//
// Auth: gated da ADMIN_SECRET (header x-admin-secret).
//
// Body atteso:
//   { stripeSessionId: string, sendInvite?: boolean }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendTransactionalEmailBackground } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://codiceinteriore.it";

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);
const pad = (n: number) => String(n).padStart(2, "0");

const formatTimezoneOffset = (offsetHours: unknown) => {
  const hours = Number(offsetHours);
  if (!Number.isFinite(hours)) return "AUTO";
  const sign = hours >= 0 ? "+" : "-";
  const absolute = Math.abs(hours);
  const wholeHours = Math.floor(absolute);
  const minutes = Math.round((absolute - wholeHours) * 60);
  return `${sign}${pad(wholeHours)}:${pad(minutes)}`;
};

const formatLocalDateTime = (date: Date, offsetHours: unknown) => {
  const hours = Number(offsetHours);
  const local = Number.isFinite(hours)
    ? new Date(date.getTime() + hours * 60 * 60 * 1000)
    : date;
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(
    local.getUTCDate(),
  )}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
};

const addMonthsToLocalDateOnly = (localDateTime: string, months: number) => {
  const [datePart, timePart = "00:00"] = localDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0));
  next.setUTCMonth(next.getUTCMonth() + months);
  return toDateOnly(next);
};

async function invokeFn(name: string, body: Record<string, unknown>) {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const txt = await res.text().catch(() => "");
    console.log(
      `[admin-recover-orphan] ${name} -> ${res.status}: ${txt.slice(0, 300)}`,
    );
    return { ok: res.ok, status: res.status, body: txt };
  } catch (e) {
    console.error(`[admin-recover-orphan] ${name} error:`, e);
    return { ok: false, status: 0, body: String(e) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    const authHeader = req.headers.get("Authorization") || "";
    const bearerToken = authHeader.replace("Bearer ", "").trim();

    const isAdminSecret = Boolean(ADMIN_SECRET && adminSecret === ADMIN_SECRET);
    const isServiceRole = Boolean(
      SUPABASE_SERVICE_ROLE_KEY && bearerToken === SUPABASE_SERVICE_ROLE_KEY,
    );

    if (!isAdminSecret && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const stripeSessionId =
      typeof body.stripeSessionId === "string" ? body.stripeSessionId.trim() : "";
    const sendInvite = body.sendInvite !== false; // default true
    const overrideEmail =
      typeof body.overrideEmail === "string" ? body.overrideEmail.trim().toLowerCase() : "";

    if (!stripeSessionId) {
      return new Response(
        JSON.stringify({ error: "stripeSessionId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Carica il checkout
    const { data: checkout, error: checkoutErr } = await admin
      .from("checkout_sessions")
      .select(
        "id, quiz_session_id, customer_email, payment_status, payment_completed_at, includes_transits, transit_months, purchase_type, product_code, claimed_profile_id, stripe_session_id, payment_provider, recovery_invite_count, amount_total, currency",
      )
      .eq("stripe_session_id", stripeSessionId)
      .maybeSingle();

    if (checkoutErr) throw checkoutErr;
    if (!checkout) {
      return new Response(
        JSON.stringify({ error: "checkout_session not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (checkout.payment_status !== "paid") {
      return new Response(
        JSON.stringify({
          error: `checkout_session is not paid (payment_status=${checkout.payment_status})`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const customerEmail = overrideEmail || (checkout.customer_email || "").trim().toLowerCase();
    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: "checkout_session has no customer_email (and no overrideEmail provided)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (overrideEmail) {
      console.log(
        `[admin-recover-orphan] email override: "${checkout.customer_email}" → "${overrideEmail}" for ${stripeSessionId}`,
      );
      await admin
        .from("checkout_sessions")
        .update({ customer_email: overrideEmail })
        .eq("stripe_session_id", stripeSessionId);
    }

    // 2. Carica quiz_session in anticipo: serve il nome per personalizzare
    //    l'invito (user_metadata.name → letto da auth-email-hook).
    const quizSessionId = checkout.quiz_session_id;
    const { data: quizSessionEarly, error: quizEarlyErr } = await admin
      .from("quiz_sessions")
      .select(
        "id, user_name, birth_place, birth_timezone, full_report, processing_status",
      )
      .eq("id", quizSessionId)
      .maybeSingle();
    if (quizEarlyErr) throw quizEarlyErr;
    if (!quizSessionEarly?.id) {
      throw new Error("quiz_session not found for this checkout");
    }
    const inviteName = (quizSessionEarly.user_name || "").trim();

    // 3. Trova o crea utente Auth
    let authUserId: string | null = null;
    {
      // Cerca per email tramite admin.listUsers (paginato)
      let page = 1;
      // limite di sicurezza: 10 pagine x 1000 utenti
      while (page <= 10) {
        const { data, error } = await admin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (error) throw error;
        const found = data.users.find(
          (u) => (u.email || "").toLowerCase() === customerEmail,
        );
        if (found) {
          authUserId = found.id;
          break;
        }
        if (data.users.length < 1000) break;
        page += 1;
      }
    }

    let invited = false;
    if (!authUserId) {
      if (sendInvite) {
        const { data: inviteData, error: inviteErr } =
          await admin.auth.admin.inviteUserByEmail(customerEmail, {
            redirectTo: `${PUBLIC_SITE_URL}/activate?session_id=${encodeURIComponent(
              stripeSessionId,
            )}`,
            data: inviteName ? { name: inviteName } : undefined,
          });
        if (inviteErr) {
          console.error("[admin-recover-orphan] invite error:", inviteErr);
          throw new Error(`invite failed: ${inviteErr.message}`);
        }
        authUserId = inviteData.user?.id || null;
        invited = true;
      } else {
        // Crea un utente "shadow" senza inviare email (l'admin lo gestirà a parte)
        const { data: createData, error: createErr } =
          await admin.auth.admin.createUser({
            email: customerEmail,
            email_confirm: false,
          });
        if (createErr) {
          console.error("[admin-recover-orphan] createUser error:", createErr);
          throw new Error(`createUser failed: ${createErr.message}`);
        }
        authUserId = createData.user?.id || null;
      }
    }

    if (!authUserId) {
      throw new Error("Could not resolve an auth user for this email");
    }

    // 4. Profilo (creato dal trigger handle_new_user; recupera o crea fallback)
    let { data: profile } = await admin
      .from("profiles")
      .select("id, user_id, email")
      .eq("user_id", authUserId)
      .maybeSingle();

    if (!profile) {
      const { data: inserted, error: insertErr } = await admin
        .from("profiles")
        .insert({ user_id: authUserId, email: customerEmail })
        .select("id, user_id, email")
        .single();
      if (insertErr) throw insertErr;
      profile = inserted;
    }

    if (!profile?.id) {
      throw new Error("Could not resolve profile for created user");
    }

    const quizSession = quizSessionEarly;

    const purchaseType = checkout.purchase_type as "base" | "premium";
    const includesTransits = !!checkout.includes_transits;
    const transitMonths = checkout.transit_months || 0;
    const paymentCompletedAt = checkout.payment_completed_at
      ? new Date(checkout.payment_completed_at)
      : new Date();

    const label =
      [quizSession.user_name, quizSession.birth_place].filter(Boolean).join(" · ") ||
      "Lettura personale";

    // 5. Aggiorna checkout_sessions con il profilo (e marca recovery se invitato)
    const checkoutUpdate: Record<string, unknown> = {
      claimed_profile_id: profile.id,
      claimed_at: new Date().toISOString(),
    };
    const currentInviteCount = Number((checkout as any).recovery_invite_count) || 0;
    const newInviteCount = invited ? currentInviteCount + 1 : currentInviteCount;
    if (invited) {
      // Bump recovery_invited_at + invite_count so the orphan cron can
      // schedule a second-round invite at +7d, and stops after 2 attempts.
      checkoutUpdate.recovery_invited_at = new Date().toISOString();
      checkoutUpdate.recovery_invite_count = newInviteCount;
    }
    await admin
      .from("checkout_sessions")
      .update(checkoutUpdate)
      .eq("stripe_session_id", stripeSessionId);

    // Second-round invite still unclaimed → notify admin for manual merge.
    // The customer likely uses a different email than the one Stripe captured.
    if (invited && newInviteCount >= 2) {
      const amountEur =
        typeof (checkout as any).amount_total === "number"
          ? Math.round(((checkout as any).amount_total / 100) * 100) / 100
          : null;
      sendTransactionalEmailBackground({
        templateName: "admin-orphan-alert",
        recipientEmail: customerEmail,
        idempotencyKey: `admin-orphan-alert-${stripeSessionId}`,
        templateData: {
          customerEmail,
          userName: quizSession.user_name || "",
          stripeSessionId,
          productCode: checkout.product_code,
          amountEur,
          paymentCompletedAt: paymentCompletedAt.toISOString(),
          inviteCount: newInviteCount,
        },
      });
      console.log(
        `[admin-recover-orphan] admin alerted: ${stripeSessionId} (email=${customerEmail}, attempts=${newInviteCount})`,
      );
    }

    // 6. Aggiorna profilo con quiz/stripe session correnti
    await admin
      .from("profiles")
      .update({
        stripe_session_id: stripeSessionId,
        quiz_session_id: quizSessionId,
      })
      .eq("id", profile.id);

    // 7. user_reports
    await admin.from("user_reports").upsert(
      {
        profile_id: profile.id,
        quiz_session_id: quizSessionId,
        stripe_session_id: stripeSessionId,
        purchase_type: purchaseType,
        label,
        is_active: true,
      },
      { onConflict: "profile_id,quiz_session_id" },
    );

    // 8. user_entitlements (natal_report)
    const source = purchaseType === "premium" ? "premium_purchase" : "base_purchase";
    await admin.from("user_entitlements").upsert(
      {
        profile_id: profile.id,
        quiz_session_id: quizSessionId,
        stripe_session_id: stripeSessionId,
        entitlement_type: "natal_report",
        status: "active",
        starts_at: paymentCompletedAt.toISOString(),
        ends_at: null,
        source,
      },
      { onConflict: "profile_id,stripe_session_id,entitlement_type" },
    );

    // 9. user_entitlements (monthly_transits) + transit_cycles
    let transitCycleId: string | null = null;
    if (includesTransits) {
      const periodStart = paymentCompletedAt;
      const periodEnd = addMonths(paymentCompletedAt, transitMonths);
      const purchaseLocalDateTime = formatLocalDateTime(
        paymentCompletedAt,
        quizSession.birth_timezone,
      );
      const purchaseTimezone = formatTimezoneOffset(quizSession.birth_timezone);

      const { data: transitEntitlement, error: entErr } = await admin
        .from("user_entitlements")
        .upsert(
          {
            profile_id: profile.id,
            quiz_session_id: quizSessionId,
            stripe_session_id: stripeSessionId,
            entitlement_type: "monthly_transits",
            status: "active",
            starts_at: periodStart.toISOString(),
            ends_at: periodEnd.toISOString(),
            source:
              purchaseType === "premium" ? "premium_purchase" : "transit_renewal",
          },
          { onConflict: "profile_id,stripe_session_id,entitlement_type" },
        )
        .select("id")
        .single();

      if (entErr || !transitEntitlement?.id) {
        console.error(
          "[admin-recover-orphan] monthly_transits entitlement error:",
          entErr?.message,
        );
      } else {
        const { data: cycle, error: cycleErr } = await admin
          .from("transit_cycles")
          .upsert(
            {
              profile_id: profile.id,
              quiz_session_id: quizSessionId,
              entitlement_id: transitEntitlement.id,
              stripe_session_id: stripeSessionId,
              period_start: purchaseLocalDateTime.slice(0, 10),
              period_end: addMonthsToLocalDateOnly(
                purchaseLocalDateTime,
                transitMonths,
              ),
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

        if (cycleErr) {
          console.error(
            "[admin-recover-orphan] transit_cycles upsert error:",
            cycleErr.message,
          );
        }
        transitCycleId = cycle?.id || null;

        if (!transitCycleId) {
          const { data: existingCycle } = await admin
            .from("transit_cycles")
            .select("id")
            .eq("entitlement_id", transitEntitlement.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          transitCycleId = existingCycle?.id || null;
        }
      }
    }

    // 10. Invocazioni: generate-report e process-transit-cycle
    const reportInvoke = await invokeFn("generate-report", {
      quizSessionId,
      email: customerEmail,
    });

    let transitInvoke: any = null;
    if (transitCycleId) {
      transitInvoke = await invokeFn("process-transit-cycle", {
        transitCycleId,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        stripeSessionId,
        quizSessionId,
        profileId: profile.id,
        authUserId,
        invited,
        transitCycleId,
        report_invoke: reportInvoke,
        transit_invoke: transitInvoke,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[admin-recover-orphan-checkout] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
