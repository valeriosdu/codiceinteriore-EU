import type { MarketConfig } from './types';
// TODO: swap to US brand logo/OG assets once the US brand is finalized. For now
// this reuses the existing IT logo asset (and the IT OG image path below).
import logo from '@/assets/logo.webp';

// US market config — placeholders pending brand/legal/pricing decisions.
export const US_MARKET: MarketConfig = {
  id: 'us',
  language: 'en',
  locale: 'en-US',
  // TODO: confirm production domain.
  siteUrl: 'https://us.example.com',
  // TODO: confirm production hostnames.
  hostnames: ['us.example.com'],
  // TODO: confirm US brand name.
  siteName: 'US Brand (TODO)',
  logo,
  // TODO: swap to US brand OG asset.
  ogImage: '/og/codice-interiore-1x1.webp',
  // TODO: confirm US contact email.
  contactEmail: 'info@us.example.com',
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
    // TODO: confirm US legal entity / company fields before launch.
    companyName: 'US Company LLC (TODO)',
    address: 'TODO US registered address',
    regNumber: 'TODO',
  },
  editorialContent: false,
};
