// Frontend funnel registry. Single source of truth for per-angle UI content
// shown on /teaser (and eventually /lp/<slug> landings + report rendering).
//
// To add a new angle:
//   1. Add the slug to FunnelSlug
//   2. Add a FunnelUIContent entry to FUNNELS
//   3. Wire the landing CTA to /quiz?funnel=<slug>
//   4. Mirror the angle's prompts in supabase/functions/_shared (see
//      process-session-insights and generate-report)

export type FunnelSlug = "classica" | "attivazione";

export type ReportSectionConfig = {
  id: string; // matches the JSON key returned by generate-report
  label: string; // short label for the sidebar/nav
  title: string; // long title shown above the section body
  type?: "prose" | "poem"; // poem rendering is a special case (italic, line-per-line)
};

export type FunnelUIContent = {
  slug: FunnelSlug;
  teaser: {
    fallbackInsights: { title: string; body: string }[];
    offerHeadline: string;
    offerSubhead: string;
    reportSectionsList: string[];
    baseOffer: { promise: string; features: string[] };
    trustBullets: string[];
    faqItems: { q: string; a: string }[];
  };
  report: {
    // Section list driving Report.tsx rendering. Order is the order shown to
    // the reader. Each id must match a JSON key returned by generate-report
    // for the corresponding funnel; mismatched ids render as empty sections.
    sections: ReportSectionConfig[];
  };
};

const CLASSICA: FunnelUIContent = {
  slug: "classica",
  teaser: {
    fallbackInsights: [
      {
        title: "Non scegli a caso",
        body: "C'è una forma precisa in cui ti leghi: qualcosa nella tua struttura riconosce un certo tipo di intensità prima ancora che tu pensi. Lo schema non è il tipo di persona, è il modo in cui ti accendi.",
      },
      {
        title: "Non sei chiusa, ti proteggi",
        body: "Quando l'altro si avvicina troppo o si allontana, qualcosa in te si attiva. Non è freddezza, non è ambivalenza: è una difesa precisa che ha una funzione, non un sintomo da correggere.",
      },
      {
        title: "Quello che cerchi davvero",
        body: "Sotto allo schema e alla difesa c'è un desiderio preciso, e ha una forma più sottile di quella che hai imparato a chiedere. Riconoscerlo non spezza lo schema: cambia il modo in cui lo abiti.",
      },
    ],
    offerHeadline: "Hai letto un'anteprima della tua lettura.",
    offerSubhead:
      "I 3 frammenti che hai letto sono sintesi brevi e dense. La Lettura Completa ti offre un quadro unico e coerente di tutti gli aspetti del tuo Tema Natale.",
    reportSectionsList: [
      "Identità profonda",
      "Dinamiche emotive",
      "Relazioni e amore",
      "Lavoro e direzione",
      "Schemi e blocchi ricorrenti",
      "Consigli pratici",
    ],
    baseOffer: {
      promise:
        "Per capire con più chiarezza la tua struttura emotiva, relazionale e personale, e vedere cosa tende a ripetersi nella tua vita.",
      features: [
        "Comprendi blocchi emotivi, difese e dinamiche ricorrenti con un linguaggio umano, non tecnico",
        "Vedi come questi schemi influenzano relazioni, lavoro, direzione personale e scelte di vita",
        "Ricevi spunti pratici su cosa osservare, favorire o correggere nei tuoi modi di reagire",
        "Approfondisci gratuitamente la lettura con una Guida Astrologica che risponde alle tue domande",
        "Accesso immediato alla tua lettura online e via e-mail",
      ],
    },
    trustBullets: [
      "Se la lettura ti sembra generica o non ti tocca davvero, ti rimborsiamo fino all'ultimo centesimo.",
    ],
    faqItems: [
      {
        q: "In cosa è diversa dalle letture astrologiche gratuite che si trovano online?",
        a: "Le letture gratuite che trovi online spesso dividono tutto in parti separate: un significato per ogni pianeta, un significato per ogni aspetto, un significato per ogni casa. Qui il lavoro è diverso: il tuo tema viene letto come un insieme vivo, dando più peso a ciò che conta davvero e collegando tra loro relazioni, emozioni, blocchi e direzione personale in una lettura unica e coerente, senza contraddizioni.",
      },
      {
        q: "Cosa ricevo esattamente acquistando la lettura?",
        a: "Ricevi una lettura completa e personalizzata di 10 pagine del tuo tema natale, scritta in linguaggio chiaro e umano. La lettura approfondisce identità, dinamiche emotive, relazioni, schemi ricorrenti, blocchi principali e direzione personale. Insieme alla lettura ricevi anche 2 domande gratuite alla Guida astrologica, dove puoi chiedere approfondimenti su qualunque parte del tuo report o della tua carta.",
      },
      {
        q: "Cos'è la Guida astrologica inclusa con la lettura?",
        a: "Dopo aver letto il tuo report, puoi farle domande personali su qualunque aspetto della tua carta natale o del momento che stai vivendo. La Guida elabora la risposta basandosi sui tuoi dati di nascita e sulla lettura che hai già ricevuto, e te la consegna nelle ore successive sul tuo spazio personale e via email. Con la Lettura Completa sono incluse 2 domande gratuite, e potrai approfondire ulteriormente con pacchetti di domande aggiuntive direttamente dal tuo report.",
      },
      {
        q: "Come viene creata la Lettura Completa?",
        a: "A partire dai dati di nascita che hai inserito viene generata la tua carta natale astrologica. Da questa base prende forma la lettura completa, che utilizza un sistema di elaborazione assistita fondato su una conoscenza astrologica e psicologica ampia e organizzata. Questo permette di collegare molte informazioni tra loro e tradurle in una lettura chiara, coerente e personale, diversa dai contenuti generici e frammentati che si trovano online.",
      },
      {
        q: "Devo conoscere già l'astrologia per capirla?",
        a: "No. La lettura è scritta per essere comprensibile anche se non hai mai studiato astrologia. I riferimenti astrologici possono essere presenti, ma vengono sempre tradotti in significati concreti, psicologici e relazionali.",
      },
      {
        q: "Che differenza c'è tra la lettura completa e l'offerta che include il primo mese di transiti?",
        a: "La lettura completa approfondisce la tua struttura personale di base: emozioni, relazioni, scelte, blocchi e pattern ricorrenti a partire dalla tua Carta Natale. È una lettura più stabile, legata a ciò che tende a ripetersi nel tempo. L'offerta con il primo mese aggiunge i transiti settimanali: una lettura di come i movimenti astrologici del periodo possono attivare alcune parti della tua mappa personale e aiutarti a capire meglio il momento che stai vivendo adesso. In breve: il report spiega la tua struttura, i transiti mostrano come quella struttura si muove nel presente. Include anche la poesia trasformativa personalizzata come omaggio.",
      },
      {
        q: "Quando ricevo l'accesso alla lettura?",
        a: "Subito dopo l'acquisto. Una volta completato il pagamento, potrai attivare il tuo accesso personale e leggere il report nella tua area riservata e via email.",
      },
    ],
  },
  report: {
    sections: [
      { id: "identity", label: "Identità", title: "Identità profonda" },
      { id: "emotions", label: "Emozioni", title: "Dinamiche emotive" },
      { id: "relationships", label: "Relazioni", title: "Relazioni e amore" },
      { id: "work", label: "Lavoro", title: "Lavoro e direzione" },
      { id: "patterns_blocks", label: "Schemi", title: "Schemi e blocchi ricorrenti" },
      { id: "advice", label: "Consigli", title: "Consigli pratici" },
      { id: "poem", label: "Poesia", title: "Poesia trasformativa", type: "poem" },
    ],
  },
};

