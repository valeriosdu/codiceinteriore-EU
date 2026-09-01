// Guardie sulla copy olandese.
//
// Il compilatore garantisce che le CHIAVI del catalogo nl siano complete, non
// che i VALORI siano davvero in olandese: una riga lasciata in italiano o in
// spagnolo compila benissimo. Questi controlli leggono i sorgenti e cercano
// esattamente quel tipo di residuo, più le due cose che il tipo non vede:
// il registro (je/jij, mai u/uw) e i segnaposto di interpolazione.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const NL_DIR = "src/i18n/nl";
const IT_DIR = "src/i18n/it";

const files = readdirSync(NL_DIR).filter((f) => f.endsWith(".ts"));

// Toglie i commenti: sono in italiano per scelta e non devono far scattare
// nulla. Non tocca le stringhe, che sono proprio ciò che vogliamo controllare.
function stripComments(src: string): string {
  return src
    // Le sequenze di escape unicode non sono testo leggibile: la u di una
    // sequenza escapata non e' la forma di cortesia.
    .replace(new RegExp(String.fromCharCode(92) + String.fromCharCode(92) + "u[0-9a-fA-F]{4}", "g"), "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((l) => l.replace(/(^|\s)\/\/.*$/, "$1"))
    .join("\n");
}

describe("copy olandese", () => {
  it("non contiene lettere accentate estranee all'olandese", () => {
    // L'olandese usa é ë ï ö ü (één, ideeën, ruïne). NON usa à ì ò ù á í ó ú ñ
    // né i punti interrogativi/esclamativi rovesciati: se compaiono, è italiano
    // o spagnolo rimasto dentro.
    const vietate = /[àìòùáíóúñâêîôûÀÌÒÙÁÍÓÚÑ¿¡]/;
    const trovati: string[] = [];
    for (const f of files) {
      const righe = stripComments(readFileSync(join(NL_DIR, f), "utf8")).split(/\r?\n/);
      righe.forEach((riga, i) => {
        if (vietate.test(riga)) trovati.push(`${NL_DIR}/${f}:${i + 1} — ${riga.trim().slice(0, 90)}`);
      });
    }
    expect(trovati).toEqual([]);
  });

  it("non contiene parole funzione italiane o spagnole", () => {
    // Solo parole che NON esistono in olandese: "per", "los", "in", "over" e
    // simili sono olandesi legittimi e restano fuori dalla lista.
    const spie = [
      "il", "lo", "gli", "della", "delle", "degli", "dalla", "nella", "che", "questo",
      "questa", "sono", "tuo", "tua", "nostro", "però", "quando", "perché", "anche",
      "el", "las", "una", "que", "para", "este", "esta", "pero", "cuando",
      "porque", "tus", "sus", "más", "muy", "como", "todo",
    ];
    const re = new RegExp(`(^|[^\\p{L}])(${spie.join("|")})([^\\p{L}]|$)`, "iu");
    const trovati: string[] = [];
    for (const f of files) {
      const righe = stripComments(readFileSync(join(NL_DIR, f), "utf8")).split(/\r?\n/);
      righe.forEach((riga, i) => {
        // Salta gli identificatori di codice: interessa solo il testo fra apici.
        const stringhe = riga.match(/'[^']*'|"[^"]*"|`[^`]*`/g) || [];
        for (const s of stringhe) {
          const m = s.match(re);
          if (m) trovati.push(`${NL_DIR}/${f}:${i + 1} — "${m[2]}" in ${s.slice(0, 70)}`);
        }
      });
    }
    expect(trovati).toEqual([]);
  });

  it("usa sempre il registro informale, mai u/uw", () => {
    const trovati: string[] = [];
    for (const f of files) {
      const righe = stripComments(readFileSync(join(NL_DIR, f), "utf8")).split(/\r?\n/);
      righe.forEach((riga, i) => {
        const stringhe = riga.match(/'[^']*'|"[^"]*"|`[^`]*`/g) || [];
        for (const s of stringhe) {
          if (/(^|[^\p{L}])(u|uw|Uw)([^\p{L}]|$)/u.test(s)) {
            trovati.push(`${NL_DIR}/${f}:${i + 1} — ${s.slice(0, 80)}`);
          }
        }
      });
    }
    expect(trovati).toEqual([]);
  });

  it("non perde i segnaposto di interpolazione presenti nell'italiano", () => {
    // Se una funzione riceve `name` e la traduzione dimentica ${name}, il
    // cliente legge una frase generica al posto del proprio nome.
    const ids = (src: string) =>
      new Set(
        (src.match(/\$\{\s*([A-Za-z_$][\w$]*)/g) || []).map((s) =>
          s.replace(/\$\{\s*/, ""),
        ),
      );
    const mancanti: string[] = [];
    for (const f of files) {
      if (f === "index.ts") continue;
      const itIds = ids(stripComments(readFileSync(join(IT_DIR, f), "utf8")));
      const nlIds = ids(stripComments(readFileSync(join(NL_DIR, f), "utf8")));
      for (const id of itIds) {
        if (!nlIds.has(id)) mancanti.push(`${f}: manca \${${id}}`);
      }
    }
    expect(mancanti).toEqual([]);
  });

  it("ha esattamente gli stessi moduli dell'italiano", () => {
    const itFiles = readdirSync(IT_DIR).filter((f) => f.endsWith(".ts")).sort();
    expect(files.slice().sort()).toEqual(itFiles);
  });
});
