// Helper to build the compact one-line label of a single synastry aspect.
// The output feeds the brief passed to the LLM. Labels are kept in ENGLISH
// (neutral): the output language of the reading is set by outputLanguageDirective
// in the prompt, so the model renders it/es from these English data labels.
// Output shape: "{planet A} {aspect} {planet B} [tag1/tag2/...]: {micro-description}"

export const PLANET_IT: Record<string, string> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptune",
  pluto: "Pluto",
  asc: "Ascendant",
  mc: "Midheaven",
  dsc: "Descendant",
  ic: "Imum Coeli",
  true_node: "North Node",
  mean_node: "North Node",
  node: "North Node",
  chiron: "Chiron",
  lilith: "Lilith",
  vertex: "Vertex",
};

export const ASPECT_IT: Record<string, string> = {
  conjunction: "conjunction to",
  opposition: "opposition to",
  trine: "trine to",
  square: "square to",
  sextile: "sextile to",
  quincunx: "quincunx to",
  semisextile: "semisextile to",
  semisquare: "semisquare to",
  sesquisquare: "sesquisquare to",
};

export const POLARITY_IT: Record<string, string> = {
  supportive: "supportive",
  challenging: "challenging",
  mixed: "mixed",
};

export const STRENGTH_IT: Record<string, string> = {
  very_strong: "very_strong",
  strong: "strong",
  moderate: "moderate",
  weak: "weak",
  very_weak: "very_weak",
};

const MICRO_DESC_BY_THEME: Record<string, string> = {
  power: "a theme of power and intensity",
  intensity: "a transformative charge",
  excitement: "a jolt of novelty",
  freedom: "a push toward individual space",
  structure: "a theme of structure and roles",
  commitment: "bond, commitment, choice",
  wisdom: "an exchange of wisdom",
  adventure: "a wish to explore together",
  spirituality: "a spiritual undertone",
  idealism: "ideals that attract each other",
  general_compatibility: "a baseline rapport",
  emotional: "an emotional register",
  stability: "an anchoring over time",
  general: "common ground",
};

const MICRO_DESC_BY_PAIR: Record<string, string> = {
  "sun-moon": "soul marriage",
  "moon-sun": "soul marriage",
  "venus-mars": "physical chemistry and desire",
  "mars-venus": "physical chemistry and desire",
  "venus-saturn": "love that asks for maturation",
  "saturn-venus": "love that asks for maturation",
  "sun-saturn": "a paternal role or a lesson in authority",
  "saturn-sun": "a paternal role or a lesson in authority",
  "moon-saturn": "an emotional lesson, containment",
  "saturn-moon": "an emotional lesson, containment",
  "venus-pluto": "transformative love",
  "pluto-venus": "transformative love",
  "mars-pluto": "intensity of will and desire",
  "pluto-mars": "intensity of will and desire",
  "moon-pluto": "unfiltered emotional depth",
  "pluto-moon": "unfiltered emotional depth",
  "sun-pluto": "transformation of identity",
  "pluto-sun": "transformation of identity",
  "mercury-mercury": "a shared language, or a dialogue that seeks translation",
  "moon-moon": "a shared emotional rhythm, or one to be tuned",
  "venus-venus": "aesthetics and ways of loving compared",
  "mars-mars": "styles of action that call to each other",
  "sun-venus": "warmth and affection",
  "venus-sun": "warmth and affection",
  "moon-venus": "tenderness and care",
  "venus-moon": "tenderness and care",
  "mercury-venus": "words of love",
  "venus-mercury": "words of love",
  "sun-mars": "energy and initiative",
  "mars-sun": "energy and initiative",
  "jupiter-venus": "joyful expansion",
  "venus-jupiter": "joyful expansion",
  "saturn-saturn": "a generational theme of structure",
  "node-sun": "a meeting that carries destiny",
  "sun-node": "a meeting that carries destiny",
  "node-moon": "a karmic family",
  "moon-node": "a karmic family",
  "node-venus": "love that carries destiny",
  "venus-node": "love that carries destiny",
  "chiron-venus": "a wound in love healed together",
  "venus-chiron": "a wound in love healed together",
  "lilith-mars": "a sexual shadow that gets activated",
  "mars-lilith": "a sexual shadow that gets activated",
  "vertex-venus": "a fated encounter",
  "venus-vertex": "a fated encounter",
};

function pickMicroDesc(p1: string, p2: string, themes: string[]): string {
  const a = `${p1}-${p2}`;
  if (MICRO_DESC_BY_PAIR[a]) return MICRO_DESC_BY_PAIR[a];
  const b = `${p2}-${p1}`;
  if (MICRO_DESC_BY_PAIR[b]) return MICRO_DESC_BY_PAIR[b];
  for (const t of themes) {
    if (MICRO_DESC_BY_THEME[t]) return MICRO_DESC_BY_THEME[t];
  }
  return "a significant contact";
}

export interface AspectInput {
  a_point: string;
  b_point: string;
  aspect: string;
  polarity?: string;
  strength_label?: string;
  categories?: string[];
  themes?: string[];
  applying?: boolean;
  polarity_confidence?: number;
}

export function formatAspectForBrief(
  asp: AspectInput,
  personANameShort: string,
  personBNameShort: string,
): string {
  const planetA = PLANET_IT[asp.a_point] ?? asp.a_point;
  const planetB = PLANET_IT[asp.b_point] ?? asp.b_point;
  const aspectIt = ASPECT_IT[asp.aspect] ?? asp.aspect;
  const themes = asp.themes ?? [];

  const tagStrength = STRENGTH_IT[asp.strength_label ?? ""] ?? asp.strength_label ?? "";
  const tagPolarity = POLARITY_IT[asp.polarity ?? ""] ?? asp.polarity ?? "";
  const tagCategories = (asp.categories ?? []).join("+") || "general";
  const tagThemes = themes.length > 0 ? themes.join("+") : "general";
  const tagApplying = asp.applying === true ? "applying" : asp.applying === false ? "separating" : "";
  const tagConf =
    typeof asp.polarity_confidence === "number"
      ? `conf:${asp.polarity_confidence.toFixed(1)}`
      : "";

  const tags = [tagStrength, tagPolarity, tagCategories, tagThemes, tagApplying, tagConf]
    .filter((t) => t.length > 0)
    .join("/");

  const micro = pickMicroDesc(asp.a_point, asp.b_point, themes);

  return `${planetA} of ${personANameShort} ${aspectIt} ${planetB} of ${personBNameShort} [${tags}]: ${micro}`;
}
