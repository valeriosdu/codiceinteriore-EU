import { describe, it, expect } from "vitest";
import { classifyAuthError, authErrorMessage } from "@/lib/auth-errors";
import itActivate from "@/i18n/it/activate";
import nlActivate from "@/i18n/nl/activate";

// I testi veri di GoTrue. Se Supabase li riformula il test non protegge più
// nulla in silenzio: fallisce, ed è il segnale per aggiornare i pattern.
const REAL_MESSAGES: Array<[string, string]> = [
  ["Invalid login credentials", "wrongCredentials"],
  ["User already registered", "alreadyRegistered"],
  ["A user with this email address has already been registered", "alreadyRegistered"],
  ["Password should be at least 6 characters", "passwordTooShort"],
  ["New password should be different from the old password.", "passwordSameAsOld"],
  ["For security purposes, you can only request this after 51 seconds.", "tooManyAttempts"],
  ["Email rate limit exceeded", "tooManyAttempts"],
];

describe("classifyAuthError", () => {
  it.each(REAL_MESSAGES)("classifica %s", (raw, expected) => {
    expect(classifyAuthError(raw)).toBe(expected);
  });

  it("ricade su generic per messaggi sconosciuti, vuoti o assenti", () => {
    expect(classifyAuthError("Database error saving new user")).toBe("generic");
    expect(classifyAuthError("")).toBe("generic");
    expect(classifyAuthError(null)).toBe("generic");
    expect(classifyAuthError(undefined)).toBe("generic");
  });

  it("non è sensibile al maiuscolo", () => {
    expect(classifyAuthError("INVALID LOGIN CREDENTIALS")).toBe("wrongCredentials");
  });
});

describe("authErrorMessage", () => {
  it("non restituisce mai il testo grezzo del server", () => {
    const raws = [...REAL_MESSAGES.map(([raw]) => raw), "Database error saving new user"];
    for (const raw of raws) {
      for (const catalog of [itActivate, nlActivate]) {
        const shown = authErrorMessage(raw, catalog.toasts);
        expect(shown).not.toBe(raw);
        expect(Object.values(catalog.toasts)).toContain(shown);
      }
    }
  });

  it("traduce la password sbagliata nella lingua del catalogo", () => {
    expect(authErrorMessage("Invalid login credentials", itActivate.toasts)).toBe(
      itActivate.toasts.wrongCredentials,
    );
    expect(authErrorMessage("Invalid login credentials", nlActivate.toasts)).toBe(
      nlActivate.toasts.wrongCredentials,
    );
  });

  it("usa il generico authError quando non riconosce l'errore", () => {
    expect(authErrorMessage("boom", nlActivate.toasts)).toBe(nlActivate.toasts.authError);
  });
});
