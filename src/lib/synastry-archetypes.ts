// Mirror frontend degli ID archetipo dell'edge function
// _shared/synastry-archetypes.ts. Le label/definizioni tradotte vivono nel
// catalogo i18n (m.coppia.archetypes); qui resta solo il contratto sugli ID e
// il fallback.

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

const ARCHETYPE_IDS: SynastryArchetypeId[] = [
  "soulmates",
  "kindred_spirits",
  "opposites_attract",
  "karmic_lesson",
  "steady_rock",
  "intellectual_powerhouse",
  "magnetic_attraction",
  "long_term_anchor",
  "mental_synergy",
  "volatile_spark",
  "catalyst_for_change",
  "deep_bond",
  "balanced_connection",
  "discordant_layout",
];

export function resolveArchetypeId(id: string | null | undefined): SynastryArchetypeId {
  if (id && ARCHETYPE_IDS.includes(id as SynastryArchetypeId)) {
    return id as SynastryArchetypeId;
  }
  return "balanced_connection";
}
