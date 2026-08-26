// I moduli condivisi delle edge function girano su Deno. Alcuni sono puri
// (nessuna dipendenza remota) e vengono importati da src/test/backend-bridge.test.ts
// solo per tirarli dentro il programma di `tsc`: e' l'unico modo per far
// verificare a compile-time le mappe per-lingua del backend, dato che il deploy
// Supabase non fa type-check e la CLI deno non e' installata su questa macchina.
// Qui basta la superficie di Deno che quei moduli toccano davvero.
declare const Deno: {
  env: { get(name: string): string | undefined };
};
