import it from './it';
import es from './es';
import en from './en';
import nl from './nl';
import fi from './fi';
import type { Language } from '@/markets';

export type Messages = typeof it;

const CATALOGS: Record<Language, Messages> = {
  it,
  es,
  en,
  nl,
  fi,
};

export function getMessages(language: Language): Messages {
  return CATALOGS[language] ?? CATALOGS.it;
}