const ATTIVAZIONE: FunnelUIContent = {
  slug: "attivazione",
  teaser: {
    fallbackInsights: [
      {
        title: "Non è pigrizia",
        body: "Quello che ti blocca non è mancanza di volontà. È una protezione che hai imparato a costruire — utile, una volta. Adesso ti tiene fermo, e capire come funziona ti aiuta a non subirla più.",
      },
      {
        title: "Non sei in ritardo, hai un altro ritmo",
        body: "Ti senti in ritardo perché ti confronti con il tempo degli altri. Ma il tuo ritmo è diverso: ha pause più lunghe, ripartenze inaspettate, momenti in cui non sembra succedere niente. Capirlo cambia il modo in cui ti vedi.",
      },
      {
        title: "Cosa ti sblocca davvero",
        body: "Non è una questione di motivazione. Parti quando intorno a te ci sono certe condizioni precise — quelle giuste per come sei fatto/a, non quelle che funzionano per gli altri. La tua carta natale ti dice quali sono.",
      },
    ],
    offerHeadline: "Hai letto un'anteprima della tua lettura.",
    offerSubhead:
      "Questi 3 punti sono sintesi volutamente brevi e dense. Il tuo tema natale è molto più ampio. La Lettura Completa svolge tutto per esteso e collega i vari aspetti tra loro: cosa ti blocca davvero (e cosa quel blocco sta proteggendo), in che condizioni ti sblocchi, e se sei davvero in ritardo o stai solo seguendo i tuoi tempi naturali. Circa 10 pagine in italiano semplice, da rileggere quando serve.",
    reportSectionsList: [
      "Identità profonda",
      "Dinamiche emotive",
      "Blocchi principali",
      "Schemi ricorrenti",
      "Condizioni di attivazione",
      "Il tuo ritmo",
    ],
    baseOffer: {
      promise:
        "Per capire perché non riesci a sbloccarti come vorresti, cosa ti fa partire davvero, e il ritmo profondo che stai già seguendo. Scritto chiaramente, in italiano umano.",
      features: [
        "Capisci cosa ti blocca, e cosa quel blocco sta proteggendo",
        "Riconosci le condizioni in cui ti sblocchi e ti metti in moto davvero",
        "Vedi il tuo ritmo: quando spingere e quando fermarti",
        "Approfondisci la lettura con una Guida Astrologica che risponde alle tue domande, 2 approfondimenti inclusi",
        "Accesso immediato alla tua lettura online e via email",
      ],
    },
    trustBullets: [
      "Se la lettura ti sembra generica o non ti tocca davvero, ti rimborsiamo fino all'ultimo centesimo.",
      "Una visione coerente che mette insieme blocchi, schemi, attivazione e direzione personale.",
      "Per questo alla fine il quadro ti risulterà chiaro e coerente.",
    ],
    faqItems: [
      {
        q: "In cosa è diversa dalle letture astrologiche gratuite che si trovano online?",
        a: "Le letture gratuite online dividono tutto in parti separate: un significato per ogni pianeta, uno per ogni aspetto, uno per ogni casa. Qui il lavoro è diverso: il tuo tema viene letto come un insieme vivo, dando più peso a ciò che conta davvero e collegando tra loro identità, emozioni, blocchi, schemi e direzione personale in una lettura unica e coerente, senza contraddizioni.",
      },
      {
        q: "Cosa ricevo esattamente acquistando la lettura?",
        a: "Ricevi una lettura completa e personalizzata di 10 pagine del tuo tema natale, scritta in linguaggio chiaro e umano. La lettura approfondisce identità, dinamiche emotive, blocchi principali, schemi che si ripetono, cosa ti sblocca davvero e il tuo ritmo profondo. Insieme alla lettura ricevi anche 2 domande gratuite alla Guida astrologica, dove puoi chiedere approfondimenti su qualunque parte del tuo report o della tua carta.",
      },
      {
        q: "Cos'è la Guida astrologica inclusa con la lettura?",
        a: "Dopo aver letto il tuo report, puoi farle domande personali su qualunque aspetto della tua carta natale o del momento che stai vivendo. La Guida elabora la risposta basandosi sui tuoi dati di nascita e sulla lettura che hai già ricevuto, e te la consegna nelle ore successive sul tuo spazio personale e via email. Con la Lettura Completa sono incluse 2 domande gratuite, e potrai approfondire ulteriormente con pacchetti di domande aggiuntive direttamente dal tuo report.",
      },
      {
        q: "Come viene creata la Lettura Completa?",
        a: "A partire dai dati di nascita che hai inserito viene generata la tua carta natale astrologica. Da questa base prende forma la lettura completa, che utilizza un sistema di elaborazione assistita fondato su una conoscenza astrologica e psicologica ampia e organizzata. Questo permette di collegare molte informazioni tra loro e tradurle in una lettura chiara, coerente e personale, diversa dai contenuti generici e frammentati che si trovano online.",
      },
      {
        q: "Devo conoscere già l'astrologia per capirla?",
        a: "No. La lettura è scritta per essere comprensibile anche se non hai mai studiato astrologia. I riferimenti astrologici possono essere presenti, ma vengono sempre tradotti in significati concreti e psicologici.",
      },
      {
        q: "Che differenza c'è tra la lettura completa e l'offerta che include il primo mese di transiti?",
        a: "La lettura completa approfondisce la tua struttura personale di base: emozioni, blocchi, schemi e direzione a partire dalla tua Carta Natale. È una lettura più stabile, legata a ciò che tende a ripetersi nel tempo. L'offerta con il primo mese aggiunge i transiti settimanali: una lettura di come i movimenti astrologici del periodo possono attivare alcune parti della tua mappa personale e aiutarti a capire meglio il momento che stai vivendo adesso. In breve: il report spiega la tua struttura, i transiti mostrano come quella struttura si muove nel presente. Include anche la poesia trasformativa personalizzata come omaggio.",
      },
      {
        q: "Quando ricevo l'accesso alla lettura?",
        a: "Subito dopo l'acquisto. Una volta completato il pagamento, potrai attivare il tuo accesso personale e leggere il report nella tua area riservata e via email.",
      },
    ],
  },
  report: {
    sections: [
      { id: "identity", label: "Identità", title: "Identità profonda" },
      { id: "emotions_relationships", label: "Dinamiche", title: "Dinamiche emotive e relazionali" },
      { id: "blocks_patterns", label: "Blocchi", title: "Blocchi e schemi ricorrenti" },
      { id: "work_direction", label: "Lavoro", title: "Lavoro e direzione" },
      { id: "advice", label: "Consigli", title: "Consigli pratici" },
      { id: "poem", label: "Poesia", title: "Poesia trasformativa", type: "poem" },
    ],
  },
};

export const FUNNELS: Record<FunnelSlug, FunnelUIContent> = {
  classica: CLASSICA,
  attivazione: ATTIVAZIONE,
};

export function getFunnelConfig(slug: string | null | undefined): FunnelUIContent {
  return FUNNELS[(slug as FunnelSlug) || "classica"] ?? FUNNELS.classica;
}
