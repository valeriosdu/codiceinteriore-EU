import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAnonymousId } from "@/lib/analytics";
import { MARKET } from "@/markets";
import type { Language } from "@/markets";

type OfferKey = "base" | "premium" | "synastry" | "synastry_launch";

const OFFER_CONTENT_NAMES: Record<Language, Record<OfferKey, string>> = {
  it: {
    base: "Lettura completa",
    premium: "Lettura completa + transiti",
    synastry: "Sinastria di coppia",
    synastry_launch: "Sinastria di coppia (lancio)",
  },
  es: {
    base: "Lectura completa",
    premium: "Lectura completa + tránsitos",
    synastry: "Sinastría de pareja",
    synastry_launch: "Sinastría de pareja (lanzamiento)",
  },
  en: {
    base: "Full reading",
    premium: "Full reading + transits",
    synastry: "Couple synastry reading",
    synastry_launch: "Couple synastry reading (launch)",
  },
  nl: {
    base: "Volledige duiding",
    premium: "Volledige duiding + transits",
    synastry: "Synastrie voor koppels",
    synastry_launch: "Synastrie voor koppels (lancering)",
  },
};

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match?.[2];
}

const FBC_STORAGE_KEY = "ci_meta_fbc";

/**
 * Persists `fbclid` from the current URL as soon as the app mounts. Meta CAPI
 * events only start firing mid-funnel (quiz done, teaser, checkout) — by then
 * client-side navigation (`navigate("/quiz")`, no search string) has already
 * dropped `fbclid` from the URL, so without this the only remaining source is
 * the `_fbc` cookie the Meta pixel sets itself — which never appears for
 * ad-blocked or Safari Link-Tracking-Protection traffic. Call this once, as
 * early as possible (App mount), so it runs on whatever page the ad click
 * actually landed on.
 */
export function captureFbclid(): void {
  try {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (!fbclid) return;
    const stored = localStorage.getItem(FBC_STORAGE_KEY) || undefined;
    if (stored && stored.endsWith(`.${fbclid}`)) return;
    localStorage.setItem(FBC_STORAGE_KEY, `fb.1.${Date.now()}.${fbclid}`);
  } catch {
    // best effort
  }
}

/**
 * Facebook click id (`fbc`) for advanced matching. Prefers the real `_fbc`
 * cookie set by the Meta pixel; if it isn't there yet (the pixel is loaded
 * deferred, so it can lag behind the first navigation), reconstruct it from the
 * `fbclid` URL param and persist it so the click attribution survives across
 * funnel pages even after the param is gone.
 */
function getStoredFbc(): string | undefined {
  const cookie = getCookie("_fbc");
  if (cookie) return cookie;
  try {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    const stored = localStorage.getItem(FBC_STORAGE_KEY) || undefined;
    if (fbclid) {
      // Reuse a stored value built from the same fbclid to keep the timestamp stable.
      if (stored && stored.endsWith(`.${fbclid}`)) return stored;
      const built = `fb.1.${Date.now()}.${fbclid}`;
      localStorage.setItem(FBC_STORAGE_KEY, built);
      return built;
    }
    return stored;
  } catch {
    return undefined;
  }
}

const SESSION_FALLBACK_KEY = "ci_meta_session_id";

function getSessionFallbackId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_FALLBACK_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_FALLBACK_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

/**
 * Deterministic event_id so Meta deduplicates the same logical event even
 * if it is sent multiple times (page refresh, effect re-run, retried capture).
 * Format: <event>:<externalId|sessionFallback>[:<purchaseType>]
 */
function buildEventId(eventName: string, externalId?: string, purchaseType?: string): string {
  const base = externalId && externalId.length > 0 ? externalId : getSessionFallbackId();
  const suffix = purchaseType ? `:${purchaseType}` : "";
  return `${eventName.toLowerCase()}:${base}${suffix}`;
}

interface BirthDate {
  day: number;
  month: number;
  year: number;
}

interface TrackOptions {
  email?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  purchaseType?: string;
  birthDate?: BirthDate | null;
  customData?: Record<string, unknown>;
}

const OFFER_VALUES: Record<string, number> = {
  base: MARKET.prices.base,
  premium: MARKET.prices.premium,
  synastry: MARKET.prices.synastry,
  synastry_launch: MARKET.prices.synastryLaunch,
};

const getOfferCustomData = (purchaseType?: string, extra?: Record<string, unknown>) => {
  if (!purchaseType) return extra;
  const key: OfferKey = purchaseType in OFFER_VALUES ? (purchaseType as OfferKey) : "base";
  return {
    content_category: purchaseType,
    // content_ids/content_type servono al catalogo e alle campagne Advantage+:
    // senza, Meta non sa che gli eventi del funnel parlano dello stesso prodotto.
    content_ids: [key],
    content_type: "product",
    num_items: 1,
    content_name: OFFER_CONTENT_NAMES[MARKET.language][key],
    currency: MARKET.currency,
    value: OFFER_VALUES[key] ?? undefined,
    ...extra,
  };
};

/** Cookie Meta del browser, da allegare alla creazione del checkout. */
export function getMetaBrowserIds(): { fbc?: string; fbp?: string } {
  const ids: { fbc?: string; fbp?: string } = {};
  const fbc = getStoredFbc();
  const fbp = getCookie("_fbp");
  if (fbc) ids.fbc = fbc;
  if (fbp) ids.fbp = fbp;
  return ids;
}

