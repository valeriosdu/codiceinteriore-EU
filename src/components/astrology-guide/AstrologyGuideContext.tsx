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
import { PACK_CREDITS, PACK_PRICE_LABEL } from "./constants";

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
  pendingSectionId: string | null;
  pendingPrefill: string | null;
  submitting: boolean;
  buyingPack: boolean;
};

type AstrologyGuideActions = {
  open: (options?: { sectionId?: string | null; prefill?: string | null }) => void;
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

interface AstrologyGuideProviderProps {
  quizSessionId: string | null;
  children: ReactNode;
}

export const AstrologyGuideProvider = ({
  quizSessionId,
  children,
}: AstrologyGuideProviderProps) => {
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<AstrologyGuideCredits | null>(null);
  const [questions, setQuestions] = useState<AstrologyGuideQuestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
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
    channel: (name: string) => any;
    removeChannel: (channel: any) => void;
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

  // Realtime: listen for INSERT/UPDATE on questions for this session.
  // Falls back to a periodic refresh if realtime isn't available.
  useEffect(() => {
    if (!quizSessionId) return;
    const channel = client
      .channel(`astrology-guide-${quizSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLE_QUESTIONS,
          filter: `quiz_session_id=eq.${quizSessionId}`,
        },
        (payload: { eventType: string; new: AstrologyGuideQuestion }) => {
          setQuestions((prev) => {
            const next = [...prev];
            const existingIdx = next.findIndex((q) => q.id === payload.new.id);
            if (payload.eventType === "INSERT") {
              if (existingIdx >= 0) next[existingIdx] = payload.new;
              else next.push(payload.new);
            } else if (payload.eventType === "UPDATE") {
              if (existingIdx >= 0) next[existingIdx] = payload.new;
            }
            return next.sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            );
          });
          // Refresh credits too — answer completion may have happened, but
          // mostly credit changes happen on submit which we already handle.
          if (payload.eventType === "UPDATE" && payload.new.status === "completed") {
            void refresh();
          }
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [quizSessionId, client, refresh]);

  // Realtime: listen for changes on the credits row (e.g. a webhook just
  // granted a pack on another tab/device). RLS ensures we only receive rows
  // we own. If the credits table doesn't have realtime enabled in the
  // Supabase publication, this silently no-ops — the post-checkout poller
  // below covers the same-tab case.
  useEffect(() => {
    if (!quizSessionId) return;
    const channel = client
      .channel(`astrology-guide-credits-${quizSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLE_CREDITS,
          filter: `quiz_session_id=eq.${quizSessionId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [quizSessionId, client, refresh]);

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
            toast.success(
              `Pacchetto attivato. Hai ${added} ${added === 1 ? "nuova domanda" : "nuove domande"}.`,
            );
            navigate("/report", { replace: true });
            return;
          }
          await new Promise((r) => setTimeout(r, INTERVAL_MS));
        }
        if (cancelled) return;
        toast.info(
          "Il pagamento è in elaborazione. Ricarica tra qualche secondo per vedere le nuove domande.",
        );
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
  // (?openGuide=1). We strip the param after opening so a refresh of the
  // page does not retrigger the open in a loop. Any other URL params
  // (e.g. ?source=transit-pdf used for analytics) are preserved.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("openGuide") !== "1") return;
    setIsOpen(true);
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
          const ctx = (error as { context?: { body?: { error?: string } } })?.context;
          const message =
            // FunctionsHttpError exposes the response body on `context`
            ctx?.body?.error ||
            (error as Error)?.message ||
            "Errore durante l'invio.";
          if (message === "no_credits") {
            toast.error(
              `Hai esaurito le tue domande. Acquista altre ${PACK_CREDITS} a ${PACK_PRICE_LABEL}.`,
            );
          } else if (message === "duplicate_question") {
            toast.info(
              "Hai già fatto questa domanda di recente. La risposta è nel thread (o sta arrivando).",
            );
          } else {
            toast.error(message);
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
        toast.error("Non siamo riusciti a inviare la domanda. Riprova.");
        return { success: false };
      } finally {
        setSubmitting(false);
      }
    },
    [quizSessionId, refresh],
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
      if (!data?.url) throw new Error("URL non disponibile");
      window.location.href = data.url;
    } catch (e) {
      console.error("[astrology-guide] checkout error:", e);
      toast.error(
        e instanceof Error
          ? e.message
          : "Non siamo riusciti ad aprire il pagamento. Riprova tra un istante.",
      );
      setBuyingPack(false);
    }
  }, [quizSessionId]);

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
