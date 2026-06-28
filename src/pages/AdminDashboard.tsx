import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, ShieldCheck, RefreshCw, LogOut, ExternalLink, MessageCircle, LifeBuoy, ChevronDown, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { isLovablePreview } from "@/lib/preview-mode";
import { clearAdminSecret, getAdminSecret, setAdminSecret } from "@/hooks/admin/adminSecretStorage";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-dashboard`;
const AI_METRICS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai-metrics`;

type DashboardData = {
  range: { from: string; to: string; tz?: string };
  meta?: {
    generated_at: string;
    dedup_removed: number;
    orders_with_missing_amount: number;
  };
  revenue: {
    total_eur: number;
    currency: string;
    order_count: number;
    unique_customers: number;
    avg_order_eur: number | null;
  };
  products: Array<{
    product_code: string;
    label: string;
    unit_price_eur: number | null;
    count: number;
    revenue_eur: number;
    mix_pct: number | null;
    signup_count: number | null;
    renewal_count: number | null;
  }>;
  payment_methods: Array<{
    provider: string;
    count: number;
    revenue_eur: number;
    share_pct: number | null;
  }>;
  by_funnel?: Array<{
    funnel_slug: string;
    order_count: number;
    revenue_eur: number;
    unique_customers: number;
    new_customers: number;
  }>;
  subscriptions?: {
    active: number;
    cancelling: number;
    new_in_period: number;
    churned_in_period: number;
    mrr_eur: number;
    avg_months_retained: number | null;
    monthly_price_eur: number;
  };
  ltv?: {
    lifetime_eur: number | null;
    period_eur: number | null;
    lifetime_customer_count: number;
  };
  comparison?: {
    prev_period: {
      from: string;
      to: string;
      revenue_eur: number;
      order_count: number;
      unique_customers: number;
      new_customers: number;
      renewal_count: number;
    };
    deltas: {
      revenue_pct: number | null;
      orders_pct: number | null;
      customers_pct: number | null;
      new_customers_pct: number | null;
    };
  };
  funnel: {
    steps: Array<{ event: string; count: number; unique_visitors: number }>;
    step_conversions: Array<{ from: string; to: string; pct: number | null }>;
    headline: {
      landing_to_purchase: number | null;
      quiz_completed_to_purchase: number | null;
      paywall_to_purchase: number | null;
      checkout_to_purchase: number | null;
    };
  };
  report_status: {
    completed: number;
    pending: number;
    failed: number;
    error_rate_pct: number | null;
  };
  recent_orders: Array<{
    order_id: string;
    date: string | null;
    email: string | null;
    product_code: string;
    product_label: string;
    amount_eur: number | null;
    amount_missing?: boolean;
    currency: string | null;
    provider: string | null;
    provider_payment_id: string | null;
    payment_status: string;
    report_status: string;
    report_error: string | null;
    report_url: string | null;
    quiz_session_id: string | null;
  }>;
  customers: {
    total: number;
    new_in_period: number;
    new_pct: number | null;
    repeat: number;
    list: Array<{
      email: string;
      order_count: number;
      period_order_count: number;
      total_eur: number;
      period_spend_eur: number;
      last_order_at: string | null;
      first_seen_at: string | null;
      is_new_in_period: boolean;
      is_subscriber: boolean;
      products: string[];
    }>;
  };
};

type Preset = "today" | "yesterday" | "7d" | "30d" | "month" | "custom";

type AiMetricsSummary = {
  count: number;
  success_count: number;
  success_rate_pct: number | null;
  duration_ms: {
    avg: number | null;
    p50: number | null;
    p95: number | null;
    max: number | null;
    min: number | null;
  };
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  attempts: { first_try: number; retried: number };
  errors: Record<string, number>;
};

type AiMetricsData = {
  range: { from: string; to: string; tz?: string };
  overall: AiMetricsSummary;
  per_function: Array<AiMetricsSummary & { function_name: string }>;
  slowest: Array<{
    id: string;
    created_at: string;
    function_name: string;
    model: string | null;
    duration_ms: number;
    success: boolean;
    attempt: number;
    error_code: string | null;
    quiz_session_id: string | null;
    transit_cycle_id: string | null;
    total_tokens: number | null;
  }>;
  meta: { generated_at: string; rows_scanned: number; truncated: boolean };
};

const APP_TZ = "Europe/Rome";

// Returns the wall-clock YYYY-MM-DD of `d` as observed in APP_TZ.
const toRomeDateString = (d: Date) => {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d); // YYYY-MM-DD
};

