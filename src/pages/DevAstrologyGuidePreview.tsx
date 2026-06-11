// Dev-only visual preview for the Astrology Guide widget.
// Mounted at /dev/astrology-guide and gated behind import.meta.env.DEV in
// App.tsx so it never ships to production.
//
// All state is mocked locally — no Supabase, no auth, no edge functions.
// Useful for eyeballing the UI states (empty / pending / completed / failed,
// free-credit badge, low-credits warning, out-of-credits buy CTA).

import { useMemo, useState } from "react";
import {
  AstrologyGuideContext,
  type AstrologyGuideContextValue,
  type AstrologyGuideQuestion,
  type AstrologyGuideCredits,
} from "@/components/astrology-guide/AstrologyGuideContext";
import AstrologyGuideWidget from "@/components/astrology-guide/AstrologyGuideWidget";
import AskAboutSectionButton from "@/components/astrology-guide/AskAboutSectionButton";

type Scenario = "empty_free" | "thread_with_pending" | "low_credits" | "out_of_credits" | "failed";

const SAMPLE_ANSWER = `Plutone in 8a casa segna un modo intenso di vivere l'intimità: ogni legame importante porta con sé una soglia da attraversare, una zona della tua interiorità che chiede di essere vista senza maschere.

Non sei una persona che si accontenta di legami superficiali — anche quando ci provi, qualcosa dentro di te cerca un livello più profondo. Questo può essere bellissimo e faticoso allo stesso tempo: bellissimo perché vivi le relazioni come spazi di trasformazione reale, faticoso perché non tutti riescono a stare a quella profondità.

Il rischio è confondere l'intensità con la verità. Una relazione può essere viscerale e comunque non nutrirti. Un legame più calmo può essere più solido di quanto credi.`;

const buildScenario = (s: Scenario): {
  credits: AstrologyGuideCredits;
  questions: AstrologyGuideQuestion[];
} => {
  const baseSession = "preview-session";
  const baseProfile = "preview-profile";
  const now = Date.now();
  switch (s) {
    case "empty_free":
      return {
        credits: { balance: 2, total_granted: 2, total_used: 0 },
        questions: [],
      };
    case "thread_with_pending":
      return {
        credits: { balance: 9, total_granted: 12, total_used: 3 },
        questions: [
          {
            id: "q1",
            profile_id: baseProfile,
            quiz_session_id: baseSession,
            section_id: "emotions_relationships",
            question: "Cosa significa avere Plutone in 8a casa per le mie relazioni?",
            answer: SAMPLE_ANSWER,
            status: "completed",
            scheduled_for: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
            processed_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
            email_sent_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
            is_free: true,
            created_at: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
            feedback: null,

            feedback_comment: null,

            error: null,
          },
          {
            id: "q2",
            profile_id: baseProfile,
            quiz_session_id: baseSession,
            section_id: null,
            question: "Come si manifesta nelle relazioni la mia Luna in Scorpione?",
            answer: null,
            status: "pending",
            scheduled_for: new Date(now + 3.5 * 60 * 60 * 1000).toISOString(),
            processed_at: null,
            email_sent_at: null,
            is_free: false,
            created_at: new Date(now - 30 * 60 * 1000).toISOString(),
            updated_at: new Date(now - 30 * 60 * 1000).toISOString(),
            feedback: null,

            feedback_comment: null,

            error: null,
          },
        ],
      };
    case "low_credits":
      return {
        credits: { balance: 1, total_granted: 12, total_used: 11 },
        questions: [
          {
            id: "q1",
            profile_id: baseProfile,
            quiz_session_id: baseSession,
            section_id: "identity",
            question: "Quale schema relazionale tendo a ripetere?",
            answer:
              "Tendi a entrare nelle relazioni con grande apertura, poi a un certo punto qualcosa scatta — di solito una percezione di non essere capita davvero — e ti ritiri. Non è freddezza: è autoprotezione di un nucleo che è stato ferito presto.",
            status: "completed",
            scheduled_for: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
            processed_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
            email_sent_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
            is_free: false,
            created_at: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
            feedback: null,

            feedback_comment: null,

            error: null,
          },
        ],
      };
    case "out_of_credits":
      return {
        credits: { balance: 0, total_granted: 12, total_used: 12 },
        questions: [
          {
            id: "q1",
            profile_id: baseProfile,
            quiz_session_id: baseSession,
            section_id: null,
            question: "Su cosa devo lavorare adesso?",
            answer:
              "Il punto in cui sei adesso non chiede grandi mosse: chiede di smettere di rincorrere prove esterne. Hai già le informazioni che ti servono — il problema è che continui a ignorarle perché ti chiedono qualcosa di scomodo.",
            status: "completed",
            scheduled_for: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
            processed_at: new Date(now - 23 * 60 * 60 * 1000).toISOString(),
            email_sent_at: new Date(now - 23 * 60 * 60 * 1000).toISOString(),
            is_free: false,
            created_at: new Date(now - 25 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(now - 23 * 60 * 60 * 1000).toISOString(),
            feedback: null,

            feedback_comment: null,

            error: null,
          },
        ],
      };
    case "failed":
      return {
        credits: { balance: 5, total_granted: 12, total_used: 7 },
        questions: [
          {
            id: "q1",
            profile_id: baseProfile,
            quiz_session_id: baseSession,
            section_id: null,
            question: "Domanda fallita per un errore di rete.",
            answer: null,
            status: "failed",
            scheduled_for: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
            processed_at: null,
            email_sent_at: null,
            is_free: false,
            created_at: new Date(now - 7 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
            feedback: null,

            feedback_comment: null,

            error: "gemini_http_500: upstream timeout",
          },
        ],
      };
  }
};

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "empty_free", label: "Empty (free question available)" },
  { id: "thread_with_pending", label: "Thread + pending answer" },
  { id: "low_credits", label: "Low credits (1 left)" },
  { id: "out_of_credits", label: "Out of credits (buy CTA)" },
  { id: "failed", label: "Failed answer" },
];

