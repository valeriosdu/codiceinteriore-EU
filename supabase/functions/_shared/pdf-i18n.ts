// Stringhe localizzate dei PDF (report natale, sinastria, transiti). I titoli
// delle sezioni replicano per lingua quelli del frontend; le altre etichette
// sono il "chrome" del documento. Brand e dominio NON vivono qui: arrivano dal
// market (getMarket) per restare coerenti tra mercati.

import type { PromptLang } from "./prompts/lang.ts";

export type PdfSectionTitles = Record<string, string>;

// Titoli sezione per funnel e lingua (key = chiave JSON del report).
export const REPORT_SECTION_TITLES: Record<PromptLang, { classica: PdfSectionTitles; attivazione: PdfSectionTitles }> = {
  it: {
    classica: {
      identity: "Identità profonda",
      emotions: "Dinamiche emotive",
      relationships: "Relazioni e amore",
      work: "Lavoro e direzione",
      patterns_blocks: "Schemi e blocchi ricorrenti",
      advice: "Consigli pratici",
      poem: "Poesia trasformativa",
    },
    attivazione: {
      identity: "Identità profonda",
      emotions_relationships: "Dinamiche emotive e relazionali",
      blocks_patterns: "Blocchi e schemi ricorrenti",
      work_direction: "Lavoro e direzione",
      advice: "Consigli pratici",
      poem: "Poesia trasformativa",
    },
  },
  es: {
    classica: {
      identity: "Identidad profunda",
      emotions: "Dinámicas emocionales",
      relationships: "Relaciones y amor",
      work: "Trabajo y dirección",
      patterns_blocks: "Patrones y bloqueos recurrentes",
      advice: "Consejos prácticos",
      poem: "Poema transformador",
    },
    attivazione: {
      identity: "Identidad profunda",
      emotions_relationships: "Dinámicas emocionales y relacionales",
      blocks_patterns: "Bloqueos y patrones recurrentes",
      work_direction: "Trabajo y dirección",
      advice: "Consejos prácticos",
      poem: "Poema transformador",
    },
  },
  en: {
    classica: {
      identity: "Your deeper identity",
      emotions: "Emotional dynamics",
      relationships: "Relationships and love",
      work: "Work and direction",
      patterns_blocks: "Recurring patterns and blocks",
      advice: "Practical guidance",
      poem: "A transformative poem",
    },
    attivazione: {
      identity: "Your deeper identity",
      emotions_relationships: "Emotional and relational dynamics",
      blocks_patterns: "Recurring blocks and patterns",
      work_direction: "Work and direction",
      advice: "Practical guidance",
      poem: "A transformative poem",
    },
  },
  nl: {
    classica: {
      identity: "Je diepere identiteit",
      emotions: "Emotionele dynamiek",
      relationships: "Relaties en liefde",
      work: "Werk en richting",
      patterns_blocks: "Terugkerende patronen en blokkades",
      advice: "Praktische handvatten",
      poem: "Een transformerend gedicht",
    },
    attivazione: {
      identity: "Je diepere identiteit",
      emotions_relationships: "Emotionele en relationele dynamiek",
      blocks_patterns: "Terugkerende blokkades en patronen",
      work_direction: "Werk en richting",
      advice: "Praktische handvatten",
      poem: "Een transformerend gedicht",
    },
  },
};

