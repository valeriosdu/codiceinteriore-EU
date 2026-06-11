import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuiz, clearFunnelStorage } from "@/context/QuizContext";
import { supabase } from "@/integrations/supabase/client";
import ReportSection from "@/components/ReportSection";
import ReportFeedback from "@/components/ReportFeedback";
import Footer from "@/components/Footer";
import {
  Loader2,
  LogOut,
  User,
  Download,
  Settings,
  ChevronDown,
  FileText,
  Sparkles,
  Mail,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.webp";
import { useAuthReady } from "@/hooks/useAuthReady";
import NatalChartSvg from "@/components/NatalChartSvg";
import TransitsUpsellCard from "@/components/TransitsUpsellCard";
import { AstrologyGuideProvider } from "@/components/astrology-guide/AstrologyGuideContext";
import AstrologyGuideWidget from "@/components/astrology-guide/AstrologyGuideWidget";
import AskAboutSectionButton from "@/components/astrology-guide/AskAboutSectionButton";
import { isLovablePreview, DEMO_FULL_REPORT, DEMO_USER_NAME, DEMO_EMAIL } from "@/lib/preview-mode";
import { getFunnelConfig } from "@/funnels/registry";
import { toast } from "sonner";
import { useSynastryReport } from "@/hooks/useSynastryReport";
import SynastryReportCard from "@/components/SynastryReportCard";

type UserReportOption = {
  id: string;
  quizSessionId: string;
  stripeSessionId: string | null;
  label: string;
  isActive: boolean;
  createdAt: string;
  userName: string;
  hasFullReport: boolean;
  processingStatus: string | null;
};

type TransitCycle = {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  fetch_status: string;
  interpretation_status: string;
  interpreted_transits: {
    summary?: {
      main_themes?: string[];
      overall_reading?: string;
    };
    periods?: { label: string; date_range: string; headline: string; focus: string }[];
    closing?: { title: string; text: string };
    intro?: string;
    mainThemes?: string[];
    weeklyWindows?: { title: string; body: string }[];
    keyAspects?: { title: string; body: string }[];
    practicalNotes?: string[];
  } | null;
  processing_error: string | null;
};

type TransitSubscription = {
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
};

type TransitState = {
  hasAccess: boolean;
  cycle: TransitCycle | null;
  allCycles: TransitCycle[];
  entitlementEndsAt: string | null;
  subscription: TransitSubscription | null;
};

const MONTH_LABEL_IT = [
  "gen", "feb", "mar", "apr", "mag", "giu",
  "lug", "ago", "set", "ott", "nov", "dic",
];

const formatTransitPeriod = (start: string | null | undefined, end: string | null | undefined) => {
  if (!start || !end) return "";
  const parse = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return { y, m, d };
  };
  const a = parse(start);
  const b = parse(end);
  if (!a.y || !b.y) return "";
  const fmt = (p: { y: number; m: number; d: number }, includeYear: boolean) =>
    `${p.d} ${MONTH_LABEL_IT[p.m - 1] || ""}${includeYear ? " " + p.y : ""}`;
  return `${fmt(a, a.y !== b.y)} – ${fmt(b, true)}`;
};

const hasPaidCheckoutSession = (value: string | null | undefined) =>
  typeof value === "string" && (/^cs_(test|live)_/.test(value) || value.startsWith("pp_"));

const isIncompletePaidState = (status: string | null | undefined) =>
  ["insights_ready", "report_processing", "chart_processing", "insights_processing", "failed"].includes(status || "");

// Some reports were stored with literal escape sequences (backslash +
// "n") instead of real newlines, because the LLM tool-call payload
// double-escaped them. Convert them back so paragraph splitting works
// correctly when rendering on screen.
const normalizeText = (value: string | null | undefined): string =>
  (value || "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n");

// Cross-funnel section aliases. classica and attivazione name some equivalent
// sections differently (e.g. `work` vs `work_direction`), and attivazione
// merges emotions+relationships into one. A report saved under one funnel's key
// scheme must still render under the other's section config, so each section id
// lists fallbacks tried in order when its primary key is empty. A nested array
// means "assemble by joining the non-empty parts" (covers the legacy classica
// patterns+blocks split too). Fallbacks fire ONLY when the direct key is empty,
// so correctly-keyed reports are never altered.
const SECTION_FALLBACKS: Record<string, (string | string[])[]> = {
  work: ["work_direction"],
  work_direction: ["work"],
  patterns_blocks: ["blocks_patterns", ["patterns", "blocks"]],
  blocks_patterns: ["patterns_blocks", ["patterns", "blocks"]],
  emotions_relationships: [["emotions", "relationships"]],
  emotions: ["emotions_relationships"],
};

const pickSectionString = (
  fullReport: Record<string, unknown> | null | undefined,
  key: string,
): string => {
  const v = fullReport ? (fullReport as Record<string, unknown>)[key] : null;
  return typeof v === "string" && v.trim() ? v : "";
};

