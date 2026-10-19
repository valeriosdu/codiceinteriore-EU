import it from './it';
import es from './es';
import en from './en';
import nl from './nl';
import fi from './fi';
import type { Language } from '@/markets';

export type Messages = typeof it;

// Un build di produzione serve un solo mercato (un progetto Vercel per
// dominio, VITE_MARKET fissato a build time): basta il suo catalogo. Vite
// sostituisce PROD e VITE_MARKET con letterali, Rollup scarta i rami morti e
// con loro gli import degli altri cataloghi, ~60 KB l'uno nel bundle che
// scarica ogni landing. In dev, nei test o senza VITE_MARKET restano tutti.
// Il test di parita' mercati verifica che ogni mercato compaia qui con la
// propria lingua.
const CATALOGS: Partial<Record<Language, Messages>> = !import.meta.env.PROD
  ? { it, es, en, nl, fi }
  : import.meta.env.VITE_MARKET === 'it'
    ? { it }
    : import.meta.env.VITE_MARKET === 'es'
      ? { es }
      : import.meta.env.VITE_MARKET === 'us'
        ? { en }
        : import.meta.env.VITE_MARKET === 'nl'
          ? { nl }
          : import.meta.env.VITE_MARKET === 'fi'
            ? { fi }
            : { it, es, en, nl, fi };

export function getMessages(language: Language): Messages {
  return CATALOGS[language] ?? CATALOGS.it ?? (Object.values(CATALOGS)[0] as Messages);
}
