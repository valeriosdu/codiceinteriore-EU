import it from './it';
import es from './es';
import type { Language } from '@/markets';

export type Messages = typeof it;

const CATALOGS: Record<Language, Messages> = {
  it,
  es,
};

export function getMessages(language: Language): Messages {
  return CATALOGS[language] ?? CATALOGS.it;
}
