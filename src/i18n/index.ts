import it from './it';
import type { Language } from '@/markets';

export type Messages = typeof it;

// Il catalogo spagnolo arriva in Fase 2; fino ad allora `es` degrada a `it`
// così il funnel resta funzionante sotto VITE_MARKET=es durante lo sviluppo.
const CATALOGS: Record<Language, Messages> = {
  it,
  es: it,
};

export function getMessages(language: Language): Messages {
  return CATALOGS[language] ?? CATALOGS.it;
}
