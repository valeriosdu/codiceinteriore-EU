import type { MarketConfig, MarketId } from './types';
import { IT_MARKET } from './it';
import { ES_MARKET } from './es';
import { US_MARKET } from './us';
import { NL_MARKET } from './nl';

export const MARKETS: Record<MarketId, MarketConfig> = {
  it: IT_MARKET,
  es: ES_MARKET,
  us: US_MARKET,
  nl: NL_MARKET,
};

// Ogni membro della union deve comparire qui: TypeScript non verifica che la
// catena di || copra MarketId, e un mercato dimenticato NON da errore — cade
// silenziosamente su MARKETS.it. Protetto dal test di parita mercati.
const isMarketId = (value: unknown): value is MarketId =>
  value === 'it' || value === 'es' || value === 'us' || value === 'nl';

// Risoluzione: VITE_MARKET (un progetto Vercel per dominio) → hostname di
// produzione (preview/fallback) → 'it'.
export function resolveMarket(): MarketConfig {
  const fromEnv = import.meta.env.VITE_MARKET;
  if (isMarketId(fromEnv)) return MARKETS[fromEnv];
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    for (const market of Object.values(MARKETS)) {
      if (market.hostnames.includes(host)) return market;
    }
  }
  return MARKETS.it;
}

export const MARKET: MarketConfig = resolveMarket();

export type { MarketConfig, MarketId, Language, MarketPrices, MarketLegal } from './types';