export const REPORT_PDF_STRINGS: Record<PromptLang, {
  metaTitle: (name: string) => string;
  metaSubject: string;
  coverTitle: string;
  coverSubtitle: string;
  coverDisclaimer: string;
  introTitle: string;
  indexTitle: string;
  sectionPrefix: string;
  feedbackCta: string;
  closingTitle: string;
  closingParagraphs: string[];
  closingCtaLabel: string;
  closingCaptionPath: string;
  footerSep: string;
}> = {
  it: {
    metaTitle: (name) => `Lettura personale - ${name}`,
    metaSubject: "Lettura personale del tema natale",
    coverTitle: "La tua lettura completa",
    coverSubtitle: "del tema natale",
    coverDisclaimer:
      "Questa lettura non è un oroscopo predittivo, ma una mappa interpretativa costruita a partire dal tuo tema natale. Leggila come uno strumento di osservazione: alcune parti potranno risultare immediate, altre emergeranno con più chiarezza nel tempo.",
    introTitle: "Come leggere questa lettura",
    indexTitle: "Indice",
    sectionPrefix: "SEZIONE",
    feedbackCta: "Facci sapere cosa ne pensi del tuo report ->",
    closingTitle: "Come continuare",
    closingParagraphs: [
      "Questa lettura può essere riletta in momenti diversi. Alcune parti parlano della tua struttura di base: non cambiano da un giorno all'altro, ma possono diventare più chiare quando nella vita reale si ripresentano certe dinamiche, scelte o tensioni interiori.",
      "Per capire meglio il periodo che stai vivendo ora, puoi approfondire i tuoi transiti personali.",
      'I transiti sono il movimento attuale dei pianeti in relazione al tuo tema natale. Non descrivono "cosa succederà" in modo rigido, ma indicano quali aree della tua carta possono essere più attive in questo momento: relazioni, emozioni, decisioni, lavoro, blocchi o cambiamenti interiori.',
      "In questo modo la lettura non resta solo una fotografia della tua struttura, ma diventa anche uno strumento per osservare il presente con più chiarezza.",
    ],
    closingCtaLabel: "Scopri i tuoi transiti personali",
    closingCaptionPath: "/report",
    footerSep: "  ·  ",
  },
  es: {
    metaTitle: (name) => `Lectura personal - ${name}`,
    metaSubject: "Lectura personal de la carta natal",
    coverTitle: "Tu lectura completa",
    coverSubtitle: "de la carta natal",
    coverDisclaimer:
      "Esta lectura no es un horóscopo predictivo, sino un mapa interpretativo construido a partir de tu carta natal. Léela como una herramienta de observación: algunas partes te resultarán inmediatas, otras emergerán con más claridad con el tiempo.",
    introTitle: "Cómo leer esta lectura",
    indexTitle: "Índice",
    sectionPrefix: "SECCIÓN",
    feedbackCta: "Cuéntanos qué te parece tu informe ->",
    closingTitle: "Cómo continuar",
    closingParagraphs: [
      "Esta lectura puede releerse en momentos distintos. Algunas partes hablan de tu estructura de base: no cambian de un día para otro, pero pueden volverse más claras cuando en la vida real reaparecen ciertas dinámicas, decisiones o tensiones interiores.",
      "Para entender mejor el periodo que estás viviendo ahora, puedes profundizar en tus tránsitos personales.",
      'Los tránsitos son el movimiento actual de los planetas en relación con tu carta natal. No describen "qué va a pasar" de forma rígida, sino que indican qué áreas de tu carta pueden estar más activas en este momento: relaciones, emociones, decisiones, trabajo, bloqueos o cambios interiores.',
      "Así la lectura no se queda solo en una foto de tu estructura, sino que se convierte también en una herramienta para observar el presente con más claridad.",
    ],
    closingCtaLabel: "Descubre tus tránsitos personales",
    closingCaptionPath: "/report",
    footerSep: "  ·  ",
  },
  en: {
    metaTitle: (name) => `Personal Reading - ${name}`,
    metaSubject: "Personal reading of your natal chart",
    coverTitle: "Your complete reading",
    coverSubtitle: "of your natal chart",
    coverDisclaimer:
      "This reading is not a predictive horoscope but an interpretive map built from your natal chart. Read it as a tool for observation: some parts will resonate right away, while others will come into focus more clearly over time.",
    introTitle: "How to read this reading",
    indexTitle: "Contents",
    sectionPrefix: "SECTION",
    feedbackCta: "Let us know what you think of your report ->",
    closingTitle: "How to continue",
    closingParagraphs: [
      "This reading can be revisited at different moments. Some parts describe your core structure: they don't change from one day to the next, but they can become clearer when certain dynamics, choices, or inner tensions resurface in real life.",
      "To better understand the period you're going through right now, you can explore your personal transits.",
      'Transits are the current movement of the planets in relation to your natal chart. They don\'t describe "what will happen" in any fixed way, but they point to which areas of your chart may be more active at the moment: relationships, emotions, decisions, work, blocks, or inner changes.',
      "This way, the reading isn't just a snapshot of your structure but also becomes a tool for observing the present with more clarity.",
    ],
    closingCtaLabel: "Discover your personal transits",
    closingCaptionPath: "/report",
    footerSep: "  ·  ",
  },
  nl: {
    metaTitle: (name) => `Persoonlijke duiding - ${name}`,
    metaSubject: "Persoonlijke duiding van je geboortehoroscoop",
    coverTitle: "Jouw volledige duiding",
    coverSubtitle: "van je geboortehoroscoop",
    coverDisclaimer:
      "Deze duiding is geen voorspellende horoscoop, maar een interpretatieve kaart die is opgebouwd vanuit jouw geboortehoroscoop. Lees hem als een instrument om te observeren: sommige delen herken je meteen, andere worden pas met de tijd duidelijker.",
    introTitle: "Hoe je deze duiding leest",
    indexTitle: "Inhoud",
    sectionPrefix: "DEEL",
    feedbackCta: "Laat ons weten wat je van je rapport vindt ->",
    closingTitle: "Hoe je verdergaat",
    closingParagraphs: [
      "Deze duiding kun je op verschillende momenten opnieuw lezen. Sommige delen gaan over je basisstructuur: die verandert niet van de ene dag op de andere, maar wordt vaak scherper zodra bepaalde dynamieken, keuzes of innerlijke spanningen zich in het echte leven opnieuw aandienen.",
      "Wil je de periode waar je nu in zit beter begrijpen, dan kun je dieper ingaan op je persoonlijke transits.",
      'Transits zijn de actuele beweging van de planeten ten opzichte van je geboortehoroscoop. Ze beschrijven niet star "wat er gaat gebeuren", maar laten zien welke gebieden van je horoscoop op dit moment actiever kunnen zijn: relaties, emoties, beslissingen, werk, blokkades of innerlijke veranderingen.',
      "Zo blijft de duiding niet alleen een momentopname van je structuur, maar wordt hij ook een instrument om het heden met meer helderheid te bekijken.",
    ],
    closingCtaLabel: "Ontdek je persoonlijke transits",
    closingCaptionPath: "/report",
    footerSep: "  ·  ",
  },
};

