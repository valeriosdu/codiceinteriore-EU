// Server-side Meta Conversions API Purchase fire, shared by stripe-reconcile
// and finalize-paypal-payment.
//
// Why this exists: the client-side Purchase in PaymentSuccess.tsx only fires
// if the buyer returns to /success. Buyers on mobile, in embedded browsers, or
// who close the tab right after Stripe/PayPal redirect were invisible to
// Meta — degrading both attribution and the optimization signal.
//
// Idempotency: relies on a local flag (checkout_sessions.meta_purchase_sent_at)
// to avoid re-firing on webhook redeliveries (Stripe retries on slow webhooks,
// PayPal redelivers on transient errors). Meta's deterministic event_id dedup
// is a backup for the race window between fire and flag update.
//
// Performance: backgrounded via EdgeRuntime.waitUntil — zero added latency on
// the webhook handler, same pattern as Brevo sync and generate-report.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getMarket, type Language } from "./markets.ts";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export type ServerPurchaseType = "base" | "premium" | "synastry" | "synastry_launch";

const SYNASTRY_TYPES = new Set(["synastry", "synastry_launch"]);

export interface FireMetaPurchaseArgs {
  quizSessionId: string;
  purchaseType: ServerPurchaseType;
  checkoutSessionId: string;
  value: number;
  currency: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  phone?: string | null;
  zip?: string | null;
  sourceUrl?: string;
}

async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function buildEventId(quizSessionId: string, purchaseType: ServerPurchaseType): string {
  // Mirror useMetaConversions.ts buildEventId — same format so Meta dedups
  // when both server- and client-side fires reach Graph within the 48h window.
  return `purchase:${quizSessionId}:${purchaseType}`;
}

// content_name inviato a Meta come segnale di catalogo/attribuzione (non mostrato
// all'acquirente). Localizzato per lingua così un acquisto US riporta il nome
// prodotto in inglese; it/es restano invariati byte-per-byte.
const PRODUCT_NAMES: Record<Language, Record<ServerPurchaseType, string>> = {
  it: {
    base: "Lettura completa",
    premium: "Lettura completa + transiti",
    synastry: "Sinastria di coppia",
    synastry_launch: "Sinastria di coppia (lancio)",
  },
  es: {
    base: "Lettura completa",
    premium: "Lettura completa + transiti",
    synastry: "Sinastría de pareja",
    synastry_launch: "Sinastría de pareja (lanzamiento)",
  },
  en: {
    base: "Complete reading",
    premium: "Complete reading + transits",
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

export function firePurchaseEventBackground(args: FireMetaPurchaseArgs) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("[fire-meta-purchase] missing supabase env; skipping");
    return;
  }
  if (typeof EdgeRuntime === "undefined" || !EdgeRuntime.waitUntil) {
    // Running outside the edge runtime (e.g. local script) — fire detached.
    void fireAndPersist(args).catch((err) =>
      console.error("[fire-meta-purchase] detached error:", err instanceof Error ? err.message : String(err)),
    );
    return;
  }
  EdgeRuntime.waitUntil(
    fireAndPersist(args).catch((err) =>
      console.error("[fire-meta-purchase] waitUntil error:", err instanceof Error ? err.message : String(err)),
    ),
  );
}

