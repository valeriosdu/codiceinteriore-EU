import { describe, it, expect } from "vitest";
import { resolveTransitQuizSession } from "../../supabase/functions/_shared/transit-session";

// Questa funzione decide a quale lettura viene legato un abbonamento ai
// transiti, e con esso ogni ciclo e ogni rinnovo futuro. Prima la lettura la
// sceglieva il server (la piu' recente del profilo): chi ne aveva due si e'
// ritrovato i transiti sulla lettura sbagliata e, sull'altra, un "abbonamento
// attivo" che nascondeva pure il bottone per comprarli (set. 2026).
//
// Ora la manda il client, quindi va validata: accettare un id qualsiasi
// significherebbe far provisionare transiti sulla lettura di un altro.

const LETTURA_A = "11111111-1111-4111-8111-111111111111";
const LETTURA_B = "22222222-2222-4222-8222-222222222222";
const DI_UN_ALTRO = "99999999-9999-4999-8999-999999999999";

const fakeAdmin = (rows: Array<{ quiz_session_id: string | null }>) => ({
  from: () => {
    const q: any = {
      select: () => q,
      eq: () => q,
      order: () => q,
      then: (resolve: (v: unknown) => void) => resolve({ data: rows }),
    };
    return q;
  },
});

describe("resolveTransitQuizSession", () => {
  it("usa la lettura che il cliente sta guardando", async () => {
    const admin = fakeAdmin([{ quiz_session_id: LETTURA_B }, { quiz_session_id: LETTURA_A }]);
    expect(await resolveTransitQuizSession(admin, "p1", null, LETTURA_A)).toBe(LETTURA_A);
  });

  it("ignora una lettura che non e' del profilo", async () => {
    const admin = fakeAdmin([{ quiz_session_id: LETTURA_B }, { quiz_session_id: LETTURA_A }]);
    expect(await resolveTransitQuizSession(admin, "p1", null, DI_UN_ALTRO)).toBe(LETTURA_B);
  });

  it("accetta la sessione del profilo anche se non e' fra i report", async () => {
    const admin = fakeAdmin([]);
    expect(await resolveTransitQuizSession(admin, "p1", LETTURA_A, LETTURA_A)).toBe(LETTURA_A);
  });

  it("senza richiesta ricade sulla piu' recente, come prima", async () => {
    const admin = fakeAdmin([{ quiz_session_id: LETTURA_B }, { quiz_session_id: LETTURA_A }]);
    expect(await resolveTransitQuizSession(admin, "p1", null, undefined)).toBe(LETTURA_B);
  });

  it("scarta valori non stringa senza rompersi", async () => {
    const admin = fakeAdmin([{ quiz_session_id: LETTURA_B }]);
    expect(await resolveTransitQuizSession(admin, "p1", null, { id: LETTURA_A })).toBe(LETTURA_B);
    expect(await resolveTransitQuizSession(admin, "p1", null, "   ")).toBe(LETTURA_B);
  });

  it("restituisce null se il profilo non ha letture", async () => {
    expect(await resolveTransitQuizSession(fakeAdmin([]), "p1", null, LETTURA_A)).toBeNull();
  });
});
