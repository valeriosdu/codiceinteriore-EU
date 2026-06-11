// Stripe product/price for the Astrology Guide question pack.
//
// The price below MUST be created manually in the Stripe dashboard before the
// upsell can ship:
//   1. Stripe dashboard → Products → New Product
//      → "Pacchetto domande Guida astrologica"
//   2. One-time price, EUR, 7,90.
//   3. Replace ASTROLOGY_GUIDE_PACK_PRICE_ID below with the new price ID.
//   4. Re-deploy create-astrology-pack-checkout.
//
// Until this is replaced, create-astrology-pack-checkout returns 500 so we
// don't accidentally charge the wrong price.

export const ASTROLOGY_GUIDE_PACK_PRICE_ID = "price_1TVWj7GZqTxkp1nxNRHbwyqm";
export const ASTROLOGY_GUIDE_PACK_AMOUNT_CENTS = 790;
export const ASTROLOGY_GUIDE_PACK_CREDITS = 10;

export const ASTROLOGY_GUIDE_PRODUCT_CODE = "astrology_guide_pack_10";
export const ASTROLOGY_GUIDE_PURCHASE_TYPE = "astrology_guide_pack";
