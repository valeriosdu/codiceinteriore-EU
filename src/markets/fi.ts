import type { MarketConfig } from './types';
import logo from '@/assets/logo.es.webp';

// Mercato finlandese. Stesso impianto di nl: brand Carta Interior, sottodominio
// di cartainterior.com, stesso account Stripe/PayPal e stessa entita venditrice
// di es/nl, prezzi allineati a es/nl. L'IVA finlandese (25,5%) e piu alta di
// quella olandese, ma i prezzi sono IVA inclusa e restano gli stessi.
export const FI_MARKET: MarketConfig = {
  id: 'fi',
  language: 'fi',
  locale: 'fi-FI',
  siteUrl: 'https://fi.cartainterior.com',
  hostnames: ['fi.cartainterior.com'],
  siteName: 'Carta Interior',
  logo,
  ogImage: '/og/carta-interior-1x1.webp',
  contactEmail: 'info@cartainterior.com',
  currency: 'EUR',
  countryCode: 'FI',
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
    address: '71-75 Shelton Street, Covent Garden, Lontoo, Yhdistynyt kuningaskunta',
    regNumber: '16364511',
  },
  editorialContent: false,
  cookieBanner: true,
};
