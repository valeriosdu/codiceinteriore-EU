import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PACK_CREDITS } from "./constants";
import { planAnswerRecheck } from "./answerRecheck";
import { useI18n } from "@/i18n/I18nProvider";
import type { Messages } from "@/i18n";

export type AstrologyGuideQuestion = {
  id: string;
  profile_id: string;
  quiz_session_id: string;
  section_id: string | null;
  question: string;
  answer: string | null;
  // Status flow:
  //   pending → processing (generating via Gemini)
  //   processing → ready (answer stored, awaiting human-friendly delivery time)
  //   ready → completed (email sent + answer revealed in panel)
  // From the user's perspective, anything that isn't 'completed' or 'failed'
  // is "in arrivo" — `ready` is an internal state and the panel never shows
  // the answer for it.
  status: "pending" | "processing" | "ready" | "completed" | "failed";
  scheduled_for: string;
  processed_at: string | null;
  email_sent_at: string | null;
  feedback: "up" | "down" | null;
  feedback_comment: string | null;
  is_free: boolean;
  created_at: string;
  updated_at: string;
  error: string | null;
};

export type AstrologyGuideCredits = {
  balance: number;
  total_granted: number;
  total_used: number;
};

type AstrologyGuideState = {
  loading: boolean;
  credits: AstrologyGuideCredits | null;
  questions: AstrologyGuideQuestion[];
  isOpen: boolean;
  // Forces the pack card even with credits available. Only the ?openGuide=pack
  // link and the user-menu entry set it: otherwise the offer shows up on its
  // own only when credits run low, so a customer could not be sent to buy it.
  showPackOffer: boolean;
  pendingSectionId: string | null;
  pendingPrefill: string | null;
  submitting: boolean;
  buyingPack: boolean;
};

type AstrologyGuideActions = {
  open: (options?: {
    sectionId?: string | null;
    prefill?: string | null;
    /** Show the pack offer even with credits available. */
    packOffer?: boolean;
  }) => void;
  close: () => void;
  toggle: () => void;
  consumePendingPrefill: () => void;
  consumePendingSection: () => string | null;
  submitQuestion: (
    question: string,
    sectionId?: string | null,
  ) => Promise<{ success: boolean; scheduledFor?: string }>;
  buyPack: () => Promise<void>;
  submitFeedback: (questionId: string, feedback: "up" | "down", comment?: string | null) => Promise<void>;
};

export type AstrologyGuideContextValue = AstrologyGuideState &
  AstrologyGuideActions & { quizSessionId: string | null };

export const AstrologyGuideContext = createContext<AstrologyGuideContextValue | null>(null);

const TABLE_QUESTIONS = "astrology_guide_questions";
const TABLE_CREDITS = "astrology_guide_credits";

type GuideToasts = Messages["astrologyGuide"]["toasts"];

// Codici stabili restituiti da submit-astrology-question → stringa localizzata.
// `no_credits` e `duplicate_question` sono gestiti a parte perché hanno un
// tono diverso (offerta e informazione, non errore).
const SUBMIT_ERROR_MESSAGE: Record<string, (t: GuideToasts) => string> = {
  auth_required: (t) => t.sessionExpired,
  invalid_session: (t) => t.sessionExpired,
  profile_not_found: (t) => t.sessionExpired,
  forbidden: (t) => t.notAllowed,
  invalid_question: (t) => t.questionTooLong,
};

interface AstrologyGuideProviderProps {
  quizSessionId: string | null;
  children: ReactNode;
}

