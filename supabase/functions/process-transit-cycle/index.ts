import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { recordAiMetric } from "../_shared/ai-metrics.ts";
import { resolvePromptLang, outputLanguageDirective, type PromptLang } from "../_shared/prompts/lang.ts";
import {
  LLM_CHAT_COMPLETIONS_URL,
  LONG_REPORT_MODEL,
  getLlmApiKey,
  llmHeaders,
} from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";
const ASTROLOGY_API_KEY = Deno.env.get("ASTROLOGY_API_KEY") || "";
// LLM provider (OpenRouter) — key/model/endpoint live in _shared/llm.ts.
const ASTROLOGY_BASE_URL = "https://api.freeastroapi.com";
const TRANSITS_ENDPOINT = "/api/v1/transits/calculate";
// 10 snapshots × 3.3 days places the last snapshot at day 29.7, so a
// 30-day cycle is covered all the way to the tail (the older value of 3
// stopped at day 27 and the narrative felt like it lost the last week).
// Step is fractional, so buildTransitSnapshotDates accumulates in minutes
// to avoid the floor-truncation Date.UTC applies to fractional day args.
// The same value lives in transit_cycles.snapshot_step_days (NUMERIC,
// default 3.3) and the per-cycle DB value wins over this fallback —
// keep them in sync when you change one.
const SNAPSHOT_COUNT = 10;
const SNAPSHOT_STEP_DAYS = 3.3;
// The 10 transit calls start staggered by this many ms instead of all at once:
// the provider's ~10 req/s limit is shared with the live funnel (astrology-chart,
// geo-lookup), so a simultaneous burst leaves no headroom. 100ms spreads them
// over ~0.9s. Bump if 100ms still proves too tight.
const TRANSIT_STAGGER_MS = 100;

const EXCLUDED_TRANSIT_PLANETS = new Set(["moon", "true_node", "lilith"]);
// Fast transits stay personal: targeting Saturn/Pluto/etc. with Mars adds
// noise. Medium/slow transits also target outer natal bodies so that life
// transits (Saturn return, Pluto-Pluto, Uranus opposition, Chiron return,
// Jupiter return) become visible.
const NATAL_POINTS_FAST = new Set(["sun", "moon", "mercury", "venus", "mars", "ascendant", "midheaven"]);
const NATAL_POINTS_SLOW_EXTENDED = new Set([
  "sun", "moon", "mercury", "venus", "mars", "ascendant", "midheaven",
  "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron",
]);
const FAST_TRANSIT_PLANETS = new Set(["sun", "mercury", "venus", "mars"]);
const MEDIUM_TRANSIT_PLANETS = new Set(["jupiter", "saturn"]);
const SLOW_TRANSIT_PLANETS = new Set(["uranus", "neptune", "pluto", "chiron"]);
// Outer bodies whose house position and stations carry multi-year meaning.
const SLOW_PLANETS_FOR_CONTEXT = ["saturn", "uranus", "neptune", "pluto", "chiron"];

const ORB_SETTINGS = {
  Conjunction: 3.0,
  Opposition: 2.5,
  Square: 2.5,
  Trine: 2.0,
  Sextile: 2.0,
};

type TransitCycle = {
  id: string;
  profile_id: string;
  quiz_session_id: string;
  entitlement_id: string;
  period_start: string;
  period_end: string;
  premium_purchase_at?: string | null;
  premium_purchase_local_datetime?: string | null;
  premium_purchase_timezone?: string | null;
  snapshot_count?: number | null;
  snapshot_step_days?: number | null;
  status: string;
  fetch_status: string;
  interpretation_status: string;
  raw_transits: any;
  llm_input?: any;
  interpreted_transits: any;
  retry_count: number;
  updated_at?: string | null;
  user_entitlements?: {
    id: string;
    status: string;
    entitlement_type: string;
    starts_at: string;
    ends_at: string | null;
  } | null;
  quiz_sessions?: {
    id: string;
    natal_chart: any;
    attachment_response: string | null;
    birth_date: any;
    birth_time: any;
    birth_place: string | null;
    birth_lat: number | null;
    birth_lng: number | null;
    birth_timezone: number | null;
    user_name: string | null;
    focus_area: string | null;
    language: string | null;
  } | null;
};

const isActiveEntitlement = (entitlement: TransitCycle["user_entitlements"]) => {
  if (!entitlement || entitlement.entitlement_type !== "monthly_transits" || entitlement.status !== "active")
    return false;
  return !entitlement.ends_at || new Date(entitlement.ends_at).getTime() >= Date.now();
};

const pad = (value: number) => String(value).padStart(2, "0");

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const getNumber = (value: unknown, label: string) => {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`birth_data_missing: ${label}`);
  return number;
};

const getOptionalNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

// Age in years from a birth_date JSONB column ({year, month, day}). Returns
// null if any field is missing or if the resulting age falls outside a
// plausible band, so an obvious data error never accidentally biases the
// model's tone. Same logic as process-astrology-questions and generate-report.
const computeAge = (
  birthDate: { year?: number; month?: number; day?: number } | null | undefined,
): number | null => {
  const year = Number(birthDate?.year);
  const month = Number(birthDate?.month);
  const day = Number(birthDate?.day);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const currentDay = now.getUTCDate();
  let age = currentYear - year;
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age -= 1;
  }
  return age >= 14 && age <= 100 ? age : null;
};

const normalizeName = (value: unknown) => {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const aliases: Record<string, string> = {
    asc: "ascendant",
    ascendent: "ascendant",
    descendant: "descendant",
    mc: "midheaven",
    medium_coeli: "midheaven",
    mid_heaven: "midheaven",
    true_node: "true_node",
    north_node: "true_node",
    lunar_node: "true_node",
  };
  return aliases[raw] || raw;
};

const getTransitName = (aspect: any) => normalizeName(aspect?.between?.transit);
const getNatalName = (aspect: any) => normalizeName(aspect?.between?.natal);

type TransitVelocity = "fast" | "medium" | "slow";

const getVelocity = (transitPlanet: string): TransitVelocity | null => {
  if (FAST_TRANSIT_PLANETS.has(transitPlanet)) return "fast";
  if (MEDIUM_TRANSIT_PLANETS.has(transitPlanet)) return "medium";
  if (SLOW_TRANSIT_PLANETS.has(transitPlanet)) return "slow";
  return null;
};

// Uniform 2° cap across velocities. Beyond 2° the aspect is "approaching"
// rather than active; previously medium/slow were clipped at 1.5° while fast
// at 2°, which silently dropped a Saturn at 1.8° from natal Sun.
const getOrbLimit = (_transitPlanet: string) => 2.0;

const getAllowedNatalPoints = (transitPlanet: string) =>
  FAST_TRANSIT_PLANETS.has(transitPlanet) ? NATAL_POINTS_FAST : NATAL_POINTS_SLOW_EXTENDED;

const cleanAspect = (aspect: any) => ({
  between: {
    transit: aspect?.between?.transit ?? null,
    natal: aspect?.between?.natal ?? null,
  },
  type: aspect?.type ?? null,
  orb: aspect?.orb ?? null,
});

const filterAspects = (response: any) => {
  const aspects = Array.isArray(response?.aspects) ? response.aspects : [];
  return aspects
    .filter((aspect: any) => {
      if (aspect?.is_major !== true) return false;
      const transitPlanet = getTransitName(aspect);
      const natalPoint = getNatalName(aspect);
      if (EXCLUDED_TRANSIT_PLANETS.has(transitPlanet)) return false;
      if (!getVelocity(transitPlanet)) return false;
      if (!getAllowedNatalPoints(transitPlanet).has(natalPoint)) return false;
      const orb = Number(aspect?.orb);
      return Number.isFinite(orb) && orb <= getOrbLimit(transitPlanet);
    })
    .map(cleanAspect);
};

const normalizeAspectType = (raw: unknown) =>
  String(raw || "")
    .trim()
    .toLowerCase();

// Pre-filter for natalChart.aspects passed to the LLM. Keeps only the natal
// aspects that meaningfully modulate transit readings: major aspects within
// 5° of orb that touch at least one personal point. Drops generational
// outer-outer aspects (Uranus-Neptune, Neptune-Pluto, etc.) and wide aspects
// that the model would deprioritize anyway. Reduces typical input from
// ~15-25 aspects to ~5-10.
const PERSONAL_NATAL_POINTS = new Set([
  "sun", "moon", "mercury", "venus", "mars", "saturn", "ascendant", "midheaven",
]);
const MAJOR_NATAL_ASPECT_TYPES = new Set([
  "conjunction", "opposition", "square", "trine", "sextile",
]);