const addDaysRomeDate = (romeDate: string, delta: number): string => {
  const [y, m, d] = romeDate.split("-").map(Number);
  // Build a UTC date for noon to avoid DST edge effects, then shift days.
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
};

const startOfRomeMonth = (romeDate: string): string => {
  const [y, m] = romeDate.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-01`;
};

const computeRange = (
  preset: Preset,
  customFrom?: string,
  customTo?: string,
): { fromDate: string; toDate: string } => {
  const today = toRomeDateString(new Date());
  switch (preset) {
    case "today":
      return { fromDate: today, toDate: today };
    case "yesterday": {
      const y = addDaysRomeDate(today, -1);
      return { fromDate: y, toDate: y };
    }
    case "7d":
      return { fromDate: addDaysRomeDate(today, -6), toDate: today };
    case "30d":
      return { fromDate: addDaysRomeDate(today, -29), toDate: today };
    case "month":
      return { fromDate: startOfRomeMonth(today), toDate: today };
    case "custom":
      return {
        fromDate: customFrom || today,
        toDate: customTo || today,
      };
  }
};

const formatEUR = (n: number | null | undefined) =>
  n == null ? "—" : `€${n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNumber = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("it-IT");
const formatPct = (n: number | null | undefined) => (n == null ? "—" : `${n.toFixed(1)}%`);
const formatDuration = (ms: number | null | undefined) => {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};
const FUNCTION_LABELS: Record<string, string> = {
  "generate-report": "Report completo",
  "process-session-insights": "Insight teaser",
  "process-transit-cycle": "Transiti mensili",
};
const formatDate = (iso: string | null | undefined, withTime = true) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  } catch {
    return "—";
  }
};

const EVENT_LABELS: Record<string, string> = {
  landing_viewed: "Landing vista",
  quiz_started: "Quiz iniziato",
  quiz_completed: "Quiz completato",
  paywall_viewed: "Paywall vista",
  checkout_started: "Checkout iniziato",
  purchase_completed: "Acquisto completato",
  report_generation_completed: "Report generato",
  report_generation_failed: "Report fallito",
};

const DeltaBadge = ({ pct }: { pct: number | null | undefined }) => {
  if (pct == null) {
    return (
      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border font-medium bg-muted text-muted-foreground border-border">
        —
      </span>
    );
  }
  const positive = pct >= 0;
  const tone = positive
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
    : "bg-destructive/10 text-destructive border-destructive/30";
  const arrow = positive ? "↑" : "↓";
  return (
    <span
      className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border font-medium ${tone}`}
      title="Variazione vs periodo precedente di pari durata"
    >
      {arrow} {Math.abs(pct).toFixed(1)}%
    </span>
  );
};

const StatCard = ({
  label,
  value,
  hint,
  deltaPct,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  deltaPct?: number | null;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="font-display text-2xl font-semibold text-foreground">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {deltaPct !== undefined && <DeltaBadge pct={deltaPct} />}
      </div>
    </CardContent>
  </Card>
);

const StatusBadge = ({ status }: { status: string }) => {
  const tone =
    status === "completed" || status === "paid"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
      : status === "failed"
        ? "bg-destructive/10 text-destructive border-destructive/30"
        : "bg-amber-500/15 text-amber-700 border-amber-500/30";
  return (
    <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border font-medium ${tone}`}>
      {status}
    </span>
  );
};

const AUTO_REFRESH_MS = 300_000;

