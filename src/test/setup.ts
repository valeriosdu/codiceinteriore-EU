import "@testing-library/jest-dom";

// I moduli condivisi delle edge function (importati da backend-bridge.test.ts
// per il type-check) leggono Deno.env a module scope. Lo stub deve esistere
// PRIMA che quei moduli vengano valutati: vitest carica i setupFiles per primi.
(globalThis as unknown as { Deno?: unknown }).Deno ??= {
  env: { get: () => undefined },
};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom non implementa IntersectionObserver: framer-motion lo usa per le
// animazioni "in viewport" e senza stub le pagine con <motion.section> non si
// montano affatto nei test.
class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver ??=
  IntersectionObserverStub;
(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom non implementa scrollTo: alcune pagine lo chiamano al mount.
if (typeof window !== "undefined" && !window.scrollTo) {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
}
