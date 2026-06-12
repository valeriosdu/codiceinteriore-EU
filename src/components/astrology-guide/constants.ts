// Frontend-side policy constants for the Astrology Guide.
// Backend mirrors these (kept in sync manually):
//   - supabase/migrations/...astrology_guide.sql (literal value in trigger + backfill)
//   - supabase/functions/submit-astrology-question/index.ts (isFree gate)

export const INCLUDED_FREE_CREDITS = 2;
export const PACK_CREDITS = 10;
// Il prezzo del pacchetto è per-mercato: usa m.common.priceLabel(market.prices.astroPack).
