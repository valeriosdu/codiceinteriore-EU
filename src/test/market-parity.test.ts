// Guardie di parita' multi-mercato.
//
// Il deploy delle edge function non fa type-check e gran parte del backend vive
// in file che `tsc` non vede (gli index.ts importano moduli remoti). Quello che
// il compilatore non copre lo copre questo scanner sul sorgente: legge i file,
// enumera gli object literal e verifica che nessuna mappa per-lingua o
// per-mercato sia rimasta indietro.
//
// Perche' serve: quasi tutte queste mappe hanno un fallback su 'it'. Una voce
// mancante non da errore — produce un report, una mail o un PDF in italiano per
// un cliente che non parla italiano, e nel caso peggiore un addebito sul conto
// Stripe di un altro mercato.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildRoutes } from "@/lib/routes";
import type { Language } from "@/markets";

const FUNCTIONS_DIR = "supabase/functions";

// Mercati e lingue attesi. Allargare queste due liste e' il primo passo di un
// mercato nuovo: da quel momento i test elencano tutto cio' che manca.
const MARKETS = ["it", "es", "us", "nl"] as const;
const LANGUAGES = ["it", "es", "en", "nl"] as const;
const LANG_KEYS = new Set<string>([...MARKETS, ...LANGUAGES]);

const DQ = String.fromCharCode(34);
const SQ = String.fromCharCode(39);
const BT = String.fromCharCode(96);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full.replace(/\\/g, "/"));
  }
  return out;
}

// Sostituisce commenti e contenuto di stringhe/template con spazi, mantenendo
// lunghezza e a capo: cosi' gli offset restano validi e nessun due punti dentro
// una stringa viene scambiato per una chiave.
function blankOutNoise(src: string): string {
  const out = src.split("");
  const n = src.length;
  let i = 0;
  const blank = (from: number, to: number) => {
    for (let k = from; k < to && k < n; k++) if (out[k] !== "\n") out[k] = " ";
  };
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "/" && next === "/") {
      let j = i;
      while (j < n && src[j] !== "\n") j++;
      blank(i, j);
      i = j;
      continue;
    }
    if (c === "/" && next === "*") {
      let j = i + 2;
      while (j < n && !(src[j] === "*" && src[j + 1] === "/")) j++;
      blank(i, j + 2);
      i = j + 2;
      continue;
    }
    if (c === DQ || c === SQ || c === BT) {
      let j = i + 1;
      while (j < n) {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src[j] === c) break;
        j++;
      }
      blank(i + 1, j);
      i = j + 1;
      continue;
    }
    i++;
  }
  return out.join("");
}

type Frame = { keys: Set<string>; line: number };

// Enumera gli object literal e le chiavi di primo livello di ciascuno.
function objectLiterals(src: string): Frame[] {
  const clean = blankOutNoise(src);
  const frames: Frame[] = [];
  const stack: Frame[] = [];
  let line = 1;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === "\n") {
      line++;
      continue;
    }
    if (c === "{") {
      stack.push({ keys: new Set(), line });
      continue;
    }
    if (c === "}") {
      const f = stack.pop();
      if (f) frames.push(f);
      continue;
    }
    if (c === ":" && stack.length > 0) {
      let j = i - 1;
      while (j >= 0 && /\s/.test(clean[j])) j--;
      const end = j + 1;
      if (clean[j] === DQ || clean[j] === SQ) j--;
      while (j >= 0 && /[A-Za-z0-9_$]/.test(clean[j])) j--;
      const raw = clean.slice(j + 1, end).replace(/["']/g, "").trim();
      if (raw) stack[stack.length - 1].keys.add(raw);
    }
  }
  return frames;
}

const backendFiles = walk(FUNCTIONS_DIR);

