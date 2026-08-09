import type { MarketConfig } from './types';
import logo from '@/assets/logo.webp';

export const IT_MARKET: MarketConfig = {
  id: 'it',
  language: 'it',
  locale: 'it-IT',
  siteUrl: 'https://www.codiceinteriore.it',
  hostnames: ['codiceinteriore.it', 'www.codiceinteriore.it'],
  siteName: 'Codice Interiore',
  logo,
  ogImage: '/og/codice-interiore-1x1.webp',
  contactEmail: 'info@codiceinteriore.it',
  currency: 'EUR',
  countryCode: 'IT',
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
    address: '71-75 Shelton Street, Covent Garden, Londra, Regno Unito',
    regNumber: '16364511',
  },
  editorialContent: true,
  cookieBanner: true,
};
