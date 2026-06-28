// Storage condiviso della password admin (header x-admin-secret).
//
// Usato da useAdminAuth, AdminDashboard e AdminAstrologyGuide: tenere la logica
// qui evita che le tre pagine divergano sul formato/scadenza.
//
// Scelta: localStorage (sopravvive alla chiusura del browser, a differenza di
// sessionStorage) con una scadenza esplicita a 7 giorni — localStorage di suo
// non scade. Ogni login fa ripartire i 7 giorni da capo.
//
// Nota sicurezza: la password resta in chiaro nel browser per la durata della
// scadenza; va bene per uno strumento admin a singolo utente, ma chi accede al
// browser entra. Il tasto "Esci" presente nelle pagine azzera tutto subito.

export const ADMIN_SECRET_KEY = "ci_admin_secret";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 giorni

type StoredSecret = { secret: string; expiresAt: number };

// Ritorna la password se presente e non scaduta, altrimenti "" (e ripulisce).
export function getAdminSecret(): string {
  try {
    const raw = localStorage.getItem(ADMIN_SECRET_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as Partial<StoredSecret>;
    if (!parsed?.secret || typeof parsed.expiresAt !== "number") {
      localStorage.removeItem(ADMIN_SECRET_KEY);
      return "";
    }
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(ADMIN_SECRET_KEY);
      return "";
    }
    return parsed.secret;
  } catch {
    localStorage.removeItem(ADMIN_SECRET_KEY);
    return "";
  }
}

export function setAdminSecret(value: string): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  const payload: StoredSecret = { secret: trimmed, expiresAt: Date.now() + TTL_MS };
  localStorage.setItem(ADMIN_SECRET_KEY, JSON.stringify(payload));
}

export function clearAdminSecret(): void {
  localStorage.removeItem(ADMIN_SECRET_KEY);
}
