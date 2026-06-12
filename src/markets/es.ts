import type { MarketConfig } from './types';

// Dati legali e prezzi definitivi da confermare con l'owner prima del lancio
// (entità giuridica spagnola non ancora definita).
export const ES_MARKET: MarketConfig = {
  id: 'es',
  language: 'es',
  locale: 'es-ES',
  siteUrl: 'https://www.cartainterior.com',
  hostnames: ['cartainterior.com', 'www.cartainterior.com'],
  siteName: 'Carta Interior',
  contactEmail: 'info@cartainterior.com',
  currency: 'EUR',
  countryCode: 'ES',
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
    address: '71-75 Shelton Street, Covent Garden, Londres, Reino Unido',
    regNumber: '16364511',
  },
  editorialContent: false,
};
