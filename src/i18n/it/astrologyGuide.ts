const astrologyGuide = {
  name: 'Guida astrologica',
  openAria: 'Apri la Guida astrologica',
  closeAria: 'Chiudi',
  freeBadge: (n: number) => `${n} gratis`,
  questionsCount: (n: number) => `${n} ${n === 1 ? 'domanda' : 'domande'}`,
  freeInline: (n: number) => `· ${n} gratis`,
  empty: {
    exhaustedTitle: 'Hai esaurito le tue domande',
    exhaustedBody: (packCredits: number) =>
      `Aggiungi un nuovo pacchetto da ${packCredits} domande per continuare ad approfondire la tua carta.`,
    introTitle: 'La tua guida astrologica personale',
    introBody:
      'Fai domande sul tuo tema natale e, se hai acquistato la sinastria di coppia o i transiti del mese, anche su quelli: le risposte sono sempre personalizzate sui tuoi dati astrologici.',
    howTitle: 'Come funziona',
    howSteps: [
      'Fai una domanda qui sotto, libera o partendo dai suggerimenti.',
      'La risposta arriva entro qualche ora in orari lavorativi.',
      'La leggi qui e nella tua email.',
    ],
    firstQuestions: 'Prime 2 domande',
    free: 'Gratuite ✦',
    additional: 'Domande aggiuntive',
    additionalValue: (packCredits: number, priceLabel: string) =>
      `${packCredits} domande extra a ${priceLabel}`,
  },
  composer: {
    genericChips: [
      "Quale schema affettivo mi porto dietro dall'infanzia?",
      'Quale parte di me sto evitando di guardare in questo momento?',
    ],
    sectionChips: {
      identity: [
        'Quale aspetto della mia identità è più sotterraneo e meno visibile agli altri?',
        'Cosa nella mia carta spiega il mio bisogno di sentirmi diverso/a dagli altri?',
      ],
      emotions: [
        'Perché certe emozioni mi travolgono e altre le sento appena?',
        'Cosa nasconde la mia tendenza a chiudermi quando soffro davvero?',
      ],
      emotions_relationships: [
        'Quale ferita emotiva si riattiva sempre nelle mie relazioni intime?',
        'Perché tendo a desiderare chi mi tiene a distanza?',
      ],
      relationships: [
        'Quale schema affettivo si ripete nelle mie storie più importanti?',
        'Cosa cerco davvero in un partner, oltre a quello che dico?',
      ],
      blocks_patterns: [
        'Quale schema mi blocca proprio quando sto per cambiare davvero?',
        'Cosa sto proteggendo quando mi chiudo o mi sabotaggio?',
      ],
      blocks: [
        'Cosa nasconde la mia tendenza a fermarmi proprio sul più bello?',
        'Quale paura sotterranea mi impedisce di prendere posizione?',
      ],
      patterns: [
        'Quale schema riconosco ma non riesco ancora a sciogliere?',
        'Da dove arriva la mia difficoltà a chiedere quello di cui ho bisogno?',
      ],
      work: [
        'Quale lavoro mi rispecchia davvero, al di là di soldi e sicurezza?',
        'Perché tendo a sentirmi prosciugato/a anche quando faccio cose che amo?',
      ],
      work_direction: [
        'Cosa sto evitando di guardare nel mio percorso professionale?',
        'Quale direzione mi rispecchia, anche se mi spaventa?',
      ],
      advice: [
        'Cosa devo lasciare andare adesso per fare spazio a qualcosa di nuovo?',
        'Su quale parte di me dovrei concentrarmi nei prossimi mesi?',
      ],
    } as Record<string, string[]>,
    placeholder: 'Scrivi la tua domanda…',
    send: 'Invia',
    remaining: (n: number) => `Ti restano ${n} ${n === 1 ? 'domanda' : 'domande'}.`,
  },
  message: {
    answerUseful: 'Risposta utile',
    answerNotUseful: 'Risposta non utile',
    commentPlaceholder: 'Cosa non ti è piaciuto?',
    commentSend: 'Invia',
    thanksFeedback: 'Grazie per il feedback.',
    pending: 'Risposta in arrivo nelle prossime ore.',
    pendingEmail: 'Ti avviseremo anche via email.',
    failed: 'Non siamo riusciti a generare la risposta. La tua domanda è stata accreditata di nuovo, puoi riprovare.',
  },
  buyMore: {
    exhaustedHeadline: 'Hai usato tutte le tue domande',
    nearEndHeadline: 'Stai per finire le domande',
    exhaustedSub: (packCredits: number) =>
      `Acquista ${packCredits} nuove domande per continuare ad approfondire la tua carta.`,
    nearEndSub: (packCredits: number) =>
      `Aggiungi altre ${packCredits} domande così non ti fermi proprio sul più bello.`,
    balance: (n: number) => `Saldo attuale: ${n} ${n === 1 ? 'domanda' : 'domande'}.`,
    buyCta: (packCredits: number, priceLabel: string) =>
      `Acquista ${packCredits} domande · ${priceLabel}`,
  },
  askButton: {
    deepen: (label: string) => `Approfondisci: ${label}`,
    deepenGeneric: 'Approfondisci questa sezione',
    free: 'gratis',
  },
  toasts: {
    packActivated: (added: number) =>
      `Pacchetto attivato. Hai ${added} ${added === 1 ? 'nuova domanda' : 'nuove domande'}.`,
    paymentProcessing: 'Il pagamento è in elaborazione. Ricarica tra qualche secondo per vedere le nuove domande.',
    sendError: "Errore durante l'invio.",
    noCredits: (packCredits: number, priceLabel: string) =>
      `Hai esaurito le tue domande. Acquista altre ${packCredits} a ${priceLabel}.`,
    duplicate: 'Hai già fatto questa domanda di recente. La risposta è nel thread (o sta arrivando).',
    submitError: 'Non siamo riusciti a inviare la domanda. Riprova.',
    noUrl: 'URL non disponibile',
    checkoutError: 'Non siamo riusciti ad aprire il pagamento. Riprova tra un istante.',
  },
};

export default astrologyGuide;