describe("parita multi-mercato — backend", () => {
  it("ogni mappa per-lingua o per-mercato ha la voce nl", () => {
    const missing: string[] = [];
    for (const file of backendFiles) {
      const src = readFileSync(file, "utf8");
      for (const frame of objectLiterals(src)) {
        const langKeys = [...frame.keys].filter((k) => LANG_KEYS.has(k));
        // Due o piu' chiavi di lingua/mercato nello stesso oggetto: e' una mappa,
        // non una coincidenza. La voce nl deve esserci.
        if (langKeys.length >= 2 && !frame.keys.has("nl")) {
          missing.push(
            file + ":" + frame.line + " — chiavi [" + langKeys.sort().join(", ") + "], manca nl",
          );
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("isMarketId copre ogni mercato, in entrambi i codebase", () => {
    for (const file of ["supabase/functions/_shared/markets.ts", "src/markets/index.ts"]) {
      const src = readFileSync(file, "utf8");
      const from = src.indexOf("isMarketId");
      const guard = src.slice(from, src.indexOf("}", from));
      for (const m of MARKETS) {
        const present = guard.includes(DQ + m + DQ) || guard.includes(SQ + m + SQ);
        expect(present, file + ": isMarketId non riconosce " + m).toBe(true);
      }
    }
  });

  it("le union MarketId e Language coincidono fra frontend e backend", () => {
    const parse = (src: string, name: string) => {
      const m = src.match(new RegExp("export type " + name + " =([^;]+);"));
      if (!m) throw new Error("union " + name + " non trovata");
      return (m[1].match(/['"](\w+)['"]/g) || []).map((s) => s.replace(/['"]/g, "")).sort();
    };
    const be = readFileSync("supabase/functions/_shared/markets.ts", "utf8");
    const fe = readFileSync("src/markets/types.ts", "utf8");
    expect(parse(be, "MarketId")).toEqual(parse(fe, "MarketId"));
    expect(parse(be, "Language")).toEqual(parse(fe, "Language"));
    expect(parse(be, "MarketId")).toEqual([...MARKETS].sort());
    expect(parse(be, "Language")).toEqual([...LANGUAGES].sort());
  });

  it("i secret del blocco nl finiscono tutti in __NL", () => {
    const src = readFileSync("supabase/functions/_shared/markets.ts", "utf8");
    const start = src.indexOf("const NL_MARKET");
    expect(start).toBeGreaterThan(-1);
    const block = src.slice(start, src.indexOf("const MARKETS", start));
    // Solo i nomi di env var (contengono sempre un underscore): esclude valori
    // letterali come "EUR" o "NL".
    const names = (block.match(/"[A-Z][A-Z0-9]*_[A-Z0-9_]+"/g) || []).map((s) => s.replace(/"/g, ""));
    expect(names.length).toBeGreaterThan(15);
    // Un blocco copiato da ES manderebbe gli incassi olandesi sul conto spagnolo.
    expect(names.filter((n) => !n.endsWith("__NL"))).toEqual([]);
  });

  it("support-poll spiega per iscritto i mercati che non interroga", () => {
    const src = readFileSync("supabase/functions/support-poll/index.ts", "utf8");
    const decl = "const MARKETS: MarketId[] = [";
    const at = src.indexOf(decl);
    expect(at).toBeGreaterThan(-1);
    const arr = src.slice(at, src.indexOf("]", at));
    const polled = new Set((arr.match(/"(\w+)"/g) || []).map((s) => s.replace(/"/g, "")));
    const preamble = src.slice(0, at);
    for (const m of MARKETS) {
      if (polled.has(m)) continue;
      // Un mercato puo' restare fuori (casella Zoho condivisa = ticket duplicati),
      // ma il motivo va scritto sopra l'array, non dedotto.
      expect(preamble, "mercato " + m + " escluso dal polling senza spiegazione").toContain(m);
    }
  });

  it("gli switch de-binarizzati non tornano a confronti su un singolo mercato", () => {
    const files = [
      "supabase/functions/_shared/logo.ts",
      "supabase/functions/_shared/email-theme.tsx",
      "supabase/functions/_shared/zoho.ts",
    ];
    for (const file of files) {
      const code = blankOutNoise(readFileSync(file, "utf8"));
      expect(code, file + ": confronto binario su mercato reintrodotto").not.toMatch(
        /===\s*['"](es|us|en|nl)['"]/,
      );
    }
  });
});

describe("parita multi-mercato — slug URL", () => {
  it("gli slug it ed es restano identici a prima del passaggio a tabella", () => {
    // Snapshot congelati: dimostrano che introdurre SLUGS_BY_LANG non ha
    // cambiato una sola URL per i mercati gia' in produzione.
    const atteso = {
      couple: "/coppia",
      coupleQuiz: "/coppia/quiz",
      coupleProcessing: "/coppia/processing",
      coupleTeaser: "/coppia/teaser",
      coupleOffer: "/coppia/offer",
      coupleSuccess: "/coppia/success",
      coupleActivate: "/coppia/activate",
      coupleReportProcessing: "/coppia/report-processing",
      coupleReport: "/coppia/report",
      contact: "/contatti",
      terms: "/termini",
      gift: "/regalo",
      lpClassica: "/lp/classica",
      lpAttivazione: "/lp/attivazione",
    };
    expect({ ...buildRoutes("it") }).toEqual(atteso);
    expect({ ...buildRoutes("es") }).toEqual(atteso);
  });

  it("en e nl hanno slug propri e distinti dagli italiani", () => {
    expect(buildRoutes("en").couple).toBe("/couple");
    expect(buildRoutes("nl").couple).toBe("/koppel");
    expect(buildRoutes("nl").terms).toBe("/voorwaarden");
    expect(buildRoutes("nl").gift).toBe("/cadeau");
    expect(buildRoutes("nl").coupleActivate).toBe("/koppel/activate");
  });

  it("lo script SEO usa esattamente gli stessi slug di routes.ts", () => {
    // La tabella e' duplicata (lo script gira in Node fuori dal bundle Vite):
    // se le due divergono, sitemap e robots.txt puntano a URL che non esistono.
    const src = readFileSync("scripts/generate-seo-files.mjs", "utf8");
    const start = src.indexOf("const SLUGS_BY_MARKET = {");
    expect(start).toBeGreaterThan(-1);
    const blocco = src.slice(start, src.indexOf("const slug =", start));
    const langPerMercato: Record<string, Language> = { it: "it", es: "es", us: "en", nl: "nl" };
    for (const [mercato, lang] of Object.entries(langPerMercato)) {
      const m = blocco.match(new RegExp(mercato + ": \{([^}]*)\}"));
      const atteso = buildRoutes(lang);
      if (!m) {
        // it/es puntano alla costante condivisa SLUGS_IT: verifica quella.
        const it = blocco.match(/SLUGS_IT = \{([^}]*)\}/) || src.match(/const SLUGS_IT = \{([^}]*)\}/);
        expect(it, "mercato " + mercato + " assente dalla tabella slug dello script SEO").not.toBeNull();
        continue;
      }
      for (const chiave of ["lpClassica", "lpAttivazione", "contact", "terms", "gift"] as const) {
        const valore = m[1].match(new RegExp(chiave + ': "([^"]+)"'));
        expect(valore, mercato + "." + chiave + " assente nello script SEO").not.toBeNull();
        expect(valore![1], "slug " + chiave + " divergente per " + mercato).toBe(atteso[chiave]);
      }
    }
  });
});
