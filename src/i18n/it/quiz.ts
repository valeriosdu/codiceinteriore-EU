const quiz = {
  months: [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  ],
  birthDateLabel(day: number, month: number, year: number) {
    return `${day} ${(this.months[month - 1] || '').toLowerCase()} ${year}`;
  },
  stepOf: (current: number, total: number) => `${current} di ${total}`,
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
    bridge: {
      exampleLabel: 'Esempio illustrativo',
      showsLabel: 'Il tema natale può mostrarti:',
      next: 'Ti servono solo data, ora e luogo di nascita. La tua lettura iniziale è gratuita.',
      variants: [
        {
          headline: 'Non ti manca qualcosa. Ti manca la mappa.',
          body: 'Non è che gli altri vedano di più: percepiscono in modo diverso dal tuo. E il tuo modo ha una struttura precisa, che si può leggere.',
          shows: 'come percepisci e cosa filtri senza accorgertene.',
          legend: ['Luna', 'Mercurio', 'Ascendente'],
        },
        {
          headline: 'Non è pigrizia e non è mancanza di volontà.',
          body: 'Il modo di partire è personale: c’è chi si accende subito e chi ha bisogno di condizioni precise. Conoscere le tue cambia il modo in cui ti giudichi.',
          shows: 'il tuo modo di partire: cosa ti accende e cosa ti frena.',
          legend: ['Marte', 'Saturno', 'Quadratura'],
        },
        {
          headline: 'Ti stai muovendo. Ma verso dove ti porta il tuo ritmo?',
          body: 'Andare avanti non basta se la direzione l’hanno scelta le circostanze. Conta quella per cui sei costruito, e il punto in cui il percorso si è spostato.',
          shows: 'la direzione per cui sei costruito e dove il tuo percorso si è spostato.',
          legend: ['Medio Cielo', 'Nodi Lunari'],
        },
        {
          headline: 'A volte tutto si ferma insieme. Di solito è una fase, non uno stato.',
          body: 'Quando tutto sembra fermo, spesso stai attraversando un periodo che ha un inizio e una fine. Si può leggere quando comincia e quando passa.',
          shows: 'i tuoi cicli: quando una fase si apre e quando si chiude.',
          legend: ['Saturno', 'Giove', 'Fase'],
        },
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
      unknown: {
        label: { self: 'Non conosco la mia ora di nascita', other: 'Non conosco la sua ora di nascita' },
        note: 'Useremo mezzogiorno: la lettura resta valida, ma Ascendente e case saranno indicativi.',
      },
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
  wheelHint: {
    date: {
      all: 'Scorri o tocca le ruote per confermare giorno, mese e anno.',
      some: (fields: string) => `Da controllare: ${fields}.`,
    },
    time: {
      all: 'Scorri o tocca le ruote per confermare ora e minuti.',
      some: (fields: string) => `Da controllare: ${fields}.`,
    },
    fields: {
      day: 'il giorno',
      month: 'il mese',
      year: "l'anno",
      hour: "l'ora",
      minute: 'i minuti',
    },
    join: (items: string[]) =>
      items.length > 1 ? items.slice(0, -1).join(', ') + ' e ' + items[items.length - 1] : (items[0] ?? ''),
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
