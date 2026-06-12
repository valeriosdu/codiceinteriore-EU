const reportProcessing = {
  messages: [
    'Stiamo recuperando la tua lettura',
    'Stiamo organizzando le aree principali',
    'Stiamo preparando le parti che non hai ancora visto',
    'Stiamo completando la tua mappa personale',
    'Tra poco entrerai nella versione completa',
    'Stiamo rifinendo i dettagli più delicati',
    'Quasi pronti — manca davvero poco',
  ],
  errors: {
    signIn: 'Accedi al tuo account per completare la lettura acquistata.',
    profileNotFound: 'Non riusciamo a trovare il tuo profilo. Accedi di nuovo o contattaci.',
    paymentMismatch: 'Il pagamento non corrisponde alla sessione quiz da completare.',
    noSession: 'Non troviamo una sessione quiz collegata al pagamento.',
    paymentRequired:
      'Per generare una nuova lettura serve un pagamento completato. Se hai già una lettura, aprila dalla tua area personale.',
    generic:
      'La tua lettura è in fase di preparazione. Il pagamento è registrato correttamente e riceverai tutto via email entro pochi minuti. Se dopo 10 minuti non ricevi nulla, contattaci e saremo lieti di aiutarti.',
  },
  errorScreen: {
    title: 'Lettura in verifica',
    cta: 'Contattaci',
  },
  verifying: 'Verifichiamo il tuo accesso alla lettura…',
  processing: {
    title: 'Stiamo completando la tua lettura',
    body: "Hai già visto l'inizio. Ora stiamo preparando la tua lettura completa, con tanti nuovi elementi e una visione completa del tuo Codice Interiore. Non chiudere o aggiornare la pagina.",
    slowHint:
      'Per le carte più complesse la preparazione può richiedere fino a 10 minuti. Puoi restare su questa pagina oppure chiuderla: riceverai tutto via email appena pronto.',
  },
};

export default reportProcessing;
