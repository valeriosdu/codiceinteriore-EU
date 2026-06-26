import Stripe from "https://esm.sh/stripe@18.5.0";

// Stripe "Basil" (apiVersion 2025-xx.basil) ha spostato due campi usati dal
// flusso subscription/rinnovo:
//   - invoice.subscription          -> invoice.parent.subscription_details.subscription
//   - subscription.current_period_* -> subscription.items.data[0].current_period_*
// Questi helper leggono la nuova posizione con fallback alla vecchia.

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as any;
  const legacy = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
  const fromParent = inv.parent?.subscription_details?.subscription;
  const fromLine = inv.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;
  return (
    legacy ||
    (typeof fromParent === "string" ? fromParent : fromParent?.id) ||
    (typeof fromLine === "string" ? fromLine : fromLine?.id) ||
    null
  );
}

export function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  periodStart: Date;
  periodEnd: Date;
} {
  const sub = subscription as any;
  const item = sub.items?.data?.[0];
  const startSec =
    item?.current_period_start ?? sub.current_period_start ?? sub.created ?? Math.floor(Date.now() / 1000);
  const endSec =
    item?.current_period_end ?? sub.current_period_end ?? startSec + 30 * 86400;
  return { periodStart: new Date(startSec * 1000), periodEnd: new Date(endSec * 1000) };
}
