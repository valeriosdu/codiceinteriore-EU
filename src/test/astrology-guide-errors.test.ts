import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Il backend Deno non è importabile da qui, quindi la corrispondenza fra i
// codici che emette e quelli che il pannello sa tradurre si verifica sul
// sorgente. La deriva che questo test previene: qualcuno aggiunge un ramo di
// errore alla edge function, il frontend non lo riconosce e il cliente si
// ritrova un toast generico (o, prima di questa correzione, inglese).
const root = resolve(__dirname, "../..");
const backend = readFileSync(
  resolve(root, "supabase/functions/submit-astrology-question/index.ts"),
  "utf-8",
);
const context = readFileSync(
  resolve(root, "src/components/astrology-guide/AstrologyGuideContext.tsx"),
  "utf-8",
);

// Codici che restano volutamente sul messaggio generico: non descrivono nulla
// che il cliente possa correggere (un bug nostro o un guasto del server).
const INTENTIONALLY_GENERIC = new Set(["missing_session", "server_error"]);

const backendCodes = [...backend.matchAll(/code:\s*"([a-z_]+)"/g)].map((m) => m[1]);

describe("codici di errore della guida astrologica", () => {
  it("la edge function ne emette almeno uno per ogni ramo di uscita", () => {
    expect(backendCodes.length).toBeGreaterThanOrEqual(9);
    expect(new Set(backendCodes).size).toBe(backendCodes.length);
  });

  it("ogni codice è tradotto dal pannello o dichiarato genericamente", () => {
    const untranslated = [...new Set(backendCodes)].filter(
      (code) => !INTENTIONALLY_GENERIC.has(code) && !context.includes(code),
    );
    expect(untranslated).toEqual([]);
  });

  it("nessun codice dichiarato generico è in realtà tradotto (lista aggiornata)", () => {
    const stale = [...INTENTIONALLY_GENERIC].filter(
      (code) => !backendCodes.includes(code) || context.includes(code),
    );
    expect(stale).toEqual([]);
  });

  it("il pannello non mostra più il messaggio grezzo del backend", () => {
    expect(context).not.toMatch(/toast\.error\(message\)/);
    expect(context).not.toMatch(/e instanceof Error \? e\.message/);
  });
});

describe("ritorno dal feedback via email", () => {
  const feedbackFn = readFileSync(
    resolve(root, "supabase/functions/astrology-guide-feedback/index.ts"),
    "utf-8",
  );

  it("il parametro su cui rimanda la funzione è quello che la pagina legge", () => {
    const reportPage = readFileSync(resolve(root, "src/pages/Report.tsx"), "utf-8");
    expect(feedbackFn).toContain("guideFeedback=");
    expect(reportPage).toContain('params.get("guideFeedback")');
  });

  it("la conferma sta fuori dal provider della Guida, che non monta senza sessione", () => {
    expect(context).not.toContain("guideFeedback");
  });
});
