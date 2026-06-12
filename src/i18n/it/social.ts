const social = {
  testimonials: {
    kicker: 'Testimonianze',
    heading: 'Cosa ha colpito di più i nostri clienti',
    items: [
      {
        text: 'Mi aspettavo qualcosa di generico. Invece ci sono stati vari passaggi che mi hanno descritta in un modo quasi scomodo da quanto erano precisi.',
        name: 'Giulia',
        age: 31,
      },
      {
        text: "La differenza rispetto alle letture gratuite online si sente. Qui non trovi frasi sparse: c'è un filo, una struttura. Alla fine hai davvero una visione più completa di come funzioni e di cosa fare",
        name: 'Serena',
        age: 39,
      },
      {
        text: 'Mi è piaciuto perché non cerca di predire tutto. Ti aiuta piuttosto a capire cosa si ripete, dove ti blocchi, che tipo di dinamica stai vivendo adesso e cosa fare.',
        name: 'Valentina',
        age: 33,
      },
      {
        text: 'Avevo paura fosse una lettura costruita per dire cose belle a tutti. Invece no: soprattutto nella parte relazionale mi sono sentita veramente vista.',
        name: 'Laura',
        age: 35,
      },
      {
        text: "Il report completo mi ha aiutata a capire la struttura, che in parte già intuivo ma non con così tanta chiarezza... Il resto mi ha fatto collegare tutto a quello che sto vivendo adesso. Consigliato l'acquisto.",
        name: 'Beatrice',
        age: 24,
      },
    ],
  },
  // NB: le immagini del carousel (src/assets/report-preview/*) sono screenshot
  // del report italiano — asset per-lingua da rifare per ogni nuovo mercato.
  reportPreview: {
    aria: 'Anteprima del report completo',
    slideAlts: [
      'Anteprima del Report Completo Codice Interiore',
      'Estratto della sezione Identità profonda',
      'Estratto della sezione Dinamiche emotive',
      'Estratto della sezione Relazioni e amore',
      'Estratto della sezione Lavoro e direzione',
      'Estratto della sezione Schemi e blocchi ricorrenti',
      'Estratto della sezione Consigli pratici',
      'Estratto della Poesia trasformativa',
    ],
    zoomAria: (alt: string) => `Ingrandisci: ${alt}`,
    prevSlide: 'Slide precedente',
    nextSlide: 'Slide successiva',
    goToSlide: (n: number) => `Vai alla slide ${n}`,
    note: 'Estratto dimostrativo. Il Report completo che riceverai è personalizzato sui tuoi dati di nascita, ed è di circa 10 pagine.',
    zoomedAria: 'Anteprima ingrandita',
    closePreview: 'Chiudi anteprima',
    prevImage: 'Immagine precedente',
    nextImage: 'Immagine successiva',
    escHint: 'Tocca fuori o premi ESC per chiudere',
  },
};

export default social;
