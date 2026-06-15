// Server-owned background generation of natal charts and teaser insights.
// Survives browser disconnect: returns 202 immediately and continues
// generation via EdgeRuntime.waitUntil, persisting status in quiz_sessions.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { recordAiMetric } from "../_shared/ai-metrics.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { resolvePromptLang, outputLanguageDirective, type PromptLang } from "../_shared/prompts/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const ASTROLOGY_API_KEY = Deno.env.get("ASTROLOGY_API_KEY")!;
const ASTROLOGY_BASE_URL = "https://api.freeastroapi.com/api/v1/natal/calculate";
const ASTROLOGY_CHART_URL = "https://api.freeastroapi.com/api/v1/natal/chart/";

type QuizSession = {
  id: string;
  natal_chart: any;
  natal_chart_svg: string | null;
  natal_chart_png: string | null;
  birth_date: any;
  birth_time: any;
  birth_place: string | null;
  birth_lat: number | null;
  birth_lng: number | null;
  birth_timezone: number | null;
  birth_timezone_iana: string | null;
  attachment_response: string | null;
  focus_area: string | null;
  user_name: string | null;
  teaser_insights: any;
  processing_status: string;
  funnel_slug: string | null;
  quiz_answers: Record<string, string> | null;
  language: string | null;
};

// Chart styling matches the warm editorial palette of the brand.
const CHART_CONFIG = {
  stroke_opacity: 1,
  font_size_fraction: 0.4,
  ring_thickness_fraction: 0.13,
  sign_ring_thickness_fraction: 0.14,
  house_ring_thickness_fraction: 0.06,
  center_disk_fraction: 0.52,
  planet_symbol_scale: 0.55,
  sign_symbol_scale: 0.6,
  house_number_scale: 0.35,
  custom_planet_color: "#8D4A35",
  custom_sign_color: "#A7654A",
  custom_house_color: "#8D4A35",
  custom_sign_bg_color: null,
  custom_house_bg_color: null,
  sign_symbol_stroke_width: 2.1,
  sign_line_width: 1.5,
  sign_line_color: "black",
  house_line_width: 1,
  house_line_color: "#919191",
  sign_ring_inner_width: 1.5,
  sign_ring_inner_color: "#000000",
  sign_ring_outer_width: 2,
  sign_ring_outer_color: "#000000",
  house_ring_inner_width: 1,
  house_ring_inner_color: "#000000",
  house_ring_outer_width: 1,
  house_ring_outer_color: "#000000",
  asc_line_width: 3,
  asc_line_color: "#000000",
  dsc_line_width: 3,
  dsc_line_color: "#000000",
  mc_line_width: 3,
  mc_line_color: "#000000",
  ic_line_width: 3,
  ic_line_color: "#000000",
  sign_tick_width: 0.5,
  sign_tick_color: "#000000",
  aspect_conjunction_width: 3,
  aspect_conjunction_color: "#300303",
  aspect_opposition_width: 3,
  aspect_opposition_color: "#655106",
  aspect_trine_width: 2.2,
  aspect_trine_color: "#5e0808",
  aspect_square_width: 2.6,
  aspect_square_color: "#401574",
  aspect_sextile_width: 1.9,
  aspect_sextile_color: "#466600",
  aspect_quincunx_width: 1.7,
  aspect_quincunx_color: "#2E7D32",
  houses_inside_planets: true,
};

const CHART_DISPLAY_SETTINGS = {
  sun: true,
  moon: true,
  mercury: true,
  venus: true,
  mars: true,
  jupiter: true,
  saturn: true,
  uranus: true,
  neptune: true,
  pluto: true,
  north_node: true,
  asc: true,
  chiron: true,
  lilith: true,
};

