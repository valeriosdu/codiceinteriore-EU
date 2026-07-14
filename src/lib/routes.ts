import { MARKET } from '@/markets';

// Slug URL localizzati per mercato.
//
// La maggior parte degli slug del funnel è già inglese (/quiz, /report,
// /checkout, /success, /activate, /teaser, /offer, /processing,
// /report-processing, /privacy) e resta identica in tutti i mercati. Qui
// vivono SOLO i pochi slug che erano italiani, tradotti in inglese per il
// mercato en (us). it ed es continuano a usare gli slug italiani storici →
// nessuna regressione per loro.
//
// `MARKET` è il singleton risolto al build (VITE_MARKET), quindi ROUTES è
// calcolato una volta per build: slug inglesi solo dove il mercato è en.
const EN = MARKET.language === 'en';

const couple = EN ? '/couple' : '/coppia';

export const ROUTES = {
  couple,
  coupleQuiz: `${couple}/quiz`,
  coupleProcessing: `${couple}/processing`,
  coupleTeaser: `${couple}/teaser`,
  coupleOffer: `${couple}/offer`,
  coupleSuccess: `${couple}/success`,
  coupleActivate: `${couple}/activate`,
  coupleReportProcessing: `${couple}/report-processing`,
  coupleReport: `${couple}/report`,
  contact: EN ? '/contact' : '/contatti',
  terms: EN ? '/terms' : '/termini',
  gift: EN ? '/gift' : '/regalo',
  lpClassica: EN ? '/lp/classic' : '/lp/classica',
  lpAttivazione: EN ? '/lp/activation' : '/lp/attivazione',
} as const;

// Vecchi slug italiani, per i redirect 301 → nuovi slug. Solo nel mercato en
// gli slug differiscono, quindi i redirect si registrano solo lì.
export const LEGACY_SLUGS = {
  couple: '/coppia',
  contact: '/contatti',
  terms: '/termini',
  gift: '/regalo',
  lpClassica: '/lp/classica',
  lpAttivazione: '/lp/attivazione',
} as const;

// True solo quando gli slug sono stati rilocalizzati (mercato en).
export const SLUGS_LOCALIZED = EN;
