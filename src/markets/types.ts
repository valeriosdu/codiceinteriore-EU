export type MarketId = 'it' | 'es' | 'us';
export type Language = 'it' | 'es' | 'en';

export interface MarketPrices {
  base: number;
  premium: number;
  synastry: number;
  synastryLaunch: number;
  transitOneTime: number;
  transitSubscription: number;
  astroPack: number;
}

export interface MarketLegal {
  companyName: string;
  vatId?: string;
  address?: string;
  regNumber?: string;
}

export interface MarketConfig {
  id: MarketId;
  language: Language;
  locale: string;
  siteUrl: string;
  hostnames: string[];
  siteName: string;
  // Logo orizzontale trasparente (asset importato), mostrato in Header/Report/
  // Processing. Per-mercato perché il wordmark cambia col brand.
  logo: string;
  // Immagine OG/social quadrata brandizzata (path da public/). Usata come
  // default og:image e come immagine prodotto nello structured data.
  ogImage: string;
  contactEmail: string;
  currency: 'EUR' | 'USD';
  countryCode: string;
  prices: MarketPrices;
  legal: MarketLegal;
  editorialContent: boolean;
  // GDPR/ePrivacy (UE) richiede un banner di consenso opt-in; gli USA no
  // (CCPA/CPRA usa un modello opt-out, non un banner). Per-mercato invece di
  // un branch it/es binario.
  cookieBanner: boolean;
}
