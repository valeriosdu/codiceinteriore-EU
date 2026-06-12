const checkout = {
  failed: {
    title: 'Non siamo riusciti a preparare la lettura',
    body: 'Qualcosa non sta funzionando come dovrebbe. Riprova tra qualche istante.',
    retry: 'Riprova',
  },
  loading: {
    title: 'Stiamo preparando la lettura',
    slow: 'Ci sta mettendo più del previsto. Resta su questa pagina: riproveremo automaticamente tra poco.',
    normal: "Calcoliamo la carta natale prima di mostrarti l'offerta.",
  },
  toasts: {
    stillPreparingShort: 'Stiamo ancora preparando la lettura. Riprova tra poco.',
    stillPreparingRetry: 'Stiamo ancora preparando la lettura. Riprova tra qualche secondo.',
  },
  hero: {
    title: (name: string) => `La lettura per ${name} è pronta`,
    fallbackRecipient: 'lui/lei',
    subtitle: 'Abbiamo calcolato la carta natale. Scegli il formato per generare la lettura completa.',
    wrongData: 'I dati non sono giusti?',
  },
  offers: {
    baseName: 'Lettura Completa del Tema Natale',
    basePromise: (name: string) =>
      `Per capire con più chiarezza la struttura emotiva, relazionale e personale di ${name}, e vedere cosa tende a ripetersi nella sua vita.`,
    baseFeatures: [
      'Comprendi blocchi emotivi, difese e dinamiche ricorrenti con un linguaggio umano, non tecnico',
      'Vedi come questi schemi influenzano relazioni, lavoro, direzione personale e scelte di vita',
      'Ricevi spunti pratici su cosa osservare, favorire o correggere',
      'Accesso immediato alla lettura online e via e-mail',
    ],
    premiumPromise: (name: string) =>
      `Capire cosa guida ${name} in profondità e leggere con chiarezza anche il momento che sta vivendo adesso.`,
  },
};

export default checkout;
