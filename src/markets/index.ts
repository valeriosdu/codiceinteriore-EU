import type { MarketConfig, MarketId } from './types';
import { IT_MARKET } from './it';
import { ES_MARKET } from './es';

export const MARKETS: Record<MarketId, MarketConfig> = {
  it: IT_MARKET,
  es: ES_MARKET,
};

const isMarketId = (value: unknown): value is MarketId =>
  value === 'it' || value === 'es';

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
