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
    base: 29,
    premium: 39,
    synastry: 19,
    synastryLaunch: 14.9,
    transitOneTime: 10,
    transitSubscription: 9.9,
    astroPack: 7.9,
  },
  legal: {
    companyName: 'VSD Green Commerce FZE LLC',
    address: 'Business Centre, Sharjah Publishing City Free Zone, Sharjah, United Arab Emirates',
    regNumber: '4418567',
  },
  editorialContent: false,
  // US: nessun obbligo di opt-in style GDPR (CCPA/CPRA usa un modello
  // opt-out, gestito nella Privacy Policy). Il banner attuale è comunque
  // cosmetico (non blocca i tracker), quindi qui non toglie protezione reale.
  cookieBanner: false,
};
