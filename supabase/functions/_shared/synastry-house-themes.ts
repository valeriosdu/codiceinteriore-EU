// Helper to interpret a synastry house overlay.
// Input: {planet, house} -> an ENGLISH sentence describing what it means to
// have the other person's planet in your house. Labels are kept in English
// (neutral): the reading's output language is set by the prompt directive.
//
// The most relevant synastry houses are 1, 4, 5, 7, 8, 10, 11, 12.

import { PLANET_IT } from "./synastry-aspect-labels.ts";

const HOUSE_THEMES: Record<number, string> = {
  1: "a presence that shapes how you show yourself to the world",
  2: "a presence that touches what you value (money, self-worth, body)",
  3: "a presence in your everyday communication",
  4: "a presence in your roots, your home, your deepest intimacy",
  5: "a presence in what makes you feel alive: play, creativity, romance",
  6: "a presence in your daily life, your habits, your routine work",
  7: "a presence in the role of natural partner: it completes you or mirrors you",
  8: "a presence in your most hidden zone: sexuality, shared money, transformation",
  9: "a presence in what you seek (travel, faith, worldview)",
  10: "a presence in your vocation, in how you fulfill yourself publicly",
  11: "a presence in your friendships, your dreams, your chosen community",
  12: "a presence in your zone of mystery: spirituality, dreams, the unconscious",
};

const PLANET_IMPACT: Record<string, string> = {
  sun: "brings light and warmth",
  moon: "brings emotion and care",
  mercury: "brings exchange and words",
  venus: "brings affection and beauty",
  mars: "brings movement and desire",
  jupiter: "brings expansion and luck",
  saturn: "brings structure and discipline",
  uranus: "brings a jolt and change",
  neptune: "brings dream and idealization",
  pluto: "brings intensity and transformation",
  asc: "brings a new version of the self",
  mc: "brings vocation",
  true_node: "brings a direction of growth",
  node: "brings a direction of growth",
  chiron: "brings a wound to heal together",
  lilith: "brings the shadow and taboo attraction",
  vertex: "brings a fated encounter",
};

export interface HouseOverlayInput {
  planet: string;
  house: number;
  /** Who has the planet (e.g. person A's name) */
  fromPersonName: string;
  /** Who owns the house (e.g. person B's name) */
  toPersonName: string;
}

export function formatHouseOverlayForBrief(overlay: HouseOverlayInput): string {
  const planetIt = PLANET_IT[overlay.planet] ?? overlay.planet;
  const impact = PLANET_IMPACT[overlay.planet] ?? "brings its energy";
  const houseTheme = HOUSE_THEMES[overlay.house] ?? `in house ${overlay.house}`;
  return `${planetIt} of ${overlay.fromPersonName} in house ${overlay.house} of ${overlay.toPersonName}: ${impact}, ${houseTheme}`;
}

/**
 * Narrative-relevance score of a house overlay.
 * Personal planets in angular houses (1,4,7,10) and relational houses (5,7,8) weigh more.
 */
export function houseOverlayRelevance(planet: string, house: number): number {
  const personal = new Set(["sun", "moon", "mercury", "venus", "mars", "asc", "mc"]);
  const generational = new Set(["uranus", "neptune", "pluto", "true_node", "node", "mean_node", "chiron", "lilith"]);
  const relationalHouses = new Set([1, 4, 5, 7, 8, 10, 12]);

  let score = 0;
  if (personal.has(planet)) score += 3;
  else if (generational.has(planet)) score += 1;
  else score += 2;

  if (relationalHouses.has(house)) score += 2;

  return score;
}
