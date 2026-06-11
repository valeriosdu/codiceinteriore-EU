import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/context/QuizContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { isLovablePreview } from "@/lib/preview-mode";
import { trackEvent } from "@/lib/analytics";

const messages = [
  "Stiamo recuperando la tua lettura",
  "Stiamo organizzando le aree principali",
  "Stiamo preparando le parti che non hai ancora visto",
  "Stiamo completando la tua mappa personale",
  "Tra poco entrerai nella versione completa",
  "Stiamo rifinendo i dettagli più delicati",
  "Quasi pronti — manca davvero poco",
];

const POLL_INTERVAL_MS = 5000;
// Show a gentle "taking a bit longer" hint after ~75 s of processing.
const SLOW_HINT_AFTER_MS = 75_000;

type FullReport = Record<string, string>;

const hasPaidCheckoutSession = (value: string | null | undefined) =>
  typeof value === "string" && (/^cs_(test|live)_/.test(value) || value.startsWith("pp_"));

type ReportLink = {
  quiz_session_id: string;
  stripe_session_id: string | null;
  is_active: boolean;
  quiz_sessions: {
    id: string;
    full_report: any;
    user_name: string | null;
    processing_status: string;
    natal_chart: any;
    teaser_insights: any;
  } | null;
};

const isIncompletePaidState = (status: string | null | undefined) =>
  ["insights_ready", "report_processing", "chart_processing", "insights_processing", "failed"].includes(status || "");

