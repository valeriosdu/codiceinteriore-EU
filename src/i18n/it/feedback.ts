const feedback = {
  title: 'Facci sapere cosa ne pensi',
  subtitle: 'Il tuo feedback ci aiuta a rendere ogni lettura più precisa. Bastano pochi secondi.',
  ratings: {
    positive: 'Mi rispecchia',
    mixed: 'In parte',
    negative: 'Non mi rispecchia',
  },
  reasons: {
    positive: ['Preciso', 'Utile', 'Scritto bene', 'Mi ha sorpreso'],
    mixed: ['Alcune parti sì, altre no', 'Troppo generico', 'Linguaggio', 'Vorrei più profondità'],
    negative: ['Non mi riconosco', 'Troppo generico', 'Errori fattuali', 'Linguaggio'],
  },
  errors: {
    signInRequired: 'Devi essere connesso per inviare un feedback.',
    saveRating: (detail: string) => `Non siamo riusciti a salvare il feedback (${detail}).`,
    saveDetails: (detail: string) => `Non siamo riusciti a salvare (${detail}).`,
    unknown: 'errore sconosciuto',
  },
  thanksMore: 'Grazie. Vuoi dirci di più?',
  commentPlaceholder: 'Vorresti qualche altra funzione o vuoi aggiungere qualcosa? (facoltativo)',
  skip: 'Salta',
  send: 'Invia',
  done: 'Grazie, ci aiuta a migliorare.',
};

export default feedback;
