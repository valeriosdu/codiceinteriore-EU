// synastry-chart: calcola la sinastria di coppia per una synastry_session.
//
// Fa 2 chiamate a freeastroapi:
//   1. POST /api/v1/western/synastry (Detailed con include.text=false)
//   2. POST /api/v1/natal/chart/synastry (SVG bi-wheel)
//
// Salva synastry_data, bi_wheel_svg, archetype, score_overall, scores in DB.
// Setta processing_status = "synastry_ready" alla fine.
//
// Plan: lazy-wishing-kay.md sez. B1.

// @ts-ignore deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  extractOverallScore,
  extractArchetypeId,
} from "../_shared/synastry-brief.ts";
import { getArchetypeLabel } from "../_shared/synastry-archetypes.ts";
import {
  PDF_CHART_CONFIG,
  PDF_CHART_DISPLAY_SETTINGS,
} from "../_shared/report-pdf.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const API_KEY = Deno.env.get("ASTROLOGY_API_KEY")!;
const SYNASTRY_URL = "https://api.freeastroapi.com/api/v1/western/synastry";
const SVG_URL = "https://api.freeastroapi.com/api/v1/natal/chart/synastry";

const BODIES = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "asc",
  "mc",
  "node",
  "chiron",
  "lilith",
  "vertex",
];

function getTimezoneString(value: unknown): string {
  return typeof value === "string" && value.trim().includes("/")
    ? value.trim()
    : "AUTO";
}

interface SynastryChartSession {
  id: string;
  person_a_name: string | null;
  person_a_birth_date: any;
  person_a_birth_time: any;
  person_a_time_known: boolean;
  person_a_birth_place: string | null;
  person_a_birth_lat: number | null;
  person_a_birth_lng: number | null;
  person_a_birth_timezone: number | null;
  person_a_birth_timezone_iana: string | null;
  person_b_name: string | null;
  person_b_birth_date: any;
  person_b_birth_time: any;
  person_b_time_known: boolean;
  person_b_birth_place: string | null;
  person_b_birth_lat: number | null;
  person_b_birth_lng: number | null;
  person_b_birth_timezone: number | null;
  person_b_birth_timezone_iana: string | null;
  synastry_data: any;
  bi_wheel_svg: string | null;
  processing_status: string | null;
}

function readPersonFields(prefix: "a" | "b", session: SynastryChartSession) {
  const name = (session as any)[`person_${prefix}_name`] || "Persona";
  const birthDate = (session as any)[`person_${prefix}_birth_date`];
  const birthTime = (session as any)[`person_${prefix}_birth_time`];
  const timeKnown = (session as any)[`person_${prefix}_time_known`] !== false;
  const place = (session as any)[`person_${prefix}_birth_place`];
  const lat = (session as any)[`person_${prefix}_birth_lat`];
  const lng = (session as any)[`person_${prefix}_birth_lng`];
  const tzNum = (session as any)[`person_${prefix}_birth_timezone`];
  const tzIana = (session as any)[`person_${prefix}_birth_timezone_iana`];
  return { name, birthDate, birthTime, timeKnown, place, lat, lng, tzNum, tzIana };
}

function buildSynastryPayload(f: ReturnType<typeof readPersonFields>): Record<string, unknown> {
  const dt = `${String(f.birthDate?.year ?? "1990").padStart(4, "0")}-${String(f.birthDate?.month ?? 1).padStart(2, "0")}-${String(f.birthDate?.day ?? 1).padStart(2, "0")}T${String(f.timeKnown ? (f.birthTime?.hour ?? 12) : 12).padStart(2, "0")}:${String(f.timeKnown ? (f.birthTime?.minute ?? 0) : 0).padStart(2, "0")}:00`;
  const location: Record<string, unknown> = {};
  if (f.place) location.city = f.place;
  if (f.lat != null) location.lat = f.lat;
  if (f.lng != null) location.lng = f.lng;
  return {
    name: f.name,
    datetime: dt,
    location: Object.keys(location).length > 0 ? location : { city: f.place ?? "Unknown" },
    tz_str: getTimezoneString(f.tzIana ?? f.tzNum),
    time_known: f.timeKnown,
  };
}

function buildChartPayload(f: ReturnType<typeof readPersonFields>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: f.name,
    year: Number(f.birthDate?.year ?? 1990),
    month: Number(f.birthDate?.month ?? 1),
    day: Number(f.birthDate?.day ?? 1),
    hour: f.timeKnown ? Number(f.birthTime?.hour ?? 12) : 12,
    minute: f.timeKnown ? Number(f.birthTime?.minute ?? 0) : 0,
    time_known: f.timeKnown,
    city: f.place ?? "Unknown",
    tz_str: getTimezoneString(f.tzIana ?? f.tzNum),
  };
  if (f.lat != null) payload.lat = f.lat;
  if (f.lng != null) payload.lng = f.lng;
  return payload;
}

