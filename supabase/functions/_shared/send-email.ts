// Shared helper to invoke send-transactional-email from other edge functions.
// Fire-and-forget by default (uses EdgeRuntime.waitUntil if available so the
// caller's response isn't blocked). Safe to retry: the caller MUST pass an
// idempotency key that uniquely identifies the logical send event.

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export interface SendTransactionalEmailArgs {
  templateName: string;
  recipientEmail: string;
  idempotencyKey: string;
  templateData?: Record<string, unknown>;
}

async function doSend(args: SendTransactionalEmailArgs) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[send-email] missing SUPABASE_URL or service role key, skipping");
    return;
  }
  if (!args.recipientEmail) {
    console.warn(`[send-email] missing recipient for ${args.templateName}, skipping`);
    return;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        templateName: args.templateName,
        recipientEmail: args.recipientEmail,
        idempotencyKey: args.idempotencyKey,
        templateData: args.templateData || {},
      }),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(
        `[send-email] ${args.templateName} → ${args.recipientEmail} failed (${res.status}): ${text.slice(0, 300)}`,
      );
    } else {
      console.log(
        `[send-email] ${args.templateName} → ${args.recipientEmail} ok (key=${args.idempotencyKey})`,
      );
    }
  } catch (err) {
    console.error(
      `[send-email] ${args.templateName} background error:`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

export function sendTransactionalEmailBackground(args: SendTransactionalEmailArgs) {
  const promise = doSend(args);
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(promise);
  } else {
    // Fallback: just kick it off; if the runtime tears down the function, the
    // queue-based dedup on idempotencyKey makes a later retry safe.
    promise.catch(() => undefined);
  }
}
