export type MarketId = 'it' | 'es';
export type Language = 'it' | 'es';

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
  contactEmail: string;
  currency: 'EUR';
  countryCode: string;
  prices: MarketPrices;
  legal: MarketLegal;
  editorialContent: boolean;
}
