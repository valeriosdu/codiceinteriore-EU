// admin-backfill-brevo: one-shot backfill of existing users to Brevo.
// Reads profiles (signup) + paid checkout_sessions (purchase) + active
// transit_subscriptions (transits_subscribed), dedupes by lowercased email,
// merges attributes and calls sync-brevo-contact once per address with the
// strongest eventType available for that user.
//
// Auth: x-admin-secret header OR service-role bearer token.
// Body: { dryRun?: boolean (default true), limit?: number (default 0 = all),
//         throttleMs?: number (default 200) }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

type EventType = "signup" | "purchase" | "transits_subscribed";

interface ContactPlan {
  email: string;
  name?: string;
  eventType: EventType;
  attributes: Record<string, unknown>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const e = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const adminSecretHeader = req.headers.get("x-admin-secret") || "";

    const isAdminSecret = Boolean(ADMIN_SECRET && adminSecretHeader === ADMIN_SECRET);
    const isServiceRole =
      Boolean(SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY);
    if (!isAdminSecret && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false; // default TRUE
    const limit = Math.max(0, Number(body.limit) || 0);
    const offset = Math.max(0, Number(body.offset) || 0);
    const throttleMs = Math.min(Math.max(Number(body.throttleMs) || 200, 0), 5000);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. profiles → signup baseline (with name from quiz_sessions if any).
    const { data: profiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("id, email, quiz_session_id, created_at");
    if (profilesErr) throw new Error(`profiles: ${profilesErr.message}`);

    const quizIds = Array.from(
      new Set((profiles || []).map((p) => p.quiz_session_id).filter(Boolean) as string[]),
    );
    const quizNameById = new Map<string, string>();
    const quizDataById = new Map<string, Record<string, unknown>>();
    if (quizIds.length > 0) {
      const CHUNK = 100;
      for (let i = 0; i < quizIds.length; i += CHUNK) {
        const slice = quizIds.slice(i, i + CHUNK);
        const { data: quizRows, error: quizErr } = await supabase
          .from("quiz_sessions")
          .select("id, user_name, birth_date, birth_time, birth_place, birth_lat, birth_lng, birth_timezone, focus_area, attachment_response, processing_status, created_at")
          .in("id", slice);
        if (quizErr) throw new Error(`quiz_sessions: ${quizErr.message}`);
        for (const q of quizRows || []) {
          if (q.user_name && q.user_name.trim()) quizNameById.set(q.id, q.user_name.trim());
          const bd: any = q.birth_date || {};
          const bt: any = q.birth_time || {};
          const birthDateStr = bd && bd.year ? `${bd.year}-${String(bd.month||"").padStart(2,"0")}-${String(bd.day||"").padStart(2,"0")}` : null;
          const birthTimeStr = bt && (bt.hour !== undefined) ? `${String(bt.hour).padStart(2,"0")}:${String(bt.minute||0).padStart(2,"0")}` : null;
          quizDataById.set(q.id, {
            BIRTH_DATE: birthDateStr,
            BIRTH_TIME: birthTimeStr,
            BIRTH_PLACE: q.birth_place || null,
            BIRTH_LAT: q.birth_lat,
            BIRTH_LNG: q.birth_lng,
            BIRTH_TZ: q.birth_timezone,
            FOCUS_AREA: q.focus_area || null,
            ATTACHMENT_RESPONSE: q.attachment_response || null,
            QUIZ_STATUS: q.processing_status || null,
            QUIZ_CREATED_AT: q.created_at,
          });
        }
      }
    }

    // 2. paid checkout_sessions → purchase.
    const { data: paid, error: paidErr } = await supabase
      .from("checkout_sessions")
      .select(
        "customer_email, payment_completed_at, product_code, amount_total, currency, includes_transits, quiz_session_id, synastry_session_id, purchase_type",
      )
      .eq("payment_status", "paid")
      .not("customer_email", "is", null);
    if (paidErr) throw new Error(`checkout_sessions: ${paidErr.message}`);

    // 3. active transits → transits_subscribed.
    //    Covers both recurring subscriptions AND one-time entitlements
    //    (premium purchase / transits addon) that haven't expired yet.
    const { data: subs, error: subsErr } = await supabase
      .from("transit_subscriptions")
      .select("profile_id, status, current_period_end, cancel_at_period_end")
      .in("status", ["active", "trialing"]);
    if (subsErr) throw new Error(`transit_subscriptions: ${subsErr.message}`);

    const nowIso = new Date().toISOString();
    const { data: ents, error: entsErr } = await supabase
      .from("user_entitlements")
      .select("profile_id, ends_at, source")
      .eq("entitlement_type", "monthly_transits")
      .eq("status", "active")
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`);
    if (entsErr) throw new Error(`user_entitlements: ${entsErr.message}`);

    // Build email → ContactPlan map, applying signup → purchase → transits in order.
    const plans = new Map<string, ContactPlan>();

    // signup
    for (const p of profiles || []) {
      const email = normalizeEmail(p.email);
      if (!email) continue;
      const name = p.quiz_session_id ? quizNameById.get(p.quiz_session_id) : undefined;
      const quizAttrs = p.quiz_session_id ? (quizDataById.get(p.quiz_session_id) || {}) : {};
      plans.set(email, {
        email,
        name,
        eventType: "signup",
        attributes: { SIGNUP_AT: p.created_at, ...quizAttrs },
      });
    }

    // purchase (keep latest paid checkout per email) + aggregate totals
    const latestPaid = new Map<string, NonNullable<typeof paid>[number]>();
    const purchaseAgg = new Map<string, { count: number; total: number; currency: string; hasSynastry: boolean }>();
    for (const row of paid || []) {
      const email = normalizeEmail(row.customer_email);
      if (!email) continue;
      const prev = latestPaid.get(email);
      const a = row.payment_completed_at ? Date.parse(row.payment_completed_at) : 0;
      const b = prev?.payment_completed_at ? Date.parse(prev.payment_completed_at) : -1;
      if (a > b) latestPaid.set(email, row);
      const agg = purchaseAgg.get(email) || { count: 0, total: 0, currency: row.currency || "EUR", hasSynastry: false };
      agg.count += 1;
      agg.total += Number(row.amount_total) || 0;
      const isSynastry =
        Boolean(row.synastry_session_id) ||
        (typeof row.product_code === "string" && row.product_code.startsWith("synastry_")) ||
        (typeof row.purchase_type === "string" && row.purchase_type.toLowerCase().includes("synastry"));
      if (isSynastry) agg.hasSynastry = true;
      purchaseAgg.set(email, agg);
    }
    for (const [email, row] of latestPaid) {
      const existing = plans.get(email);
      let name = existing?.name;
      if (!name && row.quiz_session_id) name = quizNameById.get(row.quiz_session_id);
      const quizAttrs = row.quiz_session_id ? (quizDataById.get(row.quiz_session_id) || {}) : {};
      const agg = purchaseAgg.get(email);
      plans.set(email, {
        email,
        name,
        eventType: "purchase",
        attributes: {
          ...(existing?.attributes || {}),
          ...quizAttrs,
          PURCHASED: true,
          PURCHASE_DATE: row.payment_completed_at,
          PRODUCT_CODE: row.product_code,
          LAST_AMOUNT: row.amount_total,
          LAST_CURRENCY: row.currency,
          INCLUDES_TRANSITS: Boolean(row.includes_transits),
          PURCHASE_COUNT: agg?.count || 1,
          TOTAL_SPENT: agg?.total || row.amount_total,
          HAS_SYNASTRY: agg?.hasSynastry || false,
        },
      });
    }

    // transits — need email via profile_id.
    const profileIdToEmail = new Map<string, string>();
    for (const p of profiles || []) {
      const email = normalizeEmail(p.email);
      if (email) profileIdToEmail.set(p.id, email);
    }
    for (const s of subs || []) {
      const email = profileIdToEmail.get(s.profile_id);
      if (!email) continue;
      const existing = plans.get(email);
      plans.set(email, {
        email,
        name: existing?.name,
        eventType: "transits_subscribed",
        attributes: {
          ...(existing?.attributes || {}),
          HAS_TRANSITS: true,
          TRANSITS_STATUS: s.status,
          TRANSITS_PERIOD_END: s.current_period_end,
          TRANSITS_CANCEL_AT_PERIOD_END: Boolean(s.cancel_at_period_end),
        },
      });
    }

    // One-time monthly_transits entitlements (premium purchase / addon).
    // Promote to transits_subscribed if not already covered by a subscription.
    for (const e of ents || []) {
      const email = profileIdToEmail.get(e.profile_id);
      if (!email) continue;
      const existing = plans.get(email);
      const alreadySub = existing?.eventType === "transits_subscribed";
      plans.set(email, {
        email,
        name: existing?.name,
        eventType: "transits_subscribed",
        attributes: {
          ...(existing?.attributes || {}),
          HAS_TRANSITS: true,
          // Don't clobber TRANSITS_STATUS if a real subscription already set it.
          ...(alreadySub ? {} : { TRANSITS_STATUS: "active", TRANSITS_SOURCE: e.source }),
          ...(alreadySub ? {} : { TRANSITS_PERIOD_END: e.ends_at }),
        },
      });
    }
    let allPlans = Array.from(plans.values());
    allPlans.sort((a, b) => a.email.localeCompare(b.email));
    if (offset > 0) allPlans = allPlans.slice(offset);
    if (limit > 0) allPlans = allPlans.slice(0, limit);

    const summary = {
      dryRun,
      throttleMs,
      totals: {
        profiles: profiles?.length || 0,
        paidCheckouts: paid?.length || 0,
        activeTransits: subs?.length || 0,
        activeTransitEntitlements: ents?.length || 0,
        uniqueEmails: plans.size,
        toProcess: allPlans.length,
      },
      byEvent: { signup: 0, purchase: 0, transits_subscribed: 0 },
      results: { sent: 0, failed: 0 },
      failures: [] as { email: string; error: string }[],
    };

    for (const plan of allPlans) {
      summary.byEvent[plan.eventType]++;
    }

    if (dryRun) {
      return new Response(JSON.stringify(summary), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";
    const BREVO_LIST_ID_RAW = Deno.env.get("BREVO_LIST_ID") || "";
    const listIds: number[] = [];
    if (BREVO_LIST_ID_RAW) {
      const id = Number.parseInt(BREVO_LIST_ID_RAW, 10);
      if (Number.isFinite(id) && id > 0) listIds.push(id);
    }
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "BREVO_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    function splitName(name?: string): { FIRSTNAME?: string; LASTNAME?: string } {
      if (!name) return {};
      const t = name.trim();
      if (!t) return {};
      const p = t.split(/\s+/);
      if (p.length === 1) return { FIRSTNAME: p[0] };
      return { FIRSTNAME: p[0], LASTNAME: p.slice(1).join(" ") };
    }

    for (const plan of allPlans) {
      const attributes: Record<string, unknown> = {
        ...splitName(plan.name),
        ...plan.attributes,
        LAST_EVENT: plan.eventType,
        LAST_EVENT_AT: new Date().toISOString(),
      };
      const brevoBody: Record<string, unknown> = {
        email: plan.email,
        attributes,
        updateEnabled: true,
      };
      if (listIds.length > 0) brevoBody.listIds = listIds;

      let status: "success" | "failed" = "success";
      let errorMessage: string | null = null;
      let brevoContactId: number | null = null;

      try {
        const res = await fetch("https://api.brevo.com/v3/contacts", {
          method: "POST",
          headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(brevoBody),
        });
        const text = await res.text().catch(() => "");
        let parsed: any = null;
        try { parsed = text ? JSON.parse(text) : null; } catch { /* ignore */ }
        if (!res.ok) {
          status = "failed";
          errorMessage = `Brevo ${res.status}: ${text.slice(0, 300)}`;
          summary.results.failed++;
          summary.failures.push({ email: plan.email, error: errorMessage });
        } else {
          if (parsed && typeof parsed.id === "number") brevoContactId = parsed.id;
          summary.results.sent++;
        }
      } catch (err) {
        status = "failed";
        errorMessage = err instanceof Error ? err.message : String(err);
        summary.results.failed++;
        summary.failures.push({ email: plan.email, error: errorMessage });
      }

      // Log async, don't await
      supabase.from("brevo_sync_log").insert({
        email: plan.email,
        event_type: plan.eventType,
        status,
        brevo_contact_id: brevoContactId,
        error_message: errorMessage,
        payload: brevoBody,
      }).then(() => undefined);

      if (throttleMs > 0) await sleep(throttleMs);
    }

    // Cap failures payload so the response stays readable.
    if (summary.failures.length > 50) {
      summary.failures = summary.failures.slice(0, 50);
    }

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-backfill-brevo] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
