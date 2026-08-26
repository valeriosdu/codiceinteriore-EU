import type { Messages } from '@/i18n';

const common: Messages['common'] = {
  // "€ 19", "€ 14,90" — convenzione olandese: simbolo davanti, spazio, virgola
  // decimale. Diverso sia da it ("19€") sia da es ("19 €").
  priceLabel: (eur) =>
    `€ ${eur.toLocaleString('nl-NL', {
      minimumFractionDigits: Number.isInteger(eur) ? 0 : 2,
      maximumFractionDigits: 2,
    })}`,
  header: {
    homeAria: (siteName) => `${siteName} — Home`,
    signIn: 'Inloggen',
    myReport: 'Mijn rapport',
  },
  loading: 'Laden…',
  recommendedChoice: 'Aanbevolen keuze',
  chart: {
    openFullscreen: 'Open de geboortehoroscoop op volledig scherm',
    title: 'Geboortehoroscoop',
    zoomOut: 'Uitzoomen',
    zoomReset: 'Zoom herstellen',
    zoomIn: 'Inzoomen',
  },
  cookieBanner: {
    aria: 'Cookiemelding',
    close: 'Sluiten',
    text: 'We gebruiken technische cookies en meetcookies om je ervaring te verbeteren.',
    moreInfo: 'Meer informatie',
    reject: 'Weigeren',
    accept: 'Accepteren',
  },
  footer: {
    rights: (year, siteName) => `© ${year} ${siteName}. Alle rechten voorbehouden.`,
    guides: 'Gidsen',
    glossary: 'Woordenlijst',
    privacy: 'Privacy',
    terms: 'Voorwaarden',
    contact: 'Contact',
    brandLine: (siteName) => `${siteName} is een merk van`,
    addressLabel: 'Statutaire zetel:',
    regLabel: 'Registratienummer:',
  },
};

export default common;
