// Helper di lingua per i prompt Gemini. I prompt restano scritti in inglese
// (istruzioni/struttura): cambia solo la lingua di OUTPUT e i nomi astrologici
// usati nel user-prompt. Una direttiva esplicita in cima al system prompt
// forza il modello a produrre tutto nella lingua del mercato, trattando
// eventuali parole/etichette italiane nel prompt come solo illustrative.

export type PromptLang = "it" | "es";

export function resolvePromptLang(value: unknown): PromptLang {
  return value === "es" ? "es" : "it";
}

// Nome lingua usato nelle istruzioni inglesi ("write in ${X}").
export const OUTPUT_LANGUAGE_NAME: Record<PromptLang, string> = {
  it: "Italian",
  es: "Spanish",
};

// Direttiva da anteporre a un system prompt per blindare la lingua di output.
export function outputLanguageDirective(lang: PromptLang): string {
  const name = OUTPUT_LANGUAGE_NAME[lang];
  return `OUTPUT LANGUAGE — HIGHEST PRIORITY
Write ALL output strictly and only in ${name} (${lang === "es" ? "es-ES, Spanish from Spain" : "it-IT"}).
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
};

export function planetName(lang: PromptLang, en: string): string {
  return PLANET_NAMES[lang][en] || (en ? en[0].toUpperCase() + en.slice(1) : en);
}

export function aspectName(lang: PromptLang, en: string): string {
  return ASPECT_NAMES[lang][en] || en;
}
