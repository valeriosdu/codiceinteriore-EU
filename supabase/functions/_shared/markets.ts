// Configurazione per-mercato del backend multi-mercato.
//
// Regole:
// - La config contiene NOMI di secret (env-var indirection), mai valori.
// - Il mercato `it` usa i nomi non suffissati esistenti + i price ID storici
//   come default: finché una funzione non passa esplicitamente un market
//   diverso, il comportamento è identico a prima.
// - Per i mercati nuovi (es. `es`) un secret pagamenti mancante deve fallire
//   in modo esplicito: mai fallback silenzioso sull'account di un altro
//   mercato/azienda.
// - Le funzioni leggono il market dalla riga DB (quiz_sessions /
//   synastry_sessions / checkout_sessions / transit_subscriptions), mai da
//   un env globale.

import {
  TRANSIT_ONE_TIME_PRICE_ID,
  TRANSIT_SUBSCRIPTION_PRICE_ID,
} from "./transit-products.ts";
import { ASTROLOGY_GUIDE_PACK_PRICE_ID } from "./astrology-products.ts";

export type MarketId = "it" | "es" | "us" | "nl";
export type Language = "it" | "es" | "en" | "nl";

export type StripeProduct =
  | "base"
  | "premium"
  | "synastry"
  | "synastryLaunch"
  | "transitOneTime"
  | "transitSubscription"
  | "astroPack";

export interface BackendMarketConfig {
  id: MarketId;
  language: Language;
  locale: string;
  siteUrl: string;
  siteName: string;
  senderDomain: string;
  fromDomain: string;
  contactEmail: string;
  currency: "EUR" | "USD";
  countryCode: string;
  stripe: {
    secretKeyEnv: string;
    secretKeyTestEnv: string;
    webhookSecretEnv: string;
    webhookSecretTestEnv: string;
    subscriptionWebhookSecretEnv: string;
    priceEnv: Record<StripeProduct, string>;
    priceDefaults: Partial<Record<StripeProduct, string>>;
  };
  paypal: {
    envEnv: string;
    clientIdEnv: string;
    clientSecretEnv: string;
    webhookIdEnv: string;
  };
  brevoApiKeyEnv: string;
  metaPixelIdEnv: string;
  metaAccessTokenEnv: string;
}

const IT_MARKET: BackendMarketConfig = {
  id: "it",
  language: "it",
  locale: "it-IT",
  siteUrl: Deno.env.get("PUBLIC_SITE_URL") || "https://www.codiceinteriore.it",
  siteName: "Codice Interiore",
  senderDomain: "notifiche.codiceinteriore.it",
  fromDomain: "codiceinteriore.it",
  contactEmail: "info@codiceinteriore.it",
  currency: "EUR",
  countryCode: "IT",
  stripe: {
    secretKeyEnv: "STRIPE_SECRET_KEY",
    secretKeyTestEnv: "STRIPE_SECRET_KEY_TEST",
    webhookSecretEnv: "STRIPE_WEBHOOK_SECRET",
    webhookSecretTestEnv: "STRIPE_WEBHOOK_SECRET_TEST",
    subscriptionWebhookSecretEnv: "STRIPE_SUBSCRIPTION_WEBHOOK_SECRET",
    priceEnv: {
      base: "STRIPE_PRICE_BASE",
      premium: "STRIPE_PRICE_PREMIUM",
      synastry: "STRIPE_PRICE_SYNASTRY",
      synastryLaunch: "STRIPE_PRICE_SYNASTRY_LAUNCH",
      transitOneTime: "STRIPE_PRICE_TRANSIT_ONE_TIME",
      transitSubscription: "STRIPE_PRICE_TRANSIT_SUBSCRIPTION",
      astroPack: "STRIPE_PRICE_ASTRO_PACK",
    },
    priceDefaults: {
      base: "price_1TKeKbGZqTxkp1nxN7yQQxhv",
      premium: "price_1TKeKzGZqTxkp1nxqaWiqNWh",
      transitOneTime: TRANSIT_ONE_TIME_PRICE_ID,
      transitSubscription: TRANSIT_SUBSCRIPTION_PRICE_ID,
      astroPack: ASTROLOGY_GUIDE_PACK_PRICE_ID,
    },
  },
  paypal: {
    envEnv: "PAYPAL_ENV",
    clientIdEnv: "PAYPAL_CLIENT_ID",
    clientSecretEnv: "PAYPAL_CLIENT_SECRET",
    webhookIdEnv: "PAYPAL_WEBHOOK_ID",
  },
  brevoApiKeyEnv: "BREVO_API_KEY",
  metaPixelIdEnv: "META_PIXEL_ID",
  metaAccessTokenEnv: "META_CONVERSIONS_API_TOKEN",
};

