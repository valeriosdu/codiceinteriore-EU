import { supabase } from "@/integrations/supabase/client";

export type FunnelEventName =
  | "landing_viewed"
  | "quiz_started"
  | "quiz_completed"
  | "paywall_viewed"
  | "checkout_started"
  | "purchase_completed"
  | "report_generation_completed"
  | "report_generation_failed"
  | "landing_classica_viewed"
  | "landing_attivazione_viewed"
  | "quiz_intent_selected";

const ANON_KEY = "ci_anon_id";

export const getAnonymousId = (): string => {
  if (typeof window === "undefined") return "server";
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
};

// Per-session de-duplication for events that fire on mount (StrictMode, remounts).
const sentOnce = new Set<string>();

type TrackOptions = {
  /** If true, only one event with this name will be sent per page load. */
  once?: boolean;
};

export const trackEvent = async (
  eventName: FunnelEventName,
  properties: Record<string, unknown> = {},
  options: TrackOptions = {},
): Promise<void> => {
  try {
    if (options.once) {
      const key = `${eventName}:${typeof window !== "undefined" ? window.location.pathname : ""}`;
      if (sentOnce.has(key)) return;
      sentOnce.add(key);
    }

    const anonymous_id = getAnonymousId();
    const page_path =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : null;

    let user_id: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      user_id = data.session?.user?.id ?? null;
    } catch {
      user_id = null;
    }

    const { error } = await supabase.from("funnel_events").insert({
      anonymous_id,
      user_id,
      event_name: eventName,
      event_properties: properties as never,
      page_path,
    });

    if (error) {
      // Best effort — never block UX on analytics.
      console.warn("[analytics] insert failed", error.message);
    }
  } catch (err) {
    console.warn("[analytics] error", err);
  }
};
