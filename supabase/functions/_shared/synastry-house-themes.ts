// Helper per interpretare un house overlay sinastria.
// Input: {planet, house} -> output frase italiana che descrive cosa significa
// avere il pianeta dell'altro nella propria casa.
//
// Le case sinastriche piu rilevanti sono 1, 4, 5, 7, 8, 10, 11, 12.

import { PLANET_IT } from "./synastry-aspect-labels.ts";

const HOUSE_THEMES: Record<number, string> = {
  1: "presenza che modella come ti mostri al mondo",
  2: "presenza che tocca cio che dai valore (denaro, autostima, corpo)",
  3: "presenza nella tua comunicazione quotidiana",
  4: "presenza nelle radici, nella casa, nella tua intimita piu profonda",
  5: "presenza in cio che ti rende vivo: gioco, creativita, romance",
  6: "presenza nella tua quotidianita, nelle abitudini, nel lavoro routinario",
  7: "presenza nel ruolo di partner naturale: ti completa o ti specchia",
  8: "presenza nella tua zona piu nascosta: sessualita, denaro condiviso, trasformazione",
  9: "presenza in cio che cerchi (viaggi, fede, visione del mondo)",
  10: "presenza nella tua vocazione, nel modo in cui ti realizzi pubblicamente",
  11: "presenza nelle amicizie, nei sogni, nella comunita scelta",
  12: "presenza nella tua zona di mistero: spiritualita, sogni, inconscio",
};

const PLANET_IMPACT: Record<string, string> = {
  sun: "porta luce e calore",
  moon: "porta emotivita e cura",
  mercury: "porta scambio e parole",
  venus: "porta affetto e bellezza",
  mars: "porta movimento e desiderio",
  jupiter: "porta espansione e fortuna",
  saturn: "porta struttura e disciplina",
  uranus: "porta scossa e cambiamento",
  neptune: "porta sogno e idealizzazione",
  pluto: "porta intensita e trasformazione",
  asc: "porta una nuova versione di se",
  mc: "porta vocazione",
  true_node: "porta una direzione di crescita",
  node: "porta una direzione di crescita",
  chiron: "porta una ferita da guarire insieme",
  lilith: "porta l'ombra e l'attrazione tabu",
  vertex: "porta un incontro destinico",
};

export interface HouseOverlayInput {
  planet: string;
  house: number;
  /** Chi ha il pianeta (es. nome persona A) */
  fromPersonName: string;
  /** Chi possiede la casa (es. nome persona B) */
  toPersonName: string;
}

export function formatHouseOverlayForBrief(overlay: HouseOverlayInput): string {
  const planetIt = PLANET_IT[overlay.planet] ?? overlay.planet;
  const impact = PLANET_IMPACT[overlay.planet] ?? "porta la sua energia";
  const houseTheme = HOUSE_THEMES[overlay.house] ?? `nella casa ${overlay.house}`;
  return `${planetIt} di ${overlay.fromPersonName} in casa ${overlay.house} di ${overlay.toPersonName}: ${impact} ${houseTheme}`;
}

/**
 * Punteggio di "rilevanza narrativa" di un house overlay.
 * I pianeti personali in case angolari (1,4,7,10) e relazionali (5,7,8) contano di piu.
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