const AdminDashboard = () => {
  const [secret, setSecret] = useState<string>(() => getAdminSecret());
  const [secretInput, setSecretInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [preset, setPreset] = useState<Preset>("today");
  const [customFrom, setCustomFrom] = useState<string>(() => toRomeDateString(new Date()));
  const [customTo, setCustomTo] = useState<string>(() => toRomeDateString(new Date()));

  // The AI metrics section has its own period filter, independent from the
  // dashboard-wide one. Defaults to "today" so the initial render matches the
  // global default; users can detach it (e.g., 30d AI metrics while looking at
  // today's revenue).
  const [aiPreset, setAiPreset] = useState<Preset>("today");
  const [aiCustomFrom, setAiCustomFrom] = useState<string>(() => toRomeDateString(new Date()));
  const [aiCustomTo, setAiCustomTo] = useState<string>(() => toRomeDateString(new Date()));

  const [data, setData] = useState<DashboardData | null>(null);
  const [aiMetrics, setAiMetrics] = useState<AiMetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [slowestFunctionFilter, setSlowestFunctionFilter] = useState<string>("all");

  // Customers section UI state
  type CustomerFilter = "new" | "all" | "subscribers" | "top_ltv";
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>("new");
  const CUSTOMERS_PAGE_SIZE = 50;
  const [customerVisibleCount, setCustomerVisibleCount] = useState<number>(CUSTOMERS_PAGE_SIZE);

  // Operational section collapse (Stato report + Ordini recenti + Generazioni AI)
  const [showOperational, setShowOperational] = useState<boolean>(false);

  // Reset pagination whenever the active filter or the underlying list changes.
  useEffect(() => {
    setCustomerVisibleCount(CUSTOMERS_PAGE_SIZE);
  }, [customerFilter, data]);

  // Cancel any in-flight request when a newer one starts (preset change,
  // manual refresh, auto-refresh) so the latest response always wins and we
  // don't overlap requests against the same edge function.
  const abortRef = useRef<AbortController | null>(null);
  const abortAiRef = useRef<AbortController | null>(null);
  // Throttle the visibility/focus listeners: returning to the tab can fire
  // both events back-to-back, which previously triggered duplicate fetches.
  const lastLoadAtRef = useRef<number>(0);

  const range = useMemo(
    () => computeRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );
  const aiRange = useMemo(
    () => computeRange(aiPreset, aiCustomFrom, aiCustomTo),
    [aiPreset, aiCustomFrom, aiCustomTo],
  );

  const loadGlobal = async () => {
    if (!secret) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setAuthError(false);
    try {
      const params = new URLSearchParams({
        from_date: range.fromDate,
        to_date: range.toDate,
        tz: APP_TZ,
      });
      const res = await fetch(`${FUNCTION_URL}?${params.toString()}`, {
        headers: { "x-admin-secret": secret },
        signal: controller.signal,
      });
      if (res.status === 401) {
        setAuthError(true);
        clearAdminSecret();
        setSecret("");
        toast.error("Password non valida.");
        return;
      }
      if (!res.ok) throw new Error("Errore nel caricamento.");
      const json = (await res.json()) as DashboardData;
      if (controller.signal.aborted) return;
      setData(json);
      setLastRefresh(new Date());
      lastLoadAtRef.current = Date.now();
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Errore nel caricamento.");
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  };

  const loadAiMetrics = async () => {
    if (!secret) return;
    abortAiRef.current?.abort();
    const controller = new AbortController();
    abortAiRef.current = controller;
    setAiLoading(true);
    try {
      const params = new URLSearchParams({
        from_date: aiRange.fromDate,
        to_date: aiRange.toDate,
        tz: APP_TZ,
      });
      const res = await fetch(`${AI_METRICS_URL}?${params.toString()}`, {
        headers: { "x-admin-secret": secret },
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (res.ok) {
        const aiJson = (await res.json()) as AiMetricsData;
        if (!controller.signal.aborted) setAiMetrics(aiJson);
      } else {
        console.warn("AI metrics endpoint returned", res.status);
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      console.warn("AI metrics fetch failed:", err);
    } finally {
      if (abortAiRef.current === controller) {
        setAiLoading(false);
        abortAiRef.current = null;
      }
    }
  };

  const load = () => {
    loadGlobal();
    loadAiMetrics();
  };

  useEffect(() => {
    loadGlobal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, preset, customFrom, customTo]);

  useEffect(() => {
    loadAiMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, aiPreset, aiCustomFrom, aiCustomTo]);

  // Auto-refresh: 5min interval + visibility change. We intentionally drop the
  // window 'focus' listener — on most browsers it fires alongside
  // visibilitychange when returning to the tab, causing duplicate fetches.
  // The throttle below also guards against rapid-fire triggers.
  useEffect(() => {
    if (!secret) return;
    const MIN_GAP_MS = 5_000;
    const trigger = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastLoadAtRef.current < MIN_GAP_MS) return;
      load();
    };
    const interval = window.setInterval(trigger, AUTO_REFRESH_MS);
    document.addEventListener("visibilitychange", trigger);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", trigger);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, preset, customFrom, customTo, aiPreset, aiCustomFrom, aiCustomTo]);

  useEffect(() => {
    document.title = "Admin · Dashboard";
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim()) return;
    setAdminSecret(secretInput.trim());
    setSecret(secretInput.trim());
    setSecretInput("");
  };
  const handleLogout = () => {
    clearAdminSecret();
    setSecret("");
    setData(null);
    setAiMetrics(null);
  };

  if (isLovablePreview()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 space-y-5 text-center">
          <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground">
            Anteprima Lovable: la dashboard è accessibile solo nel sito pubblicato.
          </p>
          <Button onClick={() => (window.location.href = "/")} className="w-full">
            Torna alla home
          </Button>
        </div>
      </div>
    );
  }

  if (!secret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 space-y-5"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard Admin</h1>
            <p className="text-sm text-muted-foreground">
              Inserisci la password admin per vedere le metriche.
            </p>
          </div>
          <Input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="Password admin"
            autoFocus
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" disabled={!secretInput.trim()}>
            Accedi
          </Button>
          {authError && (
            <p className="text-xs text-destructive text-center">Password non valida. Riprova.</p>
          )}
        </form>
      </div>
    );
  }

  const presets: Array<{ key: Preset; label: string }> = [
    { key: "today", label: "Oggi" },
    { key: "yesterday", label: "Ieri" },
    { key: "7d", label: "7 giorni" },
    { key: "30d", label: "30 giorni" },
    { key: "month", label: "Mese corrente" },
    { key: "custom", label: "Personalizzato" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-7xl mx-auto py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary">Codice Interiore</p>
            <h1 className="font-display text-xl font-semibold text-foreground">Admin · Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className="hidden md:inline text-[11px] text-muted-foreground tabular-nums">
                Aggiornato alle{" "}
                {lastRefresh.toLocaleTimeString("it-IT", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  timeZone: APP_TZ,
                })}
              </span>
            )}
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <a href="/admin/clienti">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Clienti</span>
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <a href="/admin/astrology-guide">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Guida astrologica</span>
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <a href="/admin/support">
                <LifeBuoy className="h-4 w-4" />
                <span className="hidden sm:inline">Assistenza</span>
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Aggiorna</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Esci</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        {/* Period filter */}
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={preset === p.key ? "default" : "outline"}
              onClick={() => setPreset(p.key)}
            >
              {p.label}
            </Button>
          ))}
          {preset === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 w-40"
              />
              <span className="text-sm text-muted-foreground">→</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 w-40"
              />
            </div>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {range.fromDate} – {range.toDate}
            {data?.meta?.dedup_removed ? (
              <span className="ml-2 text-amber-600">
                · {data.meta.dedup_removed} duplicat{data.meta.dedup_removed === 1 ? "o" : "i"} rimoss{data.meta.dedup_removed === 1 ? "o" : "i"}
              </span>
            ) : null}
            {data?.meta?.orders_with_missing_amount ? (
              <span className="ml-2 text-amber-600">
                · {data.meta.orders_with_missing_amount} ordin{data.meta.orders_with_missing_amount === 1 ? "e" : "i"} senza importo
              </span>
            ) : null}
          </span>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">Nessun dato disponibile.</p>
        ) : (
          <>
            {/* Top KPI — i 4 numeri che riassumono il periodo */}
            <section className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Incasso periodo"
                  value={formatEUR(data.revenue.total_eur)}
                  deltaPct={data.comparison?.deltas.revenue_pct}
                  hint={`${formatNumber(data.revenue.order_count)} ordini · ticket medio ${formatEUR(data.revenue.avg_order_eur)}`}
                />
                <StatCard
                  label="Nuovi clienti"
                  value={formatNumber(data.customers.new_in_period)}
                  deltaPct={data.comparison?.deltas.new_customers_pct}
                  hint={`Su ${formatNumber(data.customers.total)} totali nel periodo${data.customers.new_pct != null ? ` (${data.customers.new_pct.toFixed(1)}%)` : ""}`}
                />
                <StatCard
                  label="LTV"
                  value={formatEUR(data.ltv?.lifetime_eur ?? null)}
                  hint={
                    data.ltv
                      ? `Periodo: ${formatEUR(data.ltv.period_eur)} · ${formatNumber(data.ltv.lifetime_customer_count)} clienti storici`
                      : undefined
                  }
                />
                <StatCard
                  label="Conv. Landing → Acquisto"
                  value={formatPct(data.funnel.headline.landing_to_purchase)}
                  hint="Visitatori unici → completato acquisto"
                />
              </div>
            </section>

            {/* Per prodotto */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">Per prodotto</h2>
              <Card>
                <CardContent className="pt-6">
                  {data.products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nessuna vendita nel periodo.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Prodotto</TableHead>
                            <TableHead className="text-right">Vendite</TableHead>
                            <TableHead className="text-right">Incasso</TableHead>
                            <TableHead className="text-right">Mix %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.products.map((p) => (
                            <TableRow key={p.product_code}>
                              <TableCell className="text-sm">
                                <div className="font-medium text-foreground">{p.label}</div>
                                {p.signup_count != null && p.renewal_count != null && p.renewal_count > 0 && (
                                  <div className="text-[10px] text-muted-foreground">
                                    {formatNumber(p.signup_count)} signup · {formatNumber(p.renewal_count)} rinnovi
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-sm">{formatNumber(p.count)}</TableCell>
                              <TableCell className="text-right text-sm">{formatEUR(p.revenue_eur)}</TableCell>
                              <TableCell className="text-right text-sm">{formatPct(p.mix_pct)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* By funnel (classica vs attivazione) */}
            {data.by_funnel && data.by_funnel.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-semibold text-foreground">Per funnel</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.by_funnel.map((f) => {
                    const label =
                      f.funnel_slug === "attivazione"
                        ? "Attivazione"
                        : f.funnel_slug === "classica"
                          ? "Relazioni"
                          : f.funnel_slug;
                    return (
                      <Card key={f.funnel_slug}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-foreground">
                            {label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-1">
                          <div className="font-display text-2xl font-semibold text-foreground">
                            {formatEUR(f.revenue_eur)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(f.order_count)} ordini · {formatNumber(f.unique_customers)} clienti · {formatNumber(f.new_customers)} nuovi
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Payment methods */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Metodo di pagamento
              </h2>
              <Card>
                <CardContent className="pt-6">
                  {data.payment_methods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nessun pagamento nel periodo.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead className="text-right">Ordini</TableHead>
                          <TableHead className="text-right">Incasso</TableHead>
                          <TableHead className="text-right">Quota</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.payment_methods.map((m) => (
                          <TableRow key={m.provider}>
                            <TableCell className="font-medium capitalize">{m.provider}</TableCell>
                            <TableCell className="text-right">{formatNumber(m.count)}</TableCell>
                            <TableCell className="text-right">{formatEUR(m.revenue_eur)}</TableCell>
                            <TableCell className="text-right">{formatPct(m.share_pct)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Apple Pay e Google Pay non sono attualmente distinti dalle carte (dato non disponibile).
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Conversioni — step funnel */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">Conversioni</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard
                  label="Quiz → Acquisto"
                  value={formatPct(data.funnel.headline.quiz_completed_to_purchase)}
                />
                <StatCard
                  label="Paywall → Acquisto"
                  value={formatPct(data.funnel.headline.paywall_to_purchase)}
                />
                <StatCard
                  label="Checkout → Acquisto"
                  value={formatPct(data.funnel.headline.checkout_to_purchase)}
                />
              </div>
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Step</TableHead>
                        <TableHead className="text-right">Eventi</TableHead>
                        <TableHead className="text-right">Visitatori unici</TableHead>
                        <TableHead className="text-right">Conversion vs precedente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.funnel.steps.map((s, i) => {
                        const conv = i === 0 ? null : data.funnel.step_conversions[i - 1];
                        const max = Math.max(...data.funnel.steps.map((x) => x.unique_visitors), 1);
                        const widthPct = (s.unique_visitors / max) * 100;
                        return (
                          <TableRow key={s.event}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-sm">
                                  {EVENT_LABELS[s.event] || s.event}
                                </div>
                                <div className="h-1.5 w-full max-w-xs bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${widthPct}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(s.count)}</TableCell>
                            <TableCell className="text-right">
                              {formatNumber(s.unique_visitors)}
                            </TableCell>
                            <TableCell className="text-right">
                              {conv ? formatPct(conv.pct) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>

            {/* Operativo — sezioni di servizio, collapse di default */}
            <section className="space-y-3">
              <button
                type="button"
                onClick={() => setShowOperational((v) => !v)}
                aria-expanded={showOperational}
                className="w-full flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent hover:border-accent-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground leading-tight">
                      Operativo
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Stato report, generazioni AI e ordini recenti
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {data.report_status.failed > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-destructive/10 text-destructive border-destructive/30">
                      <AlertCircle className="h-3 w-3" />
                      {formatNumber(data.report_status.failed)} falliti
                    </span>
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {showOperational ? "Nascondi" : "Mostra"}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${showOperational ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
            </section>

            {showOperational && (
              <>
            {/* Report status */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">Stato report</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Completati" value={formatNumber(data.report_status.completed)} />
                <StatCard label="In attesa" value={formatNumber(data.report_status.pending)} />
                <StatCard label="Falliti" value={formatNumber(data.report_status.failed)} />
                <StatCard
                  label="Tasso errore"
                  value={formatPct(data.report_status.error_rate_pct)}
                  hint="Falliti / (completati + falliti)"
                />
              </div>
            </section>

            {/* AI generations */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Generazioni AI
                </h2>
                {aiLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {presets.map((p) => (
                  <Button
                    key={p.key}
                    size="sm"
                    variant={aiPreset === p.key ? "default" : "outline"}
                    onClick={() => setAiPreset(p.key)}
                  >
                    {p.label}
                  </Button>
                ))}
                {aiPreset === "custom" && (
                  <div className="flex items-center gap-2 ml-2">
                    <Input
                      type="date"
                      value={aiCustomFrom}
                      onChange={(e) => setAiCustomFrom(e.target.value)}
                      className="h-9 w-40"
                    />
                    <span className="text-sm text-muted-foreground">→</span>
                    <Input
                      type="date"
                      value={aiCustomTo}
                      onChange={(e) => setAiCustomTo(e.target.value)}
                      className="h-9 w-40"
                    />
                  </div>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {aiRange.fromDate} – {aiRange.toDate}
                </span>
              </div>
              {!aiMetrics ? (
                <Card>
                  <CardContent className="pt-6 text-sm text-muted-foreground">
                    {aiLoading ? "Caricamento metriche AI…" : "Metriche AI non disponibili."}
                  </CardContent>
                </Card>
              ) : aiMetrics.overall.count === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-sm text-muted-foreground">
                    Nessuna chiamata LLM nel periodo.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                      label="Chiamate LLM"
                      value={formatNumber(aiMetrics.overall.count)}
                      hint={`${formatNumber(aiMetrics.overall.attempts.retried)} con retry`}
                    />
                    <StatCard
                      label="Tasso successo"
                      value={formatPct(aiMetrics.overall.success_rate_pct)}
                    />
                    <StatCard
                      label="Durata mediana"
                      value={formatDuration(aiMetrics.overall.duration_ms.p50)}
                      hint={`p95 ${formatDuration(aiMetrics.overall.duration_ms.p95)}`}
                    />
                    <StatCard
                      label="Token totali"
                      value={formatNumber(aiMetrics.overall.tokens.total)}
                      hint={`${formatNumber(aiMetrics.overall.tokens.prompt)} in / ${formatNumber(aiMetrics.overall.tokens.completion)} out`}
                    />
                  </div>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">
                        Per funzione
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Funzione</TableHead>
                              <TableHead className="text-right">Chiamate</TableHead>
                              <TableHead className="text-right">Successo</TableHead>
                              <TableHead className="text-right">Durata mediana</TableHead>
                              <TableHead className="text-right">p95</TableHead>
                              <TableHead className="text-right">Max</TableHead>
                              <TableHead className="text-right">Token medi</TableHead>
                              <TableHead className="text-right">Retry</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {aiMetrics.per_function.map((f) => (
                              <TableRow key={f.function_name}>
                                <TableCell className="text-sm font-medium">
                                  {FUNCTION_LABELS[f.function_name] || f.function_name}
                                  <div className="text-[10px] text-muted-foreground font-mono">
                                    {f.function_name}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {formatNumber(f.count)}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {formatPct(f.success_rate_pct)}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums">
                                  {formatDuration(f.duration_ms.p50)}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums">
                                  {formatDuration(f.duration_ms.p95)}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums">
                                  {formatDuration(f.duration_ms.max)}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums">
                                  {f.count > 0
                                    ? formatNumber(Math.round(f.tokens.total / f.count))
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {formatNumber(f.attempts.retried)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                  {aiMetrics.slowest.length > 0 && (() => {
                    const slowestFunctions = Array.from(
                      new Set(aiMetrics.slowest.map((s) => s.function_name)),
                    ).sort();
                    const filteredSlowest =
                      slowestFunctionFilter === "all"
                        ? aiMetrics.slowest
                        : aiMetrics.slowest.filter(
                            (s) => s.function_name === slowestFunctionFilter,
                          );
                    return (
                    <Card>
                      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3 space-y-0">
                        <CardTitle className="text-sm font-medium text-foreground">
                          Generazioni più lente
                        </CardTitle>
                        <Select
                          value={slowestFunctionFilter}
                          onValueChange={setSlowestFunctionFilter}
                        >
                          <SelectTrigger className="h-8 w-[200px] text-xs">
                            <SelectValue placeholder="Tutte le funzioni" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tutte le funzioni</SelectItem>
                            {slowestFunctions.map((fn) => (
                              <SelectItem key={fn} value={fn}>
                                {FUNCTION_LABELS[fn] || fn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Quando</TableHead>
                                <TableHead>Funzione</TableHead>
                                <TableHead className="text-right">Durata</TableHead>
                                <TableHead className="text-right">Tentativo</TableHead>
                                <TableHead className="text-right">Token</TableHead>
                                <TableHead>Esito</TableHead>
                                <TableHead>Sessione</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredSlowest.length === 0 ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={7}
                                    className="text-center text-sm text-muted-foreground py-6"
                                  >
                                    Nessuna generazione per il filtro selezionato.
                                  </TableCell>
                                </TableRow>
                              ) : filteredSlowest.map((s) => (
                                <TableRow key={s.id}>
                                  <TableCell className="text-xs whitespace-nowrap">
                                    {formatDate(s.created_at)}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {FUNCTION_LABELS[s.function_name] || s.function_name}
                                  </TableCell>
                                  <TableCell className="text-right text-sm tabular-nums">
                                    {formatDuration(s.duration_ms)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm">{s.attempt}</TableCell>
                                  <TableCell className="text-right text-sm tabular-nums">
                                    {s.total_tokens == null ? "—" : formatNumber(s.total_tokens)}
                                  </TableCell>
                                  <TableCell>
                                    {s.success ? (
                                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-medium">
                                        ok
                                      </span>
                                    ) : (
                                      <span
                                        className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border bg-destructive/10 text-destructive border-destructive/30 font-medium"
                                        title={s.error_code || ""}
                                      >
                                        {s.error_code || "fail"}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-[11px] text-muted-foreground font-mono max-w-[180px] truncate">
                                    {s.quiz_session_id || s.transit_cycle_id || "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })()}
                  {aiMetrics.meta.truncated && (
                    <p className="text-[11px] text-amber-600">
                      Limite di {formatNumber(aiMetrics.meta.rows_scanned)} righe raggiunto — i dati potrebbero essere parziali.
                    </p>
                  )}
                </>
              )}
            </section>

            {/* Recent orders */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">Ordini recenti</h2>
              <Card>
                <CardContent className="pt-6">
                  {data.recent_orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nessun ordine nel periodo.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Prodotto</TableHead>
                            <TableHead className="text-right">Importo</TableHead>
                            <TableHead>Metodo</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead>Report</TableHead>
                            <TableHead>Tx ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.recent_orders.map((o) => (
                            <TableRow key={o.order_id}>
                              <TableCell className="text-xs whitespace-nowrap">
                                {formatDate(o.date)}
                              </TableCell>
                              <TableCell className="text-sm">{o.email || "—"}</TableCell>
                              <TableCell className="text-sm">{o.product_label}</TableCell>
                              <TableCell className="text-right text-sm">
                                {o.amount_missing ? (
                                  <span
                                    className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border bg-amber-500/15 text-amber-700 border-amber-500/30 font-medium"
                                    title="Importo non registrato — da riconciliare con Stripe/PayPal"
                                  >
                                    da riconciliare
                                  </span>
                                ) : (
                                  formatEUR(o.amount_eur)
                                )}
                              </TableCell>
                              <TableCell className="capitalize text-sm">
                                {o.provider || "—"}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={o.payment_status} />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <StatusBadge status={o.report_status} />
                                  {o.report_url && (
                                    <a
                                      href={o.report_url}
                                      className="text-primary hover:underline text-xs"
                                    >
                                      apri
                                    </a>
                                  )}
                                </div>
                                {o.report_error && (
                                  <p className="text-[10px] text-destructive mt-1 max-w-[200px] truncate" title={o.report_error}>
                                    {o.report_error}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell className="text-[11px] text-muted-foreground font-mono max-w-[160px] truncate" title={o.provider_payment_id || ""}>
                                {o.provider_payment_id || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
              </>
            )}

            {/* Subscriptions */}
            {data.subscriptions && (
              <section className="space-y-3">
                <h2 className="font-display text-lg font-semibold text-foreground">Abbonamenti transiti</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatCard
                    label="Attivi"
                    value={formatNumber(data.subscriptions.active)}
                    hint={`${data.subscriptions.cancelling} in disdetta`}
                  />
                  <StatCard
                    label="MRR"
                    value={formatEUR(data.subscriptions.mrr_eur)}
                    hint={`€${data.subscriptions.monthly_price_eur.toFixed(2).replace(".", ",")} × abbonati`}
                  />
                  <StatCard
                    label="Nuovi abbonati nel periodo"
                    value={formatNumber(data.subscriptions.new_in_period)}
                  />
                  <StatCard
                    label="Disdetti nel periodo"
                    value={formatNumber(data.subscriptions.churned_in_period)}
                  />
                  <StatCard
                    label="Mesi medi di permanenza"
                    value={
                      data.subscriptions.avg_months_retained == null
                        ? "—"
                        : data.subscriptions.avg_months_retained.toFixed(1)
                    }
                    hint="Calcolato sui churned"
                  />
                </div>
              </section>
            )}

            {/* Customers */}
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">Clienti</h2>

              {/* Riepilogo: una sola card con i 3 numeri chiave */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        Clienti nel periodo
                      </div>
                      <div className="font-display text-2xl font-semibold text-foreground">
                        {formatNumber(data.customers.total)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        Di cui nuovi
                      </div>
                      <div className="font-display text-2xl font-semibold text-foreground">
                        {formatNumber(data.customers.new_in_period)}
                        {data.customers.new_pct != null && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({data.customers.new_pct.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        Ricorrenti
                      </div>
                      <div className="font-display text-2xl font-semibold text-foreground">
                        {formatNumber(data.customers.repeat)}
                        <span className="text-sm text-muted-foreground ml-2">2+ ordini lifetime</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filtri */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { key: "new", label: "Nuovi nel periodo" },
                    { key: "subscribers", label: "Con abbonamento" },
                    { key: "top_ltv", label: "Top LTV" },
                    { key: "all", label: "Tutti" },
                  ] as { key: CustomerFilter; label: string }[]
                ).map((f) => (
                  <Button
                    key={f.key}
                    size="sm"
                    variant={customerFilter === f.key ? "default" : "outline"}
                    onClick={() => setCustomerFilter(f.key)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>

              {/* Tabella + paginazione */}
              {(() => {
                const base = data.customers.list;
                let filtered = base;
                if (customerFilter === "new") filtered = base.filter((c) => c.is_new_in_period);
                else if (customerFilter === "subscribers") filtered = base.filter((c) => c.is_subscriber);
                else if (customerFilter === "top_ltv") filtered = [...base].sort((a, b) => b.total_eur - a.total_eur);
                const visible = filtered.slice(0, customerVisibleCount);
                const hasMore = filtered.length > visible.length;
                return (
                  <Card>
                    <CardContent className="pt-6">
                      {filtered.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {customerFilter === "new"
                            ? "Nessun cliente nuovo nel periodo."
                            : customerFilter === "subscribers"
                              ? "Nessun cliente con abbonamento."
                              : "Nessun cliente."}
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Speso periodo</TableHead>
                                <TableHead className="text-right">Speso lifetime</TableHead>
                                <TableHead className="text-right">Ordini lifetime</TableHead>
                                <TableHead>Ultimo</TableHead>
                                <TableHead>Prodotti</TableHead>
                                <TableHead>Stato</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {visible.map((c) => (
                                <TableRow key={c.email}>
                                  <TableCell className="text-sm">{c.email}</TableCell>
                                  <TableCell className="text-right text-sm">{formatEUR(c.period_spend_eur)}</TableCell>
                                  <TableCell className="text-right text-sm font-medium">{formatEUR(c.total_eur)}</TableCell>
                                  <TableCell className="text-right text-sm">{formatNumber(c.order_count)}</TableCell>
                                  <TableCell className="text-xs whitespace-nowrap">{formatDate(c.last_order_at)}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground max-w-[260px]">
                                    {c.products.join(", ") || "—"}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {c.is_new_in_period && (
                                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border bg-primary/10 text-primary border-primary/30 font-medium">
                                          Nuovo
                                        </span>
                                      )}
                                      {c.is_subscriber && (
                                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-medium">
                                          Abbonato
                                        </span>
                                      )}
                                      {!c.is_new_in_period && !c.is_subscriber && (
                                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border bg-muted text-muted-foreground border-border font-medium">
                                          Esistente
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 mt-3 text-xs text-muted-foreground">
                        <span>
                          {visible.length} di {filtered.length} clienti
                        </span>
                        {hasMore && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCustomerVisibleCount((v) => v + CUSTOMERS_PAGE_SIZE)}
                          >
                            Carica altri {Math.min(CUSTOMERS_PAGE_SIZE, filtered.length - visible.length)}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
