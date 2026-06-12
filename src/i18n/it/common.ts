const common = {
  // "19€", "14,90€" — formato prezzi nello stile della lingua.
  priceLabel: (eur: number) =>
    `${eur.toLocaleString('it-IT', {
      minimumFractionDigits: Number.isInteger(eur) ? 0 : 2,
      maximumFractionDigits: 2,
    })}€`,
  header: {
    homeAria: (siteName: string) => `${siteName} — Home`,
    signIn: 'Accedi',
    myReport: 'Il mio report',
  },
  loading: 'Caricamento…',
  recommendedChoice: 'Scelta consigliata',
  chart: {
    openFullscreen: 'Apri carta natale a schermo intero',
    title: 'Carta natale',
    zoomOut: 'Riduci zoom',
    zoomReset: 'Reset zoom',
    zoomIn: 'Aumenta zoom',
  },
  cookieBanner: {
    aria: 'Informativa sui cookie',
    close: 'Chiudi',
    text: 'Usiamo cookie tecnici e di misurazione per migliorare la tua esperienza.',
    moreInfo: 'Maggiori informazioni',
    reject: 'Rifiuta',
    accept: 'Accetta',
  },
  footer: {
    rights: (year: number, siteName: string) => `© ${year} ${siteName}. Tutti i diritti riservati.`,
    guides: 'Guide',
    glossary: 'Glossario',
    privacy: 'Privacy',
    terms: 'Termini',
    contact: 'Contatti',
    brandLine: (siteName: string) => `${siteName} è un brand di`,
    addressLabel: 'Sede legale:',
    regLabel: 'Numero di registrazione:',
  },
};

export default common;
