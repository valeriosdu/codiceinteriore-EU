import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface QuizData {
  birthDate: { day: number; month: number; year: number } | null;
  birthTime: { hour: number; minute: number } | null;
  birthPlace: string;
  birthLat: number | null;
  birthLng: number | null;
  birthTimezone: number | null;
  birthTimezoneIana: string | null;
  attachmentResponse: string;
  focusArea: string;
  userName: string;
  purchaseType: 'base' | 'premium' | null;
  natalChart: { planets: any[]; houses: any[]; aspects: any[] } | null;
  natalChartSvg: string | null;
  teaserInsights: { title: string; body: string }[] | null;
  sessionId: string | null;
  fullReport: Record<string, string> | null;
  // True when the buyer is purchasing a report for someone else (set by the
  // "Acquista una nuova lettura" CTA on /report). Switches the quiz copy from
  // second-person to third-person; not persisted, not stored in the DB.
  subjectIsOther: boolean;
  // Discovery intent captured at the start of the self-flow quiz. For the
  // discovery landing only — angle-targeted Meta landings set funnelSlug
  // directly via URL param.
  desiredAngle: string | null;
  // Canonical angle slug for the current session. Set by Quiz.tsx from the
  // ?funnel= URL param (or 'classica' as default). Persisted to
  // quiz_sessions.funnel_slug when the session is created in Processing.tsx.
  funnelSlug: string | null;
  // Attivazione-funnel intake. Persisted as quiz_sessions.quiz_answers JSONB
  // when the session is created.
  symptomResponse: string;
  narrativeResponse: string;
}

interface QuizContextType {
  data: QuizData;
  updateData: (updates: Partial<QuizData>) => void;
  resetQuizForNewPurchase: () => void;
}

const EMPTY_QUIZ_DATA: QuizData = {
  birthDate: null,
  birthTime: null,
  birthPlace: '',
  birthLat: null,
  birthLng: null,
  birthTimezone: null,
  birthTimezoneIana: null,
  attachmentResponse: '',
  focusArea: '',
  userName: '',
  purchaseType: null,
  natalChart: null,
  natalChartSvg: null,
  teaserInsights: null,
  sessionId: null,
  fullReport: null,
  subjectIsOther: false,
  desiredAngle: null,
  funnelSlug: null,
  symptomResponse: '',
  narrativeResponse: '',
};

const STORAGE_KEYS = {
  sessionId: 'ci_session_id',
  funnelStage: 'ci_funnel_stage',
  funnelStartedAt: 'ci_funnel_started_at',
  purchaseSessionId: 'ci_purchase_session_id',
} as const;

// How long an already-generated reading stays valid. Inside the window a
// returning visitor (from an ad, the back button, a bookmark) re-sees the same
// teaser instead of redoing the quiz: the natal chart does not change, so
// regenerating it would pay a freeastroapi + Gemini cycle for the same three
// insights rewritten.
//
// Seven days is not arbitrary. It matches Meta's 7-day-click attribution window
// (a visitor re-entering inside it is still the same journey in Ads Manager)
// and the cap Safari ITP puts on script-writable storage, which on iOS wipes
// everything around day seven anyway. The rule aligns Android/desktop with what
// iOS already does by itself. Every market runs its own Meta pixel and
// localStorage is per origin, so each market domain has its own window.
const FUNNEL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type FunnelStage = 'quiz' | 'teaser' | 'offer';

export const getFunnelStage = (): FunnelStage | null => {
  return localStorage.getItem(STORAGE_KEYS.funnelStage) as FunnelStage | null;
};

export const getStoredSessionId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.sessionId);
};

// A purchase does not expire, and this is the only client-side trace that
// someone already paid: the 'offer' stage is written when the checkout opens,
// not when the money moves. It stops us from reselling the reading to an
// anonymous buyer who never activated the account. Only anonymous buyers get
// it (a signed-in buyer has an account), and it means "paid but not
// activated": clearFunnelStorage() deliberately leaves it alone, and it is
// cleared on activation and on logout.
export const getPurchaseSessionId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.purchaseSessionId);
};

export const rememberPurchaseSessionId = (checkoutSessionId: string) => {
  if (!checkoutSessionId) return;
  localStorage.setItem(STORAGE_KEYS.purchaseSessionId, checkoutSessionId);
};

export const clearPurchaseSessionId = () => {
  localStorage.removeItem(STORAGE_KEYS.purchaseSessionId);
};

export const clearFunnelStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.sessionId);
  localStorage.removeItem(STORAGE_KEYS.funnelStage);
  localStorage.removeItem(STORAGE_KEYS.funnelStartedAt);
};

// Single predicate for "already has a reading ready and it is still worth
// sending them to it". It used to live hand-duplicated in Index, Header and
// Processing with slightly different conditions (two required the session id,
// one did not).
//
// When the window has expired it cleans up, so on the next pass the visitor is
// simply new and starts from the landing. Someone who already had a reading
// before this rule existed has no timestamp: they are not expelled on deploy,
// they get "now" and the window starts from there. Same for a corrupted value:
// never throw someone out over unreadable data.
export const hasFreshFunnelSession = (): boolean => {
  const stage = getFunnelStage();
  if (stage !== 'teaser' && stage !== 'offer') return false;
  if (!getStoredSessionId()) return false;

  const startedAt = Number(localStorage.getItem(STORAGE_KEYS.funnelStartedAt));
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    localStorage.setItem(STORAGE_KEYS.funnelStartedAt, String(Date.now()));
    return true;
  }

  // Only expired, not "in the future": a negative age means the device clock
  // was moved back, not that the reading is old.
  if (Date.now() - startedAt > FUNNEL_TTL_MS) {
    clearFunnelStorage();
    return false;
  }

  return true;
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<QuizData>(() => {
    const storedSessionId = getStoredSessionId();
    return {
      ...EMPTY_QUIZ_DATA,
      sessionId: storedSessionId,
    };
  });

  const updateData = (updates: Partial<QuizData>) => {
    setData(prev => {
      const next = { ...prev, ...updates };

      // Persist sessionId
      if (updates.sessionId) {
        localStorage.setItem(STORAGE_KEYS.sessionId, updates.sessionId);
      }

      // Advance funnel stage
      if (updates.teaserInsights) {
        localStorage.setItem(STORAGE_KEYS.funnelStage, 'teaser');
        // The window starts when the reading exists and is not renewed on
        // every visit: seven days from generation, not from the last access.
        if (!localStorage.getItem(STORAGE_KEYS.funnelStartedAt)) {
          localStorage.setItem(STORAGE_KEYS.funnelStartedAt, String(Date.now()));
        }
      }
      if (updates.purchaseType) {
        localStorage.setItem(STORAGE_KEYS.funnelStage, 'offer');
      }

      return next;
    });
  };

  const resetQuizForNewPurchase = () => {
    clearFunnelStorage();
    setData({ ...EMPTY_QUIZ_DATA, subjectIsOther: true });
  };

  return (
    <QuizContext.Provider value={{ data, updateData, resetQuizForNewPurchase }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) throw new Error('useQuiz must be used within QuizProvider');
  return context;
};