// Single source of truth for teaser-stage relationship insights.
const SYSTEM_PROMPT = `You are a psychologically sophisticated astrologer focused on relational dynamics.

Write in natural Italian. The tone must be human, sober, lucid, emotionally precise, and credible.
Do not sound mystical, generic, predictive, literary, or like horoscope content.

OBJECTIVE
Generate exactly 3 short personalized insights about the person’s relational patterns.

This is teaser-stage copy, not the full reading.

The output must feel:
- grounded in a real natal chart
- psychologically sharp
- specific enough to create recognition
- incomplete enough to create curiosity
- readable and immediate on mobile

SOURCE PRIORITY
1. Natal chart
2. Strong relational configurations in the chart
3. Context answers (secondary, only for emphasis)

CONTEXT ANSWERS (IMPORTANT)
If provided, context answers include:
- "attachmentResponse": a tendency in how the person reacts in relationships (e.g. seeking more contact, distancing, needing space)
- "focusArea": the area of relational experience that feels most relevant to them (e.g. repeating patterns)

Interpret them as soft signals, not facts.

Rules:
- Use them only if clearly supported by the natal chart
- If the chart does not support them, ignore them
- Never restate them directly
- Never build an insight primarily from them
- The chart must always lead, context can only adjust emphasis

ASTROLOGICAL FOCUS
Base the interpretation mainly on:
- Venus (relational style and attraction)
- Moon (emotional needs and sensitivity)
- Mars (relational action and defense)
- Descendant / 7th house
- tight major aspects involving Venus, Moon, Mars, Saturn, Pluto, Neptune
- Ascendant only if it clearly shapes relational style or defense

ASPECT SELECTION RULES
Use ONLY major aspects:
- conjunction
- opposition
- square
- trine
- sextile

Do NOT use:
- quincunx / inconjunct
- semi-sextile
- octile
- sesquiquadrate
- quintile
- septile
- minor aspects of any kind

IMPORTANT:
If an aspect list is provided, do not trust it blindly.
When planetary degrees are available, estimate the orb and ignore aspects that exceed the limits below.

ASPECT ORB FILTER
Use this practical priority system:

Use an aspect only if it is strong enough:

- orb <= 3°: always relevant
- orb <= 5°: relevant if it involves Venus, Moon, Mars, Ascendant, Descendant, Saturn, Pluto, or Neptune
- orb <= 6°: allowed only for Sun or Moon in conjunction, opposition, square, or trine, and only if it clearly adds relational meaning
- sextiles should stay tighter: usually max 4°

For Uranus, Neptune, and Pluto:
- use them only if they aspect Venus, Moon, Mars, Ascendant, or Descendant
- keep them relatively tight

Ignore:
- minor aspects
- broad aspects
- aspects that do not clearly support the relational reading

INTERPRETIVE FOCUS
Focus on:
- how the person enters relationships
- emotional needs and attachment sensitivity
- how they react to distance, ambiguity, or inconsistency
- how they protect themselves
- recurring romantic patterns
- what they are truly seeking in love beneath defenses

INTERPRETIVE LIMITS
Do NOT:
- use minor aspects
- use Vertex, Fortune or asteroids
- rely on weak or broad signals
- invent patterns not clearly supported by the chart
- make strong claims from one isolated placement
- give equal weight to all listed aspects

ASTROLOGICAL REFERENCE RULE
You may include at most 2 explicit astrological reference across the full output, only if it adds credibility and clarity.
No jargon, no lists, no textbook tone.
Prefer lived psychological description over chart terminology.

TEASER RULE
This is not the full reading.
Do not resolve the pattern completely.
Do not explain the full cause of the pattern.
Do not create full emotional closure.
Reveal something real, but leave an important layer still open.
The user should feel: “this sees something true, and I want to understand the rest.”

STYLE RULES
- Avoid zodiac clichés
- Avoid generic self-help phrasing
- Avoid flattery
- Avoid prediction
- Avoid deterministic tone
- Avoid repetition
- Avoid overly elegant or poetic phrasing
- Prefer short, immediate, recognizable language

OUTPUT REQUIREMENTS
Produce exactly 3 insights.

Each insight must contain:
- "title": max 8 words, in Italian
- "body": 2–3 sentences, max 50 words, in Italian

CONTENT REQUIREMENTS
- Each insight must cover a different angle
- At least one: recurring romantic pattern
- At least one: reaction to distance or ambiguity
- At least one: what the person is truly seeking in love
- If a pattern is not clearly supported by the chart, omit it
- At least one insight should remain slightly unresolved rather than fully explained

TITLE RULES
Titles must be concrete, immediate, and recognizable. Not abstract or poetic.

Respond ONLY with the required tool call.`;

