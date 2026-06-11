// Helper per costruire la frase italiana compatta di un singolo aspetto
// di sinastria. L'output viene poi inserito nel brief passato a Gemini.
// Output target: "{pianeta A} {aspetto} {pianeta B} [tag1/tag2/...]: {micro-descrizione}"

export const PLANET_IT: Record<string, string> = {
  sun: "Sole",
  moon: "Luna",
  mercury: "Mercurio",
  venus: "Venere",
  mars: "Marte",
  jupiter: "Giove",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Nettuno",
  pluto: "Plutone",
  asc: "Ascendente",
  mc: "Medio Cielo",
  dsc: "Discendente",
  ic: "Fondo Cielo",
  true_node: "Nodo Nord",
  mean_node: "Nodo Nord",
  node: "Nodo Nord",
  chiron: "Chirone",
  lilith: "Lilith",
  vertex: "Vertex",
};

export const ASPECT_IT: Record<string, string> = {
  conjunction: "congiunzione a",
  opposition: "opposizione a",
  trine: "trigono a",
  square: "quadrato a",
  sextile: "sestile a",
  quincunx: "quinconce a",
  semisextile: "semisestile a",
  semisquare: "semiquadrato a",
  sesquisquare: "sesquiquadrato a",
};

export const POLARITY_IT: Record<string, string> = {
  supportive: "supportivo",
  challenging: "sfidante",
  mixed: "ambivalente",
};

export const STRENGTH_IT: Record<string, string> = {
  very_strong: "molto_forte",
  strong: "forte",
  moderate: "moderato",
  weak: "debole",
  very_weak: "molto_debole",
};

const MICRO_DESC_BY_THEME: Record<string, string> = {
  power: "tema di potere e intensita",
  intensity: "carica trasformativa",
  excitement: "scossa di novita",
  freedom: "spinta verso lo spazio individuale",
  structure: "tema di struttura e ruolo",
  commitment: "vincolo, impegno, scelta",
  wisdom: "scambio di saggezza",
  adventure: "voglia di esplorare insieme",
  spirituality: "vibrazione spirituale",
  idealism: "ideali che si attraggono",
  general_compatibility: "intesa di base",
  emotional: "registro emotivo",
  stability: "ancoraggio nel tempo",
  general: "tessuto comune",
};

const MICRO_DESC_BY_PAIR: Record<string, string> = {
  "sun-moon": "matrimonio dell'anima",
  "moon-sun": "matrimonio dell'anima",
  "venus-mars": "chimica fisica e desiderio",
  "mars-venus": "chimica fisica e desiderio",
  "venus-saturn": "amore che chiede maturazione",
  "saturn-venus": "amore che chiede maturazione",
  "sun-saturn": "ruolo paterno o lezione di autorita",
  "saturn-sun": "ruolo paterno o lezione di autorita",
  "moon-saturn": "lezione emotiva, contenimento",
  "saturn-moon": "lezione emotiva, contenimento",
  "venus-pluto": "amore trasformativo",
  "pluto-venus": "amore trasformativo",
  "mars-pluto": "intensita di volonta e desiderio",
  "pluto-mars": "intensita di volonta e desiderio",
  "moon-pluto": "profondita emotiva senza filtri",
  "pluto-moon": "profondita emotiva senza filtri",
  "sun-pluto": "trasformazione dell'identita",
  "pluto-sun": "trasformazione dell'identita",
  "mercury-mercury": "lingua comune o dialogo che cerca traduzione",
  "moon-moon": "ritmo emotivo condiviso o da accordare",
  "venus-venus": "estetica e modi di amare a confronto",
  "mars-mars": "stili di azione che si chiamano",
  "sun-venus": "calore e affetto",
  "venus-sun": "calore e affetto",
  "moon-venus": "tenerezza e cura",
  "venus-moon": "tenerezza e cura",
  "mercury-venus": "parole d'amore",
  "venus-mercury": "parole d'amore",
  "sun-mars": "energia e iniziativa",
  "mars-sun": "energia e iniziativa",
  "jupiter-venus": "espansione gioiosa",
  "venus-jupiter": "espansione gioiosa",
  "saturn-saturn": "tema generazionale di struttura",
  "node-sun": "incontro che porta destino",
  "sun-node": "incontro che porta destino",
  "node-moon": "famiglia karmica",
  "moon-node": "famiglia karmica",
  "node-venus": "amore che porta destino",
  "venus-node": "amore che porta destino",
  "chiron-venus": "ferita d'amore guarita insieme",
  "venus-chiron": "ferita d'amore guarita insieme",
  "lilith-mars": "ombra sessuale che si attiva",
  "mars-lilith": "ombra sessuale che si attiva",
  "vertex-venus": "incontro fatato",
  "venus-vertex": "incontro fatato",
};

function pickMicroDesc(p1: string, p2: string, themes: string[]): string {
  const a = `${p1}-${p2}`;
  if (MICRO_DESC_BY_PAIR[a]) return MICRO_DESC_BY_PAIR[a];
  const b = `${p2}-${p1}`;
  if (MICRO_DESC_BY_PAIR[b]) return MICRO_DESC_BY_PAIR[b];
  for (const t of themes) {
    if (MICRO_DESC_BY_THEME[t]) return MICRO_DESC_BY_THEME[t];
  }
  return "contatto significativo";
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
  const tagApplying = asp.applying === true ? "applicativo" : asp.applying === false ? "separativo" : "";
  const tagConf =
    typeof asp.polarity_confidence === "number"
      ? `conf:${asp.polarity_confidence.toFixed(1)}`
      : "";

  const tags = [tagStrength, tagPolarity, tagCategories, tagThemes, tagApplying, tagConf]
    .filter((t) => t.length > 0)
    .join("/");

  const micro = pickMicroDesc(asp.a_point, asp.b_point, themes);

  return `${planetA} di ${personANameShort} ${aspectIt} ${planetB} di ${personBNameShort} [${tags}]: ${micro}`;
}
