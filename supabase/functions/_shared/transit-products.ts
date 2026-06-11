// Stripe products/prices for the transit upsell.
// Created via Stripe API on 2026-04-28. Both products are EUR.
//
// To switch to manually-created prices, just replace the IDs below.

export const TRANSIT_ONE_TIME_PRICE_ID = "price_1TR870GZqTxkp1nxUF8ob9G7";
export const TRANSIT_ONE_TIME_PRODUCT_ID = "prod_UPy31Mym7s9iFq";
export const TRANSIT_ONE_TIME_AMOUNT_CENTS = 1000;

export const TRANSIT_SUBSCRIPTION_PRICE_ID = "price_1TWsVHGZqTxkp1nxYCC6Gt0Y";
export const TRANSIT_SUBSCRIPTION_PRODUCT_ID = "prod_UPy3WHbcTtSTJr";
export const TRANSIT_SUBSCRIPTION_AMOUNT_CENTS = 990;

export type TransitCheckoutMode = "one_time" | "subscription";

export const TRANSIT_PRODUCT_CODES = {
  one_time: "transits_one_month_addon",
  subscription: "transits_monthly_subscription",
} as const;

export const TRANSIT_PURCHASE_TYPES = {
  one_time: "transits_addon",
  subscription: "transits_subscription",
} as const;
