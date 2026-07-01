// Lookup table per i 14 archetipi sinastria restituiti da freeastroapi /synastry.
// getArchetypeMeta restituisce {label, definizione} in INGLESE (neutro): alimenta
// SOLO il brief interno passato al modello, la cui lingua di output è imposta dalla
// direttiva nel prompt. I label MOSTRATI all'utente (it/es) vivono in ARCHETYPE_LABELS,
// allineati al catalogo frontend src/i18n/{it,es}/coppia.ts, e si leggono via
// getArchetypeLabel(id, lang) — NON da qui.

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
    label: "Soulmates",
    definizione:
      "A rare combination of passion and deep endurance: a strong romantic bond sustained by a stable structure.",
  },
  kindred_spirits: {
    label: "Kindred Spirits",
    definizione:
      "Deep emotional understanding with little friction: a rapport that feels natural.",
  },
  opposites_attract: {
    label: "Opposites Attract",
    definizione:
      "Strong romantic intensity fueled by marked differences: the tension is part of the attraction.",
  },
  karmic_lesson: {
    label: "Karmic Lesson",
    definizione:
      "A demanding dynamic born to evolve: it asks for awareness, it returns transformation.",
  },
  steady_rock: {
    label: "Steady Rock",
    definizione:
      "Solid foundations and reliability: a couple to build on over time.",
  },
  intellectual_powerhouse: {
    label: "Intellectual Powerhouse",
    definizione:
      "An exceptional mental connection: ideas, words and curiosity flow with ease.",
  },
  magnetic_attraction: {
    label: "Magnetic Attraction",
    definizione:
      "Dominant romantic and physical chemistry: attraction is the main thread.",
  },
  long_term_anchor: {
    label: "Long-term Anchor",
    definizione:
      "A solid base to build the future on: stability before effervescence.",
  },
  mental_synergy: {
    label: "Mental Synergy",
    definizione:
      "An excellent intellectual rapport: communication and planning are your common ground.",
  },
  volatile_spark: {
    label: "Volatile Spark",
    definizione:
      "High energy, an intense dynamic: transformative if welcomed, draining if endured.",
  },
  catalyst_for_change: {
    label: "Catalyst for Change",
    definizione:
      "You stimulate each other's expansion: a couple that gets things moving.",
  },
  deep_bond: {
    label: "Deep Bond",
    definizione:
      "Deep emotional security: a couple where you feel seen without explanations.",
  },
  balanced_connection: {
    label: "Balanced Connection",
    definizione:
      "A stable blend of different energies: no single theme dominates, balance is the key.",
  },
  discordant_layout: {
    label: "Discordant Layout",
    definizione:
      "Significant friction that requires conscious effort: the couple works when both choose it.",
  },
};

// Label per lingua (la definizione resta solo italiana, vedi nota in testa).
const ARCHETYPE_LABELS: Record<PromptLang, Record<SynastryArchetypeId, string>> = {
  it: Object.fromEntries(
    (Object.keys(ARCHETYPES) as SynastryArchetypeId[]).map((id) => [id, ARCHETYPES[id].label]),
  ) as Record<SynastryArchetypeId, string>,
  en: {
    soulmates: "Soulmates",
    kindred_spirits: "Kindred Spirits",
    opposites_attract: "Opposites Attract",
    karmic_lesson: "Karmic Lesson",
    steady_rock: "Steady Rock",
    intellectual_powerhouse: "Intellectual Powerhouse",
    magnetic_attraction: "Magnetic Attraction",
    long_term_anchor: "Long-term Anchor",
    mental_synergy: "Mental Synergy",
    volatile_spark: "Volatile Spark",
    catalyst_for_change: "Catalyst for Change",
    deep_bond: "Deep Bond",
    balanced_connection: "Balanced Connection",
    discordant_layout: "Discordant Layout",
  },
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
