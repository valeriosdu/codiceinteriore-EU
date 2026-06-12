const legal = {
  contact: {
    seoTitle: (siteName: string) => `Contatti — ${siteName}`,
    seoDescription: (email: string) =>
      `Hai una domanda sul tema natale, sul report o sull'accesso alla tua area personale? Scrivici dal modulo o invia un'email a ${email}.`,
    kicker: 'Contatti',
    title: 'Scrivici',
    subtitle:
      'Per domande, supporto o richieste, puoi contattarci qui. Ti risponderemo il prima possibile.',
    intro:
      "Se hai un dubbio sul report, sull'accesso alla tua area personale o sul funzionamento del servizio, puoi scriverci direttamente tramite il modulo qui sotto.",
    sent: 'Messaggio inviato.',
    sentSub: 'Ti risponderemo appena possibile.',
    sendAnother: 'Invia un altro messaggio',
    nameLabel: 'Nome *',
    namePlaceholder: 'Il tuo nome',
    emailLabel: 'Email *',
    emailPlaceholder: 'La tua email',
    reasonLabel: 'Motivo del contatto',
    reasonPlaceholder: 'Seleziona un motivo',
    reasons: {
      purchase: 'Supporto acquisto',
      report: 'Accesso al report',
      general: 'Domanda generale',
      collab: 'Collaborazioni',
    },
    messageLabel: 'Messaggio *',
    messagePlaceholder: 'Scrivi qui il tuo messaggio…',
    error: 'Si è verificato un problema. Riprova tra poco.',
    sending: 'Invio in corso…',
    send: 'Invia messaggio',
    otherTitle: 'Altri contatti',
    otherSub: 'Se preferisci, puoi contattarci anche via email.',
    privacyNote: 'I tuoi dati verranno usati solo per rispondere alla tua richiesta.',
    validation: {
      name: 'Inserisci il tuo nome',
      email: "Inserisci un'email valida",
      message: 'Scrivi un messaggio',
    },
  },
  notFound: {
    title: 'Pagina non trovata',
    body: 'La pagina che cerchi non esiste o è stata spostata.',
    cta: 'Torna alla home',
  },
  unsubscribe: {
    verifying: 'Verifica in corso…',
    validTitle: 'Cancellazione iscrizione',
    validBody: (siteName: string) => `Confermi di voler annullare l'iscrizione alle email di ${siteName}?`,
    confirm: 'Conferma cancellazione',
    processing: 'Elaborazione…',
    doneTitle: 'Iscrizione annullata',
    doneBody: (siteName: string) => `Non riceverai più email da ${siteName}.`,
    alreadyTitle: 'Già cancellato',
    alreadyBody: 'La tua iscrizione è già stata annullata in precedenza.',
    errorTitle: 'Link non valido',
    errorBody: 'Questo link di cancellazione non è valido o è scaduto.',
  },
};

export default legal;