export const TRANSIT_PDF_STRINGS: Record<PromptLang, {
  metaTitle: (name: string) => string;
  metaSubject: string;
  coverTitle: string;
  coverSubtitle: string;
  periodLabel: string;
  introTitle: string;
  introText: string;
  indexTitle: string;
  sectionPrefix: string;
  weekFallback: (n: number) => string;
  index: { summary: string; reading: string; periods: string; dialogue: string };
  headers: {
    mainThemes: string; monthReading: string; monthPeriods: string; intro: string;
    monthWindows: string; keyAspects: string; practicalNotes: string;
  };
  dialogueTitle: string;
  dialogueParagraphs: string[];
  guideCta: string;
  feedbackCta: string;
  emptyMonth: string;
}> = {
  it: {
    metaTitle: (name) => `Transiti ${name}`.trim(),
    metaSubject: "Lettura dei transiti del mese",
    coverTitle: "I tuoi transiti del mese",
    coverSubtitle: "una mappa del periodo che stai vivendo",
    periodLabel: "Periodo:",
    introTitle: "Come leggere i tuoi transiti",
    introText:
      "Questa lettura è una fotografia del cielo di questo mese in relazione al tuo tema natale. Non descrive cosa succederà in modo rigido, ma indica quali aree della tua carta sono più attive ora: relazioni, emozioni, decisioni, blocchi, transizioni interiori. Leggila come uno strumento di osservazione del presente, non come un'agenda.",
    indexTitle: "Indice",
    sectionPrefix: "SEZIONE",
    weekFallback: (n) => `Settimana ${n}`,
    index: { summary: "Temi principali", reading: "Lettura del mese", periods: "Periodi del mese", dialogue: "Continua il dialogo" },
    headers: {
      mainThemes: "Temi principali", monthReading: "Lettura del mese", monthPeriods: "Periodi del mese",
      intro: "Introduzione", monthWindows: "Finestre del mese", keyAspects: "Aspetti rilevanti",
      practicalNotes: "Indicazioni pratiche",
    },
    dialogueTitle: "Continua il dialogo",
    dialogueParagraphs: [
      "I transiti del mese ti danno una direzione, ma le domande personali nascono mentre li vivi giorno per giorno.",
      "Se vuoi approfondire un passaggio specifico (perché senti una certa tensione, come affrontare un periodo, cosa significa per te un transito che ti riguarda), la Guida astrologica è lì per rispondere.",
      "Apri la guida sul sito e fai una domanda: ti risponderemo nel giro di qualche ora.",
    ],
    guideCta: "Apri la Guida astrologica",
    feedbackCta: "Facci sapere cosa ne pensi della lettura ->",
    emptyMonth: "I transiti del mese non sono ancora disponibili. Riprova tra poco oppure scrivici.",
  },
  es: {
    metaTitle: (name) => `Tránsitos ${name}`.trim(),
    metaSubject: "Lectura de los tránsitos del mes",
    coverTitle: "Tus tránsitos del mes",
    coverSubtitle: "un mapa del periodo que estás viviendo",
    periodLabel: "Periodo:",
    introTitle: "Cómo leer tus tránsitos",
    introText:
      "Esta lectura es una foto del cielo de este mes en relación con tu carta natal. No describe qué va a pasar de forma rígida, sino que indica qué áreas de tu carta están más activas ahora: relaciones, emociones, decisiones, bloqueos, transiciones interiores. Léela como una herramienta de observación del presente, no como una agenda.",
    indexTitle: "Índice",
    sectionPrefix: "SECCIÓN",
    weekFallback: (n) => `Semana ${n}`,
    index: { summary: "Temas principales", reading: "Lectura del mes", periods: "Periodos del mes", dialogue: "Continúa el diálogo" },
    headers: {
      mainThemes: "Temas principales", monthReading: "Lectura del mes", monthPeriods: "Periodos del mes",
      intro: "Introducción", monthWindows: "Ventanas del mes", keyAspects: "Aspectos relevantes",
      practicalNotes: "Indicaciones prácticas",
    },
    dialogueTitle: "Continúa el diálogo",
    dialogueParagraphs: [
      "Los tránsitos del mes te dan una dirección, pero las preguntas personales surgen mientras los vives día a día.",
      "Si quieres profundizar en un momento concreto (por qué sientes cierta tensión, cómo afrontar un periodo, qué significa para ti un tránsito que te afecta), la Guía astrológica está ahí para responder.",
      "Abre la guía en el sitio y haz una pregunta: te responderemos en unas horas.",
    ],
    guideCta: "Abre la Guía astrológica",
    feedbackCta: "Cuéntanos qué te parece la lectura ->",
    emptyMonth: "Los tránsitos del mes aún no están disponibles. Inténtalo de nuevo en breve o escríbenos.",
  },
  en: {
    metaTitle: (name) => `Transits ${name}`.trim(),
    metaSubject: "Reading of this month's transits",
    coverTitle: "Your transits for the month",
    coverSubtitle: "a map of the period you're living through",
    periodLabel: "Period:",
    introTitle: "How to read your transits",
    introText:
      "This reading is a snapshot of this month's sky in relation to your natal chart. It doesn't describe what will happen in any fixed way, but it points to which areas of your chart are more active right now: relationships, emotions, decisions, blocks, inner transitions. Read it as a tool for observing the present, not as a planner.",
    indexTitle: "Contents",
    sectionPrefix: "SECTION",
    weekFallback: (n) => `Week ${n}`,
    index: { summary: "Main themes", reading: "Reading of the month", periods: "Periods of the month", dialogue: "Continue the conversation" },
    headers: {
      mainThemes: "Main themes", monthReading: "Reading of the month", monthPeriods: "Periods of the month",
      intro: "Introduction", monthWindows: "Windows of the month", keyAspects: "Notable aspects",
      practicalNotes: "Practical notes",
    },
    dialogueTitle: "Continue the conversation",
    dialogueParagraphs: [
      "The month's transits give you a direction, but personal questions come up as you live through them day by day.",
      "If you want to go deeper into a specific moment (why you feel a certain tension, how to handle a period, what a transit affecting you means for you), the Astrology Guide is there to answer.",
      "Open the guide on the site and ask a question: we'll get back to you within a few hours.",
    ],
    guideCta: "Open the Astrology Guide",
    feedbackCta: "Let us know what you think of the reading ->",
    emptyMonth: "This month's transits aren't available yet. Try again shortly or write to us.",
  },
  nl: {
    metaTitle: (name) => `Transits ${name}`.trim(),
    metaSubject: "Duiding van de transits van deze maand",
    coverTitle: "Jouw transits van de maand",
    coverSubtitle: "een kaart van de periode waar je nu in zit",
    periodLabel: "Periode:",
    introTitle: "Hoe je je transits leest",
    introText:
      "Deze duiding is een momentopname van de hemel van deze maand ten opzichte van je geboortehoroscoop. Ze beschrijft niet star wat er gaat gebeuren, maar laat zien welke gebieden van je horoscoop nu actiever zijn: relaties, emoties, beslissingen, blokkades, innerlijke overgangen. Lees hem als een instrument om het heden te observeren, niet als een agenda.",
    indexTitle: "Inhoud",
    sectionPrefix: "DEEL",
    weekFallback: (n) => `Week ${n}`,
    index: { summary: "Hoofdthema's", reading: "Duiding van de maand", periods: "Periodes van de maand", dialogue: "Zet het gesprek voort" },
    headers: {
      mainThemes: "Hoofdthema's", monthReading: "Duiding van de maand", monthPeriods: "Periodes van de maand",
      intro: "Inleiding", monthWindows: "Vensters van de maand", keyAspects: "Opvallende aspecten",
      practicalNotes: "Praktische aantekeningen",
    },
    dialogueTitle: "Zet het gesprek voort",
    dialogueParagraphs: [
      "De transits van de maand geven je een richting, maar persoonlijke vragen komen pas op terwijl je ze dag na dag doorleeft.",
      "Wil je dieper ingaan op een specifiek moment (waarom je een bepaalde spanning voelt, hoe je een periode aanpakt, wat een transit die jou raakt voor jou betekent), dan staat de Astrologiegids klaar om te antwoorden.",
      "Open de gids op de site en stel je vraag: we komen binnen een paar uur bij je terug.",
    ],
    guideCta: "Open de Astrologiegids",
    feedbackCta: "Laat ons weten wat je van de duiding vindt ->",
    emptyMonth: "De transits van deze maand zijn nog niet beschikbaar. Probeer het zo meteen opnieuw of schrijf ons.",
  },
};