// Teaser system prompt for the "attivazione" angle: people who feel stuck —
// not in love but in *movement*. The 3 insights cover activation, the form
// of the block, and rhythm. Intake answers (symptom, narrative) are emotional
// calibration only — never quoted, never used as content.
const ATTIVAZIONE_SYSTEM_PROMPT = `You are a psychologically sophisticated astrologer focused on patterns of activation: what makes a person move forward, what blocks them, and the rhythm at which their structure actually expresses.

Write in natural Italian. The tone must be human, sober, lucid, emotionally precise, and credible.
Do not sound mystical, generic, predictive, literary, or like horoscope content.
Do not sound like a coach, a manifestation guru, or a motivational speaker.

OBJECTIVE
Generate exactly 3 short personalized insights about how this person enters action, how they block, and the rhythm at which they actually move.

This is teaser-stage copy, not the full reading.

The output must feel:
- grounded in a real natal chart
- psychologically sharp
- specific enough to create recognition
- incomplete enough to create curiosity
- readable and immediate on mobile

THE 3 ANGLES (one insight per angle, EXACTLY in this order — DO NOT REORDER)
The order is intentional: pain first (recognition), reframe in the middle (relief), promise at the end (curiosity that drives purchase).

1. BLOCCO — the specific shape of how this person gets stuck. What the chart shows about their characteristic block (paralysis, flight, fragmentation, disorientation, dependence on external stimulus, loss of momentum, pursuit of the wrong thing). Name it precisely. Not generic.
2. RITMO — the rhythm at which their structure actually moves. Often distinct from the cultural norm: sometimes slower, sometimes cyclical, sometimes characterized by long latency before activation, sometimes with late peaks. Restitute it as truth, not as deficit.
3. ATTIVAZIONE — the principle of activation for this person. What kind of conditions accendono their structure. Description of a principle, NOT operational details.

SOURCE PRIORITY
1. Natal chart
2. Strong action / vocational / structural configurations in the chart
3. Intake answers (secondary, only for emotional calibration of tone)

INTAKE ANSWERS — IMPORTANT BEHAVIOR
The session may include answers to two intake questions:
- "symptom": how the person describes what they feel about their life right now
- "narrative": who they imagine themselves to have become

Treat these as EMOTIONAL CALIBRATION signals, NOT as facts to report.

Absolute rules:
- NEVER cite or quote the user's answer
- NEVER write "tu hai detto che…", "come hai detto…", or any direct reference
- NEVER make their answer the source of an interpretation
- ALL content must derive from the natal chart
- When a chart finding resonates with what the user named, describe the chart finding — let recognition happen naturally

ASTROLOGICAL FOCUS
Base interpretation mainly on:
- Sun (vital direction, sense of purpose)
- Moon (inner regulation, baseline emotional state)
- Mars (capacity to start, friction with action)
- Saturn (capacity to structure and sustain, internalized limits)
- Mercury (cognitive style, where decision-making lives)
- Ascendant + Medium Coeli (self-presentation, vocational direction)
- Houses 6, 10, 12 (work, calling, hidden inner life)
- Tight major aspects involving Sun, Moon, Mars, Saturn

ASPECT SELECTION RULES
Use ONLY major aspects: conjunction, opposition, square, trine, sextile.
Do NOT use minor aspects (quincunx, semi-sextile, octile, sesquiquadrate, quintile, septile).

ASPECT ORB FILTER
- orb <= 3°: always relevant
- orb <= 5°: relevant if it involves Sun, Moon, Mars, Saturn, or angles
- sextiles: max 4°
- ignore minor and broad aspects

For Uranus, Neptune, Pluto:
- use only if they aspect Sun, Moon, Mars, Saturn, Ascendant or Medium Coeli
- keep tight

ASTROLOGICAL REFERENCE RULE
At most 2 explicit chart references across the full output. No textbook tone.
Prefer lived psychological description over chart terminology.

STYLE GUARD — never use any of these (or close paraphrases):
manifestare, abbondanza, vibrazione, energia universale, energia femminile, energia maschile, anima gemella, alto sé, frequenze, allinearsi, fluire, destino, il tuo cammino, il vero te stesso, ascolta il tuo cuore, sei pronto/a per, ferita interiore, bambino interiore, trasformazione interiore, trova il tuo perché, fai il primo passo, ognuno ha il suo tempo.

Words like "sbloccare", "sblocco", "potenziale", "non parti", "mettersi in moto", "consapevolezza" are allowed when used in a grounded, descriptive way (not as motivational claims). The reader recognizes them as their own language.

Avoid also: zodiac clichés, generic self-help, flattery, prediction, deterministic tone, repetition, overly poetic phrasing.
Prefer: short, immediate, recognizable language.

LANGUAGE NATURALNESS — CRITICAL
The Italian must read as natural conversational Italian, NOT as translated-from-English or constructed prose. The reader is a smart 30-year-old reading on their phone. Each sentence should be understood in one breath, without re-reading.

AVOID:
- abstract noun phrases like "la forma del…", "il principio di…", "la dimensione di…", "la cadenza specifica di…", "la struttura interna di…". These sound academic or AI-generated.
- translated-from-English syntax (long dependent clauses, nominal style)
- philosophical-sounding constructions ("la natura del tuo…", "ciò che si configura come…")
- poetic abstractions that require re-reading

PREFER:
- verbs over abstract nouns. Write "Perché non parti" instead of "le condizioni del tuo non-partire". Write "Quello che ti blocca" instead of "la forma del tuo blocco".
- everyday Italian phrasing the reader actually uses about themselves: "sono in ritardo", "non parte niente", "mi tiene fermo/a", "ti sblocchi", "ti accendi", "le cose si allineano per te".
- recognition openings: "Non è pigrizia", "Non sei in ritardo", "Non manca un metodo", "Non è mancanza di volontà".
- short sentences. If a sentence has more than 25 words, break it.

TEST before finalizing each insight: would a 30-year-old scrolling Instagram understand this in 2 seconds? If they need to re-read, simplify. The goal is recognition (the reader thinks "oh, è proprio così"), not admiration ("che bello scritto").

CONVERSION DESIGN — IMPORTANT
Each of the 3 insights has 2 jobs: create recognition (the user feels seen) and create a curiosity gap (they want the rest of the reading).

The full paid reading delivers the OPERATIONAL LAYER:
- the form of the block AND what it is protecting
- the specific operational conditions of activation ("you need X before Y")
- the rhythm map (when peaks land, how to time decisions)
- the distinction between structural pattern and current phase

The teaser must NEVER deliver the operational layer. It must NAME the existence of each, in a way that makes the user feel: "this is real about me, and the rest is in the reading."

PER-ANGLE CONVERSION RULES
1. BLOCCO insight:
   - YES: name the form of the block ("il tuo blocco ha la forma di X")
   - NO: never name what the block is protecting — that interpretive move is the signature of the full reading
2. RITMO insight:
   - YES: hint that there's a rhythm distinct from the cultural norm
   - NO: never give the rhythm map (when peaks happen, how to use it for decisions)
3. ATTIVAZIONE insight:
   - YES: name a principle of activation ("ti accendi quando…")
   - NO: never list the specific operational conditions ("hai bisogno di un complice prima di una platea", "funzioni a stagioni non a obiettivi")

CARD STRUCTURE
Each card should land like this:
- one sentence of psychologically precise recognition (the user feels seen)
- one sentence of chart-grounded observation that gives shape to the recognition
- one closing line that opens a door — what was named is real, but not yet operational

The user should close each card thinking: "yes, that's me — and there's something more here."

DEPTH MOVE
At least one of the 3 insights should gently EXTEND the user's self-narrative — naming something the chart sees that the user has not yet seen. Don't contradict, extend. This is the move that creates the strongest "this reading sees me" effect and most directly drives conversion.

OUTPUT REQUIREMENTS
Produce exactly 3 insights, in the order BLOCCO → RITMO → ATTIVAZIONE.

Each insight must contain:
- "title": max 8 words, in Italian
- "body": 2–3 sentences, max 50 words, in Italian

CONTENT REQUIREMENTS
- Each insight covers its specific angle, not the others
- If the chart does not clearly support a finding for one angle, keep that insight short and slightly more general rather than inventing
- At least one insight should remain slightly unresolved rather than fully explained

TITLE RULES
Concrete, immediate, recognizable. Not abstract or poetic.

Respond ONLY with the required tool call.`;

