// sync-checkout-session non ha un client Supabase finto contro cui girare, ma
// l'ordine dei rami e' un invariante che si legge dal sorgente: il pacchetto
// domande della Guida astrologica deve uscire PRIMA del percorso natal, che
// altrimenti riscrive user_reports/profiles e crea un entitlement natal_report
// intestato alla sessione del pacchetto.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const SRC = readFileSync("supabase/functions/sync-checkout-session/index.ts", "utf8").replace(/\r\n/g, "\n");

const at = (needle: string) => {
  const i = SRC.indexOf(needle);
  expect(i, `manca "${needle}"`).toBeGreaterThan(-1);
  return i;
};

describe("sync-checkout-session: pacchetto Guida astrologica", () => {
  const packBranch = at("checkout.purchaseType === ASTROLOGY_GUIDE_PURCHASE_TYPE");

  it("usa la costante condivisa, non una stringa letterale", () => {
    expect(SRC).toMatch(/import \{ ASTROLOGY_GUIDE_PURCHASE_TYPE \} from "\.\.\/_shared\/astrology-products\.ts"/);
    expect(SRC).not.toMatch(/purchaseType === ["']astrology_guide_pack["']/);
  });

  it("esce prima del percorso natal generico", () => {
    expect(packBranch).toBeLessThan(at("const { quizSessionId, purchaseType, includesTransits"));
    expect(packBranch).toBeLessThan(at('.from("user_reports")'));
    expect(packBranch).toBeLessThan(at('entitlement_type: "natal_report"'));
    expect(packBranch).toBeLessThan(at("stripe_session_id: checkout.id,\n      quiz_session_id: quizSessionId"));
  });

  it("viene dopo i rami sinastria e abbonamento transiti, che hanno la loro uscita", () => {
    expect(packBranch).toBeGreaterThan(at("SYNASTRY EARLY RETURN"));
    expect(packBranch).toBeGreaterThan(at("TRANSIT SUBSCRIPTION DELEGATION"));
  });

  it("nel ramo pacchetto rivendica soltanto il checkout e risponde", () => {
    const end = SRC.indexOf("const { quizSessionId, purchaseType, includesTransits");
    const body = SRC.slice(packBranch, end);
    expect(body).toContain('.from("checkout_sessions").update(');
    expect(body).toContain("claimed_profile_id: profile.id");
    expect(body).toContain("isAstrologyPack: true");
    expect(body).not.toMatch(/user_reports|user_entitlements|from\("profiles"\)|grant_astrology_credits/);
  });

  it("nessun altro punto del file concede crediti: restano a stripe-reconcile", () => {
    expect(SRC).not.toContain("grant_astrology_credits");
  });
});