async function callSynastryDetailed(personA: any, personB: any): Promise<any> {
  const body = {
    person_a: personA,
    person_b: personB,
    settings: {
      zodiac: "tropical",
      house_system: "placidus",
      node_type: "true",
      bodies: BODIES,
      aspect_set: "major",
      include: {
        natal_snapshots: true,
        aspects: true,
        house_overlays: true,
        scores: true,
        archetype: true,
        text: false,
      },
    },
  };
  const res = await fetch(SYNASTRY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Encoding": "gzip",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`synastry detailed ${res.status}: ${t.slice(0, 500)}`);
  }
  return res.json();
}

async function callBiWheelSvg(personA: any, personB: any): Promise<string | null> {
  const body = {
    person_a: { ...personA, format: "svg", size: 900, theme_type: "light" },
    person_b: personB,
    show_a_aspects: false,
    show_inter_aspects: true,
    show_b_aspects: false,
    show_person_b_houses: true,
    show_person_b_angles: true,
    chart_config: PDF_CHART_CONFIG,
    display_settings: PDF_CHART_DISPLAY_SETTINGS,
    custom_theme: { background: "transparent" },
  };
  const res = await fetch(SVG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn(`bi-wheel SVG ${res.status}: ${t.slice(0, 200)}`);
    return null;
  }
  return res.text();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { synastrySessionId } = await req.json();
    if (!synastrySessionId) {
      return new Response(JSON.stringify({ error: "synastrySessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: session, error: sessionErr } = await supabase
      .from("synastry_sessions")
      .select(
        "id, person_a_name, person_a_birth_date, person_a_birth_time, person_a_time_known, person_a_birth_place, person_a_birth_lat, person_a_birth_lng, person_a_birth_timezone, person_a_birth_timezone_iana, person_b_name, person_b_birth_date, person_b_birth_time, person_b_time_known, person_b_birth_place, person_b_birth_lat, person_b_birth_lng, person_b_birth_timezone, person_b_birth_timezone_iana, synastry_data, bi_wheel_svg, processing_status",
      )
      .eq("id", synastrySessionId)
      .maybeSingle<SynastryChartSession>();

    if (sessionErr || !session) {
      return new Response(JSON.stringify({ error: "session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: if synastry_data already exists, skip.
    if (session.synastry_data) {
      return new Response(
        JSON.stringify({ ok: true, cached: true, processing_status: session.processing_status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabase
      .from("synastry_sessions")
      .update({ processing_status: "synastry_processing" })
      .eq("id", synastrySessionId);

    const fieldsA = readPersonFields("a", session);
    const fieldsB = readPersonFields("b", session);

    const [synastryData, biWheelSvg] = await Promise.all([
      callSynastryDetailed(buildSynastryPayload(fieldsA), buildSynastryPayload(fieldsB)),
      callBiWheelSvg(buildChartPayload(fieldsA), buildChartPayload(fieldsB)),
    ]);

    const archetypeId = extractArchetypeId(synastryData);
    const scoreOverall = extractOverallScore(synastryData);
    const scoresRaw = synastryData?.synastry?.scores ?? {};

    const chartA = synastryData?.natal?.person_a ?? null;
    const chartB = synastryData?.natal?.person_b ?? null;

    await supabase
      .from("synastry_sessions")
      .update({
        synastry_data: synastryData,
        bi_wheel_svg: biWheelSvg,
        chart_a: chartA,
        chart_b: chartB,
        archetype: archetypeId,
        archetype_label: getArchetypeLabel(archetypeId),
        score_overall: scoreOverall,
        scores: scoresRaw,
        processing_status: "synastry_ready",
      })
      .eq("id", synastrySessionId);

    return new Response(
      JSON.stringify({
        ok: true,
        archetype: archetypeId,
        score_overall: scoreOverall,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("synastry-chart error:", err);

    // Best-effort: mark failed
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { synastrySessionId } = await req.json().catch(() => ({}));
      if (synastrySessionId) {
        await supabase
          .from("synastry_sessions")
          .update({
            processing_status: "failed",
            processing_error: String(err).slice(0, 1000),
          })
          .eq("id", synastrySessionId);
      }
    } catch {
      // ignore
    }

    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
