// Il Purchase di Meta parte da due posti per lo stesso ordine:
//   - dal server (_shared/fire-meta-purchase.ts, chiamato da stripe-reconcile
//     per base e premium e da finalize-paypal-payment per ogni PayPal);
//   - dal browser su /success, ma solo se il compratore ci torna davvero.
//
// Meta ne tiene uno solo quando event_name ed event_id coincidono. Le due
// implementazioni dell'event_id non possono condividere un modulo — Deno e
// Vite non hanno un runtime comune — quindi la garanzia che restino uguali è
// questo file. Se divergono, un ordine viene contato come due conversioni e
// ogni ROAS del pannello Meta diventa falso.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildPurchaseEventId,
  isCouplePurchaseType,
  planBrowserPurchase,
} from "@/lib/meta-events";

const SERVER_FILES = [
  "supabase/functions/_shared/fire-meta-purchase.ts",
  "supabase/functions/_shared/meta-identity.ts",
];

function readServerSources(): string {
  return SERVER_FILES.map((file) => {
    try {
      return readFileSync(file, "utf8");
    } catch {
      return "";
    }
  }).join("\n");
}

describe("event_id del Purchase: browser e server devono coincidere", () => {
  it("ha il formato che il server emette", () => {
    // Il template del server è nel sorgente, non importabile da qui (Deno):
    // se qualcuno lo cambia, questo test lo vede.
    expect(readServerSources()).toContain("`purchase:${quizSessionId}:${purchaseType}`");

    for (const [id, type] of [
      ["11111111-2222-3333-4444-555555555555", "base"],
      ["11111111-2222-3333-4444-555555555555", "premium"],
      ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "synastry"],
      ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "synastry_launch"],
    ]) {
      expect(buildPurchaseEventId(id, type)).toBe(`purchase:${id}:${type}`);
    }
  });

  it("distingue prodotti diversi sulla stessa sessione", () => {
    // Un upgrade da base a premium sulla stessa quiz session è un secondo
    // acquisto vero: deve restare un secondo evento.
    expect(buildPurchaseEventId("s1", "base")).not.toBe(buildPurchaseEventId("s1", "premium"));
  });

  it("vale null quando manca uno dei due pezzi, invece di inventare un id", () => {
    expect(buildPurchaseEventId(undefined, "base")).toBeNull();
    expect(buildPurchaseEventId("s1", undefined)).toBeNull();
    expect(buildPurchaseEventId("", "base")).toBeNull();
    expect(buildPurchaseEventId("s1", "")).toBeNull();
    expect(buildPurchaseEventId(null, null)).toBeNull();
  });
});

describe("planBrowserPurchase", () => {
  it("spara con l'id del server quando sessione e prodotto ci sono", () => {
    expect(planBrowserPurchase("s1", "base")).toEqual({ fire: true, eventId: "purchase:s1:base" });
    expect(planBrowserPurchase("s2", "synastry")).toEqual({
      fire: true,
      eventId: "purchase:s2:synastry",
    });
  });

  it("per un ordine naturale senza id ricostruibile non spara dal browser", () => {
    // Il webhook copre base e premium: un id casuale li conterebbe due volte.
    expect(planBrowserPurchase(undefined, "base")).toEqual({ fire: false });
    expect(planBrowserPurchase("s1", undefined)).toEqual({ fire: false });
    expect(planBrowserPurchase(undefined, undefined)).toEqual({ fire: false });
    expect(planBrowserPurchase("", "premium")).toEqual({ fire: false });
  });

  it("per un ordine di coppia senza sessione spara comunque", () => {
    // Su Stripe la coppia non ha un Purchase server-side: scartare l'evento
    // vorrebbe dire che Meta non vede quell'acquisto affatto. Senza eventId il
    // hook ricade sull'id derivato, come prima di questo controllo.
    expect(planBrowserPurchase(undefined, "synastry_launch")).toEqual({
      fire: true,
      eventId: undefined,
    });
    expect(planBrowserPurchase(null, "synastry")).toEqual({ fire: true, eventId: undefined });
  });
});

describe("isCouplePurchaseType", () => {
  it("riconosce solo i prodotti di coppia", () => {
    expect(isCouplePurchaseType("synastry")).toBe(true);
    expect(isCouplePurchaseType("synastry_launch")).toBe(true);
    expect(isCouplePurchaseType("base")).toBe(false);
    expect(isCouplePurchaseType("premium")).toBe(false);
    expect(isCouplePurchaseType(undefined)).toBe(false);
    expect(isCouplePurchaseType(null)).toBe(false);
  });
});
