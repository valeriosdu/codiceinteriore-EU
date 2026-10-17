import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const RELOAD_KEY = "ci_chunk_reload_at";
const RELOAD_WINDOW_MS = 30_000;

type ReloadStorage = Pick<Storage, "getItem" | "setItem">;

// Decide se un chunk che non si e' caricato merita un ricaricamento della
// pagina. Succede quando un deploy cambia i nomi dei file mentre l'utente sta
// navigando: la pagina ha in memoria i vecchi nomi, il server non li ha piu'.
// Un reload prende i nuovi; senza, oggi resta uno schermo bianco.
//
// Al massimo un reload ogni 30 secondi, e solo se il segno del reload si
// riesce davvero a scrivere e rileggere: un browser in-app con lo storage
// bloccato o muto non deve poter entrare in un loop di ricaricamenti.
export function shouldReloadAfterChunkError(now: number, storage: ReloadStorage | null): boolean {
  if (!storage) return false;
  try {
    const last = Number(storage.getItem(RELOAD_KEY)) || 0;
    if (now - last < RELOAD_WINDOW_MS) return false;
    storage.setItem(RELOAD_KEY, String(now));
    return storage.getItem(RELOAD_KEY) === String(now);
  } catch {
    return false;
  }
}

const sessionStorageOrNull = (): ReloadStorage | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

// React.lazy con un solo tentativo di recupero: se l'import del chunk fallisce,
// ricarica la pagina una volta invece di lasciare lo schermo bianco.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((error: unknown) => {
      if (typeof window !== "undefined" && shouldReloadAfterChunkError(Date.now(), sessionStorageOrNull())) {
        window.location.reload();
        // Resta in Suspense finche' la pagina non si ricarica.
        return new Promise<never>(() => {});
      }
      throw error;
    }),
  );
}
