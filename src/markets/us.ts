import type { MarketConfig } from './types';
// Smoke test: brand = Carta Interior → riusa logo/OG di Carta Interior.
// TODO: sostituire con logo/OG del brand US al lancio.
import logo from '@/assets/logo.es.webp';

// US market config — smoke test su us.cartainterior.com; prezzi/legali US da
// confermare al lancio.
export const US_MARKET: MarketConfig = {
  id: 'us',
  language: 'en',
  locale: 'en-US',
  // Smoke test: sottodominio in prestito di Carta Interior. Migrerà al
  // dominio .com US dedicato quando comprato (basta cambiare questi due valori).
  siteUrl: 'https://us.cartainterior.com',
  hostnames: ['us.cartainterior.com'],
  // Brand temporaneo per lo smoke test = "Carta Interior" (stesso brand del
  // dominio). TODO: sostituire col brand US reale al lancio (header/email/PDF).
  siteName: 'Carta Interior',
  logo,
  // TODO: swap to US brand OG asset.
  ogImage: '/og/carta-interior-1x1.webp',
  contactEmail: 'info@cartainterior.com',
  currency: 'USD',
  countryCode: 'US',
  prices: {
    // TODO: confirm USD prices — these mirror the es/it numeric values as USD placeholders.
    base: 19,
    premium: 29,
    synastry: 19,
    synastryLaunch: 14.9,
    transitOneTime: 10,
    transitSubscription: 9.9,
    astroPack: 7.9,
  },
  legal: {
    companyName: 'Montavia Digital LLC',
    address: '30 N Gould St Ste N, Sheridan, Wyoming 82801, United States',
  },
  editorialContent: false,
};
