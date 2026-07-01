import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET")!;

const FUNNEL_EVENTS = [
  "landing_viewed",
  "quiz_started",
  "quiz_completed",
  "paywall_viewed",
  "checkout_started",
  "purchase_completed",
  "report_generation_completed",
  "report_generation_failed",
] as const;

type FunnelEventName = (typeof FUNNEL_EVENTS)[number];

// TODO(multi-market): these reference prices and labels are IT/EUR only. The
// dashboard aggregates checkout_sessions across all markets into a single total
// with no per-market split in scope here, so labels/symbols/currency below stay
// EUR until the dashboard is made market-aware (group rows by market.currency).
const PRODUCT_PRICE_EUR: Record<string, number> = {
  natal_report_base: 19,
  natal_report_plus_transits: 29,
  transits_one_month_addon: 10,
  transits_monthly_subscription: 9.9,
  astrology_guide_pack_10: 7.9,
};

const PRODUCT_LABEL: Record<string, string> = {
  natal_report_base: "Lettura Completa (€19)",
  natal_report_plus_transits: "Lettura + 1 mese transiti (€29)",
  transits_one_month_addon: "Transiti 1 mese (€10)",
  transits_monthly_subscription: "Abbonamento transiti (€9,90/mese)",
  astrology_guide_pack_10: "Pacchetto Guida astrologica (€7,90)",
};

const TRANSIT_SUBSCRIPTION_AMOUNT_CENTS = 990;

// Compute the UTC instant corresponding to a wall-clock moment (YYYY-MM-DD HH:mm:ss)
// in the given IANA timezone. Uses Intl to discover the offset for that local moment.
function zonedWallClockToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  // First guess: treat the wall clock as if it were UTC.
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  // Find what that guess actually represents in the target timezone.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = fmt.formatToParts(new Date(guess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const tzAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second"),
  );
  // Offset = how much the timezone is ahead of UTC at that moment.
  const offset = tzAsUtc - guess;
  return new Date(guess - offset);
}

function parseRange(url: URL): { from: string; to: string; tz: string } {
  const tz = url.searchParams.get("tz") || "Europe/Rome";
  const fromDate = url.searchParams.get("from_date"); // YYYY-MM-DD (timezone-naive)
  const toDate = url.searchParams.get("to_date");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  let from: Date;
  let to: Date;

  if (fromDate && toDate) {
    const [fy, fm, fd] = fromDate.split("-").map(Number);
    const [ty, tm, td] = toDate.split("-").map(Number);
    if (!fy || !fm || !fd || !ty || !tm || !td) {
      throw new Error("Invalid from_date/to_date");
    }
    from = zonedWallClockToUtc(fy, fm, fd, 0, 0, 0, tz);
    to = zonedWallClockToUtc(ty, tm, td, 23, 59, 59, tz);
  } else if (fromParam && toParam) {
    from = new Date(fromParam);
    to = new Date(toParam);
  } else {
    const now = new Date();
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    to = now;
  }

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Invalid from/to date");
  }
  return { from: from.toISOString(), to: to.toISOString(), tz };
}

