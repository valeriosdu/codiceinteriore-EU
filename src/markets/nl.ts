import type { MarketConfig } from './types';
import logo from '@/assets/logo.es.webp';

// Mercato olandese. Brand condiviso con Carta Interior (stesso wordmark, stesso
// dominio mittente gia verificato in Brevo), servito su un sottodominio in
// prestito come us. Prezzi allineati a ES: stessa valuta, stessa aliquota IVA
// (21%), stessa entita venditrice.
export const NL_MARKET: MarketConfig = {
  id: 'nl',
  language: 'nl',
  locale: 'nl-NL',
  siteUrl: 'https://nl.cartainterior.com',
  hostnames: ['nl.cartainterior.com'],
  siteName: 'Carta Interior',
  logo,
  ogImage: '/og/carta-interior-1x1.webp',
  contactEmail: 'info@cartainterior.com',
  currency: 'EUR',
  countryCode: 'NL',
  prices: {
    base: 19,
    premium: 29,
    synastry: 19,
    synastryLaunch: 14.9,
    transitOneTime: 10,
    transitSubscription: 9.9,
    astroPack: 7.9,
  },
  legal: {
    companyName: 'ECOLIFE COMMERCE LTD.',
    address: '71-75 Shelton Street, Covent Garden, Londen, Verenigd Koninkrijk',
    regNumber: '16364511',
  },
  editorialContent: false,
  cookieBanner: true,
};