async function trackEvent(eventName: string, options: TrackOptions = {}) {
  const eventId = buildEventId(eventName, options.externalId, options.purchaseType);

  // Doppio invio browser + CAPI con lo STESSO event_id, come raccomanda Meta:
  // il pixel porta segnali che il server non ha (cookie di prima parte, sessione
  // del browser), la CAPI copre chi ha ad-blocker o ITP, e la deduplica per
  // event_id li fonde in una conversione sola. Il PageView resta a index.html.
  try {
    window.fbq?.("track", eventName, options.customData ?? {}, { eventID: eventId });
  } catch (err) {
    console.warn(`Meta pixel ${eventName} failed (non-blocking):`, err);
  }

  try {
    const userData: Record<string, string | string[]> = {
      client_user_agent: navigator.userAgent,
    };

    const { fbc, fbp } = getMetaBrowserIds();
    if (fbc) userData.fbc = fbc;
    if (fbp) userData.fbp = fbp;

    if (options.email) userData.em = options.email;
    if (options.firstName) userData.fn = options.firstName;
    if (options.lastName) userData.ln = options.lastName;
    // L'id di sessione cambia a ogni acquisto: da solo fa sembrare a Meta che un
    // cliente di ritorno sia una persona nuova. L'id anonimo è stabile sul
    // dispositivo e li ricuce (Meta accetta più external_id per evento).
    const externalIds = [options.externalId, getAnonymousId()].filter(
      (id): id is string => Boolean(id) && id !== "no-storage",
    );
    if (externalIds.length > 0) userData.external_id = externalIds;
    if (options.birthDate) {
      const { year, month, day } = options.birthDate;
      userData.db = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
    }

    await supabase.functions.invoke("meta-conversions", {
      body: {
        event_name: eventName,
        event_source_url: window.location.href,
        event_id: eventId,
        user_data: userData,
        custom_data: options.customData,
        market: MARKET.id,
      },
    });
  } catch (err) {
    console.error(`Meta CAPI ${eventName} tracking failed (non-blocking):`, err);
  }
}

export function useMetaConversions() {
  const firedRef = useRef<Set<string>>(new Set());

  const trackOnce = useCallback((eventName: string, options: TrackOptions = {}) => {
    // Local in-memory guard — saves a roundtrip. Server-side dedup uses event_id.
    const key = buildEventId(eventName, options.externalId, options.purchaseType);
    if (firedRef.current.has(key)) return;
    firedRef.current.add(key);
    trackEvent(eventName, options);
  }, []);

  const trackViewContent = useCallback((options?: { firstName?: string; sessionId?: string; purchaseType?: string; birthDate?: BirthDate | null }) => {
    trackOnce("ViewContent", {
      firstName: options?.firstName,
      externalId: options?.sessionId,
      purchaseType: options?.purchaseType,
      birthDate: options?.birthDate,
      customData: getOfferCustomData(options?.purchaseType ?? "base"),
    });
  }, [trackOnce]);

  const trackLead = useCallback((options?: { email?: string; firstName?: string; lastName?: string; sessionId?: string; purchaseType?: string; birthDate?: BirthDate | null }) => {
    trackOnce("Lead", {
      email: options?.email,
      firstName: options?.firstName,
      lastName: options?.lastName,
      externalId: options?.sessionId,
      purchaseType: options?.purchaseType,
      birthDate: options?.birthDate,
      customData: getOfferCustomData(options?.purchaseType ?? "base"),
    });
  }, [trackOnce]);

  const trackCompleteRegistration = useCallback((options?: { email?: string; firstName?: string; lastName?: string; externalId?: string; birthDate?: BirthDate | null }) => {
    trackOnce("CompleteRegistration", {
      email: options?.email,
      firstName: options?.firstName,
      lastName: options?.lastName,
      externalId: options?.externalId,
      birthDate: options?.birthDate,
    });
  }, [trackOnce]);

  const trackAddToCart = useCallback((options?: { firstName?: string; sessionId?: string; purchaseType?: string; birthDate?: BirthDate | null }) => {
    trackOnce("AddToCart", {
      firstName: options?.firstName,
      externalId: options?.sessionId,
      purchaseType: options?.purchaseType,
      birthDate: options?.birthDate,
      customData: getOfferCustomData(options?.purchaseType ?? "base"),
    });
  }, [trackOnce]);

  const trackInitiateCheckout = useCallback((options?: { email?: string; firstName?: string; sessionId?: string; purchaseType?: string; birthDate?: BirthDate | null }) => {
    trackOnce("InitiateCheckout", {
      email: options?.email,
      firstName: options?.firstName,
      externalId: options?.sessionId,
      purchaseType: options?.purchaseType,
      birthDate: options?.birthDate,
      customData: getOfferCustomData(options?.purchaseType ?? "base"),
    });
  }, [trackOnce]);

  const trackAddPaymentInfo = useCallback((options?: { email?: string; firstName?: string; sessionId?: string; purchaseType?: string; paymentMethod?: string; birthDate?: BirthDate | null }) => {
    trackOnce("AddPaymentInfo", {
      email: options?.email,
      firstName: options?.firstName,
      externalId: options?.sessionId,
      purchaseType: options?.purchaseType,
      birthDate: options?.birthDate,
      customData: getOfferCustomData(options?.purchaseType, {
        payment_method: options?.paymentMethod,
      }),
    });
  }, [trackOnce]);

  const trackPurchase = useCallback((options: { value: number; currency: string; email?: string; firstName?: string; sessionId?: string; purchaseType?: string; birthDate?: BirthDate | null }) => {
    trackOnce("Purchase", {
      email: options.email,
      firstName: options.firstName,
      externalId: options.sessionId,
      purchaseType: options.purchaseType,
      birthDate: options.birthDate,
      customData: getOfferCustomData(options.purchaseType, {
        value: options.value,
        currency: options.currency,
      }),
    });
  }, [trackOnce]);

  return { trackViewContent, trackAddToCart, trackInitiateCheckout, trackAddPaymentInfo, trackPurchase, trackLead, trackCompleteRegistration };
}
