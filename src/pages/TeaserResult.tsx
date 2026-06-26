import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import InsightCard from "@/components/InsightCard";
import OfferCard from "@/components/OfferCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Testimonials from "@/components/Testimonials";
import ReportPreviewCarousel from "@/components/ReportPreviewCarousel";
import { ArrowRight, Loader2, Lock, Zap, PenLine } from "lucide-react";
import { toast } from "sonner";
import { useQuiz, getStoredSessionId, clearFunnelStorage } from "@/context/QuizContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchQuizSessionPublic } from "@/lib/sessionAccess";
import { useMetaConversions } from "@/hooks/useMetaConversions";
import { useAuthReady } from "@/hooks/useAuthReady";
import CheckoutReview from "@/components/CheckoutReview";
import { isLovablePreview, DEMO_TEASER_INSIGHTS, DEMO_USER_NAME } from "@/lib/preview-mode";
import { trackEvent } from "@/lib/analytics";
import { getFunnelContent } from "@/funnels/registry";
import { useI18n } from "@/i18n/I18nProvider";

// Happy path is 2–5s, so keep the first-attempt window short. On timeout we
// auto-retry (re-invoking process-session-insights). We never dead-end into an
// error screen: for ~2 min we retry quickly (MAX_RECOVERY_ATTEMPTS cycles of
// ~15s poll + 2s pause), then keep retrying at a slower cadence while showing
// reassuring "complex chart" copy, so the page self-heals if the server job
// eventually completes.
const POLL_TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 4000;
const RETRY_PAUSE_MS = 2000;
const MAX_RECOVERY_ATTEMPTS = 6;
// After this many recovery cycles (~75s in), escalate to the strongest
// reassurance copy ("your chart is particularly rich, a couple more minutes").
const COMPLEX_HINT_AFTER_ATTEMPTS = 3;
// Once past the fast window, slow the retry cadence instead of giving up.
const SLOW_RETRY_PAUSE_MS = 20000;

