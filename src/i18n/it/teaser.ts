const teaser = {
  loading: {
    title: 'Stiamo completando la tua lettura iniziale',
    slow: 'Ci sta mettendo più del previsto. Resta su questa pagina: riproveremo automaticamente tra poco.',
    normal: "Stiamo verificando la carta natale e gli insight prima di mostrarti l'offerta.",
    complex: 'La tua carta è particolarmente ricca: ci servono ancora un paio di minuti. Resta su questa pagina, ci siamo quasi.',
  },
  failed: {
    title: 'Non siamo riusciti a generare la lettura',
    body: 'Qualcosa non sta funzionando come dovrebbe. Riprova tra qualche istante.',
    retry: 'Riprova',
  },
  toasts: {
    previewPaymentsDisabled: 'Anteprima: il pagamento è disabilitato in preview.',
    stillCompleting: 'Stiamo ancora completando la tua lettura iniziale. Riprova tra poco.',
    stillPreparing: 'Stiamo ancora preparando la tua lettura. Riprova tra qualche secondo.',
  },
  hero: {
    title: (name?: string | null) =>
      name ? `${name}, ecco la tua lettura iniziale` : 'Ecco la tua lettura iniziale',
    subtitle: 'Quello che emerge da una prima lettura del tuo Tema Natale.',
    wrongData: 'I dati non sono giusti?',
  },
  openFullReport: 'Apri la lettura completa',
  offers: {
    baseName: 'Lettura Completa del tuo Tema Natale',
    baseCta: 'Ottieni la Lettura Completa',
    premiumName: 'Lettura Completa + 1 Mese di Transiti',
    premiumPromise:
      'Capire cosa ti guida in profondità e leggere con chiarezza anche il momento che stai vivendo adesso',
    premiumFeatures: [
      'Tutto ciò che è incluso nella Lettura Completa',
      '1 mese di letture settimanali personalizzate sui transiti del periodo',
      'Un aiuto in più per capire cosa si sta attivando emotivamente adesso',
      'Omaggio: poesia trasformativa personale',
    ],
    premiumCta: 'Ottieni la Lettura + Transiti',
  },
  faq: {
    kicker: 'Domande frequenti',
    heading: "Qui trovi le risposte ai dubbi più comuni prima dell'acquisto.",
  },
  bottomCta: 'Ottieni la lettura completa',
  reassurance: {
    instantAccess: 'Accesso immediato',
    securePayment: 'Pagamento sicuro',
    humanLanguage: 'Lettura scritta in linguaggio umano',
  },
};

export default teaser;