const ES_MARKET: BackendMarketConfig = {
  id: "es",
  language: "es",
  locale: "es-ES",
  siteUrl: "https://www.cartainterior.com",
  siteName: "Carta Interior",
  senderDomain: "notifiche.cartainterior.com",
  fromDomain: "cartainterior.com",
  contactEmail: "info@cartainterior.com",
  currency: "EUR",
  countryCode: "ES",
  stripe: {
    secretKeyEnv: "STRIPE_SECRET_KEY__ES",
    secretKeyTestEnv: "STRIPE_SECRET_KEY_TEST__ES",
    webhookSecretEnv: "STRIPE_WEBHOOK_SECRET__ES",
    webhookSecretTestEnv: "STRIPE_WEBHOOK_SECRET_TEST__ES",
    subscriptionWebhookSecretEnv: "STRIPE_SUBSCRIPTION_WEBHOOK_SECRET__ES",
    priceEnv: {
      base: "STRIPE_PRICE_BASE__ES",
      premium: "STRIPE_PRICE_PREMIUM__ES",
      synastry: "STRIPE_PRICE_SYNASTRY__ES",
      synastryLaunch: "STRIPE_PRICE_SYNASTRY_LAUNCH__ES",
      transitOneTime: "STRIPE_PRICE_TRANSIT_ONE_TIME__ES",
      transitSubscription: "STRIPE_PRICE_TRANSIT_SUBSCRIPTION__ES",
      astroPack: "STRIPE_PRICE_ASTRO_PACK__ES",
    },
    priceDefaults: {},
  },
  paypal: {
    envEnv: "PAYPAL_ENV__ES",
    clientIdEnv: "PAYPAL_CLIENT_ID__ES",
    clientSecretEnv: "PAYPAL_CLIENT_SECRET__ES",
    webhookIdEnv: "PAYPAL_WEBHOOK_ID__ES",
  },
  brevoApiKeyEnv: "BREVO_API_KEY__ES",
  metaPixelIdEnv: "META_PIXEL_ID__ES",
  metaAccessTokenEnv: "META_CONVERSIONS_API_TOKEN__ES",
};

