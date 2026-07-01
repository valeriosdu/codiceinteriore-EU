import type { Messages } from '@/i18n';

const common: Messages['common'] = {
  // "$19", "$14.90" — US price format (symbol before the number, no space).
  priceLabel: (eur) =>
    `$${eur.toLocaleString('en-US', {
      minimumFractionDigits: Number.isInteger(eur) ? 0 : 2,
      maximumFractionDigits: 2,
    })}`,
  header: {
    homeAria: (siteName) => `${siteName} — Home`,
    signIn: 'Sign in',
    myReport: 'My reading',
  },
  loading: 'Loading…',
  recommendedChoice: 'Recommended choice',
  chart: {
    openFullscreen: 'Open birth chart in full screen',
    title: 'Birth chart',
    zoomOut: 'Zoom out',
    zoomReset: 'Reset zoom',
    zoomIn: 'Zoom in',
  },
  cookieBanner: {
    aria: 'Cookie notice',
    close: 'Close',
    text: 'We use technical and measurement cookies to improve your experience.',
    moreInfo: 'Learn more',
    reject: 'Reject',
    accept: 'Accept',
  },
  footer: {
    rights: (year, siteName) => `© ${year} ${siteName}. All rights reserved.`,
    guides: 'Guides',
    glossary: 'Glossary',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    brandLine: (siteName) => `${siteName} is a brand of`,
    addressLabel: 'Registered office:',
    regLabel: 'Registration number:',
  },
};

export default common;