function pct(numerator: number, denominator: number): number | null {
  if (!denominator || denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10; // one decimal
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret");
    if (!adminSecret || adminSecret !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const { from, to, tz } = parseRange(url);

    // Prior window of the same length, used for vs-previous-period deltas.
    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();
    const periodMs = toMs - fromMs;
    const prevFrom = new Date(fromMs - periodMs).toISOString();
    const prevTo = from;

    // ===== 1. Paid checkouts + funnel events + subscriptions + prior period (parallel) =====
    // transit_subscriptions and transit_cycles are pulled lifetime (no date
    // filter): we need every cycle to identify which is the initial signup
    // (already in checkout_sessions) vs renewals (invisible to checkout_sessions).
    const [paidQ, funnelQ, allSubsQ, allSubCyclesQ, prevPaidQ] = await Promise.all([
      supabase
        .from("checkout_sessions")
        .select(
          "id, customer_email, payment_provider, amount_total, currency, product_code, purchase_type, payment_status, payment_completed_at, provider_payment_id, quiz_session_id, stripe_session_id, created_at",
        )
        .eq("payment_status", "paid")
        .gte("payment_completed_at", from)
        .lte("payment_completed_at", to)
        .order("payment_completed_at", { ascending: false }),
      supabase
        .from("funnel_events")
        .select("event_name, anonymous_id")
        .gte("created_at", from)
        .lte("created_at", to),
      supabase
        .from("transit_subscriptions")
        .select(
          "profile_id, stripe_subscription_id, status, cancel_at_period_end, canceled_at, current_period_start, current_period_end, created_at",
        ),
      supabase
        .from("transit_cycles")
        .select("profile_id, stripe_session_id, created_at")
        .like("stripe_session_id", "sub_%"),
      supabase
        .from("checkout_sessions")
        .select("customer_email, amount_total, payment_completed_at")
        .eq("payment_status", "paid")
        .gte("payment_completed_at", prevFrom)
        .lte("payment_completed_at", prevTo),
    ]);

    if (paidQ.error) throw paidQ.error;
    const rawPaid = paidQ.data || [];
    const funnelRows = funnelQ.data || [];

    // ----- Defensive deduplication -----
    // Some webhooks (Stripe + PayPal) may fire twice. Collapse rows that share
    // the same provider_payment_id, keeping the earliest payment_completed_at.
    // Rows with no provider_payment_id are kept as-is (legacy / pending records).
    const paidByKey = new Map<string, any>();
    const paid: any[] = [];
    for (const row of rawPaid as any[]) {
      const key = row.provider_payment_id ? `pp:${row.provider_payment_id}` : null;
      if (!key) {
        paid.push(row);
        continue;
      }
      const existing = paidByKey.get(key);
      if (!existing) {
        paidByKey.set(key, row);
      } else {
        // Prefer the row with a populated amount_total; otherwise keep earliest.
        const existingHasAmount = typeof existing.amount_total === "number";
        const newHasAmount = typeof row.amount_total === "number";
        if (newHasAmount && !existingHasAmount) {
          paidByKey.set(key, row);
        }
      }
    }
    for (const v of paidByKey.values()) paid.push(v);
    // Re-sort by completed_at desc to keep recent_orders chronological.
    paid.sort((a, b) => {
      const ad = a.payment_completed_at ? new Date(a.payment_completed_at).getTime() : 0;
      const bd = b.payment_completed_at ? new Date(b.payment_completed_at).getTime() : 0;
      return bd - ad;
    });

    const dedupedRemoved = rawPaid.length - paid.length;

    // ----- Subscription renewals (data not present in checkout_sessions) -----
    // invoice.paid (stripe-subscription-webhook) creates transit_cycles + bumps
    // transit_subscriptions but does NOT create a new checkout_sessions row.
    // To recover renewal revenue we count cycles per subscription: the earliest
    // cycle is the initial signup (already in checkout_sessions); every later
    // cycle is a paid renewal worth TRANSIT_SUBSCRIPTION_AMOUNT_CENTS.
    type SubRow = {
      profile_id: string | null;
      stripe_subscription_id: string | null;
      status: string | null;
      cancel_at_period_end: boolean | null;
      canceled_at: string | null;
      current_period_start: string | null;
      current_period_end: string | null;
      created_at: string;
    };
    type CycleRow = {
      profile_id: string | null;
      stripe_session_id: string | null;
      created_at: string;
    };
    const subRows = (allSubsQ.data || []) as SubRow[];
    const subCycleRows = (allSubCyclesQ.data || []) as CycleRow[];

    const cyclesBySubId: Record<string, CycleRow[]> = {};
    for (const c of subCycleRows) {
      const m = c.stripe_session_id?.match(/^sub_(.+?)__/);
      if (!m) continue;
      const subId = m[1];
      if (!cyclesBySubId[subId]) cyclesBySubId[subId] = [];
      cyclesBySubId[subId].push(c);
    }

    const renewalCentsLifetimeByProfile: Record<string, number> = {};
    const renewalCountLifetimeByProfile: Record<string, number> = {};
    const renewalCentsInRangeByProfile: Record<string, number> = {};
    const renewalCountInRangeByProfile: Record<string, number> = {};
    const prevFromMs = new Date(prevFrom).getTime();
    const prevToMs = new Date(prevTo).getTime();
    let prevRenewalCents = 0;
    let prevRenewalCount = 0;
    for (const cycles of Object.values(cyclesBySubId)) {
      cycles.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      // Skip cycles[0] — initial signup, already counted in checkout_sessions.
      for (let i = 1; i < cycles.length; i++) {
        const c = cycles[i];
        const pid = c.profile_id;
        if (!pid) continue;
        renewalCentsLifetimeByProfile[pid] =
          (renewalCentsLifetimeByProfile[pid] || 0) + TRANSIT_SUBSCRIPTION_AMOUNT_CENTS;
        renewalCountLifetimeByProfile[pid] = (renewalCountLifetimeByProfile[pid] || 0) + 1;
        const ts = new Date(c.created_at).getTime();
        if (ts >= fromMs && ts <= toMs) {
          renewalCentsInRangeByProfile[pid] =
            (renewalCentsInRangeByProfile[pid] || 0) + TRANSIT_SUBSCRIPTION_AMOUNT_CENTS;
          renewalCountInRangeByProfile[pid] = (renewalCountInRangeByProfile[pid] || 0) + 1;
        }
        if (ts >= prevFromMs && ts <= prevToMs) {
          prevRenewalCents += TRANSIT_SUBSCRIPTION_AMOUNT_CENTS;
          prevRenewalCount += 1;
        }
      }
    }

    // profile_id → email lookup for any profile with renewal cycles.
    const profileIdsWithRenewals = Array.from(
      new Set([
        ...Object.keys(renewalCentsLifetimeByProfile),
        ...subRows.map((s) => s.profile_id).filter(Boolean),
      ]),
    );
    const emailByProfile: Record<string, string> = {};
    if (profileIdsWithRenewals.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", profileIdsWithRenewals);
      for (const p of (profs || []) as any[]) {
        if (p.email) emailByProfile[p.id] = p.email.toLowerCase().trim();
      }
    }

    const renewalCentsLifetimeByEmail: Record<string, number> = {};
    const renewalCountLifetimeByEmail: Record<string, number> = {};
    const renewalCentsInRangeByEmail: Record<string, number> = {};
    const renewalCountInRangeByEmail: Record<string, number> = {};
    for (const pid of Object.keys(renewalCentsLifetimeByProfile)) {
      const email = emailByProfile[pid];
      if (!email) continue;
      renewalCentsLifetimeByEmail[email] =
        (renewalCentsLifetimeByEmail[email] || 0) + renewalCentsLifetimeByProfile[pid];
      renewalCountLifetimeByEmail[email] =
        (renewalCountLifetimeByEmail[email] || 0) + renewalCountLifetimeByProfile[pid];
    }
    for (const pid of Object.keys(renewalCentsInRangeByProfile)) {
      const email = emailByProfile[pid];
      if (!email) continue;
      renewalCentsInRangeByEmail[email] =
        (renewalCentsInRangeByEmail[email] || 0) + renewalCentsInRangeByProfile[pid];
      renewalCountInRangeByEmail[email] =
        (renewalCountInRangeByEmail[email] || 0) + renewalCountInRangeByProfile[pid];
    }

    const totalRenewalCentsInRange = Object.values(renewalCentsInRangeByEmail).reduce(
      (a, b) => a + b,
      0,
    );
    const totalRenewalCountInRange = Object.values(renewalCountInRangeByEmail).reduce(
      (a, b) => a + b,
      0,
    );

    // ----- Revenue & customers -----
    const checkoutRevenueCents = paid.reduce(
      (acc, row: any) => acc + (typeof row.amount_total === "number" ? row.amount_total : 0),
      0,
    );
    const totalRevenueCents = checkoutRevenueCents + totalRenewalCentsInRange;
    const orderCount = paid.length + totalRenewalCountInRange;

    const ordersByEmail: Record<string, any[]> = {};
    for (const row of paid as any[]) {
      const email = (row.customer_email || "").toLowerCase().trim();
      if (!email) continue;
      if (!ordersByEmail[email]) ordersByEmail[email] = [];
      ordersByEmail[email].push(row);
    }
    // Surface renewal-only customers (signed up in a prior period but renewed
    // in this one — they'd otherwise be invisible because there's no fresh
    // checkout_sessions row).
    for (const email of Object.keys(renewalCentsInRangeByEmail)) {
      if (!ordersByEmail[email]) ordersByEmail[email] = [];
    }
    const uniqueCustomers = Object.keys(ordersByEmail).length;

    // ----- By product -----
    const productAgg: Record<string, { count: number; revenue_cents: number }> = {};
    for (const row of paid as any[]) {
      const code = row.product_code || "unknown";
      if (!productAgg[code]) productAgg[code] = { count: 0, revenue_cents: 0 };
      productAgg[code].count += 1;
      productAgg[code].revenue_cents += row.amount_total || 0;
    }
    // Roll renewals INTO the `transits_monthly_subscription` row so the table
    // shows one line per real product (signup + renewals are the same thing
    // from a "what did customers pay for" perspective). The signup/renewal
    // split is exposed as a hint via `signup_count` / `renewal_count`.
    if (totalRenewalCountInRange > 0) {
      const subCode = "transits_monthly_subscription";
      if (!productAgg[subCode]) productAgg[subCode] = { count: 0, revenue_cents: 0 };
      productAgg[subCode].count += totalRenewalCountInRange;
      productAgg[subCode].revenue_cents += totalRenewalCentsInRange;
    }
    const totalProductRevenueCents = Object.values(productAgg).reduce(
      (a, v) => a + v.revenue_cents,
      0,
    );
    const products = Object.entries(productAgg)
      .map(([code, v]) => {
        const isSubscription = code === "transits_monthly_subscription";
        const signupCount = isSubscription
          ? Math.max(0, v.count - totalRenewalCountInRange)
          : null;
        return {
          product_code: code,
          label: PRODUCT_LABEL[code] || code,
          unit_price_eur: PRODUCT_PRICE_EUR[code] ?? null,
          count: v.count,
          revenue_eur: Math.round((v.revenue_cents / 100) * 100) / 100,
          mix_pct: pct(v.revenue_cents, totalProductRevenueCents),
          signup_count: signupCount,
          renewal_count: isSubscription ? totalRenewalCountInRange : null,
        };
      })
      .sort((a, b) => b.revenue_eur - a.revenue_eur);

    // ----- By payment method -----
    const methodAgg: Record<string, { count: number; revenue_cents: number }> = {};
    for (const row of paid as any[]) {
      let key = (row.payment_provider || "altro").toLowerCase();
      if (key !== "stripe" && key !== "paypal") key = "altro";
      if (!methodAgg[key]) methodAgg[key] = { count: 0, revenue_cents: 0 };
      methodAgg[key].count += 1;
      methodAgg[key].revenue_cents += row.amount_total || 0;
    }
    const methods = ["stripe", "paypal", "altro"]
      .filter((k) => methodAgg[k])
      .map((k) => ({
        provider: k,
        count: methodAgg[k].count,
        revenue_eur: Math.round((methodAgg[k].revenue_cents / 100) * 100) / 100,
        share_pct: pct(methodAgg[k].count, orderCount),
      }));

    // ===== 2. Funnel events processing (data fetched in parallel above) =====
    const funnelCounts: Record<FunnelEventName, number> = {
      landing_viewed: 0,
      quiz_started: 0,
      quiz_completed: 0,
      paywall_viewed: 0,
      checkout_started: 0,
      purchase_completed: 0,
      report_generation_completed: 0,
      report_generation_failed: 0,
    };
    const funnelUniques: Record<FunnelEventName, Set<string>> = {
      landing_viewed: new Set(),
      quiz_started: new Set(),
      quiz_completed: new Set(),
      paywall_viewed: new Set(),
      checkout_started: new Set(),
      purchase_completed: new Set(),
      report_generation_completed: new Set(),
      report_generation_failed: new Set(),
    };
    for (const r of (funnelRows || []) as any[]) {
      const name = r.event_name as FunnelEventName;
      if (!FUNNEL_EVENTS.includes(name)) continue;
      funnelCounts[name] += 1;
      if (r.anonymous_id) funnelUniques[name].add(r.anonymous_id);
    }

    const funnel = FUNNEL_EVENTS.map((name) => ({
      event: name,
      count: funnelCounts[name],
      unique_visitors: funnelUniques[name].size,
    }));

    const stepConversions = [
      { from: "landing_viewed", to: "quiz_started" },
      { from: "quiz_started", to: "quiz_completed" },
      { from: "quiz_completed", to: "paywall_viewed" },
      { from: "paywall_viewed", to: "checkout_started" },
      { from: "checkout_started", to: "purchase_completed" },
    ].map((step) => ({
      ...step,
      pct: pct(
        funnelUniques[step.to as FunnelEventName].size,
        funnelUniques[step.from as FunnelEventName].size,
      ),
    }));

    const headlineConversions = {
      landing_to_purchase: pct(
        funnelUniques.purchase_completed.size,
        funnelUniques.landing_viewed.size,
      ),
      quiz_completed_to_purchase: pct(
        funnelUniques.purchase_completed.size,
        funnelUniques.quiz_completed.size,
      ),
      paywall_to_purchase: pct(
        funnelUniques.purchase_completed.size,
        funnelUniques.paywall_viewed.size,
      ),
      checkout_to_purchase: pct(
        funnelUniques.purchase_completed.size,
        funnelUniques.checkout_started.size,
      ),
    };

    // ===== 3+4+5. Quiz sessions metadata + has-full-report + prior orders (parallel) =====
    // We need: status/error per paid session, which paid sessions have a generated
    // full_report, and the historical first-seen date per customer email.
    // Fetching the JSONB full_report just for a truthiness check is wasteful;
    // a separate id-only "has report" query is far cheaper.
    const paidQuizIds = Array.from(
      new Set(paid.map((r: any) => r.quiz_session_id).filter(Boolean)),
    );
    const allCustomerEmails = Array.from(
      new Set(
        [
          ...(paid.map((r: any) => r.customer_email).filter(Boolean) as string[]),
          ...Object.keys(renewalCentsInRangeByEmail),
        ].map((e) => e.toLowerCase()),
      ),
    );

    const noop = Promise.resolve({ data: [] as any[] });
    const [qsStatusRes, qsHasReportRes, priorRes] = await Promise.all([
      paidQuizIds.length > 0
        ? supabase
            .from("quiz_sessions")
            .select("id, processing_status, processing_error, funnel_slug")
            .in("id", paidQuizIds)
        : noop,
      paidQuizIds.length > 0
        ? supabase
            .from("quiz_sessions")
            .select("id")
            .in("id", paidQuizIds)
            .not("full_report", "is", null)
        : noop,
      allCustomerEmails.length > 0
        ? supabase
            .from("checkout_sessions")
            .select("customer_email, payment_completed_at, amount_total, product_code")
            .eq("payment_status", "paid")
            .in("customer_email", allCustomerEmails)
            .order("payment_completed_at", { ascending: true })
        : noop,
    ]);

    const qsRows = (qsStatusRes.data || []) as any[];
    const qsWithFullReportIds = new Set(
      ((qsHasReportRes.data || []) as any[]).map((r) => r.id),
    );
    const priorRows = (priorRes.data || []) as any[];

    const qsById: Record<
      string,
      {
        processing_status: string | null;
        processing_error: string | null;
        has_full_report: boolean;
        funnel_slug: string | null;
      }
    > = {};
    for (const qs of qsRows) {
      qsById[qs.id] = {
        processing_status: qs.processing_status || null,
        processing_error: qs.processing_error || null,
        has_full_report: qsWithFullReportIds.has(qs.id),
        funnel_slug: qs.funnel_slug || null,
      };
    }

    // Report status across all paid sessions in window.
    const reportStatus = { completed: 0, pending: 0, failed: 0, error_rate_pct: null as number | null };
    for (const id of paidQuizIds) {
      const qs = qsById[id];
      const hasFullReport = !!qs?.has_full_report;
      const status = qs?.processing_status || "pending";
      if (hasFullReport || status === "completed") reportStatus.completed += 1;
      else if (status === "failed") reportStatus.failed += 1;
      else reportStatus.pending += 1;
    }
    {
      const denom = reportStatus.completed + reportStatus.failed;
      reportStatus.error_rate_pct = pct(reportStatus.failed, denom);
    }

    // Recent orders (last 50 in window) — reuse the same qsById map.
    const recentSlice = paid.slice(0, 50);
    const recentOrders = recentSlice.map((row: any) => {
      const qs = row.quiz_session_id ? qsById[row.quiz_session_id] : null;
      const hasFullReport = !!qs?.has_full_report;
      const reportStatusLabel = hasFullReport
        ? "completed"
        : qs?.processing_status === "failed"
          ? "failed"
          : qs?.processing_status || "pending";
      const amountEur =
        typeof row.amount_total === "number"
          ? Math.round((row.amount_total / 100) * 100) / 100
          : null;
      return {
        order_id: row.id,
        date: row.payment_completed_at || row.created_at,
        email: row.customer_email,
        product_code: row.product_code,
        product_label: PRODUCT_LABEL[row.product_code] || row.product_code,
        amount_eur: amountEur,
        amount_missing: amountEur == null,
        currency: row.currency,
        provider: row.payment_provider,
        provider_payment_id: row.provider_payment_id,
        payment_status: row.payment_status,
        report_status: reportStatusLabel,
        report_error: qs?.processing_error || null,
        // Deep link alla scheda cliente nella nuova area CRM (/admin/clienti).
        // Usa l'email del checkout come identità (lower-case, URL-encoded).
        report_url:
          hasFullReport && row.customer_email
            ? `/admin/clienti/${encodeURIComponent(String(row.customer_email).toLowerCase())}`
            : null,
        quiz_session_id: row.quiz_session_id,
      };
    });

    const ordersWithMissingAmount = paid.filter(
      (r: any) => typeof r.amount_total !== "number",
    ).length;

    // Build first-seen + lifetime totals from the historical paid checkouts.
    // priorRes is lifetime-scoped (no date filter), so this captures every
    // paid purchase that email ever made — across reports, transit one-time
    // packs, astrology guide packs and initial subscription signups. We then
    // add the renewal cents derived from transit_cycles (Part A) on top.
    const firstSeenByEmail: Record<string, string> = {};
    const lifetimeSpendByEmail: Record<string, number> = {};
    const lifetimeOrderCountByEmail: Record<string, number> = {};
    const lifetimeProductsByEmail: Record<string, Set<string>> = {};
    const lifetimeLastPaidByEmail: Record<string, string> = {};
    for (const r of priorRows) {
      const e = (r.customer_email || "").toLowerCase().trim();
      if (!e) continue;
      if (!firstSeenByEmail[e]) firstSeenByEmail[e] = r.payment_completed_at;
      lifetimeSpendByEmail[e] =
        (lifetimeSpendByEmail[e] || 0) +
        (typeof r.amount_total === "number" ? r.amount_total : 0);
      lifetimeOrderCountByEmail[e] = (lifetimeOrderCountByEmail[e] || 0) + 1;
      if (r.product_code) {
        if (!lifetimeProductsByEmail[e]) lifetimeProductsByEmail[e] = new Set();
        lifetimeProductsByEmail[e].add(PRODUCT_LABEL[r.product_code] || r.product_code);
      }
      if (
        r.payment_completed_at &&
        (!lifetimeLastPaidByEmail[e] || r.payment_completed_at > lifetimeLastPaidByEmail[e])
      ) {
        lifetimeLastPaidByEmail[e] = r.payment_completed_at;
      }
    }
    // Layer lifetime renewals on top — they don't appear in checkout_sessions.
    // The product label is the same as the initial signup ("Abbonamento
    // transiti …"), so renewals just bump the cents/count without polluting
    // the products column with a separate "rinnovo" entry.
    for (const [email, cents] of Object.entries(renewalCentsLifetimeByEmail)) {
      lifetimeSpendByEmail[email] = (lifetimeSpendByEmail[email] || 0) + cents;
      lifetimeOrderCountByEmail[email] =
        (lifetimeOrderCountByEmail[email] || 0) + (renewalCountLifetimeByEmail[email] || 0);
      if (!lifetimeProductsByEmail[email]) lifetimeProductsByEmail[email] = new Set();
      lifetimeProductsByEmail[email].add(PRODUCT_LABEL["transits_monthly_subscription"]);
    }

    // Build the set of emails currently subscribed (any status: active,
    // cancelling, churned, etc.) so the customers table can filter by it.
    const subscriberEmails = new Set<string>();
    for (const s of subRows) {
      const email = s.profile_id ? emailByProfile[s.profile_id] : null;
      if (email) subscriberEmails.add(email);
    }

    const customers = Object.entries(ordersByEmail).map(([email, rows]) => {
      const lifetimeCents = lifetimeSpendByEmail[email] || 0;
      const lifetimeOrders = lifetimeOrderCountByEmail[email] || rows.length;
      const products = Array.from(lifetimeProductsByEmail[email] || []);
      const lastOrder = lifetimeLastPaidByEmail[email] || null;
      const firstSeen = firstSeenByEmail[email];
      const isNew = firstSeen ? new Date(firstSeen) >= new Date(from) : true;
      // Period spend: in-range checkouts for this email + in-range renewals.
      // rows are already filtered to the period (built from `paid`).
      const periodCheckoutCents = rows.reduce(
        (acc: number, r: { amount_total?: number | null }) =>
          acc + (typeof r.amount_total === "number" ? r.amount_total : 0),
        0,
      );
      const periodRenewalCents = renewalCentsInRangeByEmail[email] || 0;
      const periodCents = periodCheckoutCents + periodRenewalCents;
      const periodOrders = rows.length + (renewalCountInRangeByEmail[email] || 0);
      return {
        email,
        order_count: lifetimeOrders,
        period_order_count: periodOrders,
        total_eur: Math.round((lifetimeCents / 100) * 100) / 100,
        period_spend_eur: Math.round((periodCents / 100) * 100) / 100,
        last_order_at: lastOrder,
        first_seen_at: firstSeen || null,
        is_new_in_period: isNew,
        is_subscriber: subscriberEmails.has(email),
        products,
      };
    });
    // Default sort: lifetime DESC. Frontend can re-sort by other criteria.
    customers.sort((a, b) => b.total_eur - a.total_eur);

    const newCustomerCount = customers.filter((c) => c.is_new_in_period).length;
    const repeatCustomerCount = customers.filter((c) => c.order_count > 1).length;
    const newCustomerPct = pct(newCustomerCount, customers.length);

    // ===== Part B: split by funnel (classica / attivazione) =====
    const funnelAgg: Record<
      string,
      {
        order_count: number;
        revenue_cents: number;
        emails: Set<string>;
        new_emails: Set<string>;
      }
    > = {};
    for (const row of paid as any[]) {
      const slug = (row.quiz_session_id && qsById[row.quiz_session_id]?.funnel_slug) || "unknown";
      if (!funnelAgg[slug]) {
        funnelAgg[slug] = {
          order_count: 0,
          revenue_cents: 0,
          emails: new Set(),
          new_emails: new Set(),
        };
      }
      const bucket = funnelAgg[slug];
      bucket.order_count += 1;
      bucket.revenue_cents += typeof row.amount_total === "number" ? row.amount_total : 0;
      const email = (row.customer_email || "").toLowerCase().trim();
      if (email) {
        bucket.emails.add(email);
        const firstSeen = firstSeenByEmail[email];
        if (firstSeen && new Date(firstSeen) >= new Date(from)) bucket.new_emails.add(email);
      }
    }
    const byFunnel = Object.entries(funnelAgg)
      .map(([slug, v]) => ({
        funnel_slug: slug,
        order_count: v.order_count,
        revenue_eur: Math.round((v.revenue_cents / 100) * 100) / 100,
        unique_customers: v.emails.size,
        new_customers: v.new_emails.size,
      }))
      .sort((a, b) => b.revenue_eur - a.revenue_eur);

    // ===== Part C: subscriptions / MRR / churn =====
    const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);
    let subsActive = 0;
    let subsCancelling = 0;
    let subsNewInPeriod = 0;
    let subsChurnedInPeriod = 0;
    let retainedMonthsSum = 0;
    let retainedMonthsCount = 0;
    const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;
    for (const s of subRows) {
      const status = s.status;
      const createdAtMs = s.created_at ? new Date(s.created_at).getTime() : null;
      const canceledAtMs = s.canceled_at ? new Date(s.canceled_at).getTime() : null;
      if (status && ACTIVE_STATUSES.has(status)) {
        if (s.cancel_at_period_end) subsCancelling += 1;
        else subsActive += 1;
      }
      if (status === "canceled" && canceledAtMs !== null && canceledAtMs >= fromMs && canceledAtMs <= toMs) {
        subsChurnedInPeriod += 1;
      }
      if (createdAtMs !== null && createdAtMs >= fromMs && createdAtMs <= toMs) {
        subsNewInPeriod += 1;
      }
      // Average months retained — meaningful only for cancelled subs.
      if (status === "canceled" && createdAtMs !== null && canceledAtMs !== null) {
        const months = (canceledAtMs - createdAtMs) / MS_PER_MONTH;
        if (months > 0) {
          retainedMonthsSum += months;
          retainedMonthsCount += 1;
        }
      }
    }
    const subscriptions = {
      active: subsActive,
      cancelling: subsCancelling,
      new_in_period: subsNewInPeriod,
      churned_in_period: subsChurnedInPeriod,
      mrr_eur: Math.round(((subsActive + subsCancelling) * (TRANSIT_SUBSCRIPTION_AMOUNT_CENTS / 100)) * 100) / 100,
      avg_months_retained:
        retainedMonthsCount > 0
          ? Math.round((retainedMonthsSum / retainedMonthsCount) * 10) / 10
          : null,
      monthly_price_eur: TRANSIT_SUBSCRIPTION_AMOUNT_CENTS / 100,
    };

    // ===== Part D: comparison vs previous period =====
    type PrevPaidRow = {
      customer_email: string | null;
      amount_total: number | null;
      payment_completed_at: string | null;
    };
    const prevPaid = (prevPaidQ.data || []) as PrevPaidRow[];
    const prevCheckoutCents = prevPaid.reduce(
      (acc, r) => acc + (typeof r.amount_total === "number" ? r.amount_total : 0),
      0,
    );
    const prevRevenueCents = prevCheckoutCents + prevRenewalCents;
    const prevOrderCount = prevPaid.length + prevRenewalCount;
    const prevEmails = new Set<string>();
    for (const r of prevPaid) {
      const e = (r.customer_email || "").toLowerCase().trim();
      if (e) prevEmails.add(e);
    }
    let prevNewCustomers = 0;
    for (const [email, firstSeen] of Object.entries(firstSeenByEmail)) {
      if (!firstSeen) continue;
      const ts = new Date(firstSeen).getTime();
      if (ts >= prevFromMs && ts <= prevToMs) prevNewCustomers += 1;
      // silence unused-var warning for `email`
      void email;
    }
    const deltaPct = (curr: number, prev: number): number | null => {
      if (!prev || prev <= 0) return null;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };
    const comparison = {
      prev_period: {
        from: prevFrom,
        to: prevTo,
        revenue_eur: Math.round((prevRevenueCents / 100) * 100) / 100,
        order_count: prevOrderCount,
        unique_customers: prevEmails.size,
        new_customers: prevNewCustomers,
        renewal_count: prevRenewalCount,
      },
      deltas: {
        revenue_pct: deltaPct(totalRevenueCents, prevRevenueCents),
        orders_pct: deltaPct(orderCount, prevOrderCount),
        customers_pct: deltaPct(uniqueCustomers, prevEmails.size),
        new_customers_pct: deltaPct(newCustomerCount, prevNewCustomers),
      },
    };

    const lifetimeEmails = Object.keys(lifetimeSpendByEmail);
    const lifetimeCustomerCount = lifetimeEmails.length;
    const lifetimeTotalCents = lifetimeEmails.reduce(
      (acc, e) => acc + (lifetimeSpendByEmail[e] || 0),
      0,
    );
    const ltv = {
      lifetime_eur:
        lifetimeCustomerCount > 0
          ? Math.round((lifetimeTotalCents / 100 / lifetimeCustomerCount) * 100) / 100
          : null,
      period_eur:
        uniqueCustomers > 0
          ? Math.round((totalRevenueCents / 100 / uniqueCustomers) * 100) / 100
          : null,
      lifetime_customer_count: lifetimeCustomerCount,
    };

    return new Response(
      JSON.stringify({
        range: { from, to, tz },
        meta: {
          generated_at: new Date().toISOString(),
          dedup_removed: dedupedRemoved,
          orders_with_missing_amount: ordersWithMissingAmount,
        },
        revenue: {
          total_eur: Math.round((totalRevenueCents / 100) * 100) / 100,
          // TODO(multi-market): revenue is summed across markets without a
          // per-market currency split; hardcoded EUR until the dashboard groups
          // by market.currency. See note on PRODUCT_PRICE_EUR.
          currency: "EUR",
          order_count: orderCount,
          unique_customers: uniqueCustomers,
          avg_order_eur: orderCount > 0
            ? Math.round((totalRevenueCents / 100 / orderCount) * 100) / 100
            : null,
        },
        products,
        payment_methods: methods,
        by_funnel: byFunnel,
        subscriptions,
        ltv,
        comparison,
        funnel: {
          steps: funnel,
          step_conversions: stepConversions,
          headline: headlineConversions,
        },
        report_status: reportStatus,
        recent_orders: recentOrders,
        customers: {
          total: uniqueCustomers,
          new_in_period: newCustomerCount,
          new_pct: newCustomerPct,
          repeat: repeatCustomerCount,
          list: customers.slice(0, 250),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[admin-dashboard] error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
