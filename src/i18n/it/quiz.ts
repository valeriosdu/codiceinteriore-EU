const quiz = {
  months: [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  ],
  steps: {
    intent: {
      question: 'Cosa ti interessa capire di più?',
      options: [
        "Le mie dinamiche relazionali e d'amore",
        'Cosa mi tiene fermo/a e dove crescere',
        'Una panoramica generale di me',
      ],
    },
    attachment: {
      question: {
        self: 'Quando qualcuno si allontana o diventa ambiguo, tendi istintivamente a:',
        other: 'Quando qualcuno si allontana o diventa ambiguo, questa persona istintivamente tende a:',
      },
      options: {
        self: [
          'Cercare più contatto',
          'Chiuderti e prendere distanza',
          'Restare in attesa di un segnale',
        ],
        other: [
          'Cercare più contatto',
          'Chiudersi e prendere distanza',
          'Restare in attesa di un segnale',
        ],
      },
    },
    symptom: {
      question: 'Cosa senti più spesso, quando guardi la tua vita oggi?',
      options: [
        'Mi sembra che mi sfugga qualcosa che gli altri vedono',
        'So cosa dovrei fare, ma non ci riesco',
        'Vado avanti, ma non sento di star andando dove vorrei',
        'Tutto sembra fermo, non solo dentro di me',
      ],
    },
    narrative: {
      question: 'Quando pensi a chi avresti potuto essere, cosa ti viene in mente?',
      options: [
        'Una versione di me più libera',
        'Una versione di me più realizzata',
        'Una versione di me più sicura, con meno dubbi',
        'Una versione di me più determinata, meno in attesa',
      ],
    },
    date: {
      title: { self: 'La tua data di nascita', other: 'La sua data di nascita' },
      day: 'Giorno',
      month: 'Mese',
      year: 'Anno',
    },
    time: {
      title: { self: 'La tua ora di nascita', other: 'La sua ora di nascita' },
      hour: 'Ora',
      minute: 'Minuti',
      hint: "Se non la conosci con precisione, scegli l'orario più vicino possibile.",
    },
    place: {
      title: { self: 'Il tuo luogo di nascita', other: 'Il suo luogo di nascita' },
      label: 'Luogo di nascita',
      placeholder: 'es. Milano, Roma, Napoli...',
      hint: 'Scegli un luogo dai suggerimenti per una lettura più precisa.',
      error: "Non riusciamo a trovare questo luogo. Scegli un suggerimento dall'elenco.",
    },
    focus: {
      question: {
        self: 'Quale parte delle tue dinamiche relazionali vuoi capire meglio?',
        other: 'Quale parte delle sue dinamiche relazionali vuoi capire meglio?',
      },
      options: {
        self: ['Come scegli', 'Che schemi ripeti', 'Come ti difendi', 'Cosa cerchi davvero'],
        other: ['Come sceglie', 'Che schemi ripete', 'Come si difende', 'Cosa cerca davvero'],
      },
    },
    name: {
      title: { self: 'Il tuo nome', other: 'Il suo nome' },
      label: 'Nome',
      placeholder: 'es. Maria, Giulia, Marco...',
      hint: {
        self: 'Useremo il tuo nome per personalizzare la lettura.',
        other: 'Useremo il suo nome per personalizzare la lettura.',
      },
    },
  },
  helper: {
    focus: 'Manca poco',
    name: 'Ancora un passaggio',
  },
  cta: {
    continue: 'Continua',
    resolvingPlace: 'Verifica luogo…',
    toPayment: 'Vai al pagamento',
    seeReading: 'Vedi la tua lettura',
  },
  back: 'Torna indietro',
};

export default quiz;
