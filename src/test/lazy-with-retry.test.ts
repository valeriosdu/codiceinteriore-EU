import { describe, expect, it } from "vitest";
import { shouldReloadAfterChunkError } from "@/lib/lazyWithRetry";

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
  };
};

describe("shouldReloadAfterChunkError", () => {
  it("ricarica al primo chunk fallito", () => {
    expect(shouldReloadAfterChunkError(1_000_000, memoryStorage())).toBe(true);
  });

  it("non ricarica una seconda volta entro 30 secondi: niente loop", () => {
    const storage = memoryStorage();
    expect(shouldReloadAfterChunkError(1_000_000, storage)).toBe(true);
    expect(shouldReloadAfterChunkError(1_010_000, storage)).toBe(false);
  });

  it("torna a ricaricare passati 30 secondi", () => {
    const storage = memoryStorage();
    shouldReloadAfterChunkError(1_000_000, storage);
    expect(shouldReloadAfterChunkError(1_031_000, storage)).toBe(true);
  });

  it("senza storage non ricarica mai", () => {
    expect(shouldReloadAfterChunkError(1_000_000, null)).toBe(false);
  });

  it("se lo storage lancia eccezioni non ricarica", () => {
    const throwing = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(shouldReloadAfterChunkError(1_000_000, throwing)).toBe(false);
  });

  it("se lo storage accetta la scrittura ma non la conserva non ricarica", () => {
    const silent = { getItem: () => null, setItem: () => {} };
    expect(shouldReloadAfterChunkError(1_000_000, silent)).toBe(false);
  });
});
