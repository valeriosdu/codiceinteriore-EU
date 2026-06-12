const coppia = {
  titles: {
    landing: (siteName: string) => `Sinastria di Coppia | ${siteName}`,
    quiz: (siteName: string) => `Sinastria di Coppia - Quiz | ${siteName}`,
    processing: (siteName: string) => `Sinastria - Elaborazione | ${siteName}`,
    teaser: (siteName: string) => `Sinastria - Anteprima | ${siteName}`,
    success: (siteName: string) => `Pagamento ricevuto | ${siteName}`,
    activate: (siteName: string) => `Sinastria – Attiva il tuo account | ${siteName}`,
    reportProcessing: (siteName: string) => `Sinastria - Generazione | ${siteName}`,
    report: (siteName: string) => `Sinastria di Coppia - Report | ${siteName}`,
  },
  landing: {
    heroLine1: 'La vostra relazione,',
    heroLine2: 'letta dalle stelle',
    heroSubtitle:
      'Vi siete mai chiesti perché su certe cose vi capite al volo, e su altre vi scontrate sempre? La sinastria è la risposta astrologica a questa domanda.',
    cta: 'Inizia il quiz',
    socialProofLine1: 'Già 800+ coppie hanno scoperto',
    socialProofLine2: 'la loro sinastria di coppia',
    discoverKicker: 'Cosa scoprirete',
    discoverTitleLine1: 'Non un oroscopo di coppia.',
    discoverTitleLine2: 'Una lettura vera.',
    discoverItems: [
      {
        title: "L'archetipo della coppia",
        body: 'Che tipo di relazione siete? 14 configurazioni astrologiche distinte, calcolate dai vostri pianeti reali.',
      },
      {
        title: 'Sei punteggi di compatibilità',
        body: 'Sintonia emotiva, attrazione, comunicazione, stabilità, crescita, tensione. Misurati, spiegati, contestualizzati.',
      },
      {
        title: 'Otto sezioni di lettura',
        body: 'Ritratto della coppia, chimica, comunicazione, mondo emotivo, sfide, stabilità, schema karmico, direzione. In italiano chiaro.',
      },
    ],
    howKicker: 'Come funziona',
    howSteps: [
      'Inserite i dati di nascita di entrambi: data, ora (se la conoscete) e luogo.',
      'Calcoliamo la carta natale di ciascuno e analizziamo la sovrapposizione: è la sinastria.',
      'Ricevete il report completo: circa 10 pagine in italiano.',
    ],
  },
  quiz: {
    stepOf: (current: number, total: number) => `Passo ${current} di ${total}`,
    personA: 'Persona 1 (te)',
    personB: 'Persona 2 (partner)',
    date: {
      titleA: 'Quando sei nato/a',
      titleB: 'Quando e nato/a il tuo partner',
      hint: 'Scorri per scegliere giorno, mese e anno.',
      day: 'Giorno',
      month: 'Mese',
      year: 'Anno',
    },
    time: {
      titleA: 'A che ora sei nato/a',
      titleB: 'A che ora e nato/a il tuo partner',
      hint: 'Se non la conosci con precisione, indica l\'orario piu vicino possibile, o spunta "non la conosco" qui sotto.',
      hour: 'Ora',
      minute: 'Minuti',
      unknownLabel: 'Non la conosco',
      unknownNote:
        "Senza l'ora la sinastria sara parziale per questa persona (niente case e ascendente). Procedi tranquillamente, il resto dell'analisi resta valido.",
    },
    place: {
      titleA: 'Dove sei nato/a',
      titleB: 'Dove e nato/a il tuo partner',
      hint: 'Citta. Inizia a digitare e scegli dai suggerimenti.',
      placeholder: 'es. Milano, Roma, Napoli...',
      suggestionHint: 'Scegli un luogo dai suggerimenti per una lettura piu precisa.',
      error: "Non riusciamo a trovare questo luogo. Scegli un suggerimento dall'elenco.",
    },
    name: {
      titleA: 'Come ti chiami',
      titleB: 'Come si chiama il tuo partner',
      hint: 'Solo il nome di battesimo, lo useremo nel report.',
      placeholderA: 'Il tuo nome',
      placeholderB: 'Nome del partner',
    },
    context: {
      title: 'Da quanto state insieme?',
      hint: 'Opzionale. Aiuta la lettura a calibrarsi sulla fase della relazione.',
      durations: {
        under_1y: 'Meno di 1 anno',
        '1_to_3y': '1-3 anni',
        '3_to_7y': '3-7 anni',
        '7_to_15y': '7-15 anni',
        over_15y: 'Oltre 15 anni',
        skip: 'Preferisco non rispondere',
      },
      focusLabel: 'Focus della lettura (opzionale)',
      focusPlaceholder: 'Es. capire le sfide, decidere se sposarci, sciogliere un blocco...',
    },
    back: 'Indietro',
    next: 'Avanti',
    resolving: 'Verifico...',
    finalCta: 'Calcola la sinastria',
  },
  processing: {
    errorTitle: "C'e un problema",
    errors: {
      createSession: 'Non sono riuscito a creare la sessione. Riprova fra qualche secondo.',
      timeout: 'La generazione sta richiedendo piu del previsto. Riprova tra poco.',
      failed: 'Generazione fallita. Riprova.',
    },
    backToQuiz: 'Torna al quiz',
    title: 'Sto calcolando la vostra sinastria',
    body: 'Sto componendo le due carte natali e i loro contatti. Pochi secondi.',
  },
  teaser: {
    kicker: 'La sinastria di',
    personA: 'Persona A',
    personB: 'Persona B',
    wrongData: 'I dati non sono giusti?',
    overallHigh:
      "C'è una base forte tra voi. La lettura completa vi mostra esattamente dove nasce questa sintonia e come proteggerla nel tempo.",
    overallMedium:
      "La vostra relazione ha risorse e punti aperti: è il profilo che restituisce la lettura più ricca, perché c'è molto da capire e da usare.",
    overallLow:
      'I numeri non sono un voto: raccontano dove la relazione scorre e dove chiede attenzione. Le coppie con dinamiche complesse sono quelle che, nella lettura, scoprono di più.',
    primaryCta: 'Ottieni la sinastria completa',
    securePayment: 'Pagamento sicuro e protetto',
    framing: {
      high: {
        ringLabel: 'Affinità',
        contextLine:
          'Un punteggio alto segnala terreno fertile. Ma anche le carte migliori hanno angoli ciechi: il report li attraversa uno per uno.',
        domainsSubtitle:
          'Nella lettura completa, ogni numero diventa una pagina, ancorata ai vostri pianeti reali.',
        ctaLabel: 'Leggere la lettura',
        offerSubtitle: 'sulla vostra relazione',
        extraBullet: null as string | null,
      },
      medium: {
        ringLabel: 'Dinamica',
        contextLine:
          'Un punteggio intermedio racconta una relazione con più sfumature che certezze. Sono proprio le sfumature a rendere la lettura interessante.',
        domainsSubtitle:
          'Ogni numero apre una domanda. Nella lettura completa, le domande trovano il contesto dei vostri pianeti reali.',
        ctaLabel: 'Leggere la lettura',
        offerSubtitle: 'sulla vostra relazione',
        extraBullet: 'Cosa funziona e cosa chiede attenzione, dominio per dominio' as string | null,
      },
      low: {
        ringLabel: 'Complessità',
        contextLine:
          "Un punteggio basso non descrive quanto vi volete bene: descrive quanto c'è da capire. Le relazioni complesse sono quelle che, lette bene, restituiscono di più.",
        domainsSubtitle:
          'I numeri bassi non sono sentenze: sono i punti in cui la relazione chiede più attenzione. La lettura completa spiega il perché, pianeta per pianeta.',
        ctaLabel: 'Capire la dinamica',
        offerSubtitle: 'per capire la vostra relazione',
        extraBullet: 'Le ragioni astrologiche dietro le dinamiche più difficili' as string | null,
      },
    },
    domains: {
      sintonia_emotiva: {
        label: 'Sintonia emotiva',
        high: 'Vi sentite a casa',
        medium: 'Un rifugio che si costruisce',
        low: 'Dove cercate sicurezza?',
      },
      attrazione: {
        label: 'Attrazione',
        high: 'Chimica e desiderio',
        medium: 'Una chimica da decifrare',
        low: 'Cosa vi avvicina davvero?',
      },
      comunicazione: {
        label: 'Comunicazione',
        high: 'Le parole scorrono',
        medium: 'Lingue diverse, stesso intento',
        low: 'Dove si inceppa il dialogo?',
      },
      stabilita: {
        label: 'Stabilità',
        high: 'Tenuta nel tempo',
        medium: 'Le fondamenta si scelgono',
        low: 'Su cosa poggia la coppia?',
      },
      crescita: {
        label: 'Crescita',
        high: 'Vi fate muovere',
        medium: 'Espansione con attrito',
        low: 'Cosa vi tiene fermi?',
      },
      tensione: {
        label: 'Tensione',
        high: 'Frizione che trasforma',
        medium: 'Attrito costruttivo',
        low: 'Calma apparente o reale?',
      },
    },
    excerptCaption: 'Estratto dal sommario della vostra lettura',
    offerBullets: [
      'Otto sezioni: ritratto, chimica, comunicazione, mondo emotivo, sfide, stabilità, pattern karmico, direzione',
      'PDF da scaricare, accesso permanente',
      'Circa 10 pagine in italiano chiaro',
    ],
    faqTitle: 'Domande frequenti',
    faqItems: [
      {
        q: 'Su cosa si basa la sinastria?',
        a: 'La sinastria confronta le posizioni planetarie reali al momento della nascita di entrambi. Non usiamo segno solare generico: calcoliamo la carta natale completa di ciascuno e analizziamo gli aspetti tra i due temi.',
      },
      {
        q: 'Posso regalare la sinastria a qualcuno?',
        a: 'Certo. Ti basta conoscere i dati di nascita di entrambe le persone. Dopo il pagamento riceverai il PDF via email: puoi inoltrarlo o stamparlo come regalo.',
      },
      {
        q: 'Quanto tempo ci vuole per ricevere la lettura?',
        a: "La lettura viene generata in pochi minuti dopo il pagamento. Riceverai un'email con il link per accedere al PDF e alla versione web.",
      },
      {
        q: 'Funziona anche per coppie in crisi o appena conosciute?',
        a: 'La sinastria fotografa il potenziale della relazione, non il suo stato attuale. È utile sia per capire le dinamiche di una coppia consolidata sia per esplorare una connessione nuova.',
      },
    ],
  },
  offerCard: {
    defaultBullets: [
      'Otto sezioni: ritratto, chimica, comunicazione, mondo emotivo, sfide, stabilità, pattern karmico, direzione',
      'PDF da scaricare, accesso permanente',
      'Circa 10 pagine in italiano chiaro',
    ],
    kicker: 'La lettura completa',
    titleLine1: 'Una lettura astrologica completa',
    defaultSubtitle: 'sulla vostra relazione',
    defaultCta: 'Ottieni la sinastria completa',
    loadingCta: 'Apertura checkout…',
    secureNote: "Pagamento sicuro e protetto. Riceverai un'email per accedere alla lettura.",
  },
  success: {
    titleProblem: "C'è stato un problema",
    titleOk: 'Grazie, pagamento ricevuto',
    paypalError:
      "Non siamo riusciti a confermare il pagamento PayPal. Contattaci se l'importo è stato addebitato.",
    capturing: 'Stiamo confermando il pagamento PayPal…',
    preparing: 'Sto preparando il tuo account. Un attimo…',
  },
  activate: {
    titles: {
      signup: 'Crea il tuo account',
      signin: 'Accedi al tuo account',
      forgot: "Recupera l'accesso",
    },
    subtitles: {
      signup: 'Per accedere al tuo report di sinastria',
      signin: 'Inserisci le tue credenziali per accedere al tuo report di sinastria.',
      forgot: 'Inserisci la tua email: ti invieremo un link per reimpostare la password.',
    },
    toasts: {
      checkEmailReset: {
        title: 'Controlla la tua email',
        description: "Se l'indirizzo è registrato, riceverai un link per reimpostare la password.",
      },
      alreadyRegistered: 'Esiste già un account con questa email. Accedi.',
      wrongCredentials: 'Email o password non corretti.',
    },
  },
  reportProcessing: {
    preparing: 'Stiamo preparando il vostro report',
    writing: 'Sto scrivendo il vostro report. Pochi minuti...',
    starting: 'Sto avviando la scrittura del report...',
    duration: 'La generazione del report richiede da 1 a 3 minuti.',
    errorTitle: "C'e un problema",
    errors: {
      sessionNotFound: 'Non riesco a trovare la tua sessione. Contattaci se il problema persiste.',
      failed: 'Generazione fallita. Contattaci se il problema persiste.',
      timeout: 'La generazione sta richiedendo piu del previsto. Riprova fra qualche minuto.',
    },
  },
  report: {
    title: 'La vostra sinastria',
    personA: 'Persona A',
    personB: 'Persona B',
    yourMap: 'La vostra mappa',
    mapLabels: {
      cosa_siete: 'Cosa siete',
      dove_brillate: 'Dove brillate',
      dove_inciampate: 'Dove inciampate',
      dove_andate: 'Dove andate',
    },
    sixDomains: 'I sei domini della vostra relazione',
    coupleChart: 'La carta della coppia',
    downloading: 'Preparazione PDF...',
    downloadPdf: 'Scarica il PDF',
  },
  radar: {
    sintonia_emotiva: 'Sintonia',
    attrazione: 'Attrazione',
    comunicazione: 'Comunicazione',
    stabilita: 'Stabilita',
    crescita: 'Crescita',
    tensione: 'Tensione',
  },
  ringDefaultLabel: 'Compatibilità',
  ringAria: (score: number) => `Punteggio ${score} su 100`,
  archetypeLabel: 'Archetipo',
  archetypes: {
    soulmates: {
      label: 'Anime affini',
      definizione:
        'Rara combinazione di passione e durata profonda: forte intesa romantica sostenuta da una struttura stabile.',
    },
    kindred_spirits: {
      label: 'Spiriti affini',
      definizione:
        'Comprensione emotiva profonda con poca frizione: una sintonia che si percepisce naturale.',
    },
    opposites_attract: {
      label: 'Opposti che si attraggono',
      definizione:
        "Forte intensita romantica alimentata da differenze marcate: la tensione e parte dell'attrazione.",
    },
    karmic_lesson: {
      label: 'Lezione karmica',
      definizione:
        'Dinamica impegnativa nata per evolvere: chiede consapevolezza, restituisce trasformazione.',
    },
    steady_rock: {
      label: 'Roccia stabile',
      definizione: 'Fondamenta solide e affidabilita: una coppia su cui costruire nel tempo.',
    },
    intellectual_powerhouse: {
      label: 'Sintonia mentale potente',
      definizione: 'Connessione mentale eccezionale: idee, parole e curiosita scorrono con fluidita.',
    },
    magnetic_attraction: {
      label: 'Attrazione magnetica',
      definizione: "Chimica romantica e fisica dominante: l'attrazione e il filo principale.",
    },
    long_term_anchor: {
      label: 'Ancora di lungo termine',
      definizione: "Una base solida su cui costruire il futuro: stabilita prima dell'effervescenza.",
    },
    mental_synergy: {
      label: 'Sinergia mentale',
      definizione: 'Ottimo rapporto intellettuale: comunicazione e progettualita sono il vostro terreno comune.',
    },
    volatile_spark: {
      label: 'Scintilla volatile',
      definizione: 'Energia alta, dinamica intensa: trasformativa se accolta, faticosa se subita.',
    },
    catalyst_for_change: {
      label: 'Catalizzatore di cambiamento',
      definizione: "Stimolate l'espansione l'uno dell'altra: una coppia che fa muovere.",
    },
    deep_bond: {
      label: 'Legame profondo',
      definizione: 'Sicurezza emotiva profonda: una coppia in cui ci si sente visti senza spiegazioni.',
    },
    balanced_connection: {
      label: 'Connessione equilibrata',
      definizione: "Una miscela stabile di energie diverse: nessun tema domina, l'equilibrio e la chiave.",
    },
    discordant_layout: {
      label: 'Configurazione dissonante',
      definizione:
        'Significativa frizione che richiede uno sforzo consapevole: la coppia funziona quando entrambi lo scelgono.',
    },
  },
};

export default coppia;
