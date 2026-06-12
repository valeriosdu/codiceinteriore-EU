import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MARKET } from "@/markets";

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match?.[2];
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
  externalId?: string;
  purchaseType?: string;
  birthDate?: BirthDate | null;
  customData?: Record<string, unknown>;
}

const OFFER_VALUES: Record<string, number> = {
  base: 19,
  premium: 29,
};

const getOfferCustomData = (purchaseType?: string, extra?: Record<string, unknown>) => {
  if (!purchaseType) return extra;
  return {
    content_category: purchaseType,
    content_name: purchaseType === "premium" ? "Lettura completa + transiti" : "Lettura completa",
    currency: "EUR",
    value: OFFER_VALUES[purchaseType] ?? undefined,
    ...extra,
  };
};

async function trackEvent(eventName: string, options: TrackOptions = {}) {
  const eventId = buildEventId(eventName, options.externalId, options.purchaseType);

  // Server-side CAPI only — no client-side fbq("track") to avoid double-firing
  // The base pixel in index.html handles PageView; all other events go through CAPI only.
  try {
    const userData: Record<string, string> = {
      client_user_agent: navigator.userAgent,
    };

    const fbc = getCookie("_fbc");
    const fbp = getCookie("_fbp");
    if (fbc) userData.fbc = fbc;
    if (fbp) userData.fbp = fbp;

    if (options.email) userData.em = options.email;
    if (options.firstName) userData.fn = options.firstName;
    if (options.externalId) userData.external_id = options.externalId;
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

  const trackViewContent = useCallback((contentName?: string) => {
    trackOnce("ViewContent", {
      customData: contentName ? { content_name: contentName } : undefined,
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

  return { trackViewContent, trackAddToCart, trackInitiateCheckout, trackAddPaymentInfo, trackPurchase };
}
