// Per-IP fixed-window rate limiting for unauthenticated, cost-bearing
// public edge functions (FreeAstro + Gemini proxies, Meta conversions,
// account recovery). Backed by the `rate_limits` table via the
// `rate_limit_check` RPC, called with the service role.
//
// Two safety properties:
//   * FAIL OPEN — if the limiter errors (DB hiccup, missing env), the
//     request is allowed. A broken limiter must never take down the funnel.
//   * Server-to-server calls that carry the service-role key bypass the
//     limit entirely, so internal invocations (webhooks, recovery jobs,
//     functions calling each other) are never throttled. Only anon-key
//     browser traffic is rate limited.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type RateLimitOptions = {
  bucket: string;
  max: number;
  windowSeconds: number;
};

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const first = fwd.split(",")[0].trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

export async function checkRateLimit(
  req: Request,
  opts: RateLimitOptions,
): Promise<{ allowed: boolean; ip: string }> {
  const ip = getClientIp(req);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return { allowed: true, ip };

    // Trusted server-to-server calls (service-role bearer) bypass the limit.
    const auth = req.headers.get("Authorization") || "";
    if (auth === `Bearer ${serviceKey}`) return { allowed: true, ip };

    const admin = createClient(url, serviceKey);
    const { data, error } = await admin.rpc("rate_limit_check", {
      p_bucket: opts.bucket,
      p_identifier: ip,
      p_max: opts.max,
      p_window_seconds: opts.windowSeconds,
    });
    if (error) {
      console.warn(`[rate-limit] ${opts.bucket} check failed, allowing:`, error.message);
      return { allowed: true, ip };
    }
    return { allowed: data === true, ip };
  } catch (e) {
    console.warn(`[rate-limit] ${opts.bucket} exception, allowing:`, e);
    return { allowed: true, ip };
  }
}

export function rateLimitResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      message: "Troppe richieste. Attendi qualche istante e riprova.",
    }),
    {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    },
  );
}
