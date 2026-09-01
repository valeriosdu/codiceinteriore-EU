import { MARKET } from '@/markets';
import type { Language } from '@/markets';

// Slug URL localizzati per lingua.
//
// La maggior parte degli slug del funnel è già inglese (/quiz, /report,
// /checkout, /success, /activate, /teaser, /offer, /processing,
// /report-processing, /privacy) e resta identica in tutti i mercati. Qui
// vivono SOLO i pochi slug che erano italiani.
//
// it ed es continuano a usare gli slug italiani storici → nessuna regressione
// per loro; en (us) usa quelli inglesi già in produzione; nl ha i suoi. La
// tabella ha sostituito un booleano `EN`: con un flag binario una lingua nuova
// ereditava in silenzio gli slug italiani, e un sito olandese su /coppia e
// /termini è la cosa peggiore sia per la SEO sia per la fiducia del visitatore.
type SlugSet = {
  couple: string;
  contact: string;
  terms: string;
  gift: string;
  lpClassica: string;
  lpAttivazione: string;
};

const IT_SLUGS: SlugSet = {
  couple: '/coppia',
  contact: '/contatti',
  terms: '/termini',
  gift: '/regalo',
  lpClassica: '/lp/classica',
  lpAttivazione: '/lp/attivazione',
};

export const SLUGS_BY_LANG: Record<Language, SlugSet> = {
  it: IT_SLUGS,
  // Lo spagnolo ha ereditato gli slug italiani al lancio: cambiarli ora
  // romperebbe i link già indicizzati, quindi restano.
  es: IT_SLUGS,
  en: {
    couple: '/couple',
    contact: '/contact',
    terms: '/terms',
    gift: '/gift',
    lpClassica: '/lp/classic',
    lpAttivazione: '/lp/activation',
  },
  nl: {
    couple: '/koppel',
    contact: '/contact',
    terms: '/voorwaarden',
    gift: '/cadeau',
    lpClassica: '/lp/klassiek',
    lpAttivazione: '/lp/activatie',
  },
};

// Funzione pura: usata dai test per congelare gli slug it/es e dimostrare che
// la tabella non ha cambiato nulla per i mercati esistenti.
export function buildRoutes(lang: Language) {
  const s = SLUGS_BY_LANG[lang] ?? IT_SLUGS;
  const couple = s.couple;
  return {
    couple,
    coupleQuiz: `${couple}/quiz`,
    coupleProcessing: `${couple}/processing`,
    coupleTeaser: `${couple}/teaser`,
    coupleOffer: `${couple}/offer`,
    coupleSuccess: `${couple}/success`,
    coupleActivate: `${couple}/activate`,
    coupleReportProcessing: `${couple}/report-processing`,
    coupleReport: `${couple}/report`,
    contact: s.contact,
    terms: s.terms,
    gift: s.gift,
    lpClassica: s.lpClassica,
    lpAttivazione: s.lpAttivazione,
  } as const;
}

// `MARKET` è il singleton risolto al build (VITE_MARKET), quindi ROUTES è
// calcolato una volta per build.
export const ROUTES = buildRoutes(MARKET.language);

// Vecchi slug italiani, per i redirect 301 → nuovi slug. Si registrano solo
// dove gli slug differiscono davvero.
export const LEGACY_SLUGS = {
  couple: IT_SLUGS.couple,
  contact: IT_SLUGS.contact,
  terms: IT_SLUGS.terms,
  gift: IT_SLUGS.gift,
  lpClassica: IT_SLUGS.lpClassica,
  lpAttivazione: IT_SLUGS.lpAttivazione,
} as const;

// True solo quando gli slug sono stati rilocalizzati (en, nl). Derivato invece
// che scritto a mano: una lingua nuova con slug propri lo ottiene gratis.
export const SLUGS_LOCALIZED = ROUTES.couple !== LEGACY_SLUGS.couple;