export const AstrologyGuideProvider = ({
  quizSessionId,
  children,
}: AstrologyGuideProviderProps) => {
  const { m, market } = useI18n();
  const gt = m.astrologyGuide.toasts;
  const packPrice = m.common.priceLabel(market.prices.astroPack);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<AstrologyGuideCredits | null>(null);
  const [questions, setQuestions] = useState<AstrologyGuideQuestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showPackOffer, setShowPackOffer] = useState(false);
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);
  const [pendingPrefill, setPendingPrefill] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [buyingPack, setBuyingPack] = useState(false);

  const profileIdRef = useRef<string | null>(null);
  const navigate = useNavigate();

  // The auto-generated Database types don't yet include astrology_guide_*
  // tables (types.ts is regenerated from migrations). Cast to a permissive
  // shape for the table operations we need; functions/auth keep their types.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const client = supabase as unknown as {
    from: (table: string) => any;
    auth: typeof supabase.auth;
    functions: typeof supabase.functions;
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const refresh = useCallback(async () => {
    if (!quizSessionId) {
      setLoading(false);
      return;
    }
    const { data: authData } = await client.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data: profile } = await client
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    profileIdRef.current = profile.id;

    const [creditsRes, questionsRes] = await Promise.all([
      client
        .from(TABLE_CREDITS)
        .select("balance, total_granted, total_used")
        .eq("profile_id", profile.id)
        .eq("quiz_session_id", quizSessionId)
        .maybeSingle(),
      client
        .from(TABLE_QUESTIONS)
        .select(
          "id, profile_id, quiz_session_id, section_id, question, answer, status, scheduled_for, processed_at, email_sent_at, feedback, feedback_comment, is_free, created_at, updated_at, error",
        )
        .eq("quiz_session_id", quizSessionId)
        .order("created_at", { ascending: true }),
    ]);

    setCredits(
      creditsRes.data
        ? {
            balance: Number(creditsRes.data.balance) || 0,
            total_granted: Number(creditsRes.data.total_granted) || 0,
            total_used: Number(creditsRes.data.total_used) || 0,
          }
        : { balance: 0, total_granted: 0, total_used: 0 },
    );
    setQuestions((questionsRes.data || []) as AstrologyGuideQuestion[]);
    setLoading(false);
  }, [quizSessionId, client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Risposte in attesa. Escono 2-6 ore dopo la domanda (scheduled_for, deciso
  // da submit-astrology-question) e arrivano anche per email. Prima due canali
  // Realtime postgres_changes restavano aperti finche' /report era aperto e
  // tenevano acceso il polling del WAL di Supabase: da pg_stat_statements era
  // il 64% del tempo di query del database, per aggiornare in diretta una
  // risposta che arriva ore dopo. Il canale dei crediti non riceveva nulla:
  // la tabella non e' nella publication di Realtime.
  //
  // Ora si ricarica solo quando serve: poco dopo l'orario previsto della
  // risposta, e quando il cliente torna sulla scheda (tipicamente dall'email).
  // La domanda appena inviata non ne ha bisogno: submitQuestion fa refresh().
  // Ogni refresh produce un nuovo array di domande, e questo riarma il timer.
  useEffect(() => {
    const plan = planAnswerRecheck(questions, Date.now());
    if (!plan) return;

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    // delayMs null = risposta bloccata oltre la finestra di ricontrollo: niente
    // piu' interrogazioni a tempo, resta solo il ricontrollo al ritorno.
    const timer = plan.delayMs !== null ? window.setTimeout(refreshIfVisible, plan.delayMs) : undefined;

    const onVisibilityChange = () => {
      if (Date.now() >= plan.nextRelease) refreshIfVisible();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [questions, refresh]);

  // Post-checkout activation flow for the astrology guide pack.
  // When Stripe redirects to /report?guide=activated&session_id=cs_..., we:
  //   1. Capture the current balance from the DB as baseline.
  //   2. Call sync-checkout-session as a backstop in case the webhook missed
  //      this session (idempotent on the server — same pattern used for the
  //      transits upsell in Report.tsx).
  //   3. Poll the balance until it grows past the baseline (webhook landed),
  //      then toast + refresh + drop URL params so a refresh doesn't loop.
  useEffect(() => {
    if (!quizSessionId) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("guide") !== "activated") return;
    const sessionIdParam = params.get("session_id") || "";
    let cancelled = false;

    (async () => {
      try {
        const { data: authData } = await client.auth.getUser();
        const userId = authData.user?.id;
        if (!userId) return;
        const { data: profile } = await client
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!profile?.id) return;
        const profileId = profile.id as string;

        const readBalance = async (): Promise<number> => {
          const { data } = await client
            .from(TABLE_CREDITS)
            .select("balance")
            .eq("profile_id", profileId)
            .eq("quiz_session_id", quizSessionId)
            .maybeSingle();
          return Number(data?.balance) || 0;
        };

        const baseline = await readBalance();

        if (sessionIdParam) {
          try {
            await supabase.functions.invoke("sync-checkout-session", {
              body: { sessionId: sessionIdParam },
            });
          } catch (err) {
            console.warn(
              "[astrology-guide] sync-checkout-session backstop failed:",
              err,
            );
          }
        }

        const MAX_ATTEMPTS = 12;
        const INTERVAL_MS = 3000;
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          if (cancelled) return;
          const current = await readBalance();
          if (current > baseline) {
            const added = current - baseline;
            await refresh();
            if (cancelled) return;
            toast.success(gt.packActivated(added));
            navigate("/report", { replace: true });
            return;
          }
          await new Promise((r) => setTimeout(r, INTERVAL_MS));
        }
        if (cancelled) return;
        toast.info(gt.paymentProcessing);
        navigate("/report", { replace: true });
      } catch (err) {
        console.error("[astrology-guide] guide=activated flow error:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizSessionId]);

  // Auto-open the widget when arriving from the transit PDF CTA link
  // (?openGuide=1). ?openGuide=pack opens it and also shows the pack offer,
  // which is otherwise not linkable. We strip the param after opening so a
  // refresh of the page does not retrigger the open in a loop. Any other URL
  // params (e.g. ?source=transit-pdf used for analytics) are preserved.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const openGuide = params.get("openGuide");
    if (openGuide !== "1" && openGuide !== "pack") return;
    setIsOpen(true);
    if (openGuide === "pack") setShowPackOffer(true);
    params.delete("openGuide");
    const search = params.toString();
    const newUrl =
      window.location.pathname +
      (search ? `?${search}` : "") +
      window.location.hash;
    window.history.replaceState({}, "", newUrl);
  }, []);

  const open: AstrologyGuideActions["open"] = useCallback((options) => {
    if (options?.sectionId !== undefined) setPendingSectionId(options.sectionId);
    if (options?.prefill !== undefined) setPendingPrefill(options.prefill);
    if (options?.packOffer) setShowPackOffer(true);
    setIsOpen(true);
  }, []);

  const close: AstrologyGuideActions["close"] = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle: AstrologyGuideActions["toggle"] = useCallback(() => {
    setIsOpen((v) => !v);
  }, []);

  const consumePendingPrefill: AstrologyGuideActions["consumePendingPrefill"] =
    useCallback(() => {
      setPendingPrefill(null);
    }, []);

  const consumePendingSection: AstrologyGuideActions["consumePendingSection"] =
    useCallback(() => {
      const v = pendingSectionId;
      setPendingSectionId(null);
      return v;
    }, [pendingSectionId]);

  const submitQuestion: AstrologyGuideActions["submitQuestion"] = useCallback(
    async (question, sectionId = null) => {
      if (!quizSessionId) return { success: false };
      setSubmitting(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "submit-astrology-question",
          { body: { quizSessionId, question, sectionId } },
        );
        if (error) {
          const ctx = (error as { context?: { body?: { error?: string; code?: string } } })
            ?.context;
          // FunctionsHttpError espone il body della risposta su `context`.
          // `code` è il contratto stabile; `error` resta come fallback per le
          // due condizioni che già usavano il codice come messaggio.
          const code = ctx?.body?.code || ctx?.body?.error || "";
          if (code === "no_credits") {
            toast.error(gt.noCredits(PACK_CREDITS, packPrice));
          } else if (code === "duplicate_question") {
            toast.info(gt.duplicate);
          } else {
            // Mai il testo grezzo del backend: è in inglese e tecnico.
            console.error("[astrology-guide] submit failed:", code || error);
            toast.error(SUBMIT_ERROR_MESSAGE[code]?.(gt) ?? gt.submitError);
          }
          return { success: false };
        }
        // Optimistic local credit decrement; refresh confirms.
        setCredits((c) =>
          c ? { ...c, balance: Math.max(0, c.balance - 1), total_used: c.total_used + 1 } : c,
        );
        await refresh();
        return { success: true, scheduledFor: data?.scheduled_for };
      } catch (e) {
        console.error("[astrology-guide] submit error:", e);
        toast.error(gt.submitError);
        return { success: false };
      } finally {
        setSubmitting(false);
      }
    },
    [quizSessionId, refresh, gt],
  );

  const buyPack: AstrologyGuideActions["buyPack"] = useCallback(async () => {
    if (!quizSessionId) return;
    setBuyingPack(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-astrology-pack-checkout",
        { body: { quizSessionId } },
      );
      if (error) throw error;
      if (!data?.url) throw new Error(gt.noUrl);
      window.location.href = data.url;
    } catch (e) {
      console.error("[astrology-guide] checkout error:", e);
      toast.error(gt.checkoutError);
      setBuyingPack(false);
    }
  }, [quizSessionId, gt]);

  const submitFeedback: AstrologyGuideActions["submitFeedback"] = useCallback(
    async (questionId, feedback, comment = null) => {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, feedback, feedback_comment: comment ?? q.feedback_comment }
            : q,
        ),
      );
      const update: Record<string, unknown> = { feedback };
      if (comment !== undefined) update.feedback_comment = comment;
      await client
        .from(TABLE_QUESTIONS)
        .update(update)
        .eq("id", questionId);
    },
    [client],
  );

  const value = useMemo<AstrologyGuideContextValue>(
    () => ({
      loading,
      credits,
      questions,
      isOpen,
      showPackOffer,
      pendingSectionId,
      pendingPrefill,
      submitting,
      buyingPack,
      quizSessionId,
      open,
      close,
      toggle,
      consumePendingPrefill,
      consumePendingSection,
      submitQuestion,
      buyPack,
      submitFeedback,
    }),
    [
      loading,
      credits,
      questions,
      isOpen,
      showPackOffer,
      pendingSectionId,
      pendingPrefill,
      submitting,
      buyingPack,
      quizSessionId,
      open,
      close,
      toggle,
      consumePendingPrefill,
      consumePendingSection,
      submitQuestion,
      buyPack,
      submitFeedback,
    ],
  );

  return (
    <AstrologyGuideContext.Provider value={value}>{children}</AstrologyGuideContext.Provider>
  );
};

export const useAstrologyGuide = () => {
  const ctx = useContext(AstrologyGuideContext);
  if (!ctx) {
    throw new Error("useAstrologyGuide must be used within AstrologyGuideProvider");
  }
  return ctx;
};

// Optional variant that returns null if no provider is mounted (so the widget
// can be safely omitted on pages that don't have a quiz session).
export const useAstrologyGuideOptional = () => useContext(AstrologyGuideContext);