const TeaserResult = () => {
  const navigate = useNavigate();
  const { data, updateData } = useQuiz();
  const { m, market } = useI18n();
  const t = m.teaser;
  // Per-angle UI content (teaser fallbacks, offer copy, FAQ, trust bullets).
  // Defaults to classica when funnelSlug is not set on the session (e.g. user
  // arriving fresh on /teaser without a context).
  const funnelConfig = getFunnelContent(data.funnelSlug, m.funnels);
  const [hasPaid, setHasPaid] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [pollFailed, setPollFailed] = useState(false);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState<"base" | "premium" | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewType, setReviewType] = useState<"base" | "premium" | null>(null);
  const { trackViewContent, trackAddToCart, trackInitiateCheckout } = useMetaConversions();
  const { isReady: authReady, user } = useAuthReady();

  useEffect(() => {
    trackEvent("paywall_viewed", {}, { once: true });
    trackViewContent({
      firstName: data.userName || undefined,
      sessionId: data.sessionId || undefined,
      purchaseType: data.purchaseType || undefined,
      birthDate: data.birthDate,
    });
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    // hasPaid means "paid for THIS quiz session". A returning customer who is
    // buying a second report has profile.stripe_session_id set from their
    // earlier purchase, but for a different quiz_session_id — the offer cards
    // must still appear for the new session.
    const checkPayment = async () => {
      const currentSessionId = data.sessionId || getStoredSessionId();
      if (!currentSessionId) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_session_id, quiz_session_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.stripe_session_id && profile?.quiz_session_id === currentSessionId) {
        setHasPaid(true);
      }
    };
    checkPayment();
  }, [authReady, recoveryAttempt, user, data.sessionId]);

  useEffect(() => {
    if (!pollFailed || sessionReady) return;
    // Never show an error screen. Retry quickly within the first ~2 min, then
    // keep retrying at a slower cadence (page stays on the reassuring copy and
    // self-heals if the background job completes later).
    const pause = recoveryAttempt >= MAX_RECOVERY_ATTEMPTS ? SLOW_RETRY_PAUSE_MS : RETRY_PAUSE_MS;
    const retry = setTimeout(() => {
      setPollFailed(false);
      setRecoveryAttempt((attempt) => attempt + 1);
    }, pause);
    return () => clearTimeout(retry);
  }, [pollFailed, sessionReady, recoveryAttempt]);

  // Track AddToCart after 10s on the teaser (signals real interest, not a bounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      trackAddToCart({
        firstName: data.userName || undefined,
        sessionId: data.sessionId || undefined,
        birthDate: data.birthDate,
      });
    }, 10_000);
    return () => clearTimeout(timer);
  }, []);

  // Lovable preview short-circuit: skip DB / polling and render demo data.
  useEffect(() => {
    if (!isLovablePreview()) return;
    if (sessionReady) return;
    updateData({
      teaserInsights: DEMO_TEASER_INSIGHTS,
      userName: data.userName || DEMO_USER_NAME,
    });
    setSessionReady(true);
    setPollFailed(false);
  }, [sessionReady]);

  useEffect(() => {
    if (isLovablePreview()) return;
    let cancelled = false;

    const hasCompleteTeaser = (row: any) =>
      Boolean(
        row?.natal_chart &&
        row?.processing_status === "insights_ready" &&
        Array.isArray(row.teaser_insights) &&
        row.teaser_insights.length > 0,
      );

    // After insights are ready, keep polling lightly for the SVG (which may
    // arrive a moment later or via a backfill). Silent degradation if it
    // never arrives — the page stays usable without the chart.
    const SVG_POLL_TIMEOUT_MS = 20000;
    const pollSvgInBackground = async (sessionId: string) => {
      const startedAt = Date.now();
      while (!cancelled && Date.now() - startedAt < SVG_POLL_TIMEOUT_MS) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        if (cancelled) return;

        const row = await fetchQuizSessionPublic(sessionId);

        const svg = (row as any)?.natal_chart_svg ?? null;
        if (svg) {
          updateData({ natalChartSvg: svg });
          return;
        }
      }
    };

    const loadOrRecover = async () => {
      const sessionId = data.sessionId || getStoredSessionId();
      if (!sessionId) {
        setPollFailed(true);
        return;
      }

      try {
        const qs = await fetchQuizSessionPublic(sessionId);

        if (qs?.user_name && !data.userName) {
          updateData({ userName: qs.user_name, sessionId });
        }

        if (hasCompleteTeaser(qs)) {
          const svg = (qs as any)?.natal_chart_svg ?? null;
          updateData({
            teaserInsights: qs!.teaser_insights as { title: string; body: string }[],
            natalChart: qs!.natal_chart as any,
            natalChartSvg: svg,
            userName: qs!.user_name || data.userName || "",
            sessionId,
          });
          setSessionReady(true);
          if (!svg) {
            pollSvgInBackground(sessionId).catch(() => {});
          }
          return;
        }

        console.log("[TeaserResult] Triggering recoverable background job for", sessionId);
        supabase.functions
          .invoke("process-session-insights", { body: { sessionId } })
          .catch((e) => console.warn("[TeaserResult] Trigger failed:", e));

        const startedAt = Date.now();
        while (!cancelled && Date.now() - startedAt < POLL_TIMEOUT_MS) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          if (cancelled) return;

          const row = await fetchQuizSessionPublic(sessionId);

          if (hasCompleteTeaser(row)) {
            const svg = (row as any)?.natal_chart_svg ?? null;
            updateData({
              teaserInsights: row!.teaser_insights as { title: string; body: string }[],
              natalChart: row!.natal_chart as any,
              natalChartSvg: svg,
              userName: row!.user_name || data.userName || "",
              sessionId,
            });
            setSessionReady(true);
            if (!svg) {
              pollSvgInBackground(sessionId).catch(() => {});
            }
            return;
          }

          if (row?.processing_status === "failed") {
            supabase.functions
              .invoke("process-session-insights", { body: { sessionId } })
              .catch((e) => console.warn("[TeaserResult] Retry failed:", e));
          }
        }

        if (!cancelled) setPollFailed(true);
      } catch (e) {
        console.error("Failed to load/recover insights:", e);
        if (!cancelled) setPollFailed(true);
      }
    };

    loadOrRecover();
    return () => {
      cancelled = true;
    };
  }, [recoveryAttempt]);

  const handleSelect = async (type: "base" | "premium") => {
    if (isLovablePreview()) {
      toast.info(t.toasts.previewPaymentsDisabled);
      return;
    }
    const sessionId = data.sessionId || getStoredSessionId();
    if (!sessionId || !sessionReady) {
      toast.error(t.toasts.stillCompleting);
      return;
    }

    setCheckoutLoading(type);
    updateData({ purchaseType: type });

    trackInitiateCheckout({
      firstName: data.userName || undefined,
      sessionId,
      purchaseType: type,
      birthDate: data.birthDate,
    });

    try {
      const row = await fetchQuizSessionPublic(sessionId);

      if (
        !row?.natal_chart ||
        row.processing_status !== "insights_ready" ||
        !Array.isArray(row.teaser_insights) ||
        row.teaser_insights.length === 0
      ) {
        throw new Error("session_not_ready");
      }

      // Open the review modal instead of redirecting straight to Stripe.
      setReviewType(type);
      setReviewOpen(true);
    } catch (e: any) {
      console.error("Checkout pre-check error:", e);
      toast.error(t.toasts.stillPreparing);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleOpenFullReport = async () => {
    if (isLovablePreview()) {
      navigate("/report");
      return;
    }
    if (!authReady || !user) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("quiz_session_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.quiz_session_id) {
        navigate("/report-processing");
        return;
      }

      const { data: quizSession } = await supabase
        .from("quiz_sessions")
        .select("full_report")
        .eq("id", profile.quiz_session_id)
        .maybeSingle();

      navigate(quizSession?.full_report ? "/report" : "/report-processing");
    } catch (e) {
      console.error("Failed to check existing report:", e);
      navigate("/report-processing");
    }
  };

  if (!sessionReady) {
    // Staged, reassuring copy — never an error. Escalates from normal → slow →
    // "complex chart" the longer generation takes; the page keeps retrying.
    const loadingMessage =
      recoveryAttempt >= COMPLEX_HINT_AFTER_ATTEMPTS
        ? t.loading.complex
        : pollFailed || recoveryAttempt > 0
          ? t.loading.slow
          : t.loading.normal;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {t.loading.title}
        </h1>
        <p className="text-sm text-foreground/70 max-w-xs leading-relaxed">
          {loadingMessage}
        </p>
      </div>
    );
  }

  const hasReal = data.teaserInsights && data.teaserInsights.length > 0;
  const insights = hasReal ? data.teaserInsights! : funnelConfig.teaser.fallbackInsights;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Teaser */}
      <div className="container mx-auto py-8 md:py-12 max-w-xl md:max-w-5xl space-y-10 md:space-y-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 max-w-xl mx-auto"
        >
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
            {t.hero.title(data.userName)}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {t.hero.subtitle}
          </p>
          {(data.birthDate || data.birthTime || data.birthPlace) && (
            <div className="pt-2 text-xs text-muted-foreground/80 space-y-1">
              <p>
                {data.birthDate && (
                  <span>
                    {String(data.birthDate.day).padStart(2, "0")}/{String(data.birthDate.month).padStart(2, "0")}/
                    {data.birthDate.year}
                  </span>
                )}
                {data.birthTime && (
                  <span>
                    {" · "}
                    {String(data.birthTime.hour).padStart(2, "0")}:{String(data.birthTime.minute).padStart(2, "0")}
                  </span>
                )}
                {data.birthPlace && (
                  <span>
                    {" · "}
                    {data.birthPlace}
                  </span>
                )}
              </p>
              {parseInt(localStorage.getItem("ci_quiz_edit_count") || "0", 10) < 2 && (
                <button
                  onClick={() => {
                    const current = parseInt(localStorage.getItem("ci_quiz_edit_count") || "0", 10);
                    localStorage.setItem("ci_quiz_edit_count", String(current + 1));
                    // Reset the funnel so /processing creates a fresh session
                    // for the edited birth data instead of skipping ahead.
                    clearFunnelStorage();
                    navigate("/quiz?step=2");
                  }}
                  className="text-primary/80 hover:text-primary underline underline-offset-2 transition-colors"
                >
                  {t.hero.wrongData}
                </button>
              )}
            </div>
          )}
        </motion.div>

        {data.natalChartSvg && (
          <div
            className="natal-chart-teaser mx-auto w-full max-w-[260px] sm:max-w-[300px] md:max-w-[340px] select-none pointer-events-none [&_svg]:w-full [&_svg]:h-auto [&_svg]:block"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: data.natalChartSvg }}
          />
        )}

        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {insights.map((insight, i) => (
            <InsightCard key={i} {...insight} index={i} />
          ))}
        </div>

        {/* CTA for paid users */}
        {hasPaid && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center space-y-3 py-2 max-w-xl mx-auto"
          >
            <Button variant="premium" size="hero" onClick={handleOpenFullReport}>
              {t.openFullReport}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Offer (only for unpaid users) */}
      {!hasPaid && (
        <div className="container max-w-2xl mx-auto py-8 space-y-12">
          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
            <h3 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
              {funnelConfig.teaser.offerHeadline}
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto text-sm">
              {funnelConfig.teaser.offerSubhead}
            </p>
          </motion.div>

          {/* What the report includes
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-surface rounded-2xl p-8"
          >
            <h3 className="font-display text-lg font-semibold text-foreground mb-5">
              Cosa include la lettura completa
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {funnelConfig.teaser.reportSectionsList.map((section, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm text-foreground/80">{section}</span>
                </div>
              ))}
            </div>
          </motion.div> */}

          {/* Visual report preview carousel */}
          <ReportPreviewCarousel />

          {/* Offer cards */}
          <div id="offer-cards" className="grid gap-6 md:grid-cols-2">
            <OfferCard
              name={t.offers.baseName}
              price={m.common.priceLabel(market.prices.base)}
              promise={funnelConfig.teaser.baseOffer.promise}
              features={funnelConfig.teaser.baseOffer.features}
              ctaLabel={t.offers.baseCta}
              onSelect={() => handleSelect("base")}
              loading={checkoutLoading === "base"}
              index={0}
            />
            <OfferCard
              name={t.offers.premiumName}
              price={m.common.priceLabel(market.prices.premium)}
              promise={t.offers.premiumPromise}
              features={t.offers.premiumFeatures}
              recommended
              ctaLabel={t.offers.premiumCta}
              onSelect={() => handleSelect("premium")}
              loading={checkoutLoading === "premium"}
              index={1}
            />
          </div>

          {/* Trust microcopy */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid gap-3 max-w-md mx-auto py-4"
          >
            {funnelConfig.teaser.trustBullets.map((text, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-foreground/70">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                <span className="leading-relaxed">{text}</span>
              </div>
            ))}
          </motion.div>

          {/* Testimonials 
          <Testimonials />*/}

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="pt-4 pb-2"
          >
            <div className="text-center space-y-3 mb-10">
              <span className="text-xs uppercase tracking-[0.2em] text-primary/70 font-medium">{t.faq.kicker}</span>
              <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                {t.faq.heading}
              </h3>
            </div>

            <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-3">
              {funnelConfig.teaser.faqItems.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border/40 rounded-xl px-6 bg-surface/50 data-[state=open]:bg-surface transition-colors"
                >
                  <AccordionTrigger className="text-left text-[15px] font-medium text-foreground/90 py-5 hover:no-underline gap-4">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-foreground/70 leading-[1.8] pb-6 pr-8">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Bottom CTA */}
          <div className="flex justify-center">
            <Button
              variant="premium"
              size="quiz"
              onClick={() =>
                document.getElementById("offer-cards")?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            >
              {t.bottomCta}
            </Button>
          </div>

          {/* Bottom reassurance */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground py-6"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> {t.reassurance.instantAccess}
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> {t.reassurance.securePayment}
            </span>
            <span className="flex items-center gap-1.5">
              <PenLine className="w-3 h-3" /> {t.reassurance.humanLanguage}
            </span>
          </motion.div>
        </div>
      )}

      <CheckoutReview
        open={reviewOpen}
        purchaseType={reviewType}
        sessionId={data.sessionId || getStoredSessionId() || ""}
        firstName={data.userName || undefined}
        birthDate={data.birthDate}
        onClose={() => setReviewOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default TeaserResult;
