import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_SECRET_KEY,
  clearAdminSecret,
  getAdminSecret,
  setAdminSecret,
} from "./adminSecretStorage";

// Stessa chiave usata dalle altre pagine admin (Dashboard, Astrology Guide):
// il login fatto su una pagina vale per tutte. Lo storage (localStorage con
// scadenza a 7 giorni) vive in adminSecretStorage.ts.

export function useAdminAuth() {
  const [secret, setSecret] = useState<string>(() => getAdminSecret());

  // Tieni in sync se cambia in un'altra tab (es. login su /admin/dashboard).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_SECRET_KEY) setSecret(getAdminSecret());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setAdminSecret(trimmed);
    setSecret(trimmed);
  }, []);

  const logout = useCallback(() => {
    clearAdminSecret();
    setSecret("");
  }, []);

  const clearOnAuthError = useCallback(() => {
    clearAdminSecret();
    setSecret("");
  }, []);

  return { secret, isAuthed: Boolean(secret), login, logout, clearOnAuthError };
}
