// Scadenza a 7 giorni della lettura generata e marker d'acquisto.
//
// Finche' il session id in localStorage non scadeva, chi tornava dopo mesi
// veniva rimandato al suo vecchio teaser, e chi voleva davvero una seconda
// lettura veniva rispedito a quella vecchia dalla guard di Processing dopo aver
// rifatto il quiz per niente. Inoltre chi pagava senza mai attivare l'account
// restava anonimo e Index gli riproponeva la lettura appena comprata.
//
// Qui si blocca l'invariante: un solo predicato (hasFreshFunnelSession) decide
// se una lettura vale ancora, e il marker d'acquisto sopravvive alla scadenza.
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  clearFunnelStorage,
  clearPurchaseSessionId,
  getPurchaseSessionId,
  hasFreshFunnelSession,
  rememberPurchaseSessionId,
} from "@/context/QuizContext";

const DAY_MS = 24 * 60 * 60 * 1000;
const KEYS = {
  session: "ci_session_id",
  stage: "ci_funnel_stage",
  startedAt: "ci_funnel_started_at",
  purchase: "ci_purchase_session_id",
};

const seed = (stage: string | null, startedAt?: string) => {
  localStorage.setItem(KEYS.session, "11111111-1111-4111-8111-111111111111");
  if (stage) localStorage.setItem(KEYS.stage, stage);
  if (startedAt !== undefined) localStorage.setItem(KEYS.startedAt, startedAt);
};

describe("hasFreshFunnelSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stage teaser a 6 giorni dalla generazione: ancora valida", () => {
    seed("teaser", String(Date.now() - 6 * DAY_MS));
    expect(hasFreshFunnelSession()).toBe(true);
    expect(localStorage.getItem(KEYS.session)).not.toBeNull();
  });

  it("a 8 giorni: scaduta e ripulisce sessione, stage e timestamp", () => {
    seed("teaser", String(Date.now() - 8 * DAY_MS));
    expect(hasFreshFunnelSession()).toBe(false);
    expect(localStorage.getItem(KEYS.session)).toBeNull();
    expect(localStorage.getItem(KEYS.stage)).toBeNull();
    expect(localStorage.getItem(KEYS.startedAt)).toBeNull();
  });

  it("stage offer senza timestamp (lettura pre-deploy): non viene espulsa, riparte da adesso", () => {
    seed("offer");
    const before = Date.now();
    expect(hasFreshFunnelSession()).toBe(true);
    const written = Number(localStorage.getItem(KEYS.startedAt));
    expect(written).toBeGreaterThanOrEqual(before);
    expect(written).toBeLessThanOrEqual(Date.now());
  });

  it("timestamp illeggibile: non butta fuori nessuno, lo riscrive", () => {
    seed("teaser", "abc");
    const before = Date.now();
    expect(hasFreshFunnelSession()).toBe(true);
    expect(Number(localStorage.getItem(KEYS.startedAt))).toBeGreaterThanOrEqual(before);
  });

  it("timestamp nel futuro (orologio spostato indietro): non e' scadenza", () => {
    const future = String(Date.now() + 3 * DAY_MS);
    seed("teaser", future);
    expect(hasFreshFunnelSession()).toBe(true);
    expect(localStorage.getItem(KEYS.startedAt)).toBe(future);
    expect(localStorage.getItem(KEYS.session)).not.toBeNull();
  });

  it("stage quiz: false e non tocca niente", () => {
    seed("quiz", String(Date.now() - 30 * DAY_MS));
    expect(hasFreshFunnelSession()).toBe(false);
    expect(localStorage.getItem(KEYS.session)).not.toBeNull();
    expect(localStorage.getItem(KEYS.startedAt)).not.toBeNull();
  });

  it("stage teaser ma senza session id: false", () => {
    localStorage.setItem(KEYS.stage, "teaser");
    localStorage.setItem(KEYS.startedAt, String(Date.now()));
    expect(hasFreshFunnelSession()).toBe(false);
  });

  it("nessuno stato salvato: false", () => {
    expect(hasFreshFunnelSession()).toBe(false);
  });

  it("il confine e' esattamente sette giorni", () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      seed("teaser", String(now - 7 * DAY_MS));
      expect(hasFreshFunnelSession()).toBe(true);
      vi.setSystemTime(now + 1);
      expect(hasFreshFunnelSession()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("marker d'acquisto", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("sopravvive a clearFunnelStorage", () => {
    rememberPurchaseSessionId("cs_test_abc");
    seed("offer", String(Date.now()));
    clearFunnelStorage();
    expect(getPurchaseSessionId()).toBe("cs_test_abc");
  });

  it("sopravvive alla scadenza della lettura", () => {
    rememberPurchaseSessionId("pp_ORDER123");
    seed("teaser", String(Date.now() - 8 * DAY_MS));
    expect(hasFreshFunnelSession()).toBe(false);
    expect(getPurchaseSessionId()).toBe("pp_ORDER123");
  });

  it("clearPurchaseSessionId lo toglie (attivazione, logout)", () => {
    rememberPurchaseSessionId("cs_test_abc");
    clearPurchaseSessionId();
    expect(getPurchaseSessionId()).toBeNull();
  });

  it("un id vuoto non scrive niente", () => {
    rememberPurchaseSessionId("");
    expect(getPurchaseSessionId()).toBeNull();
    expect(localStorage.getItem(KEYS.purchase)).toBeNull();
  });
});