const SYSTEM_PROMPT_BY_FUNNEL: Record<string, string> = {
  classica: SYSTEM_PROMPT,
  attivazione: ATTIVAZIONE_SYSTEM_PROMPT,
};

function systemPromptFor(slug: string | null | undefined, lang: PromptLang = "it"): string {
  const base = SYSTEM_PROMPT_BY_FUNNEL[slug || "classica"] ?? SYSTEM_PROMPT_BY_FUNNEL.classica;
  return outputLanguageDirective(lang) + base;
}

function buildUserPrompt(
  natalChart: any,
  funnelSlug: string,
  intake: Record<string, string | null | undefined>,
  userName: string | null,
) {
  const getName = (value: any) => value?.en || value?.name?.en || value?.name || value || "Unknown";

  const planetsDescription = Array.isArray(natalChart.planets)
    ? natalChart.planets
        .map((p: any) => {
          const name = p.name || p.id || getName(p.planet);
          const sign = p.sign || getName(p.zodiac_sign);
          const deg = p.pos ?? p.normDegree ?? p.fullDegree ?? "";
          const house = p.house ?? p.House ?? "?";
          const retro = p.retrograde || String(p.isRetro).toLowerCase() === "true" ? " (R)" : "";
          return `${name}: ${deg}° in ${sign}${house !== "?" ? ` (house ${house})` : ""}${retro}`;
        })
        .join("\n")
    : JSON.stringify(natalChart.planets);

  const housesDescription = Array.isArray(natalChart.houses)
    ? natalChart.houses
        .map(
          (h: any) =>
            `House ${h.house || h.House || h.name || "?"}: ${h.sign || getName(h.zodiac_sign)} ${h.pos ?? h.normDegree ?? ""}°`,
        )
        .join("\n")
    : JSON.stringify(natalChart.houses);

  const anglesDescription = natalChart.angles_details
    ? Object.entries(natalChart.angles_details)
        .map(([key, val]: [string, any]) => `${key.toUpperCase()}: ${val.sign} ${(val.pos ?? "").toString()}°`)
        .join("\n")
    : "";

  const aspectsDescription = Array.isArray(natalChart.aspects)
    ? natalChart.aspects
        .filter((a: any) => a.is_major !== false)
        .slice(0, 30)
        .map((a: any) => {
          const p1 = a.p1 || getName(a.planet_1);
          const p2 = a.p2 || getName(a.planet_2);
          const type = a.type || getName(a.aspect);
          return `${p1} ${type} ${p2}${a.orb != null ? ` (orb: ${a.orb}°)` : ""}`;
        })
        .join("\n")
    : JSON.stringify(natalChart.aspects);

  const contextSection =
    funnelSlug === "attivazione"
      ? `CONTESTO QUIZ:\n- Nome: ${userName || "non fornito"}\n- Sintomo riportato: ${intake.symptom || "non fornito"}\n- Narrazione di sé: ${intake.narrative || "non fornita"}`
      : `CONTESTO QUIZ:\n- Nome: ${userName || "non fornito"}\n- Reazione all'ambiguità: ${intake.attachment || "non fornita"}\n- Area di focus: ${intake.focus || "non fornita"}`;

  const closingInstruction =
    funnelSlug === "attivazione"
      ? `Genera 3 insight con questi 3 angoli precisi e in quest'ordine: 1) BLOCCO (la forma specifica del suo blocco), 2) RITMO (il ritmo profondo della sua struttura), 3) ATTIVAZIONE (il principio di attivazione). Tutto deriva dalla carta natale. Sintomo e narrazione sono solo segnale di taratura emotiva, mai citarli. NON dare il layer operativo (cosa il blocco protegge, le condizioni concrete di attivazione, la mappa del ritmo), quello è il valore del report completo.`
      : `Genera 3 insight personalizzati sulle dinamiche relazionali di questa persona.`;

  return `Carta natale:\n\nPIANETI:\n${planetsDescription}\n\nCASE:\n${housesDescription}\n${anglesDescription ? `\nANGOLI:\n${anglesDescription}\n` : ""}\nASPETTI PRINCIPALI:\n${aspectsDescription}\n\n${contextSection}\n\n${closingInstruction}`;
}

