import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { getMarket } from "../_shared/markets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_VERSION = "v21.0";

async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Meta match keys must be normalized BEFORE hashing, otherwise the hash simply
// never matches: the phone Stripe gives us ("+34 612 34 56 78") hashes to
// something Meta never computes on its side (it expects "34612345678").
// Rules: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
const normalizers: Record<string, (raw: string) => string> = {
  em: (v) => v.trim().toLowerCase(),
  // Lettere (accenti inclusi: Meta accetta UTF-8 e i profili ES/IT li hanno)
  // senza punteggiatura, cifre o spazi doppi.
  fn: (v) => v.trim().toLowerCase().replace(/[\d_'".,()[\]{}!?]/g, "").replace(/\s+/g, " ").trim(),
  ln: (v) => v.trim().toLowerCase().replace(/[\d_'".,()[\]{}!?]/g, "").replace(/\s+/g, " ").trim(),
  // Solo cifre, prefisso internazionale incluso, senza zeri iniziali.
  ph: (v) => v.replace(/\D/g, "").replace(/^0+/, ""),
  db: (v) => v.replace(/\D/g, ""),
  // Meta vuole le prime 5 cifre solo per gli ZIP statunitensi. CAP italiani e
  // spagnoli sono 5 cifre (il taglio e' un no-op), ma un codice postale olandese
  // e' "1234 AB": troncarlo a "1234a" produce un hash che non matchera' mai.
  // Regola: taglia solo se i primi 5 caratteri sono cifre (copre ZIP e ZIP+4).
  zp: (v) => {
    const z = v.trim().toLowerCase().replace(/\s+/g, "");
    return /^\d{5}/.test(z) ? z.slice(0, 5) : z;
  },
  ct: (v) => v.trim().toLowerCase().replace(/[^a-zà-ÿ]/g, ""),
  st: (v) => v.trim().toLowerCase().replace(/[^a-zà-ÿ]/g, ""),
  country: (v) => v.trim().toLowerCase().slice(0, 2),
  ge: (v) => v.trim().toLowerCase().slice(0, 1),
};

/**
 * Normalizza + hasha un match key. Restituisce `null` se dopo la normalizzazione
 * non resta nulla (es. nome fatto di sola punteggiatura): inviare l'hash di ""
 * conta come copertura piena su un valore che non matcherà mai nessuno.
 */
async function hashField(key: string, value: unknown): Promise<string[] | null> {
  const values = Array.isArray(value) ? value : [value];
  const out: string[] = [];
  for (const raw of values) {
    if (typeof raw !== "string" && typeof raw !== "number") continue;
    const normalize = normalizers[key] ?? ((v: string) => v.trim().toLowerCase());
    const normalized = normalize(String(raw));
    if (!normalized) continue;
    out.push(await sha256(normalized));
  }
  return out.length > 0 ? out : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      event_name,
      event_source_url,
      user_data,
      custom_data,
      event_id,
      skip_request_ip,
      market,
      test_event_code,
    } = await req.json();

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

    console.log(
      `[meta-conversions] event=${event_name} market=${marketConfig.id} pixel=${PIXEL_ID} event_id=${event_id ?? "<missing>"}`,
    );

    // Hash user data fields that need hashing (dopo normalizzazione)
    const hashedUserData: Record<string, unknown> = {};

    for (const key of ["em", "fn", "ln", "ph", "db", "zp", "ct", "st", "ge", "external_id"]) {
      const value = (user_data as Record<string, unknown> | undefined)?.[key];
      if (value === undefined || value === null || value === "") continue;
      // external_id è l'unico match key non anagrafico: accetta anche array
      // (mandiamo id sessione + id anonimo stabile, così un cliente di ritorno
      // resta la stessa persona per Meta anche cambiando sessione).
      const hashed = await hashField(key, value);
      if (hashed) hashedUserData[key] = hashed;
    }

    // Pass through non-hashed fields
    if (user_data?.client_user_agent) {
      hashedUserData.client_user_agent = user_data.client_user_agent;
    }
    // IP: preferisci quello esplicito nel body — i chiamanti server-to-server
    // (stripe-webhook, paypal-webhook) lo rileggono da checkout_sessions, cioè
    // è l'IP vero del browser al checkout. In assenza, e solo se non è stato
    // chiesto di ignorarlo, si usa l'IP della richiesta: per un webhook sarebbe
    // il runtime Supabase, che peggiora il match invece di migliorarlo.
    if (user_data?.client_ip_address) {
      hashedUserData.client_ip_address = user_data.client_ip_address;
    } else if (!skip_request_ip) {
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
    // Always include country code as fallback to satisfy Meta's minimum user data requirement
    if (!hashedUserData.country) {
      hashedUserData.country = await hashField("country", user_data?.country || marketConfig.countryCode);
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

    // test_event_code: opzionale, serve solo a far comparire l'evento nel Test
    // Events di Events Manager. Mai valorizzato dal funnel in produzione.
    const payload: Record<string, unknown> = { data: [eventData] };
    if (typeof test_event_code === "string" && test_event_code) {
      payload.test_event_code = test_event_code;
    }

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
