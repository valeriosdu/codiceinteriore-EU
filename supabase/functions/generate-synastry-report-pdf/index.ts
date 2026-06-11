// generate-synastry-report-pdf: ritorna il PDF della sinastria per una
// synastry_session che ha gia full_report. Verifica payment via checkout_sessions.
//
// Plan: lazy-wishing-kay.md sez. B4.

// @ts-ignore deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  generateSynastryPdf,
  SYNASTRY_PDF_VERSION,
  SynastryReportContent,
} from "../_shared/synastry-pdf.ts";
import {
  PDF_CHART_CONFIG,
  PDF_CHART_DISPLAY_SETTINGS,
} from "../_shared/report-pdf.ts";

const ASTROLOGY_API_KEY = Deno.env.get("ASTROLOGY_API_KEY") || "";
const BI_WHEEL_URL = "https://api.freeastroapi.com/api/v1/natal/chart/synastry";

function buildPersonPayloadForChart(
  birthDate: any,
  birthTime: any,
  timeKnown: boolean,
  birthPlace: string | null,
  birthLat: number | null,
  birthLng: number | null,
  birthTimezoneIana: string | null,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    year: Number(birthDate?.year ?? 1990),
    month: Number(birthDate?.month ?? 1),
    day: Number(birthDate?.day ?? 1),
    hour: timeKnown ? Number(birthTime?.hour ?? 12) : 12,
    minute: timeKnown ? Number(birthTime?.minute ?? 0) : 0,
    time_known: timeKnown,
    city: birthPlace ?? "Unknown",
    tz_str: (typeof birthTimezoneIana === "string" && birthTimezoneIana.includes("/")) ? birthTimezoneIana : "AUTO",
  };
  if (birthLat != null) payload.lat = birthLat;
  if (birthLng != null) payload.lng = birthLng;
  return payload;
}

async function fetchBiWheelPng(personA: any, personB: any): Promise<Uint8Array | null> {
  if (!ASTROLOGY_API_KEY) return null;
  try {
    const res = await fetch(BI_WHEEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ASTROLOGY_API_KEY },
      body: JSON.stringify({
        person_a: { ...personA, format: "png", size: 900, theme_type: "light" },
        person_b: personB,
        show_a_aspects: false,
        show_inter_aspects: true,
        show_b_aspects: false,
        show_person_b_houses: true,
        show_person_b_angles: true,
        chart_config: PDF_CHART_CONFIG,
        display_settings: PDF_CHART_DISPLAY_SETTINGS,
        custom_theme: { background: "transparent" },
      }),
    });
    if (!res.ok) {
      console.warn(`[synastry-pdf] bi-wheel PNG fetch ${res.status}`);
      return null;
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("image/png")) return new Uint8Array(await res.arrayBuffer());
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      const b64: string | undefined =
        parsed?.png || parsed?.image || parsed?.data?.png || parsed?.data?.image ||
        (typeof parsed?.data === "string" ? parsed.data : undefined);
      if (typeof b64 === "string" && b64.length > 0) {
        const clean = b64.replace(/^data:image\/png;base64,/, "");
        const bin = atob(clean);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
      }
    } catch { /* not JSON */ }
    return null;
  } catch (e) {
    console.warn("[synastry-pdf] fetchBiWheelPng failed:", e);
    return null;
  }
}

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") ?? "";

function safeSlug(s: string | null | undefined): string {
  return (s || "persona")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "persona";
}

function pdfResponse(bytes: Uint8Array, aName: string, bName: string): Response {
  const filename = `codice-interiore-coppia-${safeSlug(aName)}-${safeSlug(bName)}.pdf`;
  return new Response(bytes, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-PDF-Version": SYNASTRY_PDF_VERSION,
    },
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const synastrySessionId =
      url.searchParams.get("synastrySessionId") ??
      (await req.json().catch(() => ({ synastrySessionId: null })))
        ?.synastrySessionId;

    if (!synastrySessionId) {
      return json({ error: "synastrySessionId required" }, 400);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Auth: admin secret, service role, oppure user JWT con checkout pagato
    const adminHeader = req.headers.get("x-admin-secret") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "");

    let allowed = false;
    if (ADMIN_SECRET && adminHeader === ADMIN_SECRET) allowed = true;
    else if (bearer && bearer === SERVICE_ROLE) allowed = true;
    else if (bearer) {
      // User JWT: verifica payment via checkout_sessions.
      // Accetta sia synastry sia synastry_launch (sconto lancio).
      const { data: paid } = await supabaseAdmin
        .from("checkout_sessions")
        .select("payment_status, purchase_type")
        .eq("synastry_session_id", synastrySessionId)
        .eq("payment_status", "paid")
        .in("purchase_type", ["synastry", "synastry_launch"])
        .limit(1)
        .maybeSingle();
      if (paid) allowed = true;
    }

    if (!allowed) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { data: session, error } = await supabaseAdmin
      .from("synastry_sessions")
      .select(
        "id, person_a_name, person_b_name, person_a_birth_date, person_a_birth_time, person_a_time_known, person_a_birth_place, person_a_birth_lat, person_a_birth_lng, person_a_birth_timezone_iana, person_b_birth_date, person_b_birth_time, person_b_time_known, person_b_birth_place, person_b_birth_lat, person_b_birth_lng, person_b_birth_timezone_iana, archetype_label, score_overall, scores, full_report",
      )
      .eq("id", synastrySessionId)
      .maybeSingle();

    if (error || !session) {
      return json({ error: "Session not found" }, 404);
    }

    if (!session.full_report) {
      return json({ error: "Report not ready yet" }, 404);
    }

    const personAPayload = buildPersonPayloadForChart(
      session.person_a_birth_date,
      session.person_a_birth_time,
      session.person_a_time_known !== false,
      session.person_a_birth_place,
      session.person_a_birth_lat,
      session.person_a_birth_lng,
      session.person_a_birth_timezone_iana,
    );
    const personBPayload = buildPersonPayloadForChart(
      session.person_b_birth_date,
      session.person_b_birth_time,
      session.person_b_time_known !== false,
      session.person_b_birth_place,
      session.person_b_birth_lat,
      session.person_b_birth_lng,
      session.person_b_birth_timezone_iana,
    );
    const biWheelPng = await fetchBiWheelPng(personAPayload, personBPayload);

    const bytes = await generateSynastryPdf({
      reportContent: session.full_report as SynastryReportContent,
      personAName: session.person_a_name,
      personBName: session.person_b_name,
      personABirthDate: session.person_a_birth_date,
      personABirthTime: session.person_a_birth_time,
      personABirthPlace: session.person_a_birth_place,
      personBBirthDate: session.person_b_birth_date,
      personBBirthTime: session.person_b_birth_time,
      personBBirthPlace: session.person_b_birth_place,
      archetypeLabel: session.archetype_label,
      scoreOverall: session.score_overall,
      scores: session.scores,
      biWheelPng,
    });

    return pdfResponse(bytes, session.person_a_name ?? "", session.person_b_name ?? "");
  } catch (err) {
    console.error("[generate-synastry-report-pdf] error:", err);
    return json({ error: String(err) }, 500);
  }
});
