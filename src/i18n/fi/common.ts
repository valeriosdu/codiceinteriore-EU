import type { Messages } from '@/i18n';

const common: Messages['common'] = {
  // "19 €", "14,90 €" — convenzione finlandese: simbolo dopo il numero, spazio
  // non separabile (così "19" e "€" non vanno a capo su righe diverse), virgola decimale.
  priceLabel: (eur) =>
    `${eur.toLocaleString('fi-FI', {
      minimumFractionDigits: Number.isInteger(eur) ? 0 : 2,
      maximumFractionDigits: 2,
    })} €`,
  header: {
    homeAria: (siteName) => `${siteName} — Etusivu`,
    signIn: 'Kirjaudu',
    myReport: 'Raporttini',
  },
  loading: 'Ladataan…',
  recommendedChoice: 'Suositeltu valinta',
  chart: {
    openFullscreen: 'Avaa syntymäkartta koko näytölle',
    title: 'Syntymäkartta',
    zoomOut: 'Loitonna',
    zoomReset: 'Nollaa zoomaus',
    zoomIn: 'Lähennä',
  },
  cookieBanner: {
    aria: 'Evästeilmoitus',
    close: 'Sulje',
    text: 'Käytämme teknisiä evästeitä ja mittausevästeitä parantaaksemme käyttökokemustasi.',
    moreInfo: 'Lisätietoja',
    reject: 'Hylkää',
    accept: 'Hyväksy',
  },
  footer: {
    rights: (year, siteName) => `© ${year} ${siteName}. Kaikki oikeudet pidätetään.`,
    guides: 'Oppaat',
    glossary: 'Sanasto',
    privacy: 'Tietosuojaseloste',
    terms: 'Käyttöehdot',
    contact: 'Yhteystiedot',
    brandLine: (siteName) => `${siteName} on tuotemerkki, jonka omistaa`,
    addressLabel: 'Rekisteröity osoite:',
    regLabel: 'Rekisterinumero:',
  },
};

export default common;
