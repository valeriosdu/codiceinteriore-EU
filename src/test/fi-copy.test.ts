// Guardie sulla copy finlandese, sul modello di nl-copy.test.ts.
//
// Il compilatore garantisce che le CHIAVI del catalogo fi siano complete, non
// che i VALORI siano davvero in finlandese. Il catalogo e' nato come copia di
// quello inglese: il residuo piu' probabile e' quindi l'inglese, poi l'italiano.
// In piu' il lessico che il brand esclude in Finlandia (sielu, kohtalo, taivas,
// pyhä, henkinen) e i segnaposto di interpolazione.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const FI_DIR = "src/i18n/fi";
const IT_DIR = "src/i18n/it";
const LEGAL = ["src/pages/legal/PrivacyPolicy.fi.tsx", "src/pages/legal/Terms.fi.tsx"];

const catalog = readdirSync(FI_DIR)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => join(FI_DIR, f));

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((l) => l.replace(/(^|\s)\/\/.*$/, "$1"))
    .join("\n");
}

// Testo fra apici nel catalogo; nelle pagine legali anche il testo JSX fra tag.
function texts(file: string): Array<[number, string]> {
  const out: Array<[number, string]> = [];
  stripComments(readFileSync(file, "utf8"))
    .split(/\r?\n/)
    .forEach((riga, i) => {
      const parti: string[] = riga.match(/'[^']*'|"[^"]*"|`[^`]*`/g) || [];
      if (file.endsWith(".tsx")) {
        const jsx = riga.replace(/<[^>]*>/g, " ").replace(/\{[^}]*\}/g, " ").trim();
        if (jsx && !/^[\s;(){}[\],]*$/.test(jsx) && !/^(import|export|const|return)\b/.test(jsx)) parti.push(jsx);
      }
      for (const p of parti) out.push([i + 1, p]);
    });
  return out;
}

describe("copy finlandese", () => {
  it("non contiene parole funzione inglesi, italiane o spagnole", () => {
    // Solo parole che non esistono in finlandese. "en" (= non) e' finlandese.
    const spie = [
      "the", "and", "your", "you", "with", "this", "that", "for", "from", "are", "will",
      "il", "della", "che", "sono", "perché", "anche",
      "el", "los", "las", "que", "para", "pero", "porque",
      "het", "een", "jouw", "je",
    ];
    const re = new RegExp(`(^|[^\\p{L}])(${spie.join("|")})([^\\p{L}]|$)`, "iu");
    const trovati: string[] = [];
    for (const f of [...catalog, ...LEGAL]) {
      for (const [riga, s] of texts(f)) {
        if (/^['"`]?(https?:|mailto:|\/|[a-z-]+\.[a-z]{2,}|@\/)/.test(s)) continue;
        const m = s.match(re);
        if (m) trovati.push(`${f}:${riga} — "${m[2]}" in ${s.slice(0, 70)}`);
      }
    }
    expect(trovati).toEqual([]);
  });

  it("non usa il lessico spirituale escluso dal brand", () => {
    const vietate = /sielu|kohtalo|taiva|pyhä|pyhi|henkinen|henkis/iu;
    const trovati: string[] = [];
    for (const f of [...catalog, ...LEGAL]) {
      for (const [riga, s] of texts(f)) {
        if (vietate.test(s)) trovati.push(`${f}:${riga} — ${s.slice(0, 80)}`);
      }
    }
    expect(trovati).toEqual([]);
  });

  it("non contiene lettere accentate estranee al finlandese", () => {
    const vietate = /[àìòùáíóúñâêîôûèéëïü¿¡]/;
    const trovati: string[] = [];
    for (const f of catalog) {
      for (const [riga, s] of texts(f)) {
        if (vietate.test(s)) trovati.push(`${f}:${riga} — ${s.slice(0, 80)}`);
      }
    }
    expect(trovati).toEqual([]);
  });

  it("non perde i segnaposto di interpolazione presenti nell'italiano", () => {
    const ids = (src: string) =>
      new Set(
        (src.match(/\$\{\s*([A-Za-z_$][\w$]*)/g) || [])
          .map((s) => s.replace(/\$\{\s*/, ""))
          // `this.months` nei formatter di data: non e' un segnaposto di copy.
          .filter((id) => id !== "this"),
      );
    const mancanti: string[] = [];
    for (const f of readdirSync(IT_DIR).filter((x) => x.endsWith(".ts") && x !== "index.ts")) {
      const itIds = ids(stripComments(readFileSync(join(IT_DIR, f), "utf8")));
      const fiIds = ids(stripComments(readFileSync(join(FI_DIR, f), "utf8")));
      for (const id of itIds) if (!fiIds.has(id)) mancanti.push(`${f}: manca \${${id}}`);
    }
    expect(mancanti).toEqual([]);
  });

  it("ha esattamente gli stessi moduli dell'italiano", () => {
    const itFiles = readdirSync(IT_DIR).filter((f) => f.endsWith(".ts")).sort();
    expect(readdirSync(FI_DIR).filter((f) => f.endsWith(".ts")).sort()).toEqual(itFiles);
  });
});
