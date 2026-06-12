/**
 * Preview Mode helpers (legacy Lovable editor preview).
 *
 * Active ONLY when the app is being viewed inside the Lovable editor
 * preview (e.g. id-preview--<id>.lovable.app or *.lovable.dev).
 * Production hosts of every market (codiceinteriore.it, cartainterior.com, …)
 * are explicitly excluded.
 *
 * When active, pages skip DB/auth-dependent flows and render demo data
 * so the user can navigate every screen from the preview. The demo content
 * itself is localized — it lives in the i18n catalog (m.demo).
 */

import { MARKET, MARKETS } from "@/markets";
import { getMessages } from "@/i18n";

const PRODUCTION_HOSTS = new Set<string>([
  // hostnames di produzione di tutti i mercati
  ...Object.values(MARKETS).flatMap((mk) => mk.hostnames),
  // host legacy Lovable in produzione del mercato italiano
  "codiceinteriore.lovable.app",
]);

export const isLovablePreview = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();

  if (PRODUCTION_HOSTS.has(host)) return false;

  // Lovable editor preview hosts
  if (host.startsWith("id-preview--") && host.endsWith(".lovable.app")) return true;
  if (host.endsWith(".lovable.dev")) return true;
  if (host.endsWith(".sandbox.lovable.dev")) return true;

  // Local dev override: ?preview=1 in URL forces preview mode. The
  // import.meta.env.DEV gate is stripped at production build time, so this
  // branch is dead code in any shipped bundle.
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "1") return true;
  }

  return false;
};

const M = getMessages(MARKET.language);

export const DEMO_USER_NAME = M.demo.userName;
export const DEMO_EMAIL = `demo@${new URL(MARKET.siteUrl).hostname.replace(/^www\./, "")}`;

export const DEMO_TEASER_INSIGHTS = M.demo.teaserInsights;
export const DEMO_FULL_REPORT: Record<string, string> = M.demo.fullReport;
