// Ponte di type-check verso il backend Deno.
//
// Il deploy delle edge function NON fa type-check e la CLI deno non e'
// disponibile qui, quindi una mappa per-lingua incompleta passerebbe inosservata
// fino al runtime — dove si manifesta come output italiano per un cliente
// olandese. `tsc` pero' segue gli import anche fuori da `include`, quindi
// importare questi moduli da un file sotto src/ li fa entrare nel programma e
// rende i loro Record<PromptLang, ...> / Record<Language, ...> errori duri.
//
// Vincolo: qui possono entrare SOLO moduli senza import remoti (https://esm.sh)
// e senza side effect di rete. `markets.ts` legge Deno.env a module scope: lo
// stub e' in src/test/setup.ts, che vitest carica prima dei file di test.
import { describe, it, expect } from "vitest";

import {
  OUTPUT_LANGUAGE_NAME,
  outputLanguageDirective,
  planetName,
  aspectName,
  resolvePromptLang,
  salienceLabels,
  type PromptLang,
} from "../../supabase/functions/_shared/prompts/lang.ts";
import {
  REPORT_SECTION_TITLES,
  REPORT_PDF_STRINGS,
  TRANSIT_PDF_STRINGS,
  SYNASTRY_PDF_STRINGS,
} from "../../supabase/functions/_shared/pdf-i18n.ts";
import { supportSystemPrompt } from "../../supabase/functions/_shared/prompts/support.ts";
import { getArchetypeLabel } from "../../supabase/functions/_shared/synastry-archetypes.ts";
import { docNoun, getMarket, isMarketId } from "../../supabase/functions/_shared/markets.ts";
import { unknownTimeDeclaration } from "../../supabase/functions/_shared/synastry-system-prompt.ts";

const LANGS: PromptLang[] = ["it", "es", "en", "nl", "fi"];

describe("backend: lingue supportate", () => {
  it("resolvePromptLang riconosce ogni lingua (non degrada su 'it')", () => {
    for (const lang of LANGS) expect(resolvePromptLang(lang)).toBe(lang);
    expect(resolvePromptLang("zz")).toBe("it");
    expect(resolvePromptLang(null)).toBe("it");
  });

  it("le mappe dei prompt coprono ogni lingua", () => {
    for (const lang of LANGS) {
      expect(OUTPUT_LANGUAGE_NAME[lang]).toBeTruthy();
      expect(outputLanguageDirective(lang)).toContain(OUTPUT_LANGUAGE_NAME[lang]);
      expect(planetName(lang, "sun")).toBeTruthy();
      expect(aspectName(lang, "trine")).toBeTruthy();
      expect(salienceLabels(lang).angularPlanets).toBeTruthy();
      expect(supportSystemPrompt(lang, "Carta Interior")).toBeTruthy();
      expect(getArchetypeLabel("soulmates", lang)).toBeTruthy();
    }
  });

  it("i nomi dei pianeti e degli aspetti sono tradotti, non ereditati", () => {
    // Il fallback di planetName capitalizza la chiave inglese: se la voce nl
    // mancasse, "sun" diventerebbe "Sun" e nessun tipo se ne accorgerebbe.
    expect(planetName("nl", "sun")).toBe("Zon");
    expect(planetName("nl", "moon")).toBe("Maan");
    expect(aspectName("nl", "square")).toBe("vierkant");
    expect(planetName("fi", "sun")).toBe("Aurinko");
    expect(planetName("fi", "moon")).toBe("Kuu");
    expect(aspectName("fi", "square")).toBe("neliö");
  });

  it("la direttiva finlandese impone il sinä e vieta il lessico spirituale", () => {
    const d = outputLanguageDirective("fi");
    expect(d).toContain("Finnish");
    expect(d).toMatch(/sinä/);
    for (const w of ["sielu", "kohtalo", "taivas", "pyhä", "henkinen"]) expect(d).toContain(w);
    // Le direttive esistenti non cambiano di un byte.
    expect(outputLanguageDirective("it")).not.toMatch(/sinä/);
  });

  it("la frase sull'ora di nascita ignota esiste in ogni lingua, anche per entrambi", () => {
    for (const lang of LANGS) {
      const name = OUTPUT_LANGUAGE_NAME[lang];
      expect(unknownTimeDeclaration(name, "Aino")).toContain("Aino");
      // Con entrambi gli orari ignoti la parola italiana non deve finire
      // dentro le altre lingue ("Without entrambi's exact birth time").
      if (lang !== "it") expect(unknownTimeDeclaration(name, null)).not.toMatch(/entramb/);
    }
    expect(unknownTimeDeclaration("Finnish", "Aino")).toMatch(/henkilön Aino/);
  });

  it("le mappe dei PDF coprono ogni lingua", () => {
    for (const lang of LANGS) {
      expect(Object.keys(REPORT_SECTION_TITLES[lang].classica).length).toBeGreaterThan(0);
      expect(Object.keys(REPORT_SECTION_TITLES[lang].attivazione).length).toBeGreaterThan(0);
      expect(REPORT_PDF_STRINGS[lang].closingParagraphs.length).toBeGreaterThan(0);
      expect(TRANSIT_PDF_STRINGS[lang].dialogueParagraphs.length).toBeGreaterThan(0);
      expect(SYNASTRY_PDF_STRINGS[lang].closingParagraphs.length).toBeGreaterThan(0);
    }
  });

  it("docNoun e getMarket conoscono il mercato olandese", () => {
    expect(isMarketId("nl")).toBe(true);
    expect(getMarket("nl").id).toBe("nl");
    expect(getMarket("nl").language).toBe("nl");
    expect(getMarket("nl").currency).toBe("EUR");
    expect(docNoun("nl", "couple")).toBe("koppel");
    expect(docNoun("nl", "transits")).toBe("transits");
  });

  it("docNoun e getMarket conoscono il mercato finlandese", () => {
    expect(isMarketId("fi")).toBe(true);
    expect(getMarket("fi").id).toBe("fi");
    expect(getMarket("fi").language).toBe("fi");
    expect(getMarket("fi").currency).toBe("EUR");
    expect(getMarket("fi").siteUrl).toBe("https://fi.cartainterior.com");
    expect(docNoun("fi", "couple")).toBe("pari");
  });

  it.each([["nl", "__NL", "__NL"], ["fi", "__FI", "__ES"]] as const)(
    "i secret del mercato %s: prezzi e Meta propri, credenziali dell'account giusto",
    (id, own, account) => {
      const m = getMarket(id);
      // fi condivide l'account Stripe/PayPal di es: le credenziali di account
      // sono le __ES, i prezzi (prodotti finlandesi) e Meta restano __FI.
      const ownNames = [...Object.values(m.stripe.priceEnv), m.metaPixelIdEnv, m.metaAccessTokenEnv];
      const accountNames = [m.stripe.secretKeyEnv, m.stripe.secretKeyTestEnv, m.paypal.clientIdEnv, m.paypal.clientSecretEnv, m.paypal.envEnv];
      for (const name of ownNames) expect(name.endsWith(own)).toBe(true);
      for (const name of accountNames) expect(name.endsWith(account)).toBe(true);
    },
  );
});
