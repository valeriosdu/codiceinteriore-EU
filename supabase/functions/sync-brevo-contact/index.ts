// sync-brevo-contact: upsert idempotente di un contatto su Brevo per marketing automation.
// Chiamata SOLO da altre edge functions (service role) o dal trigger DB su profiles.
// Mai usata per email transazionali — quelle passano da process-email-queue.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_URL = "https://api.brevo.com/v3/contacts";

type EventType =
  | "signup"
  | "purchase"
  | "transits_subscribed"
  | "transits_canceled"
  | "attribute_update";

interface SyncBody {
  email: string;
  eventType: EventType;
  name?: string;
  attributes?: Record<string, unknown>;
}

function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidEventType(v: unknown): v is EventType {
  return (
    v === "signup" ||
    v === "purchase" ||
    v === "transits_subscribed" ||
    v === "transits_canceled" ||
    v === "attribute_update"
  );
}

function splitName(name?: string): { FIRSTNAME?: string; LASTNAME?: string } {
  if (!name || typeof name !== "string") return {};
  const trimmed = name.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { FIRSTNAME: parts[0] };
  return { FIRSTNAME: parts[0], LASTNAME: parts.slice(1).join(" ") };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  const brevoListIdRaw = Deno.env.get("BREVO_LIST_ID");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Service-role only: this function is invoked exclusively by other edge functions
  // and database triggers (signup, purchase) that pass the service role key.
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (token !== supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: SyncBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isValidEmail(body.email) || !isValidEventType(body.eventType)) {
    return new Response(JSON.stringify({ error: "Invalid email or eventType" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const email = body.email.toLowerCase();

  // Se Brevo non è configurato, logghiamo skipped e ritorniamo 200 — non bloccare il chiamante.
  if (!brevoApiKey) {
    await supabase.from("brevo_sync_log").insert({
      email,
      event_type: body.eventType,
      status: "skipped",
      error_message: "BREVO_API_KEY not configured",
      payload: { ...body, email },
    });
    return new Response(JSON.stringify({ success: false, reason: "not_configured" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const listIds: number[] = [];
  if (brevoListIdRaw) {
    const id = Number.parseInt(brevoListIdRaw, 10);
    if (Number.isFinite(id) && id > 0) listIds.push(id);
  }

  const nameParts = splitName(body.name);
  const attributes: Record<string, unknown> = {
    ...nameParts,
    ...(body.attributes || {}),
    LAST_EVENT: body.eventType,
    LAST_EVENT_AT: new Date().toISOString(),
  };

  const brevoBody: Record<string, unknown> = {
    email,
    attributes,
    updateEnabled: true,
  };
  if (listIds.length > 0) brevoBody.listIds = listIds;

  let status: "success" | "failed" = "success";
  let errorMessage: string | null = null;
  let brevoContactId: number | null = null;

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(brevoBody),
    });

    const text = await res.text().catch(() => "");
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      // ignore parse failure; some Brevo responses are empty on 204
    }

    if (!res.ok) {
      // Brevo restituisce 400 "Contact already exist" SOLO quando updateEnabled è false;
      // con updateEnabled:true questo non dovrebbe accadere. Tutti gli altri errori → failed.
      status = "failed";
      errorMessage = `Brevo ${res.status}: ${text.slice(0, 500)}`;
      console.error(`[sync-brevo-contact] ${body.eventType} → ${email} failed`, errorMessage);
    } else if (parsed && typeof parsed.id === "number") {
      brevoContactId = parsed.id;
    }
  } catch (err) {
    status = "failed";
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[sync-brevo-contact] network error`, errorMessage);
  }

  await supabase.from("brevo_sync_log").insert({
    email,
    event_type: body.eventType,
    status,
    brevo_contact_id: brevoContactId,
    error_message: errorMessage,
    payload: brevoBody,
  });

  // Ritorna sempre 200 per non bloccare i webhook chiamanti.
  return new Response(
    JSON.stringify({ success: status === "success", status, brevoContactId }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
