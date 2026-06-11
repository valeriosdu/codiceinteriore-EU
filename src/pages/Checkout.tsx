import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, Zap, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import OfferCard from "@/components/OfferCard";
import InsightCard from "@/components/InsightCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import CheckoutReview from "@/components/CheckoutReview";
import { useQuiz, getStoredSessionId } from "@/context/QuizContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchQuizSessionPublic } from "@/lib/sessionAccess";
import { useMetaConversions } from "@/hooks/useMetaConversions";
import { isLovablePreview } from "@/lib/preview-mode";
import { trackEvent } from "@/lib/analytics";
import { getFunnelConfig } from "@/funnels/registry";

// Happy path is 5–10s. On timeout we auto-retry (re-invoking
// process-session-insights) up to MAX_RECOVERY_ATTEMPTS times before
// surfacing a manual-retry screen.
const POLL_TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 4000;
const RETRY_PAUSE_MS = 2000;
const MAX_RECOVERY_ATTEMPTS = 2;

const MONTHS_SHORT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

const Checkout = () => {
  const navigate = useNavigate();
  const { data, updateData } = useQuiz();
  const funnelConfig = getFunnelConfig(data.funnelSlug);
  const [sessionReady, setSessionReady] = useState(false);
  const [pollFailed, setPollFailed] = useState(false);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  const [hardFailed, setHardFailed] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<"base" | "premium" | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewType, setReviewType] = useState<"base" | "premium" | null>(null);
  const { trackAddToCart, trackInitiateCheckout } = useMetaConversions();

  useEffect(() => {
    trackEvent("paywall_viewed", { variant: "gift_checkout" }, { once: true });
  }, []);

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

  useEffect(() => {
    if (!pollFailed || sessionReady) return;
    if (recoveryAttempt >= MAX_RECOVERY_ATTEMPTS) {
      setHardFailed(true);
      return;
    }
    const retry = setTimeout(() => {
      setPollFailed(false);
      setRecoveryAttempt((a) => a + 1);
    }, RETRY_PAUSE_MS);
    return () => clearTimeout(retry);
  }, [pollFailed, sessionReady, recoveryAttempt]);

  // Make sure the natal chart is in DB before allowing payment.
  // Processing.tsx already polls for ~35s; this is a safety net for slow
  // pipelines where the user lands here before insights_ready. We also pull the
  // chart SVG + teaser insights into context so this gift checkout can preview
  // the recipient's chart, the way /teaser does for the buyer.
  useEffect(() => {
    if (isLovablePreview()) {
      setSessionReady(true);
      return;
    }

    let cancelled = false;
    const sessionId = data.sessionId || getStoredSessionId();
    if (!sessionId) {
      setPollFailed(true);
      return;
    }

    type SessionRow = {
      natal_chart: unknown;
      natal_chart_svg: string | null;
      teaser_insights: unknown;
      processing_status: string | null;
      user_name: string | null;
    };

    const isReady = (row: SessionRow | null) =>
      Boolean(row?.natal_chart && row?.processing_status === "insights_ready");

    // The SVG is best-effort and may land a moment after insights_ready (or via
    // a backfill). Keep polling lightly for it; silent degradation if it never
    // arrives — the page stays usable without the chart.
    const SVG_POLL_TIMEOUT_MS = 20000;
    const pollSvgInBackground = async (sid: string) => {
      const startedAt = Date.now();
      while (!cancelled && Date.now() - startedAt < SVG_POLL_TIMEOUT_MS) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        if (cancelled) return;
        const row = await fetchQuizSessionPublic(sid);
        const svg = row?.natal_chart_svg ?? null;
        if (svg) {
          updateData({ natalChartSvg: svg });
          return;
        }
      }
    };

    const applyReady = (row: SessionRow | null) => {
      const svg = row?.natal_chart_svg ?? null;
      updateData({
        sessionId,
        userName: row?.user_name || data.userName || "",
        natalChartSvg: svg,
        teaserInsights: Array.isArray(row?.teaser_insights)
          ? (row!.teaser_insights as { title: string; body: string }[])
          : data.teaserInsights,
      });
      setSessionReady(true);
      if (!svg) pollSvgInBackground(sessionId).catch(() => {});
    };

    const run = async () => {
      try {
        const row = await fetchQuizSessionPublic(sessionId);

        if (row?.user_name && !data.userName) {
          updateData({ userName: row.user_name, sessionId });
        }

        if (isReady(row)) {
          applyReady(row);
          return;
        }

        // Re-trigger the background job in case Processing's invocation was lost
        supabase.functions
          .invoke("process-session-insights", { body: { sessionId } })
          .catch((e) => console.warn("[Checkout] Trigger failed:", e));

        const startedAt = Date.now();
        while (!cancelled && Date.now() - startedAt < POLL_TIMEOUT_MS) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          if (cancelled) return;

          const latest = await fetchQuizSessionPublic(sessionId);

          if (isReady(latest)) {
            applyReady(latest);
            return;
          }

          if (latest?.processing_status === "failed") {
            supabase.functions
              .invoke("process-session-insights", { body: { sessionId } })
              .catch((e) => console.warn("[Checkout] Retry failed:", e));
          }
        }

        if (!cancelled) setPollFailed(true);
      } catch (e) {
        console.error("[Checkout] Polling failed:", e);
        if (!cancelled) setPollFailed(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [recoveryAttempt]);

  const handleSelect = async (type: "base" | "premium") => {
    if (isLovablePreview()) {
      toast.info("Anteprima Lovable: il pagamento è disabilitato in preview.");
      return;
    }
    const sessionId = data.sessionId || getStoredSessionId();
    if (!sessionId || !sessionReady) {
      toast.error("Stiamo ancora preparando la lettura. Riprova tra poco.");
      return;
    }

    setCheckoutLoading(type);
    updateData({ purchaseType: type });

    trackInitiateCheckout({ firstName: data.userName || undefined, sessionId, purchaseType: type, birthDate: data.birthDate });

    try {
      const row = await fetchQuizSessionPublic(sessionId);

      if (!row?.natal_chart || row.processing_status !== "insights_ready") {
        throw new Error("session_not_ready");
      }

      setReviewType(type);
      setReviewOpen(true);
    } catch (e) {
      console.error("Checkout pre-check error:", e);
      toast.error("Stiamo ancora preparando la lettura. Riprova tra qualche secondo.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (hardFailed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Non siamo riusciti a preparare la lettura
        </h1>
        <p className="text-sm text-foreground/70 max-w-xs leading-relaxed">
          Qualcosa non sta funzionando come dovrebbe. Riprova tra qualche istante.
        </p>
        <Button
          variant="default"
          onClick={() => {
            setHardFailed(false);
            setPollFailed(false);
            setRecoveryAttempt(0);
          }}
        >
          Riprova
        </Button>
      </div>
    );
  }

  if (!sessionReady) {
    const slowMessage = pollFailed || recoveryAttempt > 0;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Stiamo preparando la lettura
        </h1>
        <p className="text-sm text-foreground/70 max-w-xs leading-relaxed">
          {slowMessage
            ? "Ci sta mettendo più del previsto. Resta su questa pagina: riproveremo automaticamente tra poco."
            : "Calcoliamo la carta natale prima di mostrarti l'offerta."}
        </p>
      </div>
    );
  }

  const hasRealInsights = data.teaserInsights && data.teaserInsights.length > 0;
  const previewInsights = hasRealInsights ? data.teaserInsights! : funnelConfig.teaser.fallbackInsights;

  const recipientName = data.userName || "lui/lei";
  const birthSummary = (() => {
    const parts: string[] = [];
    if (data.birthDate) {
      const m = MONTHS_SHORT[(data.birthDate.month || 1) - 1];
      parts.push(`${data.birthDate.day} ${m} ${data.birthDate.year}`);
    }
    if (data.birthTime) {
      parts.push(`${String(data.birthTime.hour).padStart(2, "0")}:${String(data.birthTime.minute).padStart(2, "0")}`);
    }
    if (data.birthPlace) parts.push(data.birthPlace);
    return parts.join(" · ");
  })();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-2xl mx-auto py-10 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
            La lettura per {recipientName} è pronta
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Abbiamo calcolato la carta natale. Scegli il formato per generare la lettura completa.
          </p>
          {birthSummary && (
            <p className="pt-2 text-xs text-muted-foreground/80">{birthSummary}</p>
          )}
          <button
            onClick={() => navigate("/quiz")}
            className="text-xs text-primary/80 hover:text-primary underline underline-offset-2 transition-colors"
          >
            I dati non sono giusti?
          </button>
        </motion.div>

        {data.natalChartSvg && (
          <div
            className="natal-chart-teaser mx-auto w-full max-w-[260px] sm:max-w-[300px] md:max-w-[340px] select-none pointer-events-none [&_svg]:w-full [&_svg]:h-auto [&_svg]:block"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: data.natalChartSvg }}
          />
        )}

        {previewInsights.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {previewInsights.map((insight, i) => (
              <InsightCard key={i} {...insight} index={i} />
            ))}
          </div>
        )}

        <div id="offer-cards" className="grid gap-6 md:grid-cols-2">
          <OfferCard
            name="Lettura Completa del Tema Natale"
            price="19€"
            promise={`Per capire con più chiarezza la struttura emotiva, relazionale e personale di ${recipientName}, e vedere cosa tende a ripetersi nella sua vita.`}
            features={[
              "Comprendi blocchi emotivi, difese e dinamiche ricorrenti con un linguaggio umano, non tecnico",
              "Vedi come questi schemi influenzano relazioni, lavoro, direzione personale e scelte di vita",
              "Ricevi spunti pratici su cosa osservare, favorire o correggere",
              "Accesso immediato alla lettura online e via e-mail",
            ]}
            ctaLabel="Ottieni la Lettura Completa"
            onSelect={() => handleSelect("base")}
            loading={checkoutLoading === "base"}
            index={0}
          />
          <OfferCard
            name="Lettura Completa + 1 Mese di Transiti"
            price="29€"
            promise={`Capire cosa guida ${recipientName} in profondità e leggere con chiarezza anche il momento che sta vivendo adesso.`}
            features={[
              "Tutto ciò che è incluso nella Lettura Completa",
              "1 mese di letture settimanali personalizzate sui transiti del periodo",
              "Un aiuto in più per capire cosa si sta attivando emotivamente adesso",
              "Omaggio: poesia trasformativa personale",
            ]}
            recommended
            ctaLabel="Ottieni la Lettura + Transiti"
            onSelect={() => handleSelect("premium")}
            loading={checkoutLoading === "premium"}
            index={1}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground py-2"
        >
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Accesso immediato
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Pagamento sicuro
          </span>
          <span className="flex items-center gap-1.5">
            <PenLine className="w-3 h-3" /> Lettura scritta in linguaggio umano
          </span>
        </motion.div>
      </div>

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

export default Checkout;