const filterRelevantNatalAspects = (aspects: unknown): any[] => {
  if (!Array.isArray(aspects)) return [];
  return aspects.filter((a: any) => {
    if (a?.is_major === false) return false;
    const type = normalizeAspectType(a?.type ?? a?.aspect);
    if (!MAJOR_NATAL_ASPECT_TYPES.has(type)) return false;
    const orb = Number(a?.orb);
    if (!Number.isFinite(orb) || orb > 5) return false;
    const p1 = normalizeName(a?.p1 ?? a?.planet_1);
    const p2 = normalizeName(a?.p2 ?? a?.planet_2);
    return PERSONAL_NATAL_POINTS.has(p1) || PERSONAL_NATAL_POINTS.has(p2);
  });
};

// Smallest signed distance between two longitudes, wrapping the 0/360 seam.
const normalizeLongitudeDelta = (delta: number) => {
  let d = delta;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
};

type TransitIdentity = {
  transit_planet: string;
  natal_point: string;
  aspect_type: string;
  velocity: TransitVelocity;
  first_seen_index: number;
  last_seen_index: number;
  tightest_orb: number;
  snapshots_present: number;
  direction: "applying" | "separating" | "peaked";
  is_background: boolean;
  is_long_arc: boolean;
};

// Collapse the 10 snapshots into one row per (transit_planet, aspect_type,
// natal_point) so the LLM gets an already-tracked timeline instead of having
// to deduce evolution from 10 raw aspect lists. Flash regularly gets this
// wrong when asked to do it itself.
const aggregateTransitsAcrossSnapshots = (
  snapshots: Array<{ transit_date: string; aspects: any[] }>,
): TransitIdentity[] => {
  type Bucket = {
    transit_planet: string;
    natal_point: string;
    aspect_type: string;
    velocity: TransitVelocity;
    samples: Array<{ index: number; orb: number }>;
  };
  const map = new Map<string, Bucket>();

  snapshots.forEach((snapshot, index) => {
    const aspects = Array.isArray(snapshot?.aspects) ? snapshot.aspects : [];
    for (const aspect of aspects) {
      const transitPlanet = getTransitName(aspect);
      const natalPoint = getNatalName(aspect);
      const aspectType = normalizeAspectType(aspect?.type);
      const orb = Number(aspect?.orb);
      const velocity = getVelocity(transitPlanet);
      if (!velocity || !Number.isFinite(orb) || !aspectType) continue;
      const key = `${transitPlanet}|${aspectType}|${natalPoint}`;
      let bucket = map.get(key);
      if (!bucket) {
        bucket = { transit_planet: transitPlanet, natal_point: natalPoint, aspect_type: aspectType, velocity, samples: [] };
        map.set(key, bucket);
      }
      bucket.samples.push({ index, orb });
    }
  });

  const identities: TransitIdentity[] = [];
  for (const bucket of map.values()) {
    bucket.samples.sort((a, b) => a.index - b.index);
    const orbs = bucket.samples.map((s) => s.orb);
    const present = bucket.samples.length;
    const firstIndex = bucket.samples[0].index;
    const lastIndex = bucket.samples[present - 1].index;
    const tightest = Math.min(...orbs);

    // "mixed" was dropped — narratively useless. Default falls back to
    // applying/separating based on whether the orb tightened or widened
    // across the window. Single-sample transits default to "applying" on
    // the assumption they're entering the window.
    let direction: TransitIdentity["direction"];
    if (present === 1) {
      direction = "applying";
    } else {
      const eps = 0.05;
      const minPos = orbs.indexOf(tightest);
      const monotonicDecreasing = orbs.every((v, i) => i === 0 || v <= orbs[i - 1] + eps);
      const monotonicIncreasing = orbs.every((v, i) => i === 0 || v >= orbs[i - 1] - eps);
      if (monotonicDecreasing && !monotonicIncreasing) direction = "applying";
      else if (monotonicIncreasing && !monotonicDecreasing) direction = "separating";
      else if (minPos > 0 && minPos < orbs.length - 1) direction = "peaked";
      else direction = orbs[orbs.length - 1] < orbs[0] ? "applying" : "separating";
    }

    const isBackground = bucket.velocity !== "fast" && present >= 7;
    const isLongArc = bucket.velocity === "slow" && present >= 5;

    identities.push({
      transit_planet: bucket.transit_planet,
      natal_point: bucket.natal_point,
      aspect_type: bucket.aspect_type,
      velocity: bucket.velocity,
      first_seen_index: firstIndex,
      last_seen_index: lastIndex,
      tightest_orb: Number(tightest.toFixed(3)),
      snapshots_present: present,
      direction,
      is_background: isBackground,
      is_long_arc: isLongArc,
    });
  }

  // Priority order: structural arcs first, then background, then by tightness.
  identities.sort((a, b) => {
    if (a.is_long_arc !== b.is_long_arc) return a.is_long_arc ? -1 : 1;
    if (a.is_background !== b.is_background) return a.is_background ? -1 : 1;
    return a.tightest_orb - b.tightest_orb;
  });
  return identities;
};

type PlanetPosition = {
  sign: string | null;
  house: number | null;
  longitude: number | null; // 0-360°, from FreeAstroAPI's abs_pos
  retrograde: boolean | null;
};

// FreeAstroAPI's /api/v1/transits/calculate returns transit_planets[] with
// shape: { id, name, sign, pos (0-30° in-sign), abs_pos (0-360° absolute),
// house, retrograde }. We use abs_pos as canonical longitude, with pos as
// in-sign fallback only.
const extractTransitPlanetPositions = (rawResponse: any): Map<string, PlanetPosition> => {
  const out = new Map<string, PlanetPosition>();
  const list = rawResponse?.transit_planets;
  if (!Array.isArray(list)) return out;
  for (const p of list) {
    const name = normalizeName(p?.id ?? p?.name);
    if (!name) continue;
    const longitudeRaw = p?.abs_pos ?? p?.pos;
    const longitude = Number.isFinite(Number(longitudeRaw)) ? Number(longitudeRaw) : null;
    const house = Number.isFinite(Number(p?.house)) ? Number(p.house) : null;
    const sign = p?.sign || null;
    const retrograde = typeof p?.retrograde === "boolean" ? p.retrograde : null;
    out.set(name, { sign, house, longitude, retrograde });
  }
  return out;
};

const extractNatalPlanetLongitudes = (natalChart: any): Map<string, number> => {
  const out = new Map<string, number>();
  const list = natalChart?.planets;
  if (!Array.isArray(list)) return out;
  for (const p of list) {
    const name = normalizeName(p?.id ?? p?.name);
    const lon = Number(p?.abs_pos ?? p?.pos);
    if (name && Number.isFinite(lon)) out.set(name, lon);
  }
  return out;
};

type SlowPlanetPosition = {
  planet: string;
  sign: string | null;
  house: number | null;
  longitude: number | null;
  retrograde: boolean | null;
};
type SlowPlanetStation = {
  planet: string;
  snapshot_index: number;
  longitude: number;
  // "direct" when the planet just turned forward, "retrograde" when it just
  // turned backward, "slow" when motion is near-stationary without a flip
  // (fallback when retrograde flag is unavailable).
  station_type: "direct" | "retrograde" | "slow";
  near_natal_point: string | null;
  near_natal_orb: number | null;
  // Aspect type formed with near_natal_point (conjunction/opposition/etc).
  // null when no natal point falls within 5° of any major aspect.
  aspect_to_natal: string | null;
};
type SlowPlanetContext = { positions: SlowPlanetPosition[]; stations: SlowPlanetStation[] };

// Major aspects we scan for when looking for a natal contact at the station.
// A stationary Saturn at 1° from a square to natal Venus is as meaningful
// as one at 1° from a conjunction — both crystallize the theme for a year.
const STATION_ASPECT_ANGLES: Array<{ type: string; angle: number }> = [
  { type: "conjunction", angle: 0 },
  { type: "sextile", angle: 60 },
  { type: "square", angle: 90 },
  { type: "trine", angle: 120 },
  { type: "opposition", angle: 180 },
];

const findNearestNatalAspect = (
  longitude: number,
  natalLongitudes: Map<string, number>,
): { point: string | null; orb: number | null; aspect_type: string | null } => {
  let nearestPoint: string | null = null;
  let nearestOrb: number | null = null;
  let nearestType: string | null = null;
  for (const [natalName, natalLon] of natalLongitudes.entries()) {
    for (const { type, angle } of STATION_ASPECT_ANGLES) {
      const orb = Math.abs(normalizeLongitudeDelta(longitude - natalLon - angle));
      if (orb <= 5 && (nearestOrb === null || orb < nearestOrb)) {
        nearestPoint = natalName;
        nearestOrb = orb;
        nearestType = type;
      }
    }
  }
  return { point: nearestPoint, orb: nearestOrb, aspect_type: nearestType };
};