// Smoke test: sottodominio in prestito di Carta Interior (us.cartainterior.com).
// Migrerà al dominio .com US dedicato quando comprato.
const US_MARKET: BackendMarketConfig = {
  id: "us",
  language: "en",
  locale: "en-US",
  siteUrl: "https://us.cartainterior.com",
  // Smoke test: brand + mittente email = Carta Interior (dominio già verificato
  // in Brevo, così le email arrivano). TODO: brand/sender US reali al lancio.
  siteName: "Carta Interior",
  senderDomain: "notifiche.cartainterior.com",
  fromDomain: "cartainterior.com",
  contactEmail: "info@cartainterior.com",
  currency: "USD",
  countryCode: "US",
  stripe: {
    secretKeyEnv: "STRIPE_SECRET_KEY__US",
    secretKeyTestEnv: "STRIPE_SECRET_KEY_TEST__US",
    webhookSecretEnv: "STRIPE_WEBHOOK_SECRET__US",
    webhookSecretTestEnv: "STRIPE_WEBHOOK_SECRET_TEST__US",
    subscriptionWebhookSecretEnv: "STRIPE_SUBSCRIPTION_WEBHOOK_SECRET__US",
    priceEnv: {
      base: "STRIPE_PRICE_BASE__US",
      premium: "STRIPE_PRICE_PREMIUM__US",
      synastry: "STRIPE_PRICE_SYNASTRY__US",
      synastryLaunch: "STRIPE_PRICE_SYNASTRY_LAUNCH__US",
      transitOneTime: "STRIPE_PRICE_TRANSIT_ONE_TIME__US",
      transitSubscription: "STRIPE_PRICE_TRANSIT_SUBSCRIPTION__US",
      astroPack: "STRIPE_PRICE_ASTRO_PACK__US",
    },
    priceDefaults: {},
  },
  paypal: {
    envEnv: "PAYPAL_ENV__US",
    clientIdEnv: "PAYPAL_CLIENT_ID__US",
    clientSecretEnv: "PAYPAL_CLIENT_SECRET__US",
    webhookIdEnv: "PAYPAL_WEBHOOK_ID__US",
  },
  brevoApiKeyEnv: "BREVO_API_KEY__US",
  metaPixelIdEnv: "META_PIXEL_ID__US",
  metaAccessTokenEnv: "META_CONVERSIONS_API_TOKEN__US",
};

// Mercato olandese. Condivide con Carta Interior il brand, il dominio mittente
// (gia verificato in Brevo) e l'account Stripe/PayPal ES: i secret __NL puntano
// alle stesse chiavi, ma i 7 price ID sono prodotti NUOVI con nome e descrizione
// in olandese. Nessun webhook dedicato: Stripe consegna ogni evento a OGNI
// endpoint dell'account, quindi un secondo endpoint ?market=nl processerebbe due
// volte anche i pagamenti ES. L'endpoint ?market=es serve entrambi — il mercato
// reale viene letto dalla riga DB, non dall'URL. Per questo
// STRIPE_WEBHOOK_SECRET*__NL e BREVO_API_KEY__NL non sono valorizzati (il
// dispatcher email usa una sola BREVO_API_KEY globale).
const NL_MARKET: BackendMarketConfig = {
  id: "nl",
  language: "nl",
  locale: "nl-NL",
  siteUrl: "https://nl.cartainterior.com",
  siteName: "Carta Interior",
  senderDomain: "notifiche.cartainterior.com",
  fromDomain: "cartainterior.com",
  contactEmail: "info@cartainterior.com",
  currency: "EUR",
  countryCode: "NL",
  stripe: {
    secretKeyEnv: "STRIPE_SECRET_KEY__NL",
    secretKeyTestEnv: "STRIPE_SECRET_KEY_TEST__NL",
    webhookSecretEnv: "STRIPE_WEBHOOK_SECRET__NL",
    webhookSecretTestEnv: "STRIPE_WEBHOOK_SECRET_TEST__NL",
    subscriptionWebhookSecretEnv: "STRIPE_SUBSCRIPTION_WEBHOOK_SECRET__NL",
    priceEnv: {
      base: "STRIPE_PRICE_BASE__NL",
      premium: "STRIPE_PRICE_PREMIUM__NL",
      synastry: "STRIPE_PRICE_SYNASTRY__NL",
      synastryLaunch: "STRIPE_PRICE_SYNASTRY_LAUNCH__NL",
      transitOneTime: "STRIPE_PRICE_TRANSIT_ONE_TIME__NL",
      transitSubscription: "STRIPE_PRICE_TRANSIT_SUBSCRIPTION__NL",
      astroPack: "STRIPE_PRICE_ASTRO_PACK__NL",
    },
    priceDefaults: {},
  },
  paypal: {
    envEnv: "PAYPAL_ENV__NL",
    clientIdEnv: "PAYPAL_CLIENT_ID__NL",
    clientSecretEnv: "PAYPAL_CLIENT_SECRET__NL",
    webhookIdEnv: "PAYPAL_WEBHOOK_ID__NL",
  },
  brevoApiKeyEnv: "BREVO_API_KEY__NL",
  metaPixelIdEnv: "META_PIXEL_ID__NL",
  metaAccessTokenEnv: "META_CONVERSIONS_API_TOKEN__NL",
};