async function fireAndPersist(args: FireMetaPurchaseArgs): Promise<void> {
  const eventId = buildEventId(args.quizSessionId, args.purchaseType);
  const isSynastry = SYNASTRY_TYPES.has(args.purchaseType);

  // Mercato di default `it`; sovrascritto dalla riga sessione sotto. Determina
  // pixel di destinazione, event_source_url e country.
  let market = getMarket(null);

  const userData: Record<string, unknown> = {};
  if (args.email) userData.em = args.email;
  if (args.firstName) userData.fn = args.firstName;
  if (args.lastName) userData.ln = args.lastName;
  if (args.phone) userData.ph = args.phone;
  if (args.zip) userData.zp = args.zip;
  userData.external_id = args.quizSessionId;

  const sb = SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

  // Claim atomico PRIMA di sparare. Senza questo lo sweep A di
  // recover-pending-reports (ogni ~9 min, finestra 30 giorni) ri-riconcilia ogni
  // sessione pagata-non-reclamata e rispara lo stesso Purchase all'infinito:
  // Meta deduplica per event_id solo entro 48h, dopo di che lo conta di nuovo.
  // Se l'update non tocca righe la riga è già stata reclamata (o non esiste
  // ancora: in quel caso si spara comunque, best effort come prima).
  if (sb) {
    const { data: claimed, error: claimErr } = await sb
      .from("checkout_sessions")
      .update({ meta_purchase_sent_at: new Date().toISOString() })
      .eq("stripe_session_id", args.checkoutSessionId)
      .is("meta_purchase_sent_at", null)
      .select("stripe_session_id");
    if (claimErr) {
      console.warn("[fire-meta-purchase] claim update failed:", claimErr.message);
    } else if (!claimed || claimed.length === 0) {
      const { data: existing } = await sb
        .from("checkout_sessions")
        .select("meta_purchase_sent_at")
        .eq("stripe_session_id", args.checkoutSessionId)
        .maybeSingle();
      if (existing?.meta_purchase_sent_at) {
        console.log(
          `[fire-meta-purchase] già inviato (${existing.meta_purchase_sent_at}) per ${args.checkoutSessionId}, skip`,
        );
        return;
      }
    }
  }

  if (sb) {
    try {
      // Contesto browser salvato al checkout: senza fbc/fbp/IP/UA il Purchase
      // dal webhook arriva a Meta senza click id e l'attribuzione si perde.
      const { data: checkout } = await sb
        .from("checkout_sessions")
        .select("market, provider_metadata")
        .eq("stripe_session_id", args.checkoutSessionId)
        .maybeSingle();
      if (checkout?.market) market = getMarket(checkout.market as string);
      const ctx = (checkout?.provider_metadata as Record<string, unknown> | null)?.browser_context as
        | Record<string, string>
        | undefined;
      if (ctx?.fbc) userData.fbc = ctx.fbc;
      if (ctx?.fbp) userData.fbp = ctx.fbp;
      if (ctx?.ip) userData.client_ip_address = ctx.ip;
      if (ctx?.ua) userData.client_user_agent = ctx.ua;
    } catch (err) {
      console.warn(
        "[fire-meta-purchase] checkout lookup failed:",
        err instanceof Error ? err.message : String(err),
      );
    }

    try {
      // Il funnel coppia passa l'id di synastry_sessions nello stesso campo.
      const { data: session } = await sb
        .from(isSynastry ? "synastry_sessions" : "quiz_sessions")
        .select(
          isSynastry
            ? "person_a_name, person_a_birth_date, market"
            : "birth_date, user_name, market",
        )
        .eq("id", args.quizSessionId)
        .maybeSingle();
      const row = session as Record<string, unknown> | null;
      if (row?.market) market = getMarket(row.market as string);

      const birthDate = (isSynastry ? row?.person_a_birth_date : row?.birth_date) as
        | { day: number; month: number; year: number }
        | null
        | undefined;
      if (birthDate?.year) {
        userData.db = `${birthDate.year}${String(birthDate.month).padStart(2, "0")}${String(birthDate.day).padStart(2, "0")}`;
      }
      const name = (isSynastry ? row?.person_a_name : row?.user_name) as string | null;
      if (!userData.fn && name) userData.fn = name;
    } catch (err) {
      console.warn(
        "[fire-meta-purchase] session lookup failed:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  userData.country = args.country?.trim() || market.countryCode.toLowerCase();

  const customData = {
    value: args.value,
    currency: args.currency,
    content_category: args.purchaseType,
    content_ids: [args.purchaseType],
    content_type: "product",
    num_items: 1,
    content_name:
      PRODUCT_NAMES[market.language]?.[args.purchaseType] ?? PRODUCT_NAMES.en.base,
  };

  const successPath = isSynastry ? "/coppia/success" : "/success";
  const body = {
    event_name: "Purchase",
    event_id: eventId,
    event_source_url: args.sourceUrl || `${market.siteUrl}${successPath}`,
    user_data: userData,
    custom_data: customData,
    // Senza questo ogni Purchase server finiva nel pixel IT: getMarket(undefined)
    // ricade su `it`, quindi ES/US pagavano l'attribuzione di un altro mercato.
    market: market.id,
    skip_request_ip: true,
  };

  let invokeOk = false;
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/meta-conversions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const text = await response.text().catch(() => "");
    if (!response.ok) {
      console.error(
        `[fire-meta-purchase] meta-conversions responded ${response.status}: ${text.slice(0, 300)}`,
      );
    } else {
      console.log(
        `[fire-meta-purchase] Purchase fired event_id=${eventId} response=${text.slice(0, 200)}`,
      );
      invokeOk = true;
    }
  } catch (err) {
    console.error(
      "[fire-meta-purchase] meta-conversions fetch error:",
      err instanceof Error ? err.message : String(err),
    );
  }

  // Il flag è già stato preso in carico prima dell'invio: se l'invio fallisce va
  // rilasciato, altrimenti lo sweep di recupero non ritenterebbe mai più.
  if (!invokeOk && sb) {
    const { error } = await sb
      .from("checkout_sessions")
      .update({ meta_purchase_sent_at: null })
      .eq("stripe_session_id", args.checkoutSessionId);
    if (error) {
      console.error("[fire-meta-purchase] claim release failed:", error.message);
    }
  }
}
