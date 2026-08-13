import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';

/**
 * Birth date/time con campi nullable per permettere selezione parziale
 * (es. l'utente seleziona prima il mese, poi il giorno, poi l'anno).
 * La validazione di "completezza" e' fatta a livello di CoppiaQuiz e
 * useSynastrySession converte in null se ANY subfield e' null.
 */
export interface SynastryPersonData {
  name: string;
  birthDate: { day: number | null; month: number | null; year: number | null };
  birthTime: { hour: number | null; minute: number | null };
  birthPlace: string;
  birthLat: number | null;
  birthLng: number | null;
  birthTimezone: number | null;
  birthTimezoneIana: string | null;
  timeKnown: boolean;
}

/** True se tutti e 3 i campi della data sono valorizzati. */
export function isBirthDateComplete(d: SynastryPersonData['birthDate']): boolean {
  return d.day != null && d.month != null && d.year != null;
}

/** La data di nascita in forma completa, o null: serve al matching avanzato Meta. */
export function toCompleteBirthDate(
  d: SynastryPersonData['birthDate'],
): { day: number; month: number; year: number } | null {
  if (!isBirthDateComplete(d)) return null;
  return { day: d.day as number, month: d.month as number, year: d.year as number };
}

/** True se entrambi i campi dell'ora sono valorizzati. */
export function isBirthTimeComplete(t: SynastryPersonData['birthTime']): boolean {
  return t.hour != null && t.minute != null;
}

export interface SynastryScores {
  romance?: number;
  communication?: number;
  stability?: number;
  intimacy?: number;
  growth?: number;
  tension?: number;
  overall?: number;
  // Mappa italiana derivata (per visualizzazione)
  sintonia_emotiva?: number;
  attrazione?: number;
  comunicazione?: number;
  stabilita?: number;
  crescita?: number;
  tensione?: number;
}

export interface TeaserHighlight {
  title: string;
  body: string;
}

export interface SynastryApertura {
  cosa_siete: string;
  dove_brillate: string;
  dove_inciampate: string;
  dove_andate: string;
}

export interface SynastryReportContent {
  apertura?: SynastryApertura;
  ritratto_coppia?: string;
  attrazione_chimica?: string;
  comunicazione?: string;
  mondo_emotivo?: string;
  sfide?: string;
  stabilita_longevita?: string;
  pattern_karmico?: string;
  direzione?: string;
}

export type RelationshipDuration =
  | 'under_1y'
  | '1_to_3y'
  | '3_to_7y'
  | '7_to_15y'
  | 'over_15y'
  | 'prefer_not_to_say';

export type PricingTier = 'standard' | 'launch';

export interface SynastryData {
  personA: SynastryPersonData;
  personB: SynastryPersonData;
  clientName: string;
  focusRelational: string;
  relationshipDuration: RelationshipDuration | null;
  /** 'standard' = 19,00 (default), 'launch' = 14,90 */
  pricingTier: PricingTier;

  sessionId: string | null;
  archetype: string | null;
  archetypeLabel: string | null;
  scoreOverall: number | null;
  scores: SynastryScores | null;
  teaserHighlight: TeaserHighlight | null;
  biWheelSvg: string | null;
  fullReport: SynastryReportContent | null;
  processingStatus: string | null;
}

const EMPTY_PERSON: SynastryPersonData = {
  name: '',
  birthDate: { day: null, month: null, year: null },
  birthTime: { hour: null, minute: null },
  birthPlace: '',
  birthLat: null,
  birthLng: null,
  birthTimezone: null,
  birthTimezoneIana: null,
  timeKnown: true,
};

const EMPTY_SYNASTRY: SynastryData = {
  personA: { ...EMPTY_PERSON },
  personB: { ...EMPTY_PERSON },
  clientName: '',
  focusRelational: '',
  relationshipDuration: null,
  pricingTier: 'standard',
  sessionId: null,
  archetype: null,
  archetypeLabel: null,
  scoreOverall: null,
  scores: null,
  teaserHighlight: null,
  biWheelSvg: null,
  fullReport: null,
  processingStatus: null,
};

const STORAGE_KEYS = {
  sessionId: 'ci_synastry_session_id',
  funnelStage: 'ci_synastry_funnel_stage',
  pricingTier: 'ci_synastry_pricing_tier',
} as const;

export const getStoredPricingTier = (): PricingTier => {
  if (typeof window === 'undefined') return 'standard';
  const stored = localStorage.getItem(STORAGE_KEYS.pricingTier);
  return stored === 'launch' ? 'launch' : 'standard';
};

export const setStoredPricingTier = (tier: PricingTier) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.pricingTier, tier);
};

export type SynastryFunnelStage = 'quiz' | 'teaser' | 'offer';

export const getSynastryFunnelStage = (): SynastryFunnelStage | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.funnelStage) as SynastryFunnelStage | null;
};

export const getStoredSynastrySessionId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.sessionId);
};

export const clearSynastryStorage = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.sessionId);
  localStorage.removeItem(STORAGE_KEYS.funnelStage);
  // NB: pricingTier non viene cancellato: l'utente che riprova il quiz dopo
  // essere atterrato via email deve mantenere lo sconto.
};

interface SynastryContextType {
  data: SynastryData;
  updateData: (updates: Partial<SynastryData>) => void;
  updatePersonA: (updates: Partial<SynastryPersonData>) => void;
  updatePersonB: (updates: Partial<SynastryPersonData>) => void;
  resetForNewPurchase: () => void;
}

const SynastryContext = createContext<SynastryContextType | undefined>(undefined);

export const SynastryProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<SynastryData>(() => {
    const storedSessionId = getStoredSynastrySessionId();
    const storedTier = getStoredPricingTier();
    return {
      ...EMPTY_SYNASTRY,
      sessionId: storedSessionId,
      pricingTier: storedTier,
    };
  });

  const updateData = useCallback((updates: Partial<SynastryData>) => {
    setData((prev) => {
      const next = { ...prev, ...updates };

      if (updates.sessionId) {
        localStorage.setItem(STORAGE_KEYS.sessionId, updates.sessionId);
      }
      if (updates.teaserHighlight) {
        localStorage.setItem(STORAGE_KEYS.funnelStage, 'teaser');
      }
      if (updates.pricingTier) {
        setStoredPricingTier(updates.pricingTier);
      }
      return next;
    });
  }, []);

  const updatePersonA = useCallback((updates: Partial<SynastryPersonData>) => {
    setData((prev) => ({
      ...prev,
      personA: { ...prev.personA, ...updates },
    }));
  }, []);

  const updatePersonB = useCallback((updates: Partial<SynastryPersonData>) => {
    setData((prev) => ({
      ...prev,
      personB: { ...prev.personB, ...updates },
    }));
  }, []);

  const resetForNewPurchase = useCallback(() => {
    clearSynastryStorage();
    setData({ ...EMPTY_SYNASTRY });
  }, []);

  return (
    <SynastryContext.Provider
      value={{ data, updateData, updatePersonA, updatePersonB, resetForNewPurchase }}
    >
      {children}
    </SynastryContext.Provider>
  );
};

export const useSynastry = () => {
  const ctx = useContext(SynastryContext);
  if (!ctx) throw new Error('useSynastry must be used within SynastryProvider');
  return ctx;
};

export const markSynastryFunnelStage = (stage: SynastryFunnelStage) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.funnelStage, stage);
};
