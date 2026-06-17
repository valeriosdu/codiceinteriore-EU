// Lookup table per i 14 archetipi sinastria restituiti da freeastroapi /synastry.
// Mappa ID inglese -> {label italiano, definizione breve italiana}.
// I label tradotti (es) vivono in ARCHETYPE_LABELS, allineati al catalogo
// frontend src/i18n/{it,es}/coppia.ts; la definizione resta italiana perché
// alimenta solo il brief interno per Gemini, non il PDF.

import type { PromptLang } from "./prompts/lang.ts";

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
    definizione:
      "Fondamenta solide e affidabilita: una coppia su cui costruire nel tempo.",
  },
  intellectual_powerhouse: {
    label: "Sintonia mentale potente",
    definizione:
      "Connessione mentale eccezionale: idee, parole e curiosita scorrono con fluidita.",
  },
  magnetic_attraction: {
    label: "Attrazione magnetica",
    definizione:
      "Chimica romantica e fisica dominante: l'attrazione e il filo principale.",
  },
  long_term_anchor: {
    label: "Ancora di lungo termine",
    definizione:
      "Una base solida su cui costruire il futuro: stabilita prima dell'effervescenza.",
  },
  mental_synergy: {
    label: "Sinergia mentale",
    definizione:
      "Ottimo rapporto intellettuale: comunicazione e progettualita sono il vostro terreno comune.",
  },
  volatile_spark: {
    label: "Scintilla volatile",
    definizione:
      "Energia alta, dinamica intensa: trasformativa se accolta, faticosa se subita.",
  },
  catalyst_for_change: {
    label: "Catalizzatore di cambiamento",
    definizione:
      "Stimolate l'espansione l'uno dell'altra: una coppia che fa muovere.",
  },
  deep_bond: {
    label: "Legame profondo",
    definizione:
      "Sicurezza emotiva profonda: una coppia in cui ci si sente visti senza spiegazioni.",
  },
  balanced_connection: {
    label: "Connessione equilibrata",
    definizione:
      "Una miscela stabile di energie diverse: nessun tema domina, l'equilibrio e la chiave.",
  },
  discordant_layout: {
    label: "Configurazione dissonante",
    definizione:
      "Significativa frizione che richiede uno sforzo consapevole: la coppia funziona quando entrambi lo scelgono.",
  },
};

// Label per lingua (la definizione resta solo italiana, vedi nota in testa).
const ARCHETYPE_LABELS: Record<PromptLang, Record<SynastryArchetypeId, string>> = {
  it: Object.fromEntries(
    (Object.keys(ARCHETYPES) as SynastryArchetypeId[]).map((id) => [id, ARCHETYPES[id].label]),
  ) as Record<SynastryArchetypeId, string>,
  es: {
    soulmates: "Almas afines",
    kindred_spirits: "Espíritus afines",
    opposites_attract: "Opuestos que se atraen",
    karmic_lesson: "Lección kármica",
    steady_rock: "Roca estable",
    intellectual_powerhouse: "Sintonía mental potente",
    magnetic_attraction: "Atracción magnética",
    long_term_anchor: "Ancla de largo plazo",
    mental_synergy: "Sinergia mental",
    volatile_spark: "Chispa volátil",
    catalyst_for_change: "Catalizador de cambio",
    deep_bond: "Vínculo profundo",
    balanced_connection: "Conexión equilibrada",
    discordant_layout: "Configuración disonante",
  },
};

function resolveArchetypeId(id: string | null | undefined): SynastryArchetypeId {
  return id && (id as SynastryArchetypeId) in ARCHETYPES
    ? (id as SynastryArchetypeId)
    : "balanced_connection";
}

export function getArchetypeMeta(id: string | null | undefined): SynastryArchetypeMeta {
  return ARCHETYPES[resolveArchetypeId(id)];
}

export function getArchetypeLabel(
  id: string | null | undefined,
  lang: PromptLang = "it",
): string {
  return ARCHETYPE_LABELS[lang][resolveArchetypeId(id)];
}
