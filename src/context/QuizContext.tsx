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
} as const;

export type FunnelStage = 'quiz' | 'teaser' | 'offer';

export const getFunnelStage = (): FunnelStage | null => {
  return localStorage.getItem(STORAGE_KEYS.funnelStage) as FunnelStage | null;
};

export const getStoredSessionId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.sessionId);
};

export const clearFunnelStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.sessionId);
  localStorage.removeItem(STORAGE_KEYS.funnelStage);
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
