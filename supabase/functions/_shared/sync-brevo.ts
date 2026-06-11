// Helper per invocare sync-brevo-contact in fire-and-forget dalle altre edge functions.
// Brevo è usato SOLO per marketing automation; non blocca mai il flusso del chiamante.

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export type BrevoEventType =
  | "signup"
  | "purchase"
  | "transits_subscribed"
  | "transits_canceled"
  | "attribute_update";

export interface SyncBrevoContactArgs {
  email: string;
  eventType: BrevoEventType;
  name?: string;
  attributes?: Record<string, unknown>;
}

async function doSync(args: SyncBrevoContactArgs) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[sync-brevo] missing SUPABASE_URL or service role key, skipping");
    return;
  }
  if (!args.email) {
    console.warn(`[sync-brevo] missing email for ${args.eventType}, skipping`);
    return;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-brevo-contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[sync-brevo] ${args.eventType} → ${args.email} failed (${res.status}): ${text.slice(0, 300)}`,
      );
    } else {
      console.log(`[sync-brevo] ${args.eventType} → ${args.email} ok`);
    }
  } catch (err) {
    console.error(
      `[sync-brevo] ${args.eventType} background error:`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

export function syncBrevoContactBackground(args: SyncBrevoContactArgs) {
  const promise = doSync(args);
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(promise);
  } else {
    promise.catch(() => undefined);
  }
}
