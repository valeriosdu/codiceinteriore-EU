import { describe, expect, it } from "vitest";
import { planAnswerRecheck } from "@/components/astrology-guide/answerRecheck";

const MIN = 60 * 1000;
const NOW = Date.parse("2026-10-04T12:00:00Z");
const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();
const q = (status: string, scheduled_for: string | null) => ({ status, scheduled_for });

describe("planAnswerRecheck", () => {
  it("senza domande in attesa non ricontrolla niente", () => {
    expect(planAnswerRecheck([], NOW)).toBeNull();
    expect(planAnswerRecheck([q("completed", at(-60 * MIN)), q("failed", null)], NOW)).toBeNull();
  });

  it("ricontrolla poco dopo l'orario previsto della risposta", () => {
    const plan = planAnswerRecheck([q("ready", at(3 * 60 * MIN))], NOW);
    expect(plan).toEqual({ nextRelease: NOW + 3 * 60 * MIN, delayMs: 3 * 60 * MIN + 6 * MIN });
  });

  it("con piu' domande guarda la prima che esce", () => {
    const plan = planAnswerRecheck([q("ready", at(5 * 60 * MIN)), q("pending", at(2 * 60 * MIN))], NOW);
    expect(plan?.nextRelease).toBe(NOW + 2 * 60 * MIN);
  });

  it("in ritardo sul rilascio ricontrolla ogni 2 minuti", () => {
    const plan = planAnswerRecheck([q("ready", at(-10 * MIN))], NOW);
    expect(plan?.delayMs).toBe(2 * MIN);
  });

  it("smette di interrogare a tempo dopo mezz'ora oltre la scadenza", () => {
    const plan = planAnswerRecheck([q("processing", at(-2 * 60 * MIN))], NOW);
    expect(plan).toEqual({ nextRelease: NOW - 2 * 60 * MIN, delayMs: null });
  });

  it("un orario nel futuro lontano non supera le 24 ore (setTimeout scatterebbe subito)", () => {
    const plan = planAnswerRecheck([q("ready", "2099-01-01T00:00:00Z")], NOW);
    expect(plan?.delayMs).toBe(24 * 60 * MIN);
  });

  it("senza orario o con orario illeggibile ricontrolla al passo normale", () => {
    expect(planAnswerRecheck([q("pending", null)], NOW)?.delayMs).toBe(6 * MIN);
    expect(planAnswerRecheck([q("pending", "non-una-data")], NOW)?.delayMs).toBe(6 * MIN);
  });
});
