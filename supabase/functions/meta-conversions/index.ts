import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { getMarket } from "../_shared/markets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_VERSION = "v21.0";

async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_name, event_source_url, user_data, custom_data, event_id, skip_request_ip, market } =
      await req.json();

    const marketConfig = getMarket(market);
    const PIXEL_ID = Deno.env.get(marketConfig.metaPixelIdEnv);
    const ACCESS_TOKEN = Deno.env.get(marketConfig.metaAccessTokenEnv);

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      throw new Error(`Meta Conversions API credentials not configured for market ${marketConfig.id}`);
    }

    if (!event_name) {
      return new Response(JSON.stringify({ error: "event_name is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`[meta-conversions] event=${event_name} event_id=${event_id ?? "<missing>"}`);

    // Hash user data fields that need hashing
    const hashedUserData: Record<string, unknown> = {};

    if (user_data?.em) {
      hashedUserData.em = [await hashSHA256(user_data.em)];
    }
    if (user_data?.fn) {
      hashedUserData.fn = [await hashSHA256(user_data.fn)];
    }
    if (user_data?.ln) {
      hashedUserData.ln = [await hashSHA256(user_data.ln)];
    }
    if (user_data?.ph) {
      hashedUserData.ph = [await hashSHA256(user_data.ph)];
    }
    if (user_data?.db) {
      hashedUserData.db = [await hashSHA256(user_data.db)];
    }
    if (user_data?.zp) {
      hashedUserData.zp = [await hashSHA256(user_data.zp)];
    }
    // Pass through non-hashed fields
    if (user_data?.client_user_agent) {
      hashedUserData.client_user_agent = user_data.client_user_agent;
    }
    // Get client IP from request headers (forwarded by proxy). Server-to-server
    // callers (stripe-webhook, paypal-webhook) pass skip_request_ip=true because
    // the forwarded IP would be the Supabase runtime, not the buyer's browser —
    // sending it would degrade match quality instead of improving it.
    if (!skip_request_ip) {
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("cf-connecting-ip")
        || req.headers.get("x-real-ip");
      if (clientIp) {
        hashedUserData.client_ip_address = clientIp;
      }
    }
    if (user_data?.fbc) {
      hashedUserData.fbc = user_data.fbc;
    }
    if (user_data?.fbp) {
      hashedUserData.fbp = user_data.fbp;
    }
    if (user_data?.external_id) {
      hashedUserData.external_id = [await hashSHA256(user_data.external_id)];
    }
    // Always include country code as fallback to satisfy Meta's minimum user data requirement
    if (user_data?.country) {
      hashedUserData.country = [await hashSHA256(user_data.country)];
    } else {
      hashedUserData.country = [await hashSHA256(marketConfig.countryCode)];
    }

    const eventData: Record<string, unknown> = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      user_data: hashedUserData,
    };

    if (event_source_url) {
      eventData.event_source_url = event_source_url;
    }
    if (event_id) {
      eventData.event_id = event_id;
    }
    if (custom_data) {
      eventData.custom_data = custom_data;
    }

    const payload = { data: [eventData] };

    const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Meta CAPI error:", JSON.stringify(result));
      // Return 200 anyway to avoid blocking the client — tracking is non-critical
      return new Response(JSON.stringify({ success: false, warning: "Meta API rejected event", details: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, events_received: result.events_received }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("meta-conversions error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