const DevAstrologyGuidePreview = () => {
  const [scenario, setScenario] = useState<Scenario>("empty_free");
  const [isOpen, setIsOpen] = useState(true);
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);
  const [pendingPrefill, setPendingPrefill] = useState<string | null>(null);

  const { credits, questions } = useMemo(() => buildScenario(scenario), [scenario]);

  const value = useMemo<AstrologyGuideContextValue>(
    () => ({
      loading: false,
      credits,
      questions,
      isOpen,
      pendingSectionId,
      pendingPrefill,
      submitting: false,
      buyingPack: false,
      quizSessionId: "preview-session",
      open: (options) => {
        if (options?.sectionId !== undefined) setPendingSectionId(options.sectionId);
        if (options?.prefill !== undefined) setPendingPrefill(options.prefill);
        setIsOpen(true);
      },
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
      consumePendingPrefill: () => setPendingPrefill(null),
      consumePendingSection: () => {
        const v = pendingSectionId;
        setPendingSectionId(null);
        return v;
      },
      submitQuestion: async (q) => {
        console.log("[preview] submit:", q);
        return { success: true, scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() };
      },
      submitFeedback: async () => { console.log("[preview] submitFeedback"); },
      buyPack: async () => {
        console.log("[preview] buyPack");
      },
    }),
    [credits, questions, isOpen, pendingSectionId, pendingPrefill],
  );

  return (
    <AstrologyGuideContext.Provider value={value}>
      <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-primary">Dev preview</p>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Astrology Guide widget
          </h1>
          <p className="text-sm text-muted-foreground">
            Standalone visual preview. State is mocked locally — submit and buy actions log
            to console. Switch scenarios below to see different states.
          </p>
        </header>

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Scenario
          </p>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={`text-sm px-3 py-1.5 rounded-full border transition ${
                  scenario === s.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Widget state
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="text-sm px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              Open panel
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              Close panel (show bubble)
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Section "Approfondisci" buttons
          </p>
          <div className="space-y-3 rounded-2xl border border-border/60 bg-surface p-6">
            <p className="text-sm text-foreground/80">
              Esempio sezione "Emozioni e relazioni" del report. Il pulsante qui sotto apre
              il widget pre-impostato sulla sezione corrente.
            </p>
            <AskAboutSectionButton
              sectionId="emotions_relationships"
              sectionLabel="Emozioni e relazioni"
            />
          </div>
          <div className="space-y-3 rounded-2xl border border-border/60 bg-surface p-6">
            <p className="text-sm text-foreground/80">
              Esempio sezione "Identità".
            </p>
            <AskAboutSectionButton sectionId="identity" sectionLabel="Identità" />
          </div>
        </section>

        <section className="text-xs text-muted-foreground/80 pt-6 border-t border-border/40">
          <p>
            <strong>Note:</strong> il widget è in <code>position: fixed</code> in basso a
            destra (in basso a tutta larghezza su mobile). Cambia scenario per vedere il
            badge "1 gratis", il counter, e la card "Acquista altre 10 domande".
          </p>
        </section>

        <AstrologyGuideWidget />
      </div>
    </AstrologyGuideContext.Provider>
  );
};

export default DevAstrologyGuidePreview;