const ReportProcessing = () => {
  const navigate = useNavigate();
  const { data, updateData } = useQuiz();
  const { isReady: authReady, user } = useAuthReady();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fetchStarted = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"verifying" | "processing">("verifying");
  const [showSlowHint, setShowSlowHint] = useState(false);
  const processingSessionId = useRef<string | null>(null);

  useEffect(() => {
    if (isLovablePreview()) {
      const t = setTimeout(() => navigate("/report", { replace: true }), 1500);
      return () => clearTimeout(t);
    }
    if (!authReady) return;
    if (fetchStarted.current) return;
    fetchStarted.current = true;

    const run = async () => {
      try {
        if (!user) {
          if (data.fullReport) {
            navigate("/report", { replace: true });
            return;
          }
          setError("Accedi al tuo account per completare la lettura acquistata.");
          setReady(true);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, quiz_session_id, stripe_session_id")
          .eq("user_id", user.id)
          .single();

        if (!profile?.id) {
          setError("Non riusciamo a trovare il tuo profilo. Accedi di nuovo o contattaci.");
          setReady(true);
          return;
        }

        const { data: reportLinks } = await (supabase as any)
          .from("user_reports")
          .select("quiz_session_id, stripe_session_id, is_active, quiz_sessions(id, full_report, user_name, processing_status, natal_chart, teaser_insights)")
          .eq("profile_id", profile.id)
          .order("is_active", { ascending: false })
          .order("created_at", { ascending: false });

        const links = (reportLinks || []) as ReportLink[];
        const activeLink = links.find((link) => link.is_active);
        // Short-circuit only when the active link is itself completed, or when
        // no active link exists at all (rare; trigger glitch). Falling back to
        // a different completed link would teleport a returning customer who
        // just paid for a second report to their old (now inactive) one.
        const completed = activeLink
          ? (activeLink.quiz_sessions?.full_report ? activeLink : undefined)
          : links.find((link) => link.quiz_sessions?.full_report);
        if (completed?.quiz_sessions?.full_report) {
          updateData({
            sessionId: completed.quiz_session_id,
            fullReport: completed.quiz_sessions.full_report as FullReport,
            userName: completed.quiz_sessions.user_name || "",
          });
          navigate("/report", { replace: true });
          return;
        }

        const isPayable = (link: ReportLink) =>
          hasPaidCheckoutSession(link.stripe_session_id) &&
          link.quiz_sessions?.natal_chart &&
          Array.isArray(link.quiz_sessions?.teaser_insights) &&
          link.quiz_sessions.teaser_insights.length > 0 &&
          isIncompletePaidState(link.quiz_sessions.processing_status);
        const payableLink = activeLink && isPayable(activeLink) ? activeLink : links.find(isPayable);

        const fallbackPaidSessionId = hasPaidCheckoutSession(profile.stripe_session_id) ? profile.stripe_session_id : null;
        const sessionId = payableLink?.quiz_session_id || profile.quiz_session_id || data.sessionId;
        processingSessionId.current = sessionId || null;

        if (!payableLink && fallbackPaidSessionId && sessionId) {
          const { data: checkoutData } = await supabase.functions.invoke("get-checkout-email", {
            body: { sessionId: fallbackPaidSessionId },
          });
          if (checkoutData?.quizSessionId && checkoutData.quizSessionId !== sessionId) {
            setError("Il pagamento non corrisponde alla sessione quiz da completare.");
            setReady(true);
            return;
          }
        }

        if (!sessionId) {
          setError("Non troviamo una sessione quiz collegata al pagamento.");
          setReady(true);
          return;
        }

        const paidSessionId = payableLink?.stripe_session_id || fallbackPaidSessionId;
        if (!hasPaidCheckoutSession(paidSessionId)) {
          setError("Per generare una nuova lettura serve un pagamento completato. Se hai già una lettura, aprila dalla tua area personale.");
          setReady(true);
          return;
        }

        setPhase("processing");

        const pollForReport = async () => {
          for (let attempt = 0; attempt < 120; attempt += 1) {
            const { data: latestSession } = await supabase
              .from("quiz_sessions")
              .select("full_report, user_name, processing_status, processing_error")
              .eq("id", sessionId)
              .single();

            if (latestSession?.full_report) return latestSession;
            if (latestSession?.processing_status === "failed") {
              throw new Error(latestSession.processing_error || "report_failed");
            }

            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
          }

          throw new Error("report_timeout: generazione ancora in corso");
        };

        const { data: latestSession } = await supabase
          .from("quiz_sessions")
          .select("full_report, user_name, processing_status")
          .eq("id", sessionId)
          .single();

        if (latestSession?.full_report) {
          updateData({ sessionId, fullReport: latestSession.full_report as FullReport, userName: latestSession.user_name || data.userName });
          navigate("/report", { replace: true });
          return;
        }

        if (latestSession?.processing_status !== "report_processing") {
          const { data: reportData, error: reportError } = await supabase.functions.invoke("generate-report", {
            body: { quizSessionId: sessionId },
          });

          if (reportError || (!reportData?.started && !reportData?.alreadyExists)) {
            throw new Error(reportError?.message || reportData?.error || "report_failed: start failed");
          }
        }

        const { data: transitCycles } = await (supabase as any)
          .from("transit_cycles")
          .select("id, status, fetch_status, interpretation_status")
          .eq("profile_id", profile.id)
          .eq("quiz_session_id", sessionId)
          .in("status", ["pending", "failed"])
          .order("created_at", { ascending: false })
          .limit(1);

        const transitCycleId = transitCycles?.[0]?.id;
        if (transitCycleId) {
          supabase.functions
            .invoke("process-transit-cycle", { body: { transitCycleId } })
            .catch((transitErr) => console.warn("Transit processing start failed (non-blocking):", transitErr));
        }

        const readySession = await pollForReport();
        updateData({ sessionId, fullReport: readySession.full_report as FullReport, userName: readySession.user_name || data.userName });
        trackEvent("report_generation_completed", { quiz_session_id: sessionId });

        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user?.email) {
            await supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "report-ready",
                recipientEmail: authData.user.email,
                idempotencyKey: `report-ready-${sessionId}`,
                templateData: {
                  name: readySession.user_name || data.userName || "",
                  sessionId: paidSessionId || undefined,
                },
              },
            });
          }
        } catch (emailErr) {
          console.error("Welcome email failed (non-blocking):", emailErr);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Report processing failed:", message);
        trackEvent("report_generation_failed", {
          quiz_session_id: processingSessionId.current,
          error: message.slice(0, 200),
        });
        if (processingSessionId.current) {
          await supabase
            .from("quiz_sessions")
            .update({ processing_status: "failed", processing_error: message.slice(0, 500) } as any)
            .eq("id", processingSessionId.current)
            .neq("processing_status", "report_processing");
        }
        setError("La tua lettura è in fase di preparazione. Il pagamento è registrato correttamente e riceverai tutto via email entro pochi minuti. Se dopo 10 minuti non ricevi nulla, contattaci e saremo lieti di aiutarti.");
      } finally {
        setReady(true);
      }
    };

    run();
  }, [authReady, data, navigate, updateData, user]);

  // Cycle reassuring messages forever while we keep polling. The actual
  // navigation to /report happens as soon as `ready` becomes true (see
  // below), so we never get stuck waiting on the animation timer.
  useEffect(() => {
    if (phase !== "processing") return;
    const timer = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % messages.length);
    }, 5500);
    return () => clearTimeout(timer);
  }, [currentIndex, phase]);

  // After ~75 s show a gentle "this is taking a bit longer" hint so the
  // user knows we're still working. The "Contact us" CTA only appears
  // when polling actually fails or times out (~5 minutes), never as a
  // first reaction.
  useEffect(() => {
    if (phase !== "processing") return;
    const timer = setTimeout(() => setShowSlowHint(true), SLOW_HINT_AFTER_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // As soon as the run() finishes successfully (full_report loaded),
  // jump straight to the report. No animation gating.
  useEffect(() => {
    if (ready && !error) navigate("/report", { replace: true });
  }, [ready, error, navigate]);

  const loopProgress = ((currentIndex + 1) / messages.length) * 100;

  if (ready && error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-sm w-full space-y-5">
          <AlertCircle className="mx-auto h-8 w-8 text-primary" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Lettura in verifica</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{error}</p>
          <Button variant="premium" size="quiz" onClick={() => navigate("/contatti")}>
            Contattaci
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "verifying") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="h-6 w-6 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground leading-relaxed">Verifichiamo il tuo accesso alla lettura…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-10 text-center">
        <div className="space-y-4">
          <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">
            Stiamo completando la tua lettura
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Hai già visto l'inizio. Ora stiamo preparando la tua lettura completa, con tanti nuovi elementi e una
            visione completa del tuo Codice Interiore. Non chiudere o aggiornare la pagina.
          </p>
          <AnimatePresence>
            {showSlowHint && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground/80 italic"
              >
                Per le carte più complesse la preparazione può richiedere fino a 10 minuti. Puoi restare su questa pagina oppure chiuderla: riceverai tutto via email appena pronto.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="h-20 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-foreground/80 text-sm leading-relaxed"
            >
              {messages[currentIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${loopProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-center gap-2">
            {messages.map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                animate={{ backgroundColor: i <= currentIndex ? "hsl(14, 45%, 38%)" : "hsl(35, 12%, 90%)" }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportProcessing;