const MARKETS: Record<MarketId, BackendMarketConfig> = {
  it: IT_MARKET,
  es: ES_MARKET,
  us: US_MARKET,
  nl: NL_MARKET,
};

// Ogni membro della union deve comparire qui: TypeScript non verifica che la
// catena di || la copra, e un mercato dimenticato NON da errore — getMarket
// cade silenziosamente su MARKETS.it (report, email e conto Stripe italiani).
// Protetto dal test di parita mercati.
export function isMarketId(value: unknown): value is MarketId {
  return value === "it" || value === "es" || value === "us" || value === "nl";
}

export function getMarket(id?: string | null): BackendMarketConfig {
  return isMarketId(id) ? MARKETS[id] : MARKETS.it;
}

function requireEnv(name: string, marketId: MarketId): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing secret ${name} for market "${marketId}"`);
  }
  return value;
}

export function getStripeKey(
  market: BackendMarketConfig,
  opts?: { test?: boolean },
): string {
  if (opts?.test) {
    return (
      Deno.env.get(market.stripe.secretKeyTestEnv) ||
      requireEnv(market.stripe.secretKeyEnv, market.id)
    );
  }
  return requireEnv(market.stripe.secretKeyEnv, market.id);
}

export function getStripePrice(
  market: BackendMarketConfig,
  product: StripeProduct,
): string {
  const fromEnv = Deno.env.get(market.stripe.priceEnv[product]);
  if (fromEnv) return fromEnv;
  const fallback = market.stripe.priceDefaults[product];
  if (fallback) return fallback;
  throw new Error(
    `Missing Stripe price "${product}" for market "${market.id}" (set ${market.stripe.priceEnv[product]})`,
  );
}

export function getPayPalCreds(market: BackendMarketConfig): {
  env: "sandbox" | "live";
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookId: string | null;
} {
  const rawEnv = (Deno.env.get(market.paypal.envEnv) || "sandbox").toLowerCase();
  const env = rawEnv === "live" || rawEnv === "production" ? "live" : "sandbox";
  return {
    env,
    baseUrl:
      env === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com",
    clientId: requireEnv(market.paypal.clientIdEnv, market.id),
    clientSecret: requireEnv(market.paypal.clientSecretEnv, market.id),
    webhookId: Deno.env.get(market.paypal.webhookIdEnv) || null,
  };
}

// Slug del brand derivato dal siteName: "Codice Interiore" -> "codice-interiore",
// "Carta Interior" -> "carta-interior". Un nuovo mercato lo ottiene gratis dal
// proprio siteName, senza tabelle di mappatura per-mercato.
export function brandSlug(market: BackendMarketConfig): string {
  return market.siteName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Sostantivi di tipo-documento usati nei nomi file PDF. Sono per-LINGUA (non
// per-mercato: piu mercati condividono una lingua). Il Record<Language> forza
// a compile-time l'aggiunta della voce quando si introduce una nuova lingua.
const DOC_NOUN: Record<Language, { couple: string; transits: string }> = {
  it: { couple: "coppia", transits: "transiti" },
  es: { couple: "pareja", transits: "transitos" },
  en: { couple: "couple", transits: "transits" },
  nl: { couple: "koppel", transits: "transits" },
};

export function docNoun(
  lang: string | null | undefined,
  kind: "couple" | "transits",
): string {
  const l: Language = lang && lang in DOC_NOUN ? (lang as Language) : "it";
  return DOC_NOUN[l][kind];
}