function getTimezoneString(value: unknown) {
  return typeof value === "string" && value.trim().includes("/") ? value.trim() : "AUTO";
}

function getBirthNumber(value: unknown, field: string) {
  const num = Number(value);
  if (!Number.isFinite(num)) throw new Error(`birth_data_missing: ${field}`);
  return num;
}

function buildBaseChartPayload(session: QuizSession) {
  const birthDate = session.birth_date || {};
  const birthTime = session.birth_time || {};
  const city = session.birth_place?.trim();

  if (!city) throw new Error("birth_data_missing: city");

  const base: Record<string, unknown> = {
    name: session.user_name || "User",
    year: getBirthNumber(birthDate.year, "year"),
    month: getBirthNumber(birthDate.month, "month"),
    day: getBirthNumber(birthDate.day, "day"),
    time_known: true,
    hour: getBirthNumber(birthTime.hour, "hour"),
    minute: getBirthNumber(birthTime.minute, "minute"),
    city,
    tz_str: getTimezoneString(session.birth_timezone_iana ?? session.birth_timezone),
    house_system: "placidus",
  };

  if (session.birth_lat != null && session.birth_lng != null) {
    base.lat = session.birth_lat;
    base.lng = session.birth_lng;
  }

  return base;
}

async function generateNatalChart(session: QuizSession) {
  const payload: Record<string, unknown> = {
    ...buildBaseChartPayload(session),
    zodiac_type: "tropical",
    include_speed: false,
    include_dignity: false,
    include_minor_aspects: false,
    include_stelliums: false,
    include_dominants: false,
    include_features: ["chiron", "lilith"],
    interpretation: { enable: false },
    orb_settings: {
      Conjunction: 6.0,
      Opposition: 5.0,
      Square: 5.0,
      Trine: 5.0,
      Sextile: 4.0,
    },
  };

  const response = await fetch(ASTROLOGY_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ASTROLOGY_API_KEY,
      "Accept-Encoding": "br, gzip",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`chart_failed: API returned ${response.status} ${errText.slice(0, 220)}`);
  }

  const data = await response.json();
  const chart = {
    planets: data.planets || [],
    houses: data.houses || [],
    aspects: data.aspects || [],
    angles: data.angles || null,
    angles_details: data.angles_details || null,
    confidence: data.confidence || null,
  };

  if (!Array.isArray(chart.planets) || chart.planets.length === 0) {
    throw new Error("chart_failed: empty planets result");
  }

  return chart;
}

