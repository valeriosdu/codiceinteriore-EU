import { useCallback, useEffect, useState } from "react";

// Stessa chiave usata dalle altre pagine admin (Dashboard, Astrology Guide):
// il login fatto su una pagina vale per tutte finché la sessione del browser
// è aperta.
const SECRET_KEY = "ci_admin_secret";

export function useAdminAuth() {
  const [secret, setSecret] = useState<string>(
    () => sessionStorage.getItem(SECRET_KEY) || "",
  );

  // Tieni in sync se cambia in un'altra tab (es. login su /admin/dashboard)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SECRET_KEY) setSecret(e.newValue || "");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    sessionStorage.setItem(SECRET_KEY, trimmed);
    setSecret(trimmed);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SECRET_KEY);
    setSecret("");
  }, []);

  const clearOnAuthError = useCallback(() => {
    sessionStorage.removeItem(SECRET_KEY);
    setSecret("");
  }, []);

  return { secret, isAuthed: Boolean(secret), login, logout, clearOnAuthError };
}