export const SYNASTRY_PDF_STRINGS: Record<PromptLang, {
  metaTitle: string;
  metaSubject: string;
  coverTitle: string;
  personA: string;
  personB: string;
  introTitle: string;
  introText: string;
  indexTitle: string;
  sectionPrefix: string;
  sectionTitles: Record<string, string>;
  stabilitaTitle: string;
  scoresTitle: string;
  overallLabel: string;
  scaleLabel: string;
  scoreLabels: { intimacy: string; romance: string; communication: string; stability: string; growth: string; tension: string };
  archetypeKicker: string;
  domainsTitle: string;
  timePrefix: string;
  aperturaTitle: string;
  aperturaLabels: { cosa_siete: string; dove_brillate: string; dove_inciampate: string; dove_andate: string };
  closingTitle: string;
  closingParagraphs: string[];
  closingCtaLabel: string;
}> = {
  it: {
    metaTitle: "Sinastria di coppia",
    metaSubject: "Sinastria di coppia",
    coverTitle: "Sinastria di coppia",
    personA: "Persona A",
    personB: "Persona B",
    introTitle: "Come leggere questa sinastria",
    introText:
      "Questa sinastria descrive il potenziale della relazione tra due temi natali. Si tratta di una configurazione stabile nel tempo: rappresenta le dinamiche di fondo della coppia, le affinita strutturali e le tensioni ricorrenti che non dipendono dal momento presente. Questo significa che la situazione attuale potrebbe essere molto diversa da quanto descritto qui, per via di forze temporanee (i transiti planetari) che attivano, amplificano o attenuano specifiche aree della carta. Leggila come una mappa del terreno relazionale: il territorio di base su cui si muove la coppia, indipendentemente dalla stagione che state attraversando ora.",
    indexTitle: "Indice",
    sectionPrefix: "SEZIONE",
    sectionTitles: {
      ritratto_coppia: "Il ritratto della coppia",
      attrazione_chimica: "Attrazione e chimica",
      comunicazione: "Comunicazione",
      mondo_emotivo: "Mondo emotivo",
      sfide: "Sfide come crescita",
      pattern_karmico: "Pattern karmico",
      direzione: "Direzione",
      poesia_chiusura: "Chiusura poetica",
    },
    stabilitaTitle: "Stabilita e longevita",
    scoresTitle: "La compatibilita",
    overallLabel: "Compatibilita complessiva",
    scaleLabel: "Punteggi su scala 0-100",
    scoreLabels: {
      intimacy: "Sintonia emotiva", romance: "Attrazione", communication: "Comunicazione",
      stability: "Stabilita", growth: "Crescita", tension: "Tensione",
    },
    archetypeKicker: "ARCHETIPO",
    domainsTitle: "I sei domini della relazione",
    timePrefix: "ore ",
    aperturaTitle: "Sguardo d'insieme",
    aperturaLabels: {
      cosa_siete: "Cosa siete", dove_brillate: "Dove brillate",
      dove_inciampate: "Dove inciampate", dove_andate: "Dove andate",
    },
    closingTitle: "Come continuare",
    closingParagraphs: [
      "Questa sinastria descrive il potenziale stabile della vostra relazione: le fondamenta su cui la coppia si muove nel tempo. Ma il modo in cui questo potenziale si manifesta dipende anche dal periodo che ciascuno di voi sta vivendo.",
      "I transiti planetari attivano aree diverse del tema natale in momenti diversi. In alcuni periodi potreste sentire piu intensamente le tensioni descritte qui, in altri le affinita. Nessuna dinamica e fissa: la relazione si muove.",
      "Per avere una visione completa del momento che state vivendo adesso, puoi esplorare i transiti personali di ciascun partner.",
    ],
    closingCtaLabel: "Scopri i tuoi transiti personali",
  },
  es: {
    metaTitle: "Sinastría de pareja",
    metaSubject: "Sinastría de pareja",
    coverTitle: "Sinastría de pareja",
    personA: "Persona A",
    personB: "Persona B",
    introTitle: "Cómo leer esta sinastría",
    introText:
      "Esta sinastría describe el potencial de la relación entre dos cartas natales. Es una configuración estable en el tiempo: representa las dinámicas de fondo de la pareja, las afinidades estructurales y las tensiones recurrentes que no dependen del momento presente. Esto significa que la situación actual puede ser muy distinta de lo descrito aquí, por fuerzas temporales (los tránsitos planetarios) que activan, amplifican o atenúan áreas concretas de la carta. Léela como un mapa del terreno relacional: el territorio de base sobre el que se mueve la pareja, independientemente de la estación que estéis atravesando ahora.",
    indexTitle: "Índice",
    sectionPrefix: "SECCIÓN",
    sectionTitles: {
      ritratto_coppia: "El retrato de la pareja",
      attrazione_chimica: "Atracción y química",
      comunicazione: "Comunicación",
      mondo_emotivo: "Mundo emocional",
      sfide: "Retos como crecimiento",
      pattern_karmico: "Patrón kármico",
      direzione: "Dirección",
      poesia_chiusura: "Cierre poético",
    },
    stabilitaTitle: "Estabilidad y longevidad",
    scoresTitle: "La compatibilidad",
    overallLabel: "Compatibilidad general",
    scaleLabel: "Puntuaciones en escala 0-100",
    scoreLabels: {
      intimacy: "Sintonía emocional", romance: "Atracción", communication: "Comunicación",
      stability: "Estabilidad", growth: "Crecimiento", tension: "Tensión",
    },
    archetypeKicker: "ARQUETIPO",
    domainsTitle: "Los seis dominios de la relación",
    timePrefix: "",
    aperturaTitle: "Una mirada de conjunto",
    aperturaLabels: {
      cosa_siete: "Qué sois", dove_brillate: "Dónde brilláis",
      dove_inciampate: "Dónde tropezáis", dove_andate: "Hacia dónde vais",
    },
    closingTitle: "Cómo continuar",
    closingParagraphs: [
      "Esta sinastría describe el potencial estable de vuestra relación: los cimientos sobre los que la pareja se mueve en el tiempo. Pero la forma en que ese potencial se manifiesta depende también del periodo que cada uno de vosotros está viviendo.",
      "Los tránsitos planetarios activan áreas distintas de la carta natal en momentos diferentes. En algunos periodos podríais sentir con más intensidad las tensiones descritas aquí, en otros las afinidades. Ninguna dinámica es fija: la relación se mueve.",
      "Para tener una visión completa del momento que estáis viviendo ahora, puedes explorar los tránsitos personales de cada miembro de la pareja.",
    ],
    closingCtaLabel: "Descubre tus tránsitos personales",
  },
  en: {
    metaTitle: "Couple synastry",
    metaSubject: "Couple synastry",
    coverTitle: "Couple synastry",
    personA: "Person A",
    personB: "Person B",
    introTitle: "How to read this synastry",
    introText:
      "This synastry describes the potential of the relationship between two natal charts. It's a configuration that stays stable over time: it represents the couple's underlying dynamics, the structural affinities, and the recurring tensions that don't depend on the present moment. This means your current situation could be quite different from what's described here, because of temporary forces (planetary transits) that activate, amplify, or soften specific areas of the chart. Read it as a map of the relational terrain: the underlying ground the couple moves across, regardless of the season you're going through right now.",
    indexTitle: "Contents",
    sectionPrefix: "SECTION",
    sectionTitles: {
      ritratto_coppia: "Portrait of the couple",
      attrazione_chimica: "Attraction and chemistry",
      comunicazione: "Communication",
      mondo_emotivo: "Emotional world",
      sfide: "Challenges as growth",
      pattern_karmico: "Karmic pattern",
      direzione: "Direction",
      poesia_chiusura: "Poetic closing",
    },
    stabilitaTitle: "Stability and longevity",
    scoresTitle: "The compatibility",
    overallLabel: "Overall compatibility",
    scaleLabel: "Scores on a 0-100 scale",
    scoreLabels: {
      intimacy: "Emotional attunement", romance: "Attraction", communication: "Communication",
      stability: "Stability", growth: "Growth", tension: "Tension",
    },
    archetypeKicker: "ARCHETYPE",
    domainsTitle: "The six domains of the relationship",
    timePrefix: "",
    aperturaTitle: "A look at the whole",
    aperturaLabels: {
      cosa_siete: "What you are", dove_brillate: "Where you shine",
      dove_inciampate: "Where you stumble", dove_andate: "Where you're headed",
    },
    closingTitle: "How to continue",
    closingParagraphs: [
      "This synastry describes the stable potential of your relationship: the foundations the couple moves on over time. But the way this potential shows up also depends on the period each of you is going through.",
      "Planetary transits activate different areas of the natal chart at different moments. In some periods you might feel the tensions described here more intensely, in others the affinities. No dynamic is fixed: the relationship moves.",
      "To get a complete picture of the moment you're living through now, you can explore each partner's personal transits.",
    ],
    closingCtaLabel: "Discover your personal transits",
  },
  nl: {
    metaTitle: "Synastrie van het koppel",
    metaSubject: "Synastrie van het koppel",
    coverTitle: "Synastrie van het koppel",
    personA: "Persoon A",
    personB: "Persoon B",
    introTitle: "Hoe je deze synastrie leest",
    introText:
      "Deze synastrie beschrijft het potentieel van de relatie tussen twee geboortehoroscopen. Het is een configuratie die door de tijd heen stabiel blijft: ze staat voor de onderliggende dynamiek van het koppel, de structurele affiniteiten en de terugkerende spanningen die niet van het huidige moment afhangen. Dat betekent dat je situatie van nu behoorlijk kan verschillen van wat hier staat, door tijdelijke krachten (planetaire transits) die bepaalde gebieden van de horoscoop activeren, versterken of verzachten. Lees hem als een kaart van het relationele terrein: de bodem waarover het koppel beweegt, welk seizoen jullie nu ook doormaken.",
    indexTitle: "Inhoud",
    sectionPrefix: "DEEL",
    sectionTitles: {
      ritratto_coppia: "Portret van het koppel",
      attrazione_chimica: "Aantrekking en chemie",
      comunicazione: "Communicatie",
      mondo_emotivo: "Emotionele wereld",
      sfide: "Uitdagingen als groei",
      pattern_karmico: "Karmisch patroon",
      direzione: "Richting",
      poesia_chiusura: "Poëtische afsluiting",
    },
    stabilitaTitle: "Stabiliteit en duurzaamheid",
    scoresTitle: "De compatibiliteit",
    overallLabel: "Algehele compatibiliteit",
    scaleLabel: "Scores op een schaal van 0-100",
    scoreLabels: {
      intimacy: "Emotionele afstemming", romance: "Aantrekking", communication: "Communicatie",
      stability: "Stabiliteit", growth: "Groei", tension: "Spanning",
    },
    archetypeKicker: "ARCHETYPE",
    domainsTitle: "De zes domeinen van de relatie",
    timePrefix: "",
    aperturaTitle: "Een blik op het geheel",
    aperturaLabels: {
      cosa_siete: "Wat jullie zijn", dove_brillate: "Waar jullie schitteren",
      dove_inciampate: "Waar jullie struikelen", dove_andate: "Waar jullie heen gaan",
    },
    closingTitle: "Hoe je verdergaat",
    closingParagraphs: [
      "Deze synastrie beschrijft het stabiele potentieel van jullie relatie: het fundament waarop het koppel zich door de tijd heen beweegt. Maar hoe dat potentieel zich laat zien, hangt ook af van de periode waar ieder van jullie doorheen gaat.",
      "Planetaire transits activeren op verschillende momenten verschillende gebieden van de geboortehoroscoop. In sommige periodes voel je de spanningen die hier beschreven staan intenser, in andere juist de affiniteiten. Geen enkele dynamiek ligt vast: de relatie beweegt.",
      "Wil je een compleet beeld van het moment dat jullie nu beleven, dan kun je de persoonlijke transits van allebei bekijken.",
    ],
    closingCtaLabel: "Ontdek je persoonlijke transits",
  },
};