const resolveSectionContent = (
  fullReport: Record<string, unknown> | null | undefined,
  sectionId: string,
): string => {
  const direct = pickSectionString(fullReport, sectionId);
  if (direct) return direct;
  for (const fallback of SECTION_FALLBACKS[sectionId] ?? []) {
    if (Array.isArray(fallback)) {
      const parts = fallback.map((k) => pickSectionString(fullReport, k)).filter(Boolean);
      if (parts.length > 0) return parts.join("\n\n");
    } else {
      const v = pickSectionString(fullReport, fallback);
      if (v) return v;
    }
  }
  return "";
};

const Report = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const feedbackSource: "web" | "pdf" = new URLSearchParams(location.search).get("source") === "pdf" ? "pdf" : "web";
  const { data, updateData, resetQuizForNewPurchase } = useQuiz();
  const { isReady: authReady, user } = useAuthReady();
  // Per-angle section list. Drives both the sidebar nav and the body render.
  // Sections whose id is missing from full_report (e.g. legacy classica reports
  // viewed under attivazione registry, or vice versa) silently skip.
  const funnelConfig = getFunnelConfig(data.funnelSlug);
  const reportSections = funnelConfig.report.sections;
  const sectionIds = reportSections.map(({ id, label }) => ({ id, label }));
  const [activeSection, setActiveSection] = useState(reportSections[0]?.id || "identity");
  const [loading, setLoading] = useState(!data.fullReport);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(data.userName || null);
  const [firstReportName, setFirstReportName] = useState<string | null>(null);
  const [reportOptions, setReportOptions] = useState<UserReportOption[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedQuizSessionId, setSelectedQuizSessionId] = useState<string | null>(data.sessionId || null);
  const [switchingReportId, setSwitchingReportId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [transitPdfLoading, setTransitPdfLoading] = useState(false);
  const content = data.fullReport;
  const [transitState, setTransitState] = useState<TransitState>({
    hasAccess: false,
    cycle: null,
    allCycles: [],
    entitlementEndsAt: null,
    subscription: null,
  });
  const [portalLoading, setPortalLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { sessions: synSessions } = useSynastryReport(profileId, userEmail);
  const visibleSectionIds = (() => {
    const ids = transitState.hasAccess
      ? [...sectionIds, { id: "transits", label: "Transiti" }]
      : [...sectionIds];
    if (synSessions.length > 0) ids.push({ id: "synastry", label: "Sinastria" });
    return ids;
  })();

  const loadTransitState = async (profileId: string, quizSessionId: string) => {
    // Load ALL transit entitlements for this profile/quiz session, not just the
    // latest. Each paid period (initial sub, renewal, one-time addon) creates
    // its own entitlement row. We want every cycle attached to any of them to
    // remain consultable, even after that period's ends_at has passed.
    const { data: entitlements } = await (supabase as any)
      .from("user_entitlements")
      .select("id, starts_at, ends_at, source")
      .eq("profile_id", profileId)
      .eq("quiz_session_id", quizSessionId)
      .eq("entitlement_type", "monthly_transits")
      .eq("status", "active")
      .order("ends_at", { ascending: false });

    // Subscription is per-profile (not per quiz session) — load latest active.
    const { data: subscription } = await (supabase as any)
      .from("transit_subscriptions")
      .select("status, cancel_at_period_end, current_period_end")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const entitlementRows = (entitlements || []) as Array<{
      id: string;
      starts_at: string | null;
      ends_at: string | null;
    }>;
    const latestEndsAt = entitlementRows[0]?.ends_at || null;

    if (entitlementRows.length === 0) {
      setTransitState({
        hasAccess: false,
        cycle: null,
        allCycles: [],
        entitlementEndsAt: latestEndsAt,
        subscription: (subscription as TransitSubscription | null) || null,
      });
      return;
    }

    const entitlementIds = entitlementRows.map((e) => e.id);
    const { data: cyclesData } = await (supabase as any)
      .from("transit_cycles")
      .select(
        "id, period_start, period_end, status, fetch_status, interpretation_status, interpreted_transits, processing_error",
      )
      .in("entitlement_id", entitlementIds)
      .order("period_start", { ascending: false });

    const rawCycles = (cyclesData || []) as TransitCycle[];
    // Defensive dedupe by period: historically two code paths (the subscription
    // webhook and sync-checkout-session) could create two cycles for the same
    // period. Keep the most progressed one so the month picker shows a single
    // entry per period even for already-affected customers.
    const cycleRank = (c: TransitCycle) =>
      (c.interpreted_transits ? 4 : 0) +
      (c.interpretation_status === "completed" ? 2 : 0) +
      (c.status === "completed" ? 1 : 0);
    const cyclesByPeriod = new Map<string, TransitCycle>();
    for (const c of rawCycles) {
      const key = `${c.period_start}|${c.period_end}`;
      const prev = cyclesByPeriod.get(key);
      if (!prev || cycleRank(c) > cycleRank(prev)) cyclesByPeriod.set(key, c);
    }
    const allCycles = Array.from(cyclesByPeriod.values()).sort((a, b) =>
      a.period_start < b.period_start ? 1 : -1,
    );
    // Pick default: the cycle whose period covers today (local date), falling
    // back to the most recent one (allCycles[0]).
    const todayYmd = new Date().toISOString().slice(0, 10);
    const currentCycle =
      allCycles.find((c) => c.period_start <= todayYmd && todayYmd < c.period_end) ||
      allCycles[0] ||
      null;

    // hasAccess: section is rendered if the user has ever had transits. Past
    // cycles stay consultable even when no current period is active (cliente
    // paga, cliente legge — sempre).
    setTransitState({
      hasAccess: allCycles.length > 0,
      cycle: currentCycle,
      allCycles,
      entitlementEndsAt: latestEndsAt,
      subscription: (subscription as TransitSubscription | null) || null,
    });
  };

  const openTransitPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-transit-portal-session");
      if (error) throw error;
      if (!data?.url) throw new Error("Portale non disponibile");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("portal error:", err);
      toast.error(err instanceof Error ? err.message : "Non siamo riusciti ad aprire la gestione abbonamento.");
    } finally {
      setPortalLoading(false);
    }
  };

  useEffect(() => {
    if (authReady) setUserEmail(user?.email || null);
  }, [authReady, user]);

  // Lovable preview short-circuit: render demo report instead of hitting DB/auth.
  useEffect(() => {
    if (!isLovablePreview()) return;
    if (data.fullReport) return;
    updateData({
      fullReport: DEMO_FULL_REPORT,
      userName: data.userName || DEMO_USER_NAME,
    });
    setUserName(data.userName || DEMO_USER_NAME);
    setUserEmail(DEMO_EMAIL);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // For authenticated users, always prefer the report linked to their profile.
  useEffect(() => {
    if (isLovablePreview()) return;
    if (!authReady) return;

    const loadFromDb = async () => {
      try {
        if (!user) {
          if (data.fullReport) {
            setLoading(false);
            return;
          }
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, quiz_session_id")
          .eq("user_id", user.id)
          .single();

        if (!profile?.id) {
          setLoading(false);
          return;
        }

        setProfileId(profile.id);

        const { data: userReports } = await (supabase as any)
          .from("user_reports")
          .select(
            "id, quiz_session_id, stripe_session_id, label, is_active, created_at, quiz_sessions(full_report, user_name, processing_status)",
          )
          .eq("profile_id", profile.id)
          .order("created_at", { ascending: false });

        const options: UserReportOption[] = (userReports || []).map((item: any) => ({
          id: item.id,
          quizSessionId: item.quiz_session_id,
          stripeSessionId: item.stripe_session_id,
          label: item.label || item.quiz_sessions?.user_name || "Lettura personale",
          isActive: Boolean(item.is_active),
          createdAt: item.created_at,
          userName: item.quiz_sessions?.user_name || "",
          hasFullReport: Boolean(item.quiz_sessions?.full_report),
          processingStatus: item.quiz_sessions?.processing_status || null,
        }));

        setReportOptions(options);

        // Greeting in the header should always show the FIRST (oldest) profile
        // name, not the currently selected report. When the user adds more
        // profiles for friends/family, the "Ciao X" must stay anchored to the
        // account owner.
        const oldestWithName = [...options]
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .find((o) => o.userName?.trim());
        if (oldestWithName) {
          setFirstReportName(oldestWithName.userName);
        }

        const activeOption =
          options.find((item) => item.isActive && item.hasFullReport) || options.find((item) => item.hasFullReport);
        const preferredQuizSessionId = activeOption?.quizSessionId || profile.quiz_session_id;

        const { data: quizSession } = preferredQuizSessionId
          ? await supabase
              .from("quiz_sessions")
              .select("full_report, user_name, processing_status, natal_chart_svg")
              .eq("id", preferredQuizSessionId)
              .single()
          : { data: null };

        if (quizSession?.full_report && preferredQuizSessionId) {
          await loadTransitState(profile.id, preferredQuizSessionId);
          updateData({
            sessionId: preferredQuizSessionId,
            fullReport: quizSession.full_report as Record<string, string>,
            userName: quizSession.user_name || "",
            natalChartSvg: (quizSession as any).natal_chart_svg ?? null,
          });
          setSelectedReportId(activeOption?.id || null);
          setSelectedQuizSessionId(preferredQuizSessionId);
          if (quizSession.user_name && !userName) {
            setUserName(quizSession.user_name);
          }
          return;
        }

        const pendingPaidOption = options.find(
          (item) => hasPaidCheckoutSession(item.stripeSessionId) && isIncompletePaidState(item.processingStatus),
        );

        if (
          ["report_processing", "chart_processing", "insights_processing"].includes(
            quizSession?.processing_status || "",
          ) ||
          pendingPaidOption
        ) {
          navigate("/report-processing", { replace: true });
        }
      } catch (err) {
        console.error("Failed to load report from DB:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFromDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id]);

  // Post-checkout activation flow for the transits upsell.
  // When the user lands on /report?transits=activated&session_id=cs_..., we:
  //   1. Call sync-checkout-session as a backstop in case the Stripe webhook
  //      missed the addon (covers the race where the webhook arrives before
  //      the profile has been resolved).
  //   2. Poll loadTransitState for up to ~40s waiting for the cycle to flip
  //      to status=completed, then refresh the URL to drop the params.
  useEffect(() => {
    if (isLovablePreview()) return;
    if (!authReady || !user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("transits") !== "activated") return;
    const sessionIdParam = params.get("session_id") || "";
    let cancelled = false;

    (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, quiz_session_id")
          .eq("user_id", user.id)
          .single();
        if (!profile?.id) return;

        // 1) Backstop reconciliation. Idempotent on the server.
        if (sessionIdParam) {
          try {
            await supabase.functions.invoke("sync-checkout-session", {
              body: { sessionId: sessionIdParam },
            });
          } catch (err) {
            // Non-fatal: the orphan sweep inside sync-checkout-session also
            // runs without a sessionId, so the next poll cycle will still pick
            // it up if the addon was paid.
            console.warn("[transits] sync-checkout-session backstop failed:", err);
          }
        } else {
          // No session_id in the URL → still ask for an orphan sweep.
          try {
            await supabase.functions.invoke("sync-checkout-session", { body: {} });
          } catch {
            /* noop */
          }
        }

        // 2) Poll the transit state until cycle.status === 'completed' or we
        //    give up. We resolve a quizSessionId for loadTransitState the same
        //    way the main load flow does.
        const quizSessionIdForTransits = selectedQuizSessionId || data.sessionId || profile.quiz_session_id || null;
        if (!quizSessionIdForTransits) return;

        const MAX_ATTEMPTS = 10;
        const INTERVAL_MS = 4000;
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          if (cancelled) return;
          await loadTransitState(profile.id, quizSessionIdForTransits);
          // We can't read the state atomically here (setState is async), so
          // re-query the cycle directly to decide whether to stop.
          const { data: cycleRow } = await (supabase as any)
            .from("transit_cycles")
            .select("status")
            .eq("profile_id", profile.id)
            .eq("quiz_session_id", quizSessionIdForTransits)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (cycleRow?.status === "completed") {
            if (!cancelled) {
              navigate("/report", { replace: true });
              toast.success("Transiti attivati. Trovi la sezione qui sotto.");
            }
            return;
          }
          await new Promise((r) => setTimeout(r, INTERVAL_MS));
        }
        // Timed out — clear the params anyway so a refresh doesn't restart
        // the polling. The user can still see the transits the next time
        // the page loads.
        if (!cancelled) {
          navigate("/report", { replace: true });
        }
      } catch (err) {
        console.error("[transits] activation flow error:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id]);

  const handleSelectReport = async (option: UserReportOption) => {
    if (selectedReportId === option.id) return;
    if (switchingReportId) return;
    setSwitchingReportId(option.id);
    try {
      const { data: quizSession } = await supabase
        .from("quiz_sessions")
        .select("full_report, user_name, processing_status, natal_chart_svg")
        .eq("id", option.quizSessionId)
        .single();

      if (!quizSession?.full_report) {
        if (hasPaidCheckoutSession(option.stripeSessionId) && isIncompletePaidState(quizSession?.processing_status)) {
          await (supabase as any).from("user_reports").update({ is_active: true }).eq("id", option.id);
          navigate("/report-processing", { replace: true });
        }
        return;
      }

      updateData({
        sessionId: option.quizSessionId,
        fullReport: quizSession.full_report as Record<string, string>,
        userName: quizSession.user_name || "",
        natalChartSvg: (quizSession as any).natal_chart_svg ?? null,
      });
      setUserName(quizSession.user_name || "");
      setSelectedReportId(option.id);
      setSelectedQuizSessionId(option.quizSessionId);

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
        if (profile?.id) {
          await (supabase as any).from("user_reports").update({ is_active: true }).eq("id", option.id);
          await supabase.from("profiles").update({ quiz_session_id: option.quizSessionId }).eq("user_id", user.id);
          await loadTransitState(profile.id, option.quizSessionId);
        }
      }
    } finally {
      setSwitchingReportId(null);
    }
  };

  const handleLogout = async () => {
    if (isLovablePreview()) {
      navigate("/");
      return;
    }
    await supabase.auth.signOut();
    clearFunnelStorage();
    navigate("/");
  };

  // Shared download helper used by both the natal-report and transit
  // PDF buttons. It asks the given edge function for a signed HTTPS URL
  // (mode=url) and then either:
  //  - on iOS / in-app browsers: navigates a pre-opened tab to the
  //    signed URL (so the system PDF viewer / "Save to Files" works).
  //  - elsewhere: clicks an anchor with `download` set.
  // This avoids fragile blob: URLs that often fail on Apple/Meta
  // in-app browsers.
  const downloadPdfFromFunction = async (
    functionPath: "generate-report-pdf" | "generate-transit-pdf",
    setLoading: (v: boolean) => void,
    fallbackBaseName: string,
  ) => {
    if (isLovablePreview()) {
      const { toast } = await import("sonner");
      toast.info("Download PDF disponibile solo in produzione.");
      return;
    }

    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isInAppBrowser = /(FBAN|FBAV|Instagram|Line|Twitter|LinkedInApp)/i.test(ua);
    const needsTabFallback = isIOS || isInAppBrowser;

    let fallbackTab: Window | null = null;
    if (needsTabFallback) {
      fallbackTab = window.open("", "_blank");
      if (fallbackTab) {
        try {
          fallbackTab.document.write(
            `<!doctype html><html><head><meta charset="utf-8"><title>Codice Interiore — PDF</title>
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f7f1e8;color:#2a1f18;padding:32px;text-align:center;line-height:1.5}</style>
            </head><body><p>Stiamo preparando il tuo PDF...</p></body></html>`,
          );
        } catch (_) {
          /* cross-origin write may fail; ignored */
        }
      }
    }

    setLoading(true);
    const { toast } = await import("sonner");

    const closeFallbackTab = () => {
      if (fallbackTab && !fallbackTab.closed) {
        try {
          fallbackTab.close();
        } catch (_) {
          /* noop */
        }
      }
    };

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        closeFallbackTab();
        toast.error("Accedi di nuovo per scaricare il PDF.");
        return;
      }

      const params = new URLSearchParams({ mode: "url" });
      if (selectedQuizSessionId) params.set("quizSessionId", selectedQuizSessionId);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionPath}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        closeFallbackTab();
        let message = "Non siamo riusciti a preparare il PDF. Scrivici e te lo inviamo subito.";
        if (response.status === 401) message = "Accedi di nuovo per scaricare il PDF.";
        if (response.status === 403) message = "Questo download non è incluso nel tuo accesso.";
        if (response.status === 404) message = "Il PDF non è ancora disponibile per il download.";
        if (response.status >= 500) {
          try {
            const errBody = await response.json();
            if (errBody?.detail) console.error("[pdf] server error detail:", errBody.detail);
          } catch (_) {
            /* noop */
          }
          message = "Errore durante la generazione del PDF. Riprova tra un istante o scrivici.";
        }
        throw new Error(message);
      }

      const payload = (await response.json()) as { url?: string; filename?: string };
      const signedUrl = payload?.url;
      if (!signedUrl) {
        closeFallbackTab();
        throw new Error("PDF non disponibile.");
      }

      const filename =
        payload.filename ||
        `${fallbackBaseName}-${
          (userName || "report")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "report"
        }.pdf`;

      if (needsTabFallback) {
        if (fallbackTab && !fallbackTab.closed) {
          fallbackTab.location.href = signedUrl;
          toast.success("PDF aperto in una nuova scheda. Tocca Condividi per salvarlo.");
        } else {
          window.location.href = signedUrl;
        }
      } else {
        const link = document.createElement("a");
        link.href = signedUrl;
        link.download = filename;
        link.rel = "noopener";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        closeFallbackTab();
        toast.success("Download avviato.");
      }
    } catch (err) {
      console.error("PDF download error:", err);
      closeFallbackTab();
      toast.error(err instanceof Error ? err.message : "Errore durante il download. Riprova o scrivici.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewReport = () => {
    resetQuizForNewPurchase();
    navigate("/quiz");
  };

  const handleDownloadPdf = () => downloadPdfFromFunction("generate-report-pdf", setPdfLoading, "codice-interiore");

  const handleDownloadTransitPdf = () =>
    downloadPdfFromFunction("generate-transit-pdf", setTransitPdfLoading, "codice-interiore-transiti");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const didScrollToFeedbackRef = useRef(false);
  useEffect(() => {
    if (didScrollToFeedbackRef.current) return;
    if (loading || !content) return;
    if (location.hash !== "#feedback") return;
    didScrollToFeedbackRef.current = true;
    const t = setTimeout(() => {
      document.getElementById("feedback")?.scrollIntoView({ behavior: "auto", block: "start" });
      // Drop the hash so subsequent renders / state updates don't re-anchor here.
      window.history.replaceState(null, "", `${location.pathname}${location.search}`);
    }, 250);
    return () => clearTimeout(t);
  }, [loading, content, location.hash, location.pathname, location.search]);

  // Wait until the report content is rendered before scrolling to the
  // transits-upsell anchor — otherwise the section may not exist yet at
  // the time the browser tries to resolve the hash.
  const didScrollToTransitsRef = useRef(false);
  useEffect(() => {
    if (didScrollToTransitsRef.current) return;
    if (loading || !content) return;
    if (location.hash !== "#transits-upsell") return;
    didScrollToTransitsRef.current = true;
    const t = setTimeout(() => {
      document.getElementById("transits-upsell")?.scrollIntoView({ behavior: "auto", block: "start" });
      window.history.replaceState(null, "", `${location.pathname}${location.search}`);
    }, 250);
    return () => clearTimeout(t);
  }, [loading, content, location.hash, location.pathname, location.search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    // Authenticated user with no report yet → still generating, send to processing screen.
    if (user) {
      navigate("/report-processing", { replace: true });
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    // Not logged in → show a clear access screen instead of silently
    // redirecting to "/". This is what users coming from the report-ready
    // email link land on if they never completed signup.
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border">
          <div className="container max-w-3xl mx-auto py-4 flex items-center justify-between">
            <img src={logo} alt="Codice Interiore" className="h-8" />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="max-w-sm w-full text-center space-y-6">
            <h1 className="font-display text-3xl font-semibold text-foreground">Accedi al tuo spazio</h1>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Per aprire la tua lettura, accedi con la stessa email che hai usato al momento dell'acquisto.
            </p>
            <div className="space-y-3 pt-2">
              <Button
                variant="premium"
                size="hero"
                className="w-full"
                onClick={() => navigate("/activate?intent=signin")}
              >
                Accedi
              </Button>
              <button
                type="button"
                onClick={() => navigate("/activate?intent=signup")}
                className="block w-full text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Hai pagato e non hai ancora un account? Creane uno
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <AstrologyGuideProvider quizSessionId={selectedQuizSessionId}>
    <div className="min-h-screen bg-background">
      {/* Customer header with logo, user info, logout */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm shadow-sm">
        <div className="container max-w-3xl lg:max-w-6xl mx-auto px-4 lg:px-8 py-2.5 lg:py-4 flex items-center justify-between gap-2 lg:gap-4">
          <img src={logo} alt="Codice Interiore" className="h-7 lg:h-12" />
          <div className="flex items-center gap-1 lg:gap-2">
            <Button
              variant="outline-premium"
              size="sm"
              onClick={handleStartNewReport}
              className="h-8 lg:h-11 px-2.5 lg:px-5 gap-1.5 lg:gap-2 rounded-full text-xs sm:text-sm lg:text-base"
              aria-label="Acquista una nuova lettura"
            >
              <UserPlus className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" />
              <span>Nuova lettura</span>
            </Button>
          {(() => {
            const sub = transitState.subscription;
            const subActive =
              !!sub && ["active", "trialing", "past_due"].includes(sub.status) && !sub.cancel_at_period_end;
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 lg:h-11 px-2 lg:px-3 text-muted-foreground hover:text-foreground gap-2 max-w-[60vw] sm:max-w-none lg:text-sm"
                    aria-label="Menu utente"
                  >
                    <User className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
                    <span className="hidden sm:inline truncate">{userEmail || "Account"}</span>
                    <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 shrink-0 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-xs lg:text-sm text-muted-foreground">Connesso come</p>
                    <p className="text-sm text-foreground truncate">{userEmail || "—"}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Il mio report
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleStartNewReport()}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Acquista un'altra lettura
                  </DropdownMenuItem>
                  {subActive ? (
                    <DropdownMenuItem onSelect={() => openTransitPortal()} disabled={portalLoading}>
                      <Settings className="mr-2 h-4 w-4" />
                      Gestisci abbonamento transiti
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onSelect={() => {
                        requestAnimationFrame(() => {
                          document
                            .getElementById("transits-upsell")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        });
                      }}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Leggi i transiti del mese
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => navigate("/contatti")}>
                    <Mail className="mr-2 h-4 w-4" />
                    Contatti / Supporto
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => handleLogout()} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })()}
          </div>
        </div>
      </header>

      {/* Section nav */}
      <div className="sticky top-[49px] lg:top-[81px] bg-background/95 backdrop-blur-sm border-b border-border z-20">
        <div className="container max-w-3xl mx-auto">
          <div className="flex gap-1 overflow-x-auto py-2.5 scrollbar-hide">
            {visibleSectionIds.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-2xl lg:max-w-3xl mx-auto py-10 space-y-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2 pb-6">
          <p className="text-sm lg:text-base text-muted-foreground">{(firstReportName || userName) ? `Ciao ${firstReportName || userName}` : "Il tuo spazio personale"}</p>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground">La tua lettura completa</h1>
          {reportOptions.length > 1 && (
            <div className="pt-5 text-left space-y-3">
              <p className="text-xs lg:text-sm font-medium uppercase tracking-wider text-primary text-center">
                Scegli quale lettura visualizzare
              </p>
              <div className="grid gap-2">
                {reportOptions.map((option) => {
                  const isSelected = selectedReportId === option.id;
                  const isSwitchingThis = switchingReportId === option.id;
                  const switchingOther = switchingReportId !== null && !isSwitchingThis;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectReport(option)}
                      disabled={switchingReportId !== null || isSelected}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground hover:border-primary/40"
                      } ${switchingOther ? "opacity-60" : ""}`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{option.label}</span>
                        {isSwitchingThis ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          isSelected && <span className="text-xs lg:text-sm text-primary">Attivo</span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs lg:text-sm opacity-80">
                        Report generato il {new Date(option.createdAt).toLocaleDateString("it-IT")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="mt-4 gap-2 text-muted-foreground hover:text-foreground"
          >
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {pdfLoading ? "Preparazione..." : "Scarica il PDF"}
          </Button>
        </motion.div>

        {data.natalChartSvg && (
          <NatalChartSvg svg={data.natalChartSvg} caption="Tocca per ingrandire la tua carta natale" />
        )}

        {reportSections.map((section, index) => {
          const text = normalizeText(resolveSectionContent(content, section.id));
          if (!text) return null;
          return (
            <div key={section.id} id={section.id} className="scroll-mt-28 lg:scroll-mt-32 pb-8">
              <ReportSection title={section.title} index={index}>
                {section.type === "poem" ? (
                  <div className="bg-surface rounded-xl p-8 font-display text-lg lg:text-xl leading-loose text-foreground/90 italic">
                    {text.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </div>
                ) : (
                  text.split("\n\n").map((p, i) => <p key={i}>{p}</p>)
                )}
              </ReportSection>
              {section.type !== "poem" && (
                <AskAboutSectionButton sectionId={section.id} sectionLabel={section.title} />
              )}
              <div className="mt-8 h-px bg-border/40" />
            </div>
          );
        })}

        {transitState.hasAccess && (
          <div id="transits" className="scroll-mt-28 lg:scroll-mt-32">
            <ReportSection title={`Transiti del mese${userName ? ` di ${userName}` : ""}`} index={reportSections.length}>
              {transitState.cycle && (
                <div className="-mt-2 mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    Periodo: {formatTransitPeriod(transitState.cycle.period_start, transitState.cycle.period_end)}
                  </p>
                  <div className="flex items-center gap-2">
                    {transitState.cycle.interpreted_transits && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTransitPdf}
                        disabled={transitPdfLoading}
                        className="h-8 gap-1 text-xs"
                      >
                        {transitPdfLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        {transitPdfLoading ? "Preparazione..." : "Scarica PDF"}
                      </Button>
                    )}
                    {transitState.allCycles.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                            Cambia mese
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                          <DropdownMenuLabel className="text-xs">I tuoi periodi di transiti</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {transitState.allCycles.map((c) => {
                            const isSelected = transitState.cycle?.id === c.id;
                            const todayYmd = new Date().toISOString().slice(0, 10);
                            const isCurrent = c.period_start <= todayYmd && todayYmd < c.period_end;
                            return (
                              <DropdownMenuItem
                                key={c.id}
                                onClick={() =>
                                  setTransitState((prev) => ({ ...prev, cycle: c }))
                                }
                                className={isSelected ? "bg-accent/40 font-medium" : ""}
                              >
                                <span className="flex-1">{formatTransitPeriod(c.period_start, c.period_end)}</span>
                                {isCurrent && (
                                  <span className="ml-2 text-[10px] lg:text-xs uppercase tracking-wider text-primary">
                                    in corso
                                  </span>
                                )}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )}
              {!transitState.cycle || ["pending", "processing"].includes(transitState.cycle.status) ? (
                <p>I transiti del mese sono in preparazione. La tua lettura natale è già sopra.</p>
              ) : transitState.cycle.status === "failed" ? (
                <p>Non siamo riusciti a generare la lettura dei transiti. Riproveremo a breve, oppure scrivici se preferisci.</p>
              ) : transitState.cycle.interpreted_transits ? (
                <div className="space-y-6">
                  {transitState.cycle.interpreted_transits.summary ? (
                    <>
                      {!!transitState.cycle.interpreted_transits.summary.main_themes?.length && (
                        <div className="space-y-2">
                          <h3 className="font-display text-lg lg:text-xl font-semibold text-foreground">Temi principali</h3>
                          <ul className="list-disc pl-5 space-y-2">
                            {transitState.cycle.interpreted_transits.summary.main_themes.map((theme, index) => (
                              <li key={index}>{theme}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {transitState.cycle.interpreted_transits.summary.overall_reading && (
                        <div className="space-y-2">
                          <h3 className="font-display text-lg lg:text-xl font-semibold text-foreground">Lettura del mese</h3>
                          <p>{transitState.cycle.interpreted_transits.summary.overall_reading}</p>
                        </div>
                      )}
                      {!!transitState.cycle.interpreted_transits.periods?.length && (
                        <div className="space-y-4">
                          {transitState.cycle.interpreted_transits.periods.map((period, index) => (
                            <div key={index} className="border-l-2 border-primary/40 pl-4 space-y-1">
                              <p className="text-xs lg:text-sm font-medium uppercase tracking-wider text-primary">
                                {period.label} · {period.date_range}
                              </p>
                              <h4 className="font-display text-lg lg:text-xl font-semibold text-foreground">{period.headline}</h4>
                              <p>{period.focus}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {transitState.cycle.interpreted_transits.closing && (
                        <div className="space-y-2 pt-2">
                          <h3 className="font-display text-lg lg:text-xl font-semibold text-foreground">
                            {transitState.cycle.interpreted_transits.closing.title}
                          </h3>
                          <p>{transitState.cycle.interpreted_transits.closing.text}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {transitState.cycle.interpreted_transits.intro && (
                        <p>{transitState.cycle.interpreted_transits.intro}</p>
                      )}
                      {!!transitState.cycle.interpreted_transits.mainThemes?.length && (
                        <div className="space-y-2">
                          <h3 className="font-display text-lg lg:text-xl font-semibold text-foreground">Temi principali</h3>
                          <ul className="list-disc pl-5 space-y-2">
                            {transitState.cycle.interpreted_transits.mainThemes.map((theme, index) => (
                              <li key={index}>{theme}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!!transitState.cycle.interpreted_transits.weeklyWindows?.length && (
                        <div className="space-y-3">
                          <h3 className="font-display text-lg lg:text-xl font-semibold text-foreground">Finestre del mese</h3>
                          {transitState.cycle.interpreted_transits.weeklyWindows.map((item, index) => (
                            <div key={index} className="border-l-2 border-primary/40 pl-4 space-y-1">
                              <h4 className="font-medium text-foreground">{item.title}</h4>
                              <p>{item.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {!!transitState.cycle.interpreted_transits.keyAspects?.length && (
                        <div className="space-y-3">
                          <h3 className="font-display text-lg lg:text-xl font-semibold text-foreground">Aspetti rilevanti</h3>
                          {transitState.cycle.interpreted_transits.keyAspects.map((item, index) => (
                            <div key={index} className="space-y-1">
                              <h4 className="font-medium text-foreground">{item.title}</h4>
                              <p>{item.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {!!transitState.cycle.interpreted_transits.practicalNotes?.length && (
                        <div className="space-y-2">
                          <h3 className="font-display text-lg lg:text-xl font-semibold text-foreground">Indicazioni pratiche</h3>
                          <ul className="list-disc pl-5 space-y-2">
                            {transitState.cycle.interpreted_transits.practicalNotes.map((note, index) => (
                              <li key={index}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p>Stiamo scrivendo la lettura dei transiti di questo mese.</p>
              )}
            </ReportSection>
          </div>
        )}

        {/* Transits upsell / manage subscription */}
        <div id="transits-upsell" className="scroll-mt-28 lg:scroll-mt-32">
          {(() => {
            const sub = transitState.subscription;
            const subActive =
              sub && ["active", "trialing", "past_due"].includes(sub.status) && !sub.cancel_at_period_end;
            if (subActive) {
              return (
                <div className="rounded-2xl border border-border/60 bg-surface px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Abbonamento transiti mensile attivo</p>
                    {sub?.current_period_end && (
                      <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">
                        Prossimo rinnovo il {new Date(sub.current_period_end).toLocaleDateString("it-IT")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openTransitPortal}
                    disabled={portalLoading}
                    className="gap-2"
                  >
                    {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                    Gestisci abbonamento
                  </Button>
                </div>
              );
            }
            if (sub && sub.cancel_at_period_end) {
              return (
                <div className="rounded-2xl border border-border/60 bg-surface px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Abbonamento in disdetta</p>
                    {sub?.current_period_end && (
                      <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">
                        Accesso attivo fino al {new Date(sub.current_period_end).toLocaleDateString("it-IT")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openTransitPortal}
                    disabled={portalLoading}
                    className="gap-2"
                  >
                    {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                    Gestisci abbonamento
                  </Button>
                </div>
              );
            }
            if (transitState.hasAccess) {
              return <TransitsUpsellCard subscriptionOnly accessEndsAt={transitState.entitlementEndsAt} />;
            }
            if (!transitState.hasAccess) {
              return <TransitsUpsellCard />;
            }
            return null;
          })()}
        </div>

        <div id="synastry" className="scroll-mt-28 lg:scroll-mt-32">
          <SynastryReportCard sessions={synSessions} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] via-surface to-surface px-6 py-7 sm:px-8 sm:py-8 shadow-sm"
        >
          <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.18em] font-medium">
            <UserPlus className="h-3.5 w-3.5" />
            Una nuova lettura
          </div>
          <h3 className="mt-3 font-display text-xl sm:text-2xl font-semibold text-foreground leading-snug">
            Una lettura per qualcun altro?
          </h3>
          <p className="mt-2 text-[15px] lg:text-base text-muted-foreground leading-relaxed max-w-prose">
            Acquista una nuova lettura completa con dati di nascita differenti, per una persona vicina o per fare un
            regalo.
          </p>
          <Button
            variant="premium"
            size="lg"
            onClick={handleStartNewReport}
            className="mt-5 gap-2 w-full sm:w-auto"
          >
            <Sparkles className="h-4 w-4" />
            Acquista una nuova lettura
          </Button>
        </motion.div>

        <ReportFeedback quizSessionId={selectedQuizSessionId} source={feedbackSource} />
      </div>

      <Footer />
      <AstrologyGuideWidget />
    </div>
    </AstrologyGuideProvider>
  );
};

export default Report;
