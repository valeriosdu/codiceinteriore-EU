// Mirror frontend del lookup table edge function _shared/synastry-archetypes.ts.
// Lookup ID inglese -> {label italiano, definizione breve}.

export type SynastryArchetypeId =
  | "soulmates"
  | "kindred_spirits"
  | "opposites_attract"
  | "karmic_lesson"
  | "steady_rock"
  | "intellectual_powerhouse"
  | "magnetic_attraction"
  | "long_term_anchor"
  | "mental_synergy"
  | "volatile_spark"
  | "catalyst_for_change"
  | "deep_bond"
  | "balanced_connection"
  | "discordant_layout";

export interface SynastryArchetypeMeta {
  label: string;
  definizione: string;
}

const ARCHETYPES: Record<SynastryArchetypeId, SynastryArchetypeMeta> = {
  soulmates: {
    label: "Anime affini",
    definizione:
      "Rara combinazione di passione e durata profonda: forte intesa romantica sostenuta da una struttura stabile.",
  },
  kindred_spirits: {
    label: "Spiriti affini",
    definizione:
      "Comprensione emotiva profonda con poca frizione: una sintonia che si percepisce naturale.",
  },
  opposites_attract: {
    label: "Opposti che si attraggono",
    definizione:
      "Forte intensita romantica alimentata da differenze marcate: la tensione e parte dell'attrazione.",
  },
  karmic_lesson: {
    label: "Lezione karmica",
    definizione:
      "Dinamica impegnativa nata per evolvere: chiede consapevolezza, restituisce trasformazione.",
  },
  steady_rock: {
    label: "Roccia stabile",
    definizione: "Fondamenta solide e affidabilita: una coppia su cui costruire nel tempo.",
  },
  intellectual_powerhouse: {
    label: "Sintonia mentale potente",
    definizione: "Connessione mentale eccezionale: idee, parole e curiosita scorrono con fluidita.",
  },
  magnetic_attraction: {
    label: "Attrazione magnetica",
    definizione: "Chimica romantica e fisica dominante: l'attrazione e il filo principale.",
  },
  long_term_anchor: {
    label: "Ancora di lungo termine",
    definizione: "Una base solida su cui costruire il futuro: stabilita prima dell'effervescenza.",
  },
  mental_synergy: {
    label: "Sinergia mentale",
    definizione: "Ottimo rapporto intellettuale: comunicazione e progettualita sono il vostro terreno comune.",
  },
  volatile_spark: {
    label: "Scintilla volatile",
    definizione: "Energia alta, dinamica intensa: trasformativa se accolta, faticosa se subita.",
  },
  catalyst_for_change: {
    label: "Catalizzatore di cambiamento",
    definizione: "Stimolate l'espansione l'uno dell'altra: una coppia che fa muovere.",
  },
  deep_bond: {
    label: "Legame profondo",
    definizione: "Sicurezza emotiva profonda: una coppia in cui ci si sente visti senza spiegazioni.",
  },
  balanced_connection: {
    label: "Connessione equilibrata",
    definizione: "Una miscela stabile di energie diverse: nessun tema domina, l'equilibrio e la chiave.",
  },
  discordant_layout: {
    label: "Configurazione dissonante",
    definizione: "Significativa frizione che richiede uno sforzo consapevole: la coppia funziona quando entrambi lo scelgono.",
  },
};

export function getArchetypeMeta(id: string | null | undefined): SynastryArchetypeMeta {
  if (id && (id as SynastryArchetypeId) in ARCHETYPES) {
    return ARCHETYPES[id as SynastryArchetypeId];
  }
  return ARCHETYPES.balanced_connection;
}

export function getArchetypeLabel(id: string | null | undefined): string {
  return getArchetypeMeta(id).label;
}
