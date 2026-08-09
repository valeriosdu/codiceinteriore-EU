// Helper di lingua per i prompt Gemini. I prompt restano scritti in inglese
// (istruzioni/struttura): cambia solo la lingua di OUTPUT e i nomi astrologici
// usati nel user-prompt. Una direttiva esplicita in cima al system prompt
// forza il modello a produrre tutto nella lingua del mercato, trattando
// eventuali parole/etichette italiane nel prompt come solo illustrative.

export type PromptLang = "it" | "es" | "en";

export function resolvePromptLang(value: unknown): PromptLang {
  if (value === "es") return "es";
  if (value === "en") return "en";
  return "it";
}

// Nome lingua usato nelle istruzioni inglesi ("write in ${X}").
export const OUTPUT_LANGUAGE_NAME: Record<PromptLang, string> = {
  it: "Italian",
  es: "Spanish",
  en: "English",
};

// Direttiva da anteporre a un system prompt per blindare la lingua di output.
export function outputLanguageDirective(lang: PromptLang): string {
  const name = OUTPUT_LANGUAGE_NAME[lang];
  return `OUTPUT LANGUAGE — HIGHEST PRIORITY
Write ALL output strictly and only in ${name} (${lang === "es" ? "es-ES, Spanish from Spain" : lang === "en" ? "en-US, English (United States)" : "it-IT"}).
Any Italian word, label, or example shown later in this prompt is illustrative of intent ONLY — never copy it; always produce the equivalent in ${name}. Grammatical gender agreement must follow ${name}.

`;
}

const PLANET_NAMES: Record<PromptLang, Record<string, string>> = {
  it: {
    sun: "Sole", moon: "Luna", mercury: "Mercurio", venus: "Venere",
    mars: "Marte", jupiter: "Giove", saturn: "Saturno", uranus: "Urano",
    neptune: "Nettuno", pluto: "Plutone", chiron: "Chirone", lilith: "Lilith",
  },
  es: {
    sun: "Sol", moon: "Luna", mercury: "Mercurio", venus: "Venus",
    mars: "Marte", jupiter: "Júpiter", saturn: "Saturno", uranus: "Urano",
    neptune: "Neptuno", pluto: "Plutón", chiron: "Quirón", lilith: "Lilith",
  },
  en: {
    sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus",
    mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus",
    neptune: "Neptune", pluto: "Pluto", chiron: "Chiron", lilith: "Lilith",
  },
};

const ASPECT_NAMES: Record<PromptLang, Record<string, string>> = {
  it: {
    conjunction: "congiunto", opposition: "opposto", square: "quadrato",
    trine: "trigono", sextile: "sestile",
  },
  es: {
    conjunction: "conjunto", opposition: "opuesto", square: "cuadrado",
    trine: "trígono", sextile: "sextil",
  },
  en: {
    conjunction: "conjunct", opposition: "opposite", square: "square",
    trine: "trine", sextile: "sextile",
  },
};

const SALIENCE_LABELS: Record<PromptLang, {
  header: string;
  angularPlanets: string;
  planetsOnAxes: string;
  keyAspects: string;
  retrogradePersonal: string;
}> = {
  it: {
    header: "PRIORITY MARKERS (calcolati dalla carta — usa SEMPRE in interpretazione):",
    angularPlanets: "Pianeti angolari",
    planetsOnAxes: "Pianeti su assi (orb<=8°)",
    keyAspects: "Aspetti chiave",
    retrogradePersonal: "Retrogradazioni personali",
  },
  es: {
    header: "PRIORITY MARKERS (calculados a partir de la carta — usar SIEMPRE en la interpretación):",
    angularPlanets: "Planetas angulares",
    planetsOnAxes: "Planetas en ejes (orbe<=8°)",
    keyAspects: "Aspectos clave",
    retrogradePersonal: "Retrogradaciones personales",
  },
  en: {
    header: "PRIORITY MARKERS (computed from the chart — ALWAYS use in the interpretation):",
    angularPlanets: "Angular planets",
    planetsOnAxes: "Planets on axes (orb<=8°)",
    keyAspects: "Key aspects",
    retrogradePersonal: "Personal retrogrades",
  },
};

export function salienceLabels(lang: PromptLang) {
  return SALIENCE_LABELS[lang];
}

// Ordine dei componenti data per lingua: en usa MM/DD/YYYY (en-US), it/es DD/MM/YYYY.
// I chiamanti passano i componenti già formattati (padding a loro scelta) così il
// comportamento it/es resta identico byte-per-byte; cambia solo l'ordine per en.
export function orderDateParts(
  lang: PromptLang,
  day: string,
  month: string,
  year: string,
): string {
  return lang === "en" ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

export function planetName(lang: PromptLang, en: string): string {
  return PLANET_NAMES[lang][en] || (en ? en[0].toUpperCase() + en.slice(1) : en);
}

export function aspectName(lang: PromptLang, en: string): string {
  return ASPECT_NAMES[lang][en] || en;
}