// Fetches the visual SVG rendering of the natal chart. Non-fatal: if it
// fails we still continue with the rest of the pipeline.
async function generateNatalChartSvg(session: QuizSession): Promise<string | null> {
  try {
    const payload = {
      ...buildBaseChartPayload(session),
      theme_type: "light",
      format: "svg",
      chart_config: CHART_CONFIG,
      display_settings: CHART_DISPLAY_SETTINGS,
      custom_theme: { background: "transparent" },
    };

    const response = await fetch(ASTROLOGY_CHART_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ASTROLOGY_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[chart-svg] API returned ${response.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const text = await response.text();
    const trimmed = text.trim();

    // The endpoint may return either a raw SVG string or a JSON envelope
    // containing the SVG (depending on the API version). Handle both.
    if (trimmed.startsWith("<")) return trimmed;

    try {
      const parsed = JSON.parse(trimmed);
      const svg = parsed?.svg || parsed?.chart || parsed?.data?.svg || parsed?.data;
      if (typeof svg === "string" && svg.trim().startsWith("<")) return svg;
    } catch (_) {
      /* fall through */
    }

    console.warn("[chart-svg] Unexpected response shape");
    return null;
  } catch (err) {
    console.warn("[chart-svg] generation failed:", err);
    return null;
  }
}

const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// Gemini intermittently returns 503 (model overloaded) / 429 (rate limit).
// Google recommends retrying these with backoff; flash-lite is fast (~3s) so a
// couple of retries stay well within the client's teaser polling window.
async function geminiInsightsFetch(body: string): Promise<Response> {
  const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
  const MAX_ATTEMPTS = 3;
  let response: Response;
  for (let attempt = 1; ; attempt++) {
    response = await fetch(GEMINI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body,
    });
    if (response.ok || !RETRYABLE_STATUS.has(response.status) || attempt >= MAX_ATTEMPTS) {
      return response;
    }
    await response.text().catch(() => {}); // drain body so the connection frees up
    await new Promise((r) => setTimeout(r, attempt * 1000)); // backoff: 1s, then 2s
  }
}

async function generateInsights(
  natalChart: any,
  funnelSlug: string,
  intake: Record<string, string | null | undefined>,
  userName: string | null,
  supabase: any,
  sessionId: string,
  lang: PromptLang = "it",
) {
  const systemPrompt = systemPromptFor(funnelSlug, lang);
  const userPrompt = buildUserPrompt(natalChart, funnelSlug, intake, userName);
  const model = "gemini-3.1-flash-lite";
  const t0 = Date.now();
  const metricBase = {
    functionName: "process-session-insights",
    model,
    quizSessionId: sessionId,
    attempt: 1,
  };

  // reasoning_effort "low": flash-lite stays ~3s but gets a little extra
  // reasoning for the chart's aspect/orb selection. "high" is avoided — it
  // pushes the request onto congested capacity and starts returning 503.
  const response = await geminiInsightsFetch(
    JSON.stringify({
      model,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_insights",
            description: "Return 3 personalized teaser insights based on the natal chart.",
            parameters: {
              type: "object",
              properties: {
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      body: { type: "string" },
                    },
                    required: ["title", "body"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["insights"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_insights" } },
    }),
  );

  if (!response.ok) {
    const errText = await response.text();
    recordAiMetric(supabase, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: `http_${response.status}`,
    });
    throw new Error(`insights_failed: AI gateway ${response.status}: ${errText.slice(0, 300)}`);
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    recordAiMetric(supabase, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: "missing_tool_call",
      usage: result?.usage,
    });
    throw new Error("insights_failed: AI returned unexpected format");
  }

  const parsed = JSON.parse(toolCall.function.arguments);
  if (!Array.isArray(parsed.insights) || parsed.insights.length === 0) {
    recordAiMetric(supabase, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: "empty_insights",
      usage: result?.usage,
    });
    throw new Error("insights_failed: AI returned no insights");
  }

  recordAiMetric(supabase, {
    ...metricBase,
    durationMs: Date.now() - t0,
    success: true,
    httpStatus: response.status,
    usage: result?.usage,
  });
  return { insights: parsed.insights, llmInput: { userPrompt, systemPrompt }, llmOutput: parsed };
}

async function processSession(sessionId: string) {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: session, error: loadError } = await supabase
    .from("quiz_sessions")
    .select(
      "id, natal_chart, natal_chart_svg, natal_chart_png, birth_date, birth_time, birth_place, birth_lat, birth_lng, birth_timezone, birth_timezone_iana, attachment_response, focus_area, user_name, teaser_insights, processing_status, funnel_slug, quiz_answers, language",
    )
    .eq("id", sessionId)
    .maybeSingle<QuizSession>();

  if (loadError || !session) {
    console.error("[process-session-insights] Session not found:", sessionId, loadError);
    return;
  }

  if (
    session.natal_chart &&
    session.natal_chart_svg &&
    session.teaser_insights &&
    session.processing_status === "insights_ready"
  ) {
    console.log("[process-session-insights] Already complete:", sessionId);
    return;
  }

  let natalChart = session.natal_chart;

  try {
    if (!natalChart) {
      await supabase
        .from("quiz_sessions")
        .update({ processing_status: "chart_processing", processing_error: null })
        .eq("id", sessionId);

      // Run the calculation and the visual chart fetch in parallel — the
      // visual fetch is non-fatal and won't block insight generation.
      const [chartResult, svgResult] = await Promise.all([
        generateNatalChart(session),
        session.natal_chart_svg ? Promise.resolve(session.natal_chart_svg) : generateNatalChartSvg(session),
      ]);

      natalChart = chartResult;

      await supabase
        .from("quiz_sessions")
        .update({
          natal_chart: natalChart,
          natal_chart_svg: svgResult,
          processing_status: "chart_ready",
          processing_error: null,
        })
        .eq("id", sessionId);

      console.log("[process-session-insights] Chart ready:", sessionId, "svg:", Boolean(svgResult));
    } else if (!session.natal_chart_svg) {
      // Chart already calculated but image is missing — backfill in the
      // background without blocking the rest of the pipeline.
      generateNatalChartSvg(session)
        .then((svg) => {
          if (svg) {
            return supabase.from("quiz_sessions").update({ natal_chart_svg: svg }).eq("id", sessionId);
          }
        })
        .catch((e) => console.warn("[chart-svg] backfill failed:", e));
    }

    if (session.teaser_insights && Array.isArray(session.teaser_insights) && session.teaser_insights.length > 0) {
      await supabase
        .from("quiz_sessions")
        .update({ processing_status: "insights_ready", processing_error: null })
        .eq("id", sessionId);
      return;
    }

    // Atomic compare-and-swap to claim the insights generation lock. Three
    // entry points (Processing.tsx fire-and-forget, TeaserResult.tsx landing
    // recovery, TeaserResult.tsx failed-state retry) used to all pass a
    // non-atomic check and could each invoke Gemini Flash in parallel.
    // Postgres makes the UPDATE+WHERE atomic: only one caller wins.
    // The lock is claimable when (a) no insights yet AND (b) either the lock
    // is free, or it has been held for more than STALE_INSIGHTS_MS (i.e. the
    // previous worker crashed silently without writing "failed").
    const STALE_INSIGHTS_MS = 30 * 1000;
    const staleInsightsISO = new Date(Date.now() - STALE_INSIGHTS_MS).toISOString();

    const { data: insightsClaimed, error: insightsClaimErr } = await supabase
      .from("quiz_sessions")
      .update({
        processing_status: "insights_processing",
        insights_started_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", sessionId)
      .is("teaser_insights", null)
      .or(
        `processing_status.neq.insights_processing,` +
          `insights_started_at.lt.${staleInsightsISO},` +
          `insights_started_at.is.null`,
      )
      .select("id");

    if (insightsClaimErr) throw insightsClaimErr;
    if (!insightsClaimed || insightsClaimed.length === 0) {
      console.log("[process-session-insights] Insights lock held by another worker, skipping:", sessionId);
      return;
    }

    // Build the funnel-specific intake bag. Classica reads the dedicated
    // columns (back-compat), attivazione reads quiz_answers JSONB. Both shapes
    // are normalized to a flat string-map for buildUserPrompt.
    const funnelSlug = session.funnel_slug || "classica";
    const intake: Record<string, string | null | undefined> =
      funnelSlug === "attivazione"
        ? {
            symptom: session.quiz_answers?.symptom,
            narrative: session.quiz_answers?.narrative,
          }
        : {
            attachment: session.attachment_response,
            focus: session.focus_area,
          };

    const { insights, llmInput, llmOutput } = await generateInsights(
      natalChart,
      funnelSlug,
      intake,
      session.user_name,
      supabase,
      sessionId,
      resolvePromptLang(session.language),
    );

    await supabase
      .from("quiz_sessions")
      .update({
        teaser_insights: insights,
        llm_input: llmInput,
        llm_output: llmOutput,
        processing_status: "insights_ready",
        insights_completed_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", sessionId);

    console.log("[process-session-insights] Completed:", sessionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[process-session-insights] Failed:", sessionId, message);
    await supabase
      .from("quiz_sessions")
      .update({
        processing_status: "failed",
        processing_error: message.slice(0, 500),
      })
      .eq("id", sessionId);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { allowed } = await checkRateLimit(req, {
    bucket: "process-session-insights",
    max: 30,
    windowSeconds: 60,
  });
  if (!allowed) return rateLimitResponse(corsHeaders);

  try {
    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== "string") {
      return new Response(JSON.stringify({ error: "sessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // @ts-ignore - EdgeRuntime is provided by Supabase
    EdgeRuntime.waitUntil(processSession(sessionId));

    return new Response(JSON.stringify({ ok: true, sessionId }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[process-session-insights] Request error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