// Stations are the single most intense multi-year signal: when an outer
// planet sits within 5° of a natal point on its station date, you get a
// year-long crystallization of that theme. Detection prefers the precise
// retrograde-flag flip (stationary direct/retrograde), and falls back to a
// near-zero-motion heuristic when retrograde is missing. Cycle-start house
// + retrograde state is also captured so background passages (e.g. "Saturn
// in your 7th house for two years") have a frame.
const buildSlowPlanetContext = (
  snapshotPositions: Array<Map<string, PlanetPosition>>,
  natalLongitudes: Map<string, number>,
): SlowPlanetContext => {
  if (snapshotPositions.length === 0) return { positions: [], stations: [] };

  const positions: SlowPlanetPosition[] = [];
  const first = snapshotPositions[0];
  for (const planet of SLOW_PLANETS_FOR_CONTEXT) {
    const pos = first.get(planet);
    if (pos && (pos.house !== null || pos.sign !== null || pos.longitude !== null)) {
      positions.push({
        planet,
        sign: pos.sign,
        house: pos.house,
        longitude: pos.longitude,
        retrograde: pos.retrograde,
      });
    }
  }

  const stations: SlowPlanetStation[] = [];
  for (const planet of SLOW_PLANETS_FOR_CONTEXT) {
    const series: Array<{ index: number; lon: number; retrograde: boolean | null }> = [];
    snapshotPositions.forEach((m, index) => {
      const entry = m.get(planet);
      const lon = entry?.longitude;
      if (lon != null && Number.isFinite(lon)) {
        series.push({ index, lon, retrograde: entry?.retrograde ?? null });
      }
    });
    if (series.length < 2) continue;

    // Preferred: detect a retrograde-flag flip between consecutive snapshots.
    // A flip pinpoints the actual station date (within one snapshot window).
    let flipFound = false;
    for (let i = 0; i < series.length - 1; i++) {
      const a = series[i];
      const b = series[i + 1];
      if (a.retrograde === null || b.retrograde === null) continue;
      if (a.retrograde === b.retrograde) continue;
      const stationType: "direct" | "retrograde" = b.retrograde ? "retrograde" : "direct";
      const { point, orb, aspect_type } = findNearestNatalAspect(b.lon, natalLongitudes);
      stations.push({
        planet,
        snapshot_index: b.index,
        longitude: Number(b.lon.toFixed(3)),
        station_type: stationType,
        near_natal_point: point,
        near_natal_orb: orb !== null ? Number(orb.toFixed(2)) : null,
        aspect_to_natal: aspect_type,
      });
      flipFound = true;
      break;
    }
    if (flipFound) continue;

    // Fallback: near-zero motion across 3 consecutive snapshots when the
    // retrograde flag isn't usable. Less precise (the planet is "stationing"
    // somewhere in the window) but still narratively useful.
    for (let i = 0; i <= series.length - 3; i++) {
      const a = series[i];
      const b = series[i + 1];
      const c = series[i + 2];
      if (b.index !== a.index + 1 || c.index !== b.index + 1) continue;
      const d1 = Math.abs(normalizeLongitudeDelta(b.lon - a.lon));
      const d2 = Math.abs(normalizeLongitudeDelta(c.lon - b.lon));
      if (d1 >= 0.3 || d2 >= 0.3) continue;
      const { point, orb, aspect_type } = findNearestNatalAspect(b.lon, natalLongitudes);
      stations.push({
        planet,
        snapshot_index: b.index,
        longitude: Number(b.lon.toFixed(3)),
        station_type: "slow",
        near_natal_point: point,
        near_natal_orb: orb !== null ? Number(orb.toFixed(2)) : null,
        aspect_to_natal: aspect_type,
      });
      break;
    }
  }

  return { positions, stations };
};

const formatTimezoneOffset = (offsetHours: unknown) => {
  const hours = Number(offsetHours);
  if (!Number.isFinite(hours)) return "AUTO";
  const sign = hours >= 0 ? "+" : "-";
  const absolute = Math.abs(hours);
  const wholeHours = Math.floor(absolute);
  const minutes = Math.round((absolute - wholeHours) * 60);
  return `${sign}${pad(wholeHours)}:${pad(minutes)}`;
};

const localDateTimeFromUtc = (date: Date, offsetHours: unknown) => {
  const hours = Number(offsetHours);
  const local = Number.isFinite(hours) ? new Date(date.getTime() + hours * 60 * 60 * 1000) : date;
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
};

const buildTransitSnapshotDates = (
  baseLocalDateTime: string,
  count = SNAPSHOT_COUNT,
  stepDays = SNAPSHOT_STEP_DAYS,
) => {
  const [datePart, timePart = "00:00"] = baseLocalDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite))
    throw new Error("premium_purchase_local_datetime_invalid");

  // Convert step to total minutes so fractional days survive: Date.UTC floors
  // fractional day args (MakeDay → ToIntegerOrInfinity), so a step of 3.2
  // would collapse back to 3. Minutes do overflow correctly into hours/days.
  return Array.from({ length: count }, (_, index) => {
    const totalMinutes = Math.round(index * stepDays * 24 * 60);
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute + totalMinutes));
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  });
};

const buildNatalPayload = (cycle: TransitCycle) => {
  const quiz = cycle.quiz_sessions;
  if (!quiz) throw new Error("quiz_session_missing");
  const birthDate = quiz.birth_date || {};
  const birthTime = quiz.birth_time || {};
  if (quiz.birth_lat == null || quiz.birth_lng == null) throw new Error("birth_data_missing: coordinates");

  const hour = getOptionalNumber(birthTime.hour);
  const minute = getOptionalNumber(birthTime.minute);
  const timeKnown = hour !== null && minute !== null;

  const payload: Record<string, unknown> = {
    name: quiz.user_name || "User",
    city: quiz.birth_place || "Birth place",
    year: getNumber(birthDate.year, "year"),
    month: getNumber(birthDate.month, "month"),
    day: getNumber(birthDate.day, "day"),
    time_known: timeKnown,
    lat: quiz.birth_lat,
    lng: quiz.birth_lng,
    tz_str: "AUTO",
    house_system: "placidus",
    zodiac_type: "tropical",
  };

  if (timeKnown) {
    payload.hour = hour;
    payload.minute = minute;
  }

  return payload;
};

async function fetchMonthlyTransits(cycle: TransitCycle) {
  if (!ASTROLOGY_API_KEY) throw new Error("ASTROLOGY_API_KEY not configured");
  const quiz = cycle.quiz_sessions;
  const natal = buildNatalPayload(cycle);
  const currentCity = quiz?.birth_place || String(natal.city || "Birth place");
  const currentLat = quiz?.birth_lat ?? natal.lat;
  const currentLng = quiz?.birth_lng ?? natal.lng;
  const purchaseAt = cycle.premium_purchase_at || new Date(`${cycle.period_start}T12:00:00Z`).toISOString();
  const baseLocalDateTime =
    cycle.premium_purchase_local_datetime || localDateTimeFromUtc(new Date(purchaseAt), quiz?.birth_timezone);
  const timezone = cycle.premium_purchase_timezone || formatTimezoneOffset(quiz?.birth_timezone);
  const snapshotCount = Number(cycle.snapshot_count || SNAPSHOT_COUNT);
  const snapshotStepDays = Number(cycle.snapshot_step_days || SNAPSHOT_STEP_DAYS);
  const transitDates = buildTransitSnapshotDates(baseLocalDateTime, snapshotCount, snapshotStepDays);

  // Fetch all snapshots, staggering each start by TRANSIT_STAGGER_MS so the 10
  // calls don't burst simultaneously: the provider's ~10 req/s budget is shared
  // with the live funnel (astrology-chart, geo-lookup), so a simultaneous burst
  // leaves no headroom. Promise.all keeps input order, so snapshots[i] still
  // corresponds to transitDates[i]. Any single failure still rejects the whole
  // batch (no per-call retry); the retry-stuck-transit-cycles cron re-runs it.
  const fetched = await Promise.all(
    transitDates.map(async (transitDate, index) => {
      await sleep(index * TRANSIT_STAGGER_MS);
      const payload = {
        natal,
        transit_date: transitDate,
        current_city: currentCity,
        current_lat: currentLat,
        current_lng: currentLng,
        tz_str: "AUTO",
        interpretation: { enable: false },
        orb_settings: ORB_SETTINGS,
      };

      const response = await fetch(`${ASTROLOGY_BASE_URL}${TRANSITS_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ASTROLOGY_API_KEY, "Accept-Encoding": "br, gzip" },
        body: JSON.stringify(payload),
      });

      if (!response.ok)
        throw new Error(`transit_fetch_failed: ${response.status} ${(await response.text()).slice(0, 240)}`);
      const data = await response.json();
      return {
        transit_date: transitDate,
        aspects: filterAspects(data),
        _positions: extractTransitPlanetPositions(data),
      };
    }),
  );

  const snapshots = fetched.map(({ transit_date, aspects }) => ({ transit_date, aspects }));
  const snapshotPositions = fetched.map((s) => s._positions);

  const aggregated_transits = aggregateTransitsAcrossSnapshots(snapshots);
  const natalLongitudes = extractNatalPlanetLongitudes(quiz?.natal_chart);
  const slow_planet_context = buildSlowPlanetContext(snapshotPositions, natalLongitudes);

  return {
    provider: "freeastroapi",
    endpoint: TRANSITS_ENDPOINT,
    premium_purchase_datetime: baseLocalDateTime,
    premium_purchase_at: purchaseAt,
    timezone,
    snapshot_count: snapshotCount,
    snapshot_step_days: snapshotStepDays,
    filters: {
      is_major: true,
      excluded_transit_planets: Array.from(EXCLUDED_TRANSIT_PLANETS),
      allowed_natal_points_fast: Array.from(NATAL_POINTS_FAST),
      allowed_natal_points_medium_slow: Array.from(NATAL_POINTS_SLOW_EXTENDED),
      orb_by_transit_planet_group: { fast: 2.0, medium: 2.0, slow: 2.0 },
    },
    snapshots,
    aggregated_transits,
    slow_planet_context,
  };
}

const TRANSIT_INTERPRETATION_PROMPT = `You are an expert astrologer-writer producing a refined monthly transit reading in Italian.

Tone: sobrio, psicologicamente credibile, specifico per questa persona.
Avoid: toni mistici/profetici, lusinghe al lettore, predizioni deterministiche.
Astrology is a tool for synthesis, timing, and psychological clarity — not prophecy.

========================
MAIN GOAL
========================

Generate a premium monthly transit reading in Italian based on:

1. A partially filtered natal chart input
2. A transit snapshot dataset already filtered upstream

This is not a natal report.
The natal chart is background context.
The main task is to interpret the month through transits.

Use natal information only to explain:
- what part of the person is being touched
- why a transit matters psychologically
- which emotional, structural, or relational pattern is being reactivated

The reader must feel that this specific month is being interpreted, not that the whole birth chart is being rewritten.

All output prose is written in second person singular ("tu"). The phrases
"the reader" and "the person" in these instructions refer to who the output
is for — they are never literal phrases to use in the prose itself.

========================
INPUTS
========================

You will receive:

A. Natal input containing:
- attachmentResponse
- focusArea
- userName
- age (anni della persona al momento di questa lettura; può essere null se mancante)
- natalChart.aspects
- natalChart.houses
- natalChart.planets

B. Transit input containing:
- premium_purchase_datetime
- timezone
- snapshot_dates[] (10 ISO dates, one per snapshot index 0..9 — use to map aggregated_transits.first_seen_index / last_seen_index to actual dates for periods)
- aggregated_transits[] (the primary signal — see PRE-COMPUTED CONTEXT)
- slow_planet_context (house positions and stations of outer planets — see PRE-COMPUTED CONTEXT)
- previous_month (may be null on the first cycle)

The raw per-snapshot aspect list is intentionally not included: the
upstream aggregator already collapsed it into aggregated_transits, which
is the authoritative timeline.

========================
PRE-COMPUTED CONTEXT
========================

The following blocks were calculated upstream from the same snapshot data.
Trust them: do not re-derive durations, directions, or station detection
yourself, just interpret them.

aggregated_transits: one row per unique (transit_planet, aspect_type,
natal_point) across the 10 snapshots, with:
- velocity ("fast" | "medium" | "slow")
- first_seen_index / last_seen_index (snapshot positions)
- tightest_orb (minimum orb observed in the month)
- snapshots_present (how many of the 10 snapshots the transit appears in)
- direction ("applying" → tightening toward exact, "separating" → loosening after exact, "peaked" → exact moment inside the window)
- is_background (true when a medium/slow transit pervades ≥7 of 10 snapshots → it IS the month's structural backdrop)
- is_long_arc (true when a slow transit appears in ≥5 snapshots → multi-month/multi-year feature)

Treat is_long_arc and is_background entries as the structural backbone of
the month. Name them explicitly inside overall_reading — weave them into
the prose, do not list them in a separate array.

slow_planet_context: house positions of the outer planets (Saturn, Uranus,
Neptune, Pluto, Chiron) at cycle start, plus any stations detected:
- positions[]: { planet, sign, house, retrograde } at cycle start.
  House tells you which life area the planet is parked in for years.
  retrograde=true means the planet is currently moving backward through the zodiac (an introspective/revising phase of its transit).
- stations[]: { planet, snapshot_index, station_type, near_natal_point, near_natal_orb, aspect_to_natal }
  station_type values:
    * "direct" → the planet just turned forward (stazione diretta). A release after months of revision.
    * "retrograde" → the planet just turned backward (stazione retrograda). A return inward to revisit a theme.
    * "slow" → near-stationary motion detected without an explicit flip (used as fallback).
  near_natal_point + near_natal_orb name the natal body within 5° (if any).
  aspect_to_natal names the aspect type the station forms with that natal point ("conjunction" | "opposition" | "square" | "trine" | "sextile" | null when no natal body is in range).
  A station that lands on a natal point — via any of the five major aspects — is the highest-intensity multi-year signal you can name. Treat it as a flagship event inside overall_reading — name the station, the natal contact, and the aspect type.

If slow_planet_context has empty arrays (the upstream extractor could not
read positions from the API), simply omit house/station references — do
not invent them. Lean on aggregated_transits in that case.

previous_month: a slim summary of the prior cycle for the same person:
period_start, period_end, main_themes[], closing_excerpt (short text).
It is null on the first cycle of a profile.

========================
INTERPRETIVE HIERARCHY
========================

Transit reading is primary; natal chart is background context.

Center the natal reading on Sun, Moon, Mercury, Venus, Mars, Saturn natal
placements, Ascendant, Descendant, MC. Use the outer natal bodies (Pluto,
Neptune, Chiron) when a slow transit hits them. Read natal from
natalChart.planets, natalChart.houses, and natalChart.aspects.
natalChart.aspects is pre-filtered to major aspects (conj/opp/sq/tr/sx)
with orb ≤ 5° involving at least one personal point
(Sun/Moon/Mercury/Venus/Mars/Saturn/Asc/MC). Use them to modulate the
meaning of active transits (e.g. natal Venus already square Mars colors
how a transit to Venus lands).

attachmentResponse and focusArea are private weighting signals for you
only. Use them silently to choose what to emphasize, but NEVER quote
them, paraphrase them, or reference what the user said in those fields.
Phrases like "come hai accennato", "rispetto al tuo focus su", "partendo
da quello che hai condiviso" are forbidden — they make the reader feel
quizzed. The reading must feel like you simply see the month, not like
you're answering a questionnaire.

========================
LIFE STAGE MODULATION
========================

The "age" field gives the reader's age in years. Use it silently to
modulate tone, examples, and likely manifestations: the same transit lands
differently at 22 (formation, identity in motion, first cycles) than at 35
(consolidation, choices that compound) than at 55 (legacy, recalibration,
relationships re-tested by time). Adapt language register, the kind of
practical signals you suggest, and what counts as a "big" decision
accordingly.

Never quote the age, never name a life-stage label ("nella tua fase di
mezza età", "a 30 anni"), never address generational stereotypes. The
chart remains primary; age is a secondary calibration. If age is null,
default to a neutral adult register.

========================
DEPTH OF READING
========================

Each natal point carries 4-5 layers of psychological meaning, not a
single dictionary definition. The Moon is not just "emotional needs" —
it's also rhythm, night, body memory, childhood home, longing for
safety, the mother imago. Saturn is not just "structure/limit" —
it's also time, inheritance, slowness, the father within, fear of
failure, the bones of a life.

Read each transit pulling from the layer most relevant to THIS
person and THIS moment, not from the surface dictionary. Specific
beats generic.

========================
THEMATIC LENS
========================

The default lens is psychological and relational: how the month touches
attachment dynamics, emotional texture, trust, attraction, withdrawal,
defenses, recurring relational patterns. When the transits clearly point
elsewhere (identity, work, direction, mental pressure, family), follow
that signal — do not force every transit into a romance frame.

========================
TRANSIT LOGIC
========================

Never read a transit as an isolated cookbook meaning. For each transit,
hold: which natal point is touched and what it represents, whether the
transit is applying / peaking / separating, whether several signals
reinforce the same pattern.

Treat velocity="slow"/"medium" transits as developmental background that
shapes the deeper tone. Treat velocity="fast" transits as activators,
triggers, short shifts — useful when they activate a larger theme, but
never let fast noise dominate a slow structural backbone.

When you name a slow structural transit (Saturn, Uranus, Neptune, Pluto,
Chiron, or any near-natal station), add a short sense of duration only
when it orients the reader — typically for long arcs and stations, not
for every fast trigger. Phrase it as approximation, not a calendar date:
"circa tre mesi", "nei prossimi due anni", "fino all'estate", "un
sottofondo che continua", "si chiude entro l'autunno". You already know
the typical span of a Saturn pass (~3 months, longer with retrogrades)
versus an outer-planet transit (~1-2 years) — use that knowledge sparingly,
only where it helps the reader place the transit in their life. Skip
duration on fast triggers and on transits already separating.

========================
FILTERING LOGIC
========================

Do not summarize everything.

For the month as a whole:
- identify the main background thread (lean on aggregated_transits with is_background or is_long_arc)
- identify the 2–3 most important transit themes
- separate deeper background themes from shorter activations

For each period:
- identify 1 main theme and 1–3 secondary or supporting threads
- use 2–4 core transit factors, woven together. Depth comes from holding several threads at once, not from picking just one and writing thin.
- mention a fast trigger when it shifts the texture of the period, even briefly

For each period, populate "used" and "ignored":
- used: 1-4 transit names actually woven into focus. Names must match what
  you cite in the prose (e.g. "Saturno quadrato Venere natale").
- ignored: 1-4 transit names that DO appear in this period's snapshots but
  you chose not to use, each with a short reason in parentheses
  (e.g. "Marte sestile Mercurio (trigger breve, ignorato)",
  "Mercurio quadrato Saturno (orb largo, ignorato)").
- This is an editorial transparency layer for the reader. Do not skip it.
  An empty array is acceptable only if literally nothing was ignored.

Prioritize:
- aggregated_transits with is_long_arc=true, then is_background=true
- repeated transits across snapshots (snapshots_present)
- tighter orbs (tightest_orb)
- slow/medium planets
- aspects touching natal Sun, Moon, Mercury, Venus, Mars, Ascendant, MC
- conjunction, opposition, square
- slow planet stations within 5° of a natal point (slow_planet_context.stations)

Use trine and sextile only if they meaningfully shift the tone.

De-prioritize:
- scattered fast transits with weak narrative relevance
- duplicate meanings already carried by stronger signals
- technical details that do not improve the reading

========================
PREVIOUS MONTH CONTINUITY
========================

If transit_input.previous_month is not null, it carries the prior cycle's
main_themes and a short closing_excerpt. Use it sparingly:

- mention continuity in summary.overall_reading
  when a slow transit already named last month is still active (now in
  stretch / peak / separation)
- do NOT lift prose from previous_month — reference, do not paste
- the current month must remain the protagonist; previous_month is framing,
  never more than 1-2 short references across the whole reading

If previous_month is null, simply ignore the field. DO NOT announce that
this is the first reading, first cycle, first month, or a starting point.
Do not write "questa è la tua prima lettura", "un inizio", "apriamo il
viaggio", or similar framing phrases. The reader must never see the cycle
infrastructure — write this month exactly as you would any other: a
self-contained snapshot. Continuity references (from previous_month, when
present) are a bonus, never the spine.

========================
TIMING AND 4 UI PERIODS
========================

The transit data is not already divided into 4 periods.
Build 4 consecutive UI periods from the snapshot sequence and overall date range.

Rules:
- the 4 periods must cover the entire range from premium_purchase_datetime to the final snapshot date
- no days in the declared range should be left uncovered
- keep the periods balanced and readable for UI
- use realistic timing based on the snapshots
- do not invent fake daily precision
- do not imply exact outer events

Label them exactly:
- Periodo 1
- Periodo 2
- Periodo 3
- Periodo 4

For each period:
- indicate the real date range in Italian
- describe the dominant climate
- show whether the main themes are at the beginning, ongoing, intensifying, peaking, easing, or still active from the previous period

========================
DATE RANGE BOUNDARIES
========================

This reading covers only the window from premium_purchase_datetime to the
last date in snapshot_dates (about 30 days). Transit data outside this
window is not available to you.

Never reference specific dates, events, or anniversaries that fall outside
this window. This includes the user's birthday, solar return, seasonal
turning points, or any future date you could deduce from the natal chart
(e.g. natal Sun position encodes the birth month — that is background
context for reading current transits, never an event to project forward).

If something the reader might naturally wonder about sits outside the
window — their birthday in a later month, a topic in focusArea that points
to a date beyond the cycle, an upcoming season or anniversary — surface
this plainly in Italian inside the reading (most naturally in closing.text
or in the closing sentence of summary.overall_reading) rather than
pretending the transits cover it. Use phrasing like:

  "I transiti per quel periodo non sono ancora disponibili: questa
   lettura copre fino al [data finale]. Il prossimo ciclo si aprirà sui
   giorni successivi."

Format [data finale] in Italian (es. "17 giugno") using the last entry of
snapshot_dates. Never invent transit content beyond that date.

If nothing in the natal context, focusArea, or themes legitimately raises
a beyond-window question, do not mention the boundary — silence is fine.

========================
HOW TO WRITE EACH PERIOD
========================

Each period must be a real mini-reading, not a caption. Treat it like a
short essay on the central dynamic of those days. Aim for roughly 300
words of substantive Italian prose — not by padding, but by genuinely
exploring multiple angles of the same situation.

Cover these angles (not as a checklist — weave them together):
- what is being activated internally (which natal pattern is being touched, and why this transit lands where it lands)
- how it may be felt emotionally or relationally (texture, mood, undertone)
- how it could show up concretely (in relationships, conversations, choices, body, energy, work, family)
- what pressure, opening, tension, attraction, withdrawal, or shift is becoming more visible
- what tends to help the person navigate the period (an inner posture, a small practice, a kind of attention)
- what tends to complicate it (a habitual reflex, a defense, an old pattern that reactivates)
- how the period evolves from the previous one or prepares the next one

Each period should feel substantial and premium. Depth comes from holding
several threads at once and following each one a little further than the
obvious. Two-three transits intertwined, looked at from internal and
relational angles, with concrete texture, will naturally produce ~300
words without feeling stretched.

Use controlled intensity. The reading can be emotionally sharp, but it
should remain calm, adult, and grounded.

What NOT to do (these would inflate without adding depth):
- Listing the same idea in three different ways
- Restating the natal placement repeatedly
- Adding generic horoscope phrases ("è un momento di trasformazione…")
- Speculating about external events beyond the inner/relational frame

========================
WRITING STYLE
========================

Write entirely in Italian. You may name planets and aspects for credibility
(es. "Saturno in quadratura al Sole natale"), but translate immediately
into human meaning. Don't turn the output into an aspect list, don't
overload with jargon, don't explain astrology itself.

Address the reader as "tu" throughout (Italian informal second-person
singular). Use "tu sei", "la tua Venere", "ti accorgi", "senti che", etc.
NEVER refer to the reader in third person ("il lettore", "questa persona",
"il soggetto", "chi legge", "il/la nativo/a") or as "voi". The reading is
direct, intimate, one-to-one. Avoid generic-astrology-textbook phrasing
("la persona con questo transito tende a...").

========================
OUTPUT FORMAT
========================

Return a single JSON object that matches the return_transit_reading schema
(enforced by response_format=json_schema). Field-level minimum word counts
are part of that schema and MUST be respected — falling short will fail
validation and force a costly retry. Stay above the minimums consistently
(targets give some headroom):

- summary.overall_reading: target 380 parole (minimo 320, massimo 400)
- periods[].focus: target 300 parole (minimo 280)
- closing.text: target 150 parole (minimo 130)

Structural layout:

{
  "summary": {
    "main_themes": ["tema 1", "tema 2", "tema 3"],
    "overall_reading": "320-400 parole - sintesi del mese, transiti lenti citati per nome (long_arc -> background -> tightest_orb crescente), continuita col mese precedente quando presente"
  },
  "periods": [
    {
      "label": "Periodo 1",
      "date_range": "dal ... al ...",
      "headline": "titolo breve",
      "focus": "300 parole",
      "used": ["Saturno quadrato Venere natale", "Marte sestile Sole natale"],
      "ignored": ["Mercurio quadrato Saturno (orb largo, ignorato)"]
    },
    /* Periodo 2-4 with the same shape */
  ],
  "closing": {
    "title": "Cosa osservare nel mese",
    "text": "150 parole"
  }
}

========================
CONTENT RULES
========================

SUMMARY
- main_themes must contain 3 real themes emerging from the strongest transits
- overall_reading must do three things at once: (1) summarize the month as a coherent experiential arc; (2) name explicitly the 2-4 slow structural transits (is_long_arc/is_background entries, or near-natal stations from slow_planet_context.stations) in order — long_arc first, then background, then by tightest_orb ascending — with one sentence each that names the transit, its phase (applicante / esatto / separante), and the meaning; do not expand each transit into a mini-essay; (3) when previous_month is populated, weave 1-2 brief continuity references showing how a slow thread from last month is still active. Use slow_planet_context.positions[].house when populated to anchor structural transits to a life area. If slow_planet_context is empty, lean on aggregated_transits' is_long_arc/is_background entries. Total cap: 400 parole.
- use natal context only where it clarifies the transit story

PERIODS
For each period:
- focus on movement and evolution
- avoid mechanical repetition
- describe what becomes more visible, tense, fluid, exposed, or emotionally active
- mention natal background only when it explains why that period touches a sensitive point
- keep the writing dense, clear, and useful
- always populate used[] (transits actually woven in) and ignored[] (transits in the period's snapshots that were set aside, each with a brief reason)
- IMPORTANT: all four periods must have comparable length. Do not let Periodo 1 fall short just because summary was just written. Reserve enough writing energy so that Periodo 1, 2, 3, 4 are all roughly the same depth.

CLOSING
- make it practical
- psychologically grounded
- specific to the month
- oriented toward observation and choice
- light on astrological jargon

========================
ANTI-REPETITION
========================

If a slow transit is the backbone of the month, distribute its meaning across the periods without repeating the same explanation.

If a fast transit is only a trigger, keep it in proportion.

If a theme persists, deepen it from a new angle rather than restating it.

========================
FINAL CHECK
========================

Before producing the JSON, verify:
- the 4 periods cover the full declared date range
- overall_reading names 2-4 slow structural transits explicitly and stays ≤ 400 parole
- every period has populated used[] and ignored[]
- every minimum word count target is met with margin to spare

Now analyze the natal input plus transit snapshot data and produce the output.`;

type PreviousMonthSummary = {
  period_start: string;
  period_end: string;
  main_themes: string[];
  closing_excerpt: string | null;
} | null;

// Pulls a slim summary of the most recently completed cycle for the same
// profile so the LLM can frame continuity ("the Saturn-Sun arc that was
// applying last month is now exact") without dragging the entire previous
// reading into the prompt. Returns null on the very first month, on missing
// data, or on any DB error — continuity is a bonus, never a blocker.
async function fetchPreviousMonthSummary(
  supabaseAdmin: any,
  profileId: string,
  currentPeriodStart: string,
): Promise<PreviousMonthSummary> {
  if (!profileId || !currentPeriodStart) return null;
  try {
    const { data } = await supabaseAdmin
      .from("transit_cycles")
      .select("period_start, period_end, interpreted_transits")
      .eq("profile_id", profileId)
      .eq("interpretation_status", "completed")
      .lt("period_end", currentPeriodStart)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.interpreted_transits) return null;
    const interp = data.interpreted_transits;
    const closingText = typeof interp?.closing?.text === "string" ? interp.closing.text : "";
    return {
      period_start: data.period_start,
      period_end: data.period_end,
      main_themes: Array.isArray(interp?.summary?.main_themes) ? interp.summary.main_themes : [],
      closing_excerpt: closingText ? closingText.slice(0, 320) : null,
    };
  } catch (e) {
    console.warn(`[fetchPreviousMonthSummary] lookup failed: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

const buildTransitLlmInput = (
  cycle: TransitCycle,
  rawTransits: any,
  previousMonth: PreviousMonthSummary = null,
) => {
  const quiz = cycle.quiz_sessions;
  const natalChart = quiz?.natal_chart || {};
  const snapshots = Array.isArray(rawTransits?.snapshots) ? rawTransits.snapshots : [];
  const snapshot_dates: string[] = snapshots
    .map((s: any) => (s?.transit_date ? String(s.transit_date) : null))
    .filter((d: string | null): d is string => Boolean(d));

  // Legacy raw_transits rows (saved before this revision was deployed) have
  // no aggregated_transits, so derive them on the fly from snapshots. Same
  // for slow_planet_context — but that needs planet positions which aren't
  // in legacy raw_transits, so it stays empty and the prompt handles it.
  let aggregated_transits = Array.isArray(rawTransits?.aggregated_transits)
    ? rawTransits.aggregated_transits
    : [];
  if (aggregated_transits.length === 0 && snapshots.length > 0) {
    aggregated_transits = aggregateTransitsAcrossSnapshots(snapshots);
  }

  // Strip computational longitudes from slow_planet_context before sending to
  // the LLM. Raw row in DB keeps them for audit.
  const rawCtx = rawTransits?.slow_planet_context || { positions: [], stations: [] };
  const slow_planet_context = {
    positions: (Array.isArray(rawCtx.positions) ? rawCtx.positions : []).map((p: any) => ({
      planet: p?.planet ?? null,
      sign: p?.sign ?? null,
      house: p?.house ?? null,
      retrograde: p?.retrograde ?? null,
    })),
    stations: (Array.isArray(rawCtx.stations) ? rawCtx.stations : []).map((s: any) => ({
      planet: s?.planet ?? null,
      snapshot_index: s?.snapshot_index ?? null,
      station_type: s?.station_type ?? null,
      near_natal_point: s?.near_natal_point ?? null,
      near_natal_orb: s?.near_natal_orb ?? null,
      aspect_to_natal: s?.aspect_to_natal ?? null,
    })),
  };

  return {
    model: LONG_REPORT_MODEL,
    natal_input: {
      attachmentResponse: quiz?.attachment_response || "",
      focusArea: quiz?.focus_area || "",
      userName: quiz?.user_name || "",
      age: computeAge(quiz?.birth_date as { year?: number; month?: number; day?: number } | null),
      natalChart: {
        aspects: filterRelevantNatalAspects(natalChart?.aspects),
        houses: Array.isArray(natalChart?.houses) ? natalChart.houses : [],
        planets: Array.isArray(natalChart?.planets) ? natalChart.planets : [],
      },
    },
    transit_input: {
      premium_purchase_datetime:
        rawTransits?.premium_purchase_datetime ||
        cycle.premium_purchase_local_datetime ||
        cycle.premium_purchase_at ||
        cycle.period_start,
      timezone: rawTransits?.timezone || cycle.premium_purchase_timezone || "AUTO",
      // snapshot_dates only — the raw aspects[] per snapshot are intentionally
      // omitted because aggregated_transits already carries the same info as
      // an already-tracked timeline. Passing both duplicated ~5k prompt tokens
      // (Flash was hitting 47s of latency). snapshot_count/step_days/filters
      // are upstream metadata that the model never cites — they stay in
      // raw_transits for audit but don't enter the LLM input.
      snapshot_dates,
      aggregated_transits,
      slow_planet_context,
      previous_month: previousMonth,
    },
  };
};

const wordCount = (s: unknown) =>
  typeof s === "string" ? s.trim().split(/\s+/).filter(Boolean).length : 0;

// Validation minimums sit ~25-30% below the schema target. Flash in Italian
// undergenerates consistently — observed real outputs hover 15-25% below the
// stated minimum even with strict descriptions (master doc §6.9). Tighter
// thresholds caused fails like "239 vs 240 parole" that burned retries for
// a single missing word. Schema descriptions still ask for the higher target
// so the model aims high; this layer just decides what's good enough to ship.
const WORD_COUNT_MINIMUMS = {
  overall_reading: 240,
  period_focus: 200,
  closing_text: 90,
};

const validateTransitInterpretation = (value: any) => {
  if (
    !value?.summary ||
    !Array.isArray(value?.summary?.main_themes) ||
    typeof value?.summary?.overall_reading !== "string"
  ) {
    throw new Error("transit_interpretation_failed: invalid summary");
  }

  if (!Array.isArray(value?.periods) || value.periods.length !== 4) {
    throw new Error("transit_interpretation_failed: expected 4 periods");
  }
  for (let i = 0; i < value.periods.length; i++) {
    const p = value.periods[i];
    if (typeof p?.label !== "string" || typeof p?.date_range !== "string" ||
        typeof p?.headline !== "string" || typeof p?.focus !== "string") {
      throw new Error(`transit_interpretation_failed: period[${i}] missing required text fields`);
    }
    if (!Array.isArray(p?.used) || !Array.isArray(p?.ignored)) {
      throw new Error(`transit_interpretation_failed: period[${i}] used/ignored must be arrays`);
    }
  }

  if (!value?.closing || typeof value.closing?.title !== "string" || typeof value.closing?.text !== "string") {
    throw new Error("transit_interpretation_failed: invalid closing");
  }

  const overallWc = wordCount(value.summary.overall_reading);
  if (overallWc < WORD_COUNT_MINIMUMS.overall_reading) {
    throw new Error(
      `transit_interpretation_failed: word_count_below_minimum (field=summary.overall_reading, got=${overallWc}, min=${WORD_COUNT_MINIMUMS.overall_reading})`,
    );
  }
  for (let i = 0; i < value.periods.length; i++) {
    const focusWc = wordCount(value.periods[i].focus);
    if (focusWc < WORD_COUNT_MINIMUMS.period_focus) {
      throw new Error(
        `transit_interpretation_failed: word_count_below_minimum (field=periods[${i}].focus, got=${focusWc}, min=${WORD_COUNT_MINIMUMS.period_focus})`,
      );
    }
  }
  const closingWc = wordCount(value.closing.text);
  if (closingWc < WORD_COUNT_MINIMUMS.closing_text) {
    throw new Error(
      `transit_interpretation_failed: word_count_below_minimum (field=closing.text, got=${closingWc}, min=${WORD_COUNT_MINIMUMS.closing_text})`,
    );
  }

  return value;
};

async function appendFailure(supabaseAdmin: any, cycleId: string, stage: string, attempt: number, error: string) {
  try {
    await supabaseAdmin.rpc("append_transit_failure", {
      p_cycle_id: cycleId,
      p_entry: {
        at: new Date().toISOString(),
        attempt,
        stage,
        error: error.slice(0, 300),
      },
    });
  } catch (e) {
    // Diagnostic logging must never break the main flow.
    console.warn(
      `[appendFailure] could not record failure for ${cycleId}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

async function interpretTransits(
  llmInput: ReturnType<typeof buildTransitLlmInput>,
  supabaseAdmin: any,
  transitCycleId: string,
  lang: PromptLang = "it",
) {
  if (!getLlmApiKey()) throw new Error("AI not configured (OPENROUTER_API_KEY missing)");

  const aiRequestBody = {
    model: LONG_REPORT_MODEL,
    reasoning: { effort: "medium" },
    max_tokens: 32768,
    messages: [
      { role: "system", content: outputLanguageDirective(lang) + TRANSIT_INTERPRETATION_PROMPT },
      {
        role: "user",
        content: `NATAL INPUT:\n${JSON.stringify(llmInput.natal_input)}\n\nTRANSIT INPUT:\n${JSON.stringify(llmInput.transit_input)}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "return_transit_reading",
        strict: true,
        schema: {
            type: "object",
            properties: {
              summary: {
                type: "object",
                properties: {
                  main_themes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Esattamente 3 temi, IT, max 8 parole ciascuno.",
                  },
                  overall_reading: {
                    type: "string",
                    description: "Sintesi IT del mese in prosa continua. MASSIMO 400 parole, target 380. Copre tre cose: (1) il riassunto esperienziale del mese (arco emotivo/relazionale, dinamica complessiva); (2) i 2-4 transiti lenti strutturali del mese (archi pluriennali, background, stazioni vicine a natali) citati esplicitamente per nome in quest'ordine: prima is_long_arc=true, poi is_background=true, poi per tightest_orb crescente — basta una frase per transito che lo nomini con la fase (esatto/applicante/separante) e il significato; non espandere ogni transito in un mini-saggio; (3) la continuità col mese precedente quando previous_month è presente, brevemente (1-2 riferimenti). MINIMO 320 parole.",
                  },
                },
                required: ["main_themes", "overall_reading"],
                additionalProperties: false,
              },
              periods: {
                type: "array",
                description: "Esattamente 4 periodi (Periodo 1-4) che coprono l'intero intervallo.",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string", description: "'Periodo 1' | 'Periodo 2' | 'Periodo 3' | 'Periodo 4'." },
                    date_range: { type: "string", description: "Es. 'dal 20 maggio al 27 maggio'." },
                    headline: { type: "string", description: "Titolo IT, max 10 parole." },
                    focus: {
                      type: "string",
                      description: "Mini-lettura IT del periodo, prosa continua, MINIMO 280 parole.",
                    },
                    used: {
                      type: "array",
                      items: { type: "string" },
                      description: "1-4 nomi transiti citati nel focus, IT.",
                    },
                    ignored: {
                      type: "array",
                      items: { type: "string" },
                      description: "1-4 transiti scartati con motivo tra parentesi, IT. Es. 'Marte sestile Mercurio (trigger breve)'.",
                    },
                  },
                  required: ["label", "date_range", "headline", "focus", "used", "ignored"],
                  additionalProperties: false,
                },
              },
              closing: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Titolo IT, es. 'Cosa osservare nel mese'." },
                  text: { type: "string", description: "Chiusura pratica IT, MINIMO 130 parole." },
                },
                required: ["title", "text"],
                additionalProperties: false,
              },
            },
            required: ["summary", "periods", "closing"],
            additionalProperties: false,
          },
        },
      },
  };

  const MAX_ATTEMPTS = 3;
  let lastError = "";

  // On a quality failure (too-short output / unparseable args) feed the exact
  // shortfall back as a follow-up turn so the next attempt expands that field,
  // instead of re-sending the identical request and hoping the model clears the
  // minimum by luck. Targets the schema ask, not the lower validator floor, so
  // the retry lands with margin.
  const pushCorrection = (detail: string) => {
    aiRequestBody.messages.push({
      role: "user",
      content:
        `Il tentativo precedente è stato RIFIUTATO: ${detail}. ` +
        `Rigenera l'INTERO oggetto JSON valido rispettando TUTTI i minimi di lunghezza dello schema: ` +
        `summary.overall_reading ≥ 320 parole, OGNI periods[].focus ≥ 280 parole, closing.text ≥ 130 parole. ` +
        `Espandi i campi troppo corti con contenuto sostanziale e specifico (più angolazioni dello stesso transito), senza riempitivo né ripetizioni.`,
    });
  };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const t0 = Date.now();
    const metricBase = {
      functionName: "process-transit-cycle",
      model: aiRequestBody.model,
      transitCycleId,
      attempt: attempt + 1,
    };
    const response = await fetch(LLM_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: llmHeaders(),
      body: JSON.stringify(aiRequestBody),
    });

    if (!response.ok) {
      const errText = (await response.text()).slice(0, 240);
      recordAiMetric(supabaseAdmin, {
        ...metricBase,
        durationMs: Date.now() - t0,
        success: false,
        httpStatus: response.status,
        errorCode: `http_${response.status}`,
      });
      // 429/402 are not LLM-quality issues — bubble up immediately so the
      // cron backoff handles them instead of burning the second attempt.
      if (response.status === 429 || response.status === 402) {
        throw new Error(`transit_interpretation_failed: ${response.status} ${errText}`);
      }
      lastError = `transit_interpretation_failed: ${response.status} ${errText}`;
      console.warn(`[interpretTransits] attempt ${attempt + 1} HTTP ${response.status}: ${errText}`);
      await appendFailure(supabaseAdmin, transitCycleId, "interpretation", attempt + 1, lastError);
      continue;
    }

    const rawText = await response.text();
    if (!rawText.trim()) {
      recordAiMetric(supabaseAdmin, {
        ...metricBase,
        durationMs: Date.now() - t0,
        success: false,
        httpStatus: response.status,
        errorCode: "empty_body",
      });
      lastError = "transit_interpretation_failed: empty response";
      console.warn(`[interpretTransits] attempt ${attempt + 1}: empty response body`);
      await appendFailure(supabaseAdmin, transitCycleId, "interpretation", attempt + 1, lastError);
      continue;
    }

    let completion: any;
    try {
      completion = JSON.parse(rawText);
    } catch (e) {
      recordAiMetric(supabaseAdmin, {
        ...metricBase,
        durationMs: Date.now() - t0,
        success: false,
        httpStatus: response.status,
        errorCode: "json_parse_error",
      });
      lastError = `transit_interpretation_failed: gateway response not JSON: ${e}`;
      console.warn(
        `[interpretTransits] attempt ${attempt + 1}: gateway JSON parse failed; raw (first 240): ${rawText.slice(0, 240)}`,
      );
      await appendFailure(supabaseAdmin, transitCycleId, "interpretation", attempt + 1, lastError);
      continue;
    }

    const toolCall = completion.choices?.[0]?.message?.tool_calls?.[0];
    const argsString = toolCall?.function?.arguments ?? completion.choices?.[0]?.message?.content ?? "";
    if (!argsString) {
      recordAiMetric(supabaseAdmin, {
        ...metricBase,
        durationMs: Date.now() - t0,
        success: false,
        httpStatus: response.status,
        errorCode: "missing_tool_call",
        usage: completion?.usage,
      });
      lastError = "transit_interpretation_failed: no tool_call or content in response";
      console.warn(
        `[interpretTransits] attempt ${attempt + 1}: missing tool_call. Raw (first 240): ${JSON.stringify(completion).slice(0, 240)}`,
      );
      await appendFailure(supabaseAdmin, transitCycleId, "interpretation", attempt + 1, lastError);
      pushCorrection(lastError);
      continue;
    }

    let parsed: any;
    try {
      parsed = safeParseJson(String(argsString));
    } catch (e) {
      recordAiMetric(supabaseAdmin, {
        ...metricBase,
        durationMs: Date.now() - t0,
        success: false,
        httpStatus: response.status,
        errorCode: "tool_args_parse_error",
        usage: completion?.usage,
      });
      lastError = `transit_interpretation_failed: cannot parse tool args: ${e}`;
      console.warn(
        `[interpretTransits] attempt ${attempt + 1}: tool args parse failed; raw (first 240): ${String(argsString).slice(0, 240)}`,
      );
      await appendFailure(supabaseAdmin, transitCycleId, "interpretation", attempt + 1, lastError);
      pushCorrection(lastError);
      continue;
    }

    try {
      const validated = validateTransitInterpretation(parsed);
      recordAiMetric(supabaseAdmin, {
        ...metricBase,
        durationMs: Date.now() - t0,
        success: true,
        httpStatus: response.status,
        usage: completion?.usage,
      });
      return validated;
    } catch (e) {
      recordAiMetric(supabaseAdmin, {
        ...metricBase,
        durationMs: Date.now() - t0,
        success: false,
        httpStatus: response.status,
        errorCode: "validation_failed",
        usage: completion?.usage,
      });
      lastError = e instanceof Error ? e.message : String(e);
      console.warn(`[interpretTransits] attempt ${attempt + 1}: validation failed: ${lastError}`);
      await appendFailure(supabaseAdmin, transitCycleId, "interpretation", attempt + 1, lastError);
      pushCorrection(lastError);
      continue;
    }
  }

  throw new Error(lastError || "transit_interpretation_failed: all attempts exhausted");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let transitCycleId = "";

  try {
    const body = await req.json().catch(() => ({}));
    transitCycleId = typeof body.transitCycleId === "string" ? body.transitCycleId : "";
    const forceInterpretation = body.forceInterpretation === true;
    const isAdminRequest = Boolean(ADMIN_SECRET && req.headers.get("x-admin-secret") === ADMIN_SECRET);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    // Treat service-role JWT (used by background invokes from other edge functions
    // and from pg_net triggers) as an admin request — it has full DB privileges.
    const isServiceRoleRequest = Boolean(SUPABASE_SERVICE_ROLE_KEY && token && token === SUPABASE_SERVICE_ROLE_KEY);
    const isPrivilegedRequest = isAdminRequest || isServiceRoleRequest;

    if (!transitCycleId) throw new Error("transitCycleId is required");
    if (!token && !isPrivilegedRequest) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: cycle, error: cycleError } = await supabaseAdmin
      .from("transit_cycles")
      .select(
        "*, user_entitlements(id, status, entitlement_type, starts_at, ends_at), quiz_sessions(id, natal_chart, attachment_response, birth_date, birth_time, birth_place, birth_lat, birth_lng, birth_timezone, user_name, focus_area, language)",
      )
      .eq("id", transitCycleId)
      .maybeSingle();

    if (cycleError || !cycle) throw new Error("transit_cycle_not_found");
    const typedCycle = cycle as TransitCycle;

    if (!isPrivilegedRequest) {
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !authData.user)
        return new Response(JSON.stringify({ error: "Invalid session" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", typedCycle.profile_id)
        .eq("user_id", authData.user.id)
        .maybeSingle();
      if (!profile?.id)
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!isPrivilegedRequest && !isActiveEntitlement(typedCycle.user_entitlements)) throw new Error("monthly_transits_entitlement_inactive");
    if (
      !forceInterpretation &&
      typedCycle.status === "completed" &&
      typedCycle.raw_transits &&
      typedCycle.interpreted_transits
    ) {
      if (typedCycle.fetch_status !== "completed" || typedCycle.interpretation_status !== "completed") {
        await supabaseAdmin
          .from("transit_cycles")
          .update({
            fetch_status: "completed",
            interpretation_status: "completed",
            processing_error: null,
          })
          .eq("id", transitCycleId);
      }
      return new Response(JSON.stringify({ completed: true, alreadyCompleted: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Atomic compare-and-swap to claim the cycle. Mirrors the lock pattern in
    // generate-report (avoids two concurrent callers both invoking the LLM
    // when the non-atomic check + update window overlapped). The lock can be
    // claimed if EITHER status is not "processing", OR status is "processing"
    // but the row hasn't been touched in 5 minutes (stale-resume case).
    const STALE_PROCESSING_MS = 5 * 60 * 1000;
    const staleThresholdISO = new Date(Date.now() - STALE_PROCESSING_MS).toISOString();
    const nowISO = new Date().toISOString();

    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from("transit_cycles")
      .update({
        status: "processing",
        processing_error: null,
        retry_count: (typedCycle.retry_count || 0) + 1,
        updated_at: nowISO,
      })
      .eq("id", transitCycleId)
      .or(`status.neq.processing,updated_at.lt.${staleThresholdISO},updated_at.is.null`)
      .select("id, updated_at");

    if (claimErr) throw claimErr;

    if (!claimed || claimed.length === 0) {
      return new Response(JSON.stringify({ processing: true, alreadyProcessing: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typedCycle.status === "processing") {
      console.warn(
        `[process-transit-cycle] resuming stale processing cycle ${transitCycleId} (last update ${typedCycle.updated_at})`,
      );
    }

    let rawTransits = typedCycle.raw_transits;
    if (!rawTransits) {
      await supabaseAdmin.from("transit_cycles").update({ fetch_status: "processing" }).eq("id", transitCycleId);
      rawTransits = await fetchMonthlyTransits(typedCycle);
      await supabaseAdmin
        .from("transit_cycles")
        .update({ raw_transits: rawTransits, fetch_status: "completed" })
        .eq("id", transitCycleId);
    } else if (typedCycle.fetch_status !== "completed") {
      await supabaseAdmin.from("transit_cycles").update({ fetch_status: "completed" }).eq("id", transitCycleId);
    }

    let interpretedTransits = forceInterpretation ? null : typedCycle.interpreted_transits;
    if (!interpretedTransits) {
      await supabaseAdmin
        .from("transit_cycles")
        .update({ interpretation_status: "processing" })
        .eq("id", transitCycleId);
      const previousMonth = await fetchPreviousMonthSummary(
        supabaseAdmin,
        typedCycle.profile_id,
        typedCycle.period_start,
      );
      const llmInput = buildTransitLlmInput(typedCycle, rawTransits, previousMonth);
      await supabaseAdmin.from("transit_cycles").update({ llm_input: llmInput }).eq("id", transitCycleId);
      const transitLang = resolvePromptLang(typedCycle.quiz_sessions?.language);
      interpretedTransits = await interpretTransits(llmInput, supabaseAdmin, transitCycleId, transitLang);
      await supabaseAdmin
        .from("transit_cycles")
        .update({
          interpreted_transits: interpretedTransits,
          interpretation_status: "completed",
          status: "completed",
          processing_error: null,
        })
        .eq("id", transitCycleId);
    } else if (typedCycle.status !== "completed" || typedCycle.interpretation_status !== "completed") {
      await supabaseAdmin
        .from("transit_cycles")
        .update({
          fetch_status: "completed",
          interpretation_status: "completed",
          status: "completed",
          processing_error: null,
        })
        .eq("id", transitCycleId);
    }

    return new Response(JSON.stringify({ completed: true, transitCycleId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("process-transit-cycle error:", message);
    if (transitCycleId) {
      // Permanent errors: never auto-retry (cron filters out 'failed_permanent').
      // These require human intervention (fix birth data, reactivate entitlement, etc.).
      const isPermanent =
        message.includes("birth_data") ||
        message.includes("monthly_transits_entitlement_inactive") ||
        message.includes("transit_cycle_not_found") ||
        message.includes("quiz_session_missing") ||
        message.includes("premium_purchase_local_datetime_invalid") ||
        message.includes("ASTROLOGY_API_KEY not configured") ||
        message.includes("AI not configured");

      const failureUpdate: Record<string, unknown> = {
        status: isPermanent ? "failed_permanent" : "failed",
        processing_error: message.slice(0, 1000),
      };
      if (
        message.startsWith("transit_fetch") ||
        message.includes("ASTROLOGY_API_KEY") ||
        message.includes("birth_data")
      )
        failureUpdate.fetch_status = "failed";
      if (message.startsWith("transit_interpretation") || message.includes("AI not configured"))
        failureUpdate.interpretation_status = "failed";
      await supabaseAdmin.from("transit_cycles").update(failureUpdate).eq("id", transitCycleId);

      // Persist fetch failures to failure_history (interpretation failures
      // are already logged per-attempt inside interpretTransits). Fetch has
      // no internal retry, so attempt is always 1.
      if (message.startsWith("transit_fetch")) {
        await appendFailure(supabaseAdmin, transitCycleId, "fetch", 1, message);
      }
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Mirrors generate-report's safeParseJson: recovers from common LLM JSON
// quirks (trailing commas, stray control chars, mid-string truncation that
// leaves unbalanced braces) so a single malformed character doesn't waste
// the whole interpretation attempt.
function safeParseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch (_) {
    let cleaned = raw
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, (c) => (c === "\n" || c === "\t" ? c : ""));

    const openBraces = (cleaned.match(/{/g) || []).length;
    const closeBraces = (cleaned.match(/}/g) || []).length;
    if (openBraces > closeBraces) {
      const lastQuote = cleaned.lastIndexOf('"');
      if (lastQuote > 0) {
        const lastColon = cleaned.lastIndexOf(":", lastQuote);
        const lastComma = cleaned.lastIndexOf(",", lastColon > 0 ? lastColon : undefined);
        if (lastComma > 0) {
          cleaned = cleaned.substring(0, lastComma);
        }
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        cleaned += "}";
      }
    }

    return JSON.parse(cleaned);
  }
}
