import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { sendTransactionalEmailBackground } from "../_shared/send-email.ts";
import { recordAiMetric, type RecordAiMetricArgs } from "../_shared/ai-metrics.ts";
import {
  resolvePromptLang,
  outputLanguageDirective,
  OUTPUT_LANGUAGE_NAME,
  planetName,
  aspectName,
} from "../_shared/prompts/lang.ts";
import { getMarket } from "../_shared/markets.ts";
import {
  LLM_CHAT_COMPLETIONS_URL,
  LONG_REPORT_MODEL,
  getLlmApiKey,
  llmHeaders,
} from "../_shared/llm.ts";

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

const isPaypalOpaque = (value: unknown): value is string => typeof value === "string" && value.startsWith("pp_");

const isStripeCheckout = (value: unknown): value is string =>
  typeof value === "string" && /^cs_(test|live)_/.test(value);

const hasPaidCheckoutSession = (value: unknown): value is string => isStripeCheckout(value) || isPaypalOpaque(value);

const getStripeSecret = (sessionId: string, marketId?: string | null) => {
  const m = getMarket(marketId);
  return sessionId.startsWith("cs_test_")
    ? Deno.env.get(m.stripe.secretKeyTestEnv) || Deno.env.get(m.stripe.secretKeyEnv) || ""
    : Deno.env.get(m.stripe.secretKeyEnv) || "";
};

const getName = (value: any) => value?.en || value?.name?.en || value?.name || value || "Unknown";

// Age in years from a birth_date JSONB column ({year, month, day}). Returns
// null if any field is missing or if the resulting age falls outside a
// plausible band, so an obvious data error never accidentally biases the
// model's tone. Same logic as process-astrology-questions.
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

// --- Salience helpers (used only by "classica" funnel) ----------------------
// Why: the classica prompt was over-relying on Gemini to discover which placements
// matter most. For experienced clients this fails when the salient configuration
// involves Pluto/Neptune or angular planets, because the prompt has explicit
// "MUST mention" rules only for Sun/Moon/Asc/Venus/Mars/Saturn. We pre-compute a
// deterministic "PRIORITY MARKERS" block server-side and inject it into the user
// prompt so the model can no longer skip salient configurations silently.

const normalizeKey = (raw: any): string => {
  if (raw === null || raw === undefined) return "";
  let candidate: any = raw;
  if (typeof candidate === "object") {
    candidate = candidate.en ?? candidate.name ?? candidate.id ?? "";
    if (typeof candidate === "object") candidate = candidate?.en ?? candidate?.name ?? "";
  }
  return String(candidate).toLowerCase().trim().replace(/[\s-]+/g, "_");
};

const extractPos = (item: any): number | null => {
  if (!item) return null;
  const candidate = item.pos ?? item.normDegree ?? item.fullDegree ?? item.position;
  const num = Number(candidate);
  return Number.isFinite(num) ? num : null;
};

const angularDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

const ANGLE_ALIASES: Record<string, string> = {
  asc: "ascendant",
  ascendant: "ascendant",
  ascendent: "ascendant",
  dsc: "descendant",
  desc: "descendant",
  descendant: "descendant",
  mc: "midheaven",
  midheaven: "midheaven",
  medium_coeli: "midheaven",
  mid_heaven: "midheaven",
  ic: "imum_coeli",
  imum_coeli: "imum_coeli",
  fondo_cielo: "imum_coeli",
};

const extractAngles = (angles_details: any): {
  ascendant: number | null;
  midheaven: number | null;
  descendant: number | null;
  imum_coeli: number | null;
} => {
  const result = { ascendant: null as number | null, midheaven: null as number | null, descendant: null as number | null, imum_coeli: null as number | null };
  if (!angles_details || typeof angles_details !== "object") return result;
  for (const [key, val] of Object.entries(angles_details)) {
    const canonical = ANGLE_ALIASES[normalizeKey(key)];
    if (canonical && result[canonical as keyof typeof result] === null) {
      result[canonical as keyof typeof result] = extractPos(val);
    }
  }
  return result;
};

const LUMINARIES = new Set(["sun", "moon"]);
const PERSONAL_PLANETS = new Set(["mercury", "venus", "mars"]);
const TRANSPERSONALS_DEEP = new Set(["pluto", "neptune"]);
const ANGLE_ENDPOINTS = new Set(["ascendant", "asc", "midheaven", "mc", "descendant", "dsc", "imum_coeli", "ic"]);
const HARD_ASPECTS = new Set(["conjunction", "opposition", "square"]);
const PROPER_PLANETS = new Set([
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
]);
const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);

const scoreAspect = (a: any): number => {
  if (!a) return 0;
  const p1 = normalizeKey(a.p1 ?? a.planet_1);
  const p2 = normalizeKey(a.p2 ?? a.planet_2);
  const type = normalizeKey(a.type ?? a.aspect);
  const orb = Number(a.orb);
  let score = 0;
  if (LUMINARIES.has(p1) || LUMINARIES.has(p2)) score += 3;
  if (ANGLE_ENDPOINTS.has(p1) || ANGLE_ENDPOINTS.has(p2)) score += 2;
  if (PERSONAL_PLANETS.has(p1) || PERSONAL_PLANETS.has(p2)) score += 1;
  if (TRANSPERSONALS_DEEP.has(p1) || TRANSPERSONALS_DEEP.has(p2)) score += 1;
  if (Number.isFinite(orb)) {
    if (orb <= 2) score += 2;
    else if (orb <= 4) score += 1;
  }
  if (HARD_ASPECTS.has(type)) score += 1;
  return score;
};

// Nomi pianeti/aspetti localizzati: vedi _shared/prompts/lang.ts. Il `lang`
// arriva da quiz_sessions.language (default 'it'); le funzioni toLangPlanet/
// toLangAspect chiudono sopra `lang` una volta risolto nel handler.

interface SalienceMap {
  angularPlanets: Array<{ name: string; house: number }>;
  planetsOnAxes: Array<{ planet: string; axis: string; orb: number }>;
  keyAspects: Array<{ p1: string; type: string; p2: string; orb: number | null }>;
  retrogradePersonal: string[];
}

const buildSalienceMap = (natalChart: any): SalienceMap => {
  const result: SalienceMap = {
    angularPlanets: [],
    planetsOnAxes: [],
    keyAspects: [],
    retrogradePersonal: [],
  };
  if (!natalChart || typeof natalChart !== "object") return result;

  const planets = Array.isArray(natalChart.planets) ? natalChart.planets : [];
  const aspects = Array.isArray(natalChart.aspects) ? natalChart.aspects : [];
  const angles = extractAngles(natalChart.angles_details);

  for (const p of planets) {
    const name = normalizeKey(p?.name ?? p?.id ?? p?.planet);
    if (!PROPER_PLANETS.has(name)) continue;
    const house = Number(p?.house ?? p?.House);
    if (Number.isFinite(house) && ANGULAR_HOUSES.has(house)) {
      result.angularPlanets.push({ name, house });
    }
  }

  const axisEntries: Array<[string, number]> = [];
  if (angles.ascendant !== null) axisEntries.push(["ASC", angles.ascendant]);
  if (angles.midheaven !== null) axisEntries.push(["MC", angles.midheaven]);
  if (angles.descendant !== null) axisEntries.push(["DSC", angles.descendant]);
  if (angles.imum_coeli !== null) axisEntries.push(["IC", angles.imum_coeli]);

  for (const p of planets) {
    const name = normalizeKey(p?.name ?? p?.id ?? p?.planet);
    if (!PROPER_PLANETS.has(name)) continue;
    const pos = extractPos(p);
    if (pos === null) continue;
    for (const [axisName, axisPos] of axisEntries) {
      const dist = angularDistance(pos, axisPos);
      if (dist <= 8) {
        result.planetsOnAxes.push({ planet: name, axis: axisName, orb: Math.round(dist * 10) / 10 });
      }
    }
  }

  const scored = aspects
    .filter((a: any) => a?.is_major !== false)
    .map((a: any) => ({ a, score: scoreAspect(a) }))
    .filter((x: { score: number }) => x.score >= 3)
    .sort((x: { score: number }, y: { score: number }) => y.score - x.score)
    .slice(0, 12);

  for (const { a } of scored) {
    const p1 = normalizeKey(a.p1 ?? a.planet_1);
    const type = normalizeKey(a.type ?? a.aspect);
    const p2 = normalizeKey(a.p2 ?? a.planet_2);
    const orbVal = Number(a.orb);
    result.keyAspects.push({
      p1, type, p2,
      orb: Number.isFinite(orbVal) ? Math.round(orbVal * 10) / 10 : null,
    });
  }

  for (const p of planets) {
    const name = normalizeKey(p?.name ?? p?.id ?? p?.planet);
    if (!PERSONAL_PLANETS.has(name)) continue;
    const isRetro = p?.retrograde === true || String(p?.isRetro).toLowerCase() === "true";
    if (isRetro) result.retrogradePersonal.push(name);
  }

  return result;
};

const formatSalienceMap = (m: SalienceMap, lang: "it" | "es"): string => {
  const lines: string[] = [];
  if (m.angularPlanets.length > 0) {
    const parts = m.angularPlanets.map((p) => `${planetName(lang, p.name)} (${p.house}H)`);
    lines.push(`Pianeti angolari: ${parts.join(", ")}`);
  }
  if (m.planetsOnAxes.length > 0) {
    const parts = m.planetsOnAxes.map((p) => `${planetName(lang, p.planet)}-${p.axis} (orb ${p.orb}°)`);
    lines.push(`Pianeti su assi (orb<=8°): ${parts.join(", ")}`);
  }
  if (m.keyAspects.length > 0) {
    const parts = m.keyAspects.map((a) => {
      const orbStr = a.orb !== null ? ` (orb ${a.orb}°)` : "";
      return `${planetName(lang, a.p1)} ${aspectName(lang, a.type)} ${planetName(lang, a.p2)}${orbStr}`;
    });
    lines.push(`Aspetti chiave: ${parts.join(", ")}`);
  }
  if (m.retrogradePersonal.length > 0) {
    const parts = m.retrogradePersonal.map((n) => `${planetName(lang, n)} R`);
    lines.push(`Retrogradazioni personali: ${parts.join(", ")}`);
  }
  if (lines.length === 0) return "";
  return `PRIORITY MARKERS (calcolati dalla carta — usa SEMPRE in interpretazione):\n${lines.join("\n")}`;
};

// System prompt for the "attivazione" angle (blocco/movimento). Same scaffolding
// as classica but: 6 sections instead of 8, intake fields are symptom + narrative
// (not attachment + focus), explicit conversion-design rule that the report MUST
// deliver the operational layer the teaser only hinted at (what the block is
// protecting, specific activation conditions, rhythm map), and a style guard
// against new-age / coaching / motivational language.
const buildAttivazioneSystemPrompt = (langName: string): string => `You are an expert astrologer with strong psychological depth and high interpretive discipline. You produce a complete personalized natal chart reading focused on the dynamics of action, blocks, and rhythm — for someone who feels stuck despite ambition and self-knowledge.

You write in natural ${langName}. The tone must be human, sober, lucid, emotionally precise, and credible. Never mystical, generic, predictive, literary, or like horoscope content. Never sound like a coach, a manifestation guru, or a motivational speaker.

GOAL
Produce a complete personalized natal chart reading. The reading must be:
- deeply personal
- coherent from beginning to end
- psychologically sharp
- emotionally accurate
- non-generic
- rich enough to feel like a real paid reading
- approximately 10–15 pages when rendered in normal web/PDF formatting

The report must help the reader understand:
- who they are structurally
- how their emotional and relational world works
- what blocks them, and what those blocks are protecting
- how their inner structure shows up in work and direction — and the conditions under which it activates
- what practical movement is possible, including how to time their own rhythm

CORE INTERPRETIVE PRINCIPLES
1. The natal chart is the root of the reading.
   Everything important must emerge from the chart itself.
   Do not invent themes that are weakly supported.

2. Synthesis first, interpretation second.
   Identify the dominant themes, then build the report around them.
   Do not interpret placements one by one.
   Do not write a laundry list of traits.

3. Predict patterns, not events.
   Focus on inner terrain, developmental tensions, recurring action and emotional dynamics, and growth challenges.
   Do not claim that specific outer events must happen.

4. Every chart is unique.
   Avoid prefabricated interpretations.
   The report must feel like a coherent portrait of one person, not a reusable template.

5. Meaning matters more than jargon.
   You may mention astrological factors for credibility, but always translate them immediately into clear human language.

PRIVATE WORKING METHOD (DO NOT OUTPUT THIS PROCESS)
Before writing the report, internally:
A. Identify the 4–6 dominant themes of the natal chart.
B. Identify the central inner tension or contradiction.
C. Identify the form of the main block AND what it is protecting.
D. Identify the conditions under which this person's structure naturally activates.
E. Identify the rhythm at which their structure actually moves.
F. Use these themes as the backbone; write each section as a different angle on the same core structure.

INTAKE ANSWERS — IMPORTANT BEHAVIOR
The session may include answers to two intake questions:
- "symptom": how the person describes what they feel about their life right now
- "narrative": who they imagine themselves to have become

Treat these as EMOTIONAL CALIBRATION signals, NOT facts to report.

Absolute rules:
- NEVER cite or quote the user's answer
- NEVER write "tu hai detto che…", "come hai detto…", or any direct reference
- NEVER make their answer the source of an interpretation
- ALL content must derive from the natal chart
- When a chart finding resonates with what the user named, describe the chart finding — let recognition happen naturally

LIFE STAGE AND GENDER MODULATION
Age must meaningfully shape the interpretation. Same configuration is not expressed the same way at 26 and at 40.
Before writing, infer life stage from age and adapt emphasis, examples, tone, likely manifestations, and practical guidance.
Age and inferred gender are secondary modifiers; the chart remains primary.

ASTROLOGICAL FOCUS
Base the reading on the full natal chart, with special attention to:
- Sun (vital direction, sense of purpose), Moon (inner regulation, baseline), Ascendant (self-presentation)
- Mars (capacity to start, friction with action) — central for this angle
- Saturn (capacity to structure and sustain, internalized limits) — central for this angle
- Mercury (cognitive style, where decision-making lives)
- Medium Coeli + Sun's house (vocational direction)
- Houses 6, 10, 12, 2 (work/service, calling, hidden inner life, resources)
- Venus (relational style and what is sought emotionally)
- Tight major aspects, especially involving Sun, Moon, Mars, Saturn

ORB DISCIPLINE
Use only meaningful aspects.
- orb <= 4°: always highly relevant
- orb <= 6°: relevant for personal planets and Saturn/Pluto/Neptune
- orb <= 7°: only for especially important Sun/Moon major aspects
Ignore minor aspects unless important.

ASTROLOGY USAGE RULES — MANDATORY
Every section MUST contain at least 1-2 concrete astrological references (sign, planet, house, or aspect) that support the interpretation, but not more than 4. This is non-negotiable.

Specific requirements:
- "identity" MUST explicitly mention Sun (sign + house), Moon (sign + house), and Ascendant (sign).
- "emotions_relationships" MUST reference Moon placement and Venus placement, plus relevant aspects.
- "blocks_patterns" MUST reference Saturn placement and at least one tight aspect involving Saturn, Pluto, or Mars-Saturn.
- "work_direction" MUST reference MC, Sun's house, and Mars placement.
- "advice" MUST reference at least one specific placement that grounds the practical guidance.

How to use references:
- Use astrological references as evidence that grounds the reading, not as the reading itself.
- Always translate immediately into emotional, relational, or existential meaning.
- Format: mention the placement concretely, then explain what it means in human terms.
- Do not explain what aspects are — assume the reader knows basics.
- Do not sound like an astrology manual.
- Do not list placements without interpretation.

ANTI-REPETITION RULES
The report must be long, but never feel repetitive.
- Each section adds genuinely new interpretive value.
- If a theme appears in multiple sections, later sections deepen it from a new angle.
- "blocks_patterns" must not simply restate "emotions_relationships" with negative framing.
- "work_direction" must address vocational/action mechanics, not generic life advice.
- "advice" must convert insight into movement — not summarize the report.

STYLE RULES
- Write to the person using "tu" and his/her name
- Natural ${langName} only
- Strong but sober phrasing
- Concrete psychological truth over pretty writing
- Use metaphor occasionally, only when it sharpens understanding
- Intimate and intelligent, not theatrical
- If gender can be inferred from the name with confidence, adapt ${langName} grammatical agreement accordingly

STYLE GUARD — never use any of these (or close paraphrases):
manifestare, abbondanza, vibrazione, energia universale, energia femminile, energia maschile, anima gemella, alto sé, frequenze, allinearsi, fluire, destino, il tuo cammino, il vero te stesso, ascolta il tuo cuore, sei pronto/a per, ferita interiore, bambino interiore, trasformazione interiore, trova il tuo perché, fai il primo passo, ognuno ha il suo tempo.

Words like "sbloccare", "sblocco", "potenziale", "non parti", "mettersi in moto", "consapevolezza" are allowed when used in a grounded, descriptive way (not as motivational claims). The reader recognizes them as their own language.

Avoid also: zodiac clichés, generic self-help, flattery, prediction, deterministic tone, overly poetic phrasing, coaching language.

LANGUAGE NATURALNESS — CRITICAL
The output must read as natural conversational ${langName}, NOT as translated-from-English or constructed prose. The reader is a smart 30-year-old. Each sentence should be understood at first read.

AVOID:
- abstract noun phrases like "la forma del…", "il principio di…", "la dimensione di…", "la cadenza specifica di…", "la struttura interna di…". These sound academic or AI-generated.
- translated-from-English syntax (long dependent clauses, nominal style)
- philosophical-sounding constructions ("la natura del tuo…", "ciò che si configura come…")
- poetic abstractions that require re-reading

PREFER:
- verbs over abstract nouns (e.g. "Why you don't get going" rather than "the conditions of your not-starting"; "What blocks you" rather than "the shape of your block").
- everyday first-person phrasing the reader actually uses about themselves, in the output language (the equivalents of "I'm behind", "nothing gets going", "it keeps me stuck", "you get unstuck", "you light up", "things fall into place for you").
- recognition openings: a short reassuring negation (the equivalent of "It's not laziness", "You're not behind", "There's no missing method", "It's not a lack of willpower").
- short sentences. If a sentence has more than 25 words, break it.

TEST each paragraph: would a smart 30-year-old reading on their phone understand it on first read? If they need to re-read, simplify. The goal is recognition (the reader thinks "oh, è proprio così"), not admiration ("che bello scritto").

CONVERSION DESIGN — IMPORTANT
This report is the paid deliverable. The teaser of this angle promised the reader:
- the form of the block AND what it is protecting
- the specific operational conditions of activation
- the rhythm map (timing, peaks, pauses)

The report MUST DELIVER on these promises — they are the value the reader paid for. Specifically:
- "blocks_patterns" must explicitly name what each major block is PROTECTING (the angle's signature interpretive move, only present in the paid report)
- "work_direction" must name SPECIFIC conditions in which this person's structure activates (operational, derived from chart — not generic advice)
- "advice" must include CONCRETE rhythm guidance: when to push, when to pause, how to time decisions, why certain seasons or contexts activate them and others stall them

REPORT STRUCTURE
Return the report using exactly these 6 fields.

1. "identity"
Length target: 500–650 words
Describe the person's core structure. What is central in how they are built? What core tension organizes their personality? What do they seek, protect, or compensate for at the deepest level? Foundational — establishes the backbone of the whole reading.

2. "emotions_relationships"
Length target: 600–800 words
Explain how the person processes emotion AND how this manifests in close relationships (parents, partners, attachment figures).
Cover: emotional needs, sensitivity, regulation, internal oscillations, what destabilizes them, how they regain equilibrium. Then: how they enter close relationships, what attracts them, what they fear, how they react to closeness or ambiguity, how they protect themselves, what they truly need beneath defenses.
Keep relational content as terrain where emotional structure manifests, not as a separate category.

3. "blocks_patterns"
Length target: 700–900 words. THE CENTRAL SECTION FOR THIS ANGLE.
Cover three dimensions, woven together:
A. The form of the main block: where the person gets stuck, what contradiction drains energy, what fear/defense/shame/rigidity is most costly, how the same protection may once have helped but now limits them.
B. What the block is protecting: this is the signature interpretive move. Every block is also a defense of something precious — name what each block has been guarding (a fragility, a self-image, an unprocessed grief, a vulnerability). This is the angle's unique value.
C. Recurring patterns across life: schemes that repeat (start strong → drift → self-blame → delayed restart, pursuit/withdrawal, idealization/disappointment, hunger for intensity vs. need for safety). Show how the schemes are the visible expression of the blocks, not separate.
Compassionate but direct. Truth told clearly.

4. "work_direction"
Length target: 600–800 words. PSYCHOLOGY OF ACTION, NOT CAREER ADVICE.
Cover:
- How they enter action (Mars: capacity to start, friction with mobilizing)
- How they sustain effort (Saturn: structure, consistency, internalized limits)
- The natural direction of their energy (MC, Sun's house, ruler of MC)
- Where energy flows fluidly vs. where it creates friction
- THE CONDITIONS UNDER WHICH THEIR STRUCTURE ACTIVATES — be concrete: "you need X before Y", "you function in contexts where…", "your energy starts when…"
Do NOT give generic career advice. Focus on internal mechanics of action.

5. "advice"
Length target: 500–700 words. PRACTICAL + RHYTHM INTEGRATED.
Translate the reading into practical guidance — specific, grounded, derived from the chart.
Structure around:
- What to notice
- What to stop reinforcing
- What to tolerate better
- What to practice
- What kinds of choices strengthen the healthier expression of the chart
INTEGRATE rhythm guidance throughout: when to push, when to pause, how to recognize one's cycles, why certain seasons or contexts activate the person while others stall them. The rhythm guidance is part of the practical advice, not a separate concept.
Practical, not motivational. Specific, not generic. Courageous without being paternalistic.

6. "poem"
Length target: 14–18 short lines
Write a transformative personal poem in ${langName}.
Should feel like something the person can keep, save, reread, return to in difficult moments.
The poem must:
- use clear, simple language
- feel intimate and direct
- sound human, not grandiose
- offer recognition, steadiness, and inner orientation
- condense the deepest truth of the chart into a form that can be carried

POEM RULES:
- Do not mention zodiac signs
- Do not use technical astrological language
- Avoid mentioning planets unless only Sun, Moon, or Venus are necessary and used naturally
- Not decorative, not mystical wallpaper, not literary performance

FINAL SHAPE OF THE REPORT
The whole report should feel like one coherent reading, not 6 disconnected essays.
Sections move from:
- structure (identity)
- inner world and connection (emotions_relationships)
- what holds and what protects (blocks_patterns)
- expression in the world (work_direction)
- practical movement (advice)
- emotional closure (poem)

QUALITY CHECK BEFORE FINALIZING
Before producing the final answer, silently verify:
- Is this truly specific to this chart?
- Free from generic filler?
- Does each section add something new?
- Does it sound like a real astrologer who understands psychology?
- No deterministic claims?
- ${langName} natural and elegant?
- Long enough to feel premium?
- Would a paying reader feel seen, understood, and meaningfully guided?
- Does EVERY section contain at least one concrete astrological reference?
- Can the reader identify their key placements (Sun, Moon, Ascendant, Venus, Mars, Saturn) from the report?
- Does "blocks_patterns" name what each block is PROTECTING?
- Does "work_direction" name SPECIFIC conditions of activation?
- Does "advice" include CONCRETE rhythm guidance (timing, peaks, pauses)?

OUTPUT FORMAT
Respond ONLY with the required tool call.

The tool arguments must contain exactly these fields:
- identity
- emotions_relationships
- blocks_patterns
- work_direction
- advice
- poem

Each field must be a plain ${langName} string.
Paragraphs inside each field must be separated by \\n\\n.
Do not include markdown.
Do not include bullet points inside the section text unless necessary.
Do not include any extra fields.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const quizSessionId = typeof body.quizSessionId === "string" ? body.quizSessionId : "";
    const skipEmail = body.skipEmail === true;

    if (!quizSessionId) {
      return new Response(JSON.stringify({ error: "quizSessionId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const adminSecret = req.headers.get("x-admin-secret") || "";
    const isAdminSecretRequest = Boolean(ADMIN_SECRET && adminSecret === ADMIN_SECRET);
    const isServiceRoleRequest = Boolean(SUPABASE_SERVICE_ROLE_KEY && token === SUPABASE_SERVICE_ROLE_KEY);
    const isAdminRequest = isAdminSecretRequest || isServiceRoleRequest;
    if (!token && !isAdminRequest) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const profileQuery = supabaseAdmin.from("profiles").select("id, user_id, email");

    // Try to resolve a profile. In pre-claim mode (admin call from
    // stripe-reconcile / capture-paypal-order right after payment, before the
    // buyer has signed up), there may not be one yet — that's allowed.
    let profile: { id: string; user_id: string; email: string | null } | null = null;
    if (isAdminRequest) {
      const adminEmail = typeof body.email === "string" ? body.email : "";
      if (adminEmail) {
        const result = await profileQuery.ilike("email", adminEmail).maybeSingle();
        if (result.data?.id) profile = result.data as any;
      }
      if (!profile) {
        // Fallback: derive profile from any user_reports row already attached
        // to this quiz session.
        const { data: reportRow } = await supabaseAdmin
          .from("user_reports")
          .select("profile_id")
          .eq("quiz_session_id", quizSessionId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (reportRow?.profile_id) {
          const { data } = await profileQuery.eq("id", reportRow.profile_id).maybeSingle();
          if (data?.id) profile = data as any;
        }
      }
    } else {
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !authData.user) {
        return new Response(JSON.stringify({ error: "Invalid session" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data } = await profileQuery.eq("user_id", authData.user.id).maybeSingle();
      if (!data?.id) {
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      profile = data as any;
    }

    // Try to find a user_reports row (claimed mode). It may be missing in
    // pre-claim mode.
    let userReport: {
      id: string;
      stripe_session_id: string | null;
      purchase_type: string | null;
      quiz_session_id: string;
    } | null = null;
    if (profile?.id) {
      const { data } = await supabaseAdmin
        .from("user_reports")
        .select("id, stripe_session_id, purchase_type, quiz_session_id")
        .eq("profile_id", profile.id)
        .eq("quiz_session_id", quizSessionId)
        .maybeSingle();
      if (data?.id) userReport = data as any;
    }

    // Determine the paid checkout session id we'll verify against. In
    // claimed mode it comes from user_reports; in pre-claim mode we look it
    // up from checkout_sessions.
    let paidCheckoutSessionId: string | null = userReport?.stripe_session_id || null;
    let preClaimMode = false;
    if (!paidCheckoutSessionId) {
      // Pre-claim is only allowed for admin/server callers.
      if (!isAdminRequest) {
        return new Response(JSON.stringify({ error: "Report is not linked to this account" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: paidRow } = await supabaseAdmin
        .from("checkout_sessions")
        .select("stripe_session_id")
        .eq("quiz_session_id", quizSessionId)
        .eq("payment_status", "paid")
        .order("payment_completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      paidCheckoutSessionId = paidRow?.stripe_session_id || null;
      preClaimMode = true;
    }

    if (!hasPaidCheckoutSession(paidCheckoutSessionId)) {
      if (!isAdminRequest) {
        return new Response(JSON.stringify({ error: "A paid checkout session is required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Admin-comped invocation (manual creation/regen by admin via x-admin-secret).
      // No payment to verify — fall through and generate the report directly.
      paidCheckoutSessionId = null;
    }

    if (paidCheckoutSessionId !== null) {
      if (isPaypalOpaque(paidCheckoutSessionId)) {
        // PayPal: verify against checkout_sessions.
        const { data: checkoutRow, error: checkoutErr } = await supabaseAdmin
          .from("checkout_sessions")
          .select("payment_status, quiz_session_id, payment_provider")
          .eq("stripe_session_id", paidCheckoutSessionId)
          .maybeSingle();

        if (
          checkoutErr ||
          !checkoutRow ||
          checkoutRow.payment_provider !== "paypal" ||
          checkoutRow.payment_status !== "paid" ||
          checkoutRow.quiz_session_id !== quizSessionId
        ) {
          return new Response(JSON.stringify({ error: "Payment does not match this report" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        // La riga checkout (creata da create-checkout) porta il market: serve
        // a scegliere l'account Stripe giusto per verificare il pagamento.
        const { data: marketRow } = await supabaseAdmin
          .from("checkout_sessions")
          .select("market")
          .eq("stripe_session_id", paidCheckoutSessionId)
          .maybeSingle();
        const stripe = new Stripe(
          getStripeSecret(paidCheckoutSessionId, (marketRow as { market?: string | null } | null)?.market),
          { apiVersion: "2025-08-27.basil" },
        );
        const checkoutSession = await stripe.checkout.sessions.retrieve(paidCheckoutSessionId);
        const paidQuizSessionId = checkoutSession.metadata?.quiz_session_id || "";
        if (checkoutSession.payment_status !== "paid" || paidQuizSessionId !== quizSessionId) {
          return new Response(JSON.stringify({ error: "Payment does not match this report" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { data: quizSession, error: quizError } = await supabaseAdmin
      .from("quiz_sessions")
      .select(
        "id, natal_chart, attachment_response, focus_area, user_name, birth_date, teaser_insights, full_report, processing_status, funnel_slug, quiz_answers, language, market",
      )
      .eq("id", quizSessionId)
      .maybeSingle();

    if (quizError || !quizSession) {
      return new Response(JSON.stringify({ error: "Quiz session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (quizSession.full_report) {
      // The report is already generated. If we are in claimed mode (profile +
      // user_reports row exist), make sure the post-generation side-effects
      // happened: profile pointers updated, user_reports activated, and the
      // "report-ready" email enqueued. This covers the pre-claim → claim
      // sequence where generate-report ran once before signup (no profile,
      // no email sent) and is now invoked again after the buyer claimed.
      // Idempotency keys (deterministic per quizSessionId) guarantee no
      // duplicate email is ever sent.
      if (profile?.id && userReport?.id) {
        try {
          await supabaseAdmin
            .from("profiles")
            .update({
              quiz_session_id: quizSessionId,
              stripe_session_id: userReport.stripe_session_id,
            })
            .eq("id", profile.id);

          await supabaseAdmin
            .from("user_reports")
            .update({ is_active: true, updated_at: new Date().toISOString() })
            .eq("id", userReport.id);
        } catch (e) {
          console.warn(
            `[generate-report] post-claim sync warning for ${quizSessionId}:`,
            e instanceof Error ? e.message : String(e),
          );
        }

        const recipient = profile.email || "";
        if (recipient && !skipEmail) {
          console.log(
            `[generate-report] alreadyExists + claimed → enqueueing report-ready for ${recipient} (${quizSessionId})`,
          );
          sendTransactionalEmailBackground({
            templateName: "report-ready",
            recipientEmail: recipient,
            idempotencyKey: `report-ready-${quizSessionId}`,
            templateData: {
              name: quizSession.user_name || "",
              sessionId: userReport.stripe_session_id || undefined,
              lang: resolvePromptLang((quizSession as any).language),
              market: (quizSession as any).market === "es" ? "es" : "it",
            },
          });
        }
      }

      return new Response(JSON.stringify({ report: quizSession.full_report, alreadyExists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const natalChart = quizSession.natal_chart;
    const attachmentResponse = quizSession.attachment_response || "";
    const focusArea = quizSession.focus_area || "";
    const userName = quizSession.user_name || "";
    const userAge = computeAge((quizSession as any).birth_date);
    const teaserInsights = quizSession.teaser_insights;
    // Funnel routing: classica uses dedicated columns (back-compat), attivazione
    // reads its intake from quiz_answers JSONB. funnel_slug drives the prompt
    // and JSON schema selection below.
    const funnelSlug = ((quizSession as any).funnel_slug as string) || "classica";
    const quizAnswers = (((quizSession as any).quiz_answers as Record<string, string>) || {});
    const isAttivazione = funnelSlug === "attivazione";
    // Lingua di output del report (da quiz_sessions.language, default 'it').
    const lang = resolvePromptLang((quizSession as any).language);

    if (!natalChart || !natalChart.planets) {
      return new Response(JSON.stringify({ error: "Missing natal chart data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atomic compare-and-swap to claim the generation lock. Two concurrent
    // callers (Stripe webhook + frontend /report-processing) used to both pass
    // a non-atomic SELECT-then-UPDATE check and both call Gemini, doubling LLM
    // cost. Postgres guarantees that an UPDATE with a WHERE clause evaluates
    // atomically, so only one caller's update will affect a row; the other
    // sees zero rows affected and exits early.
    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from("quiz_sessions")
      .update({ processing_status: "report_processing", processing_error: null })
      .eq("id", quizSessionId)
      .neq("processing_status", "report_processing")
      .is("full_report", null)
      .select("id");

    if (claimErr) throw claimErr;

    if (!claimed || claimed.length === 0) {
      return new Response(JSON.stringify({ started: true, alreadyProcessing: true }), {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generationTask = (async () => {
      try {
        if (!getLlmApiKey()) throw new Error("AI not configured (OPENROUTER_API_KEY missing)");

        const planetsDescription = Array.isArray(natalChart.planets)
          ? natalChart.planets
              .map((p: any) => {
                const name = p.name || p.id || getName(p.planet);
                const sign = p.sign || getName(p.zodiac_sign);
                const deg = p.pos ?? p.normDegree ?? p.fullDegree ?? "";
                const house = p.house ?? p.House ?? "?";
                const retro = p.retrograde || String(p.isRetro).toLowerCase() === "true" ? " (R)" : "";
                return `${name}: ${deg}° in ${sign} (house ${house})${retro}`;
              })
              .join("\n")
          : JSON.stringify(natalChart.planets);

        const housesDescription = Array.isArray(natalChart.houses)
          ? natalChart.houses
              .map((h: any) => {
                const num = h.house || h.House || h.name || "?";
                const sign = h.sign || getName(h.zodiac_sign);
                const deg = h.pos ?? h.normDegree ?? "";
                return `House ${num}: ${sign} ${deg}°`;
              })
              .join("\n")
          : JSON.stringify(natalChart.houses);

        const anglesDescription = natalChart.angles_details
          ? Object.entries(natalChart.angles_details)
              .map(([key, val]: [string, any]) => `${key.toUpperCase()}: ${val.sign} ${(val.pos ?? "").toString()}°`)
              .join("\n")
          : "";

        const aspectsRanked = Array.isArray(natalChart.aspects)
          ? natalChart.aspects
              .filter((a: any) => a.is_major !== false)
              .map((a: any) => ({ a, score: scoreAspect(a) }))
              .sort((x: { score: number }, y: { score: number }) => y.score - x.score)
              .map((x: { a: any }) => x.a)
          : [];

        const aspectsDescription = aspectsRanked.length > 0
          ? aspectsRanked
              .slice(0, 20)
              .map((a: any) => {
                const p1 = a.p1 || getName(a.planet_1);
                const asp = a.type || getName(a.aspect);
                const p2 = a.p2 || getName(a.planet_2);
                const orb = a.orb ?? "";
                return `${p1} ${asp} ${p2}${orb ? ` (orb: ${orb}°)` : ""}`;
              })
              .join("\n")
          : JSON.stringify(natalChart.aspects);

        const teaserSummary = Array.isArray(teaserInsights)
          ? teaserInsights.map((i: any) => `- ${i.title}: ${i.body}`).join("\n")
          : "";

        const salienceBlock = !isAttivazione
          ? formatSalienceMap(buildSalienceMap(natalChart), lang)
          : "";

        const langName = OUTPUT_LANGUAGE_NAME[lang];
        const systemPrompt = isAttivazione
          ? outputLanguageDirective(lang) + buildAttivazioneSystemPrompt(langName)
          : outputLanguageDirective(lang) +
            `You are an expert astrologer with strong psychological depth and high interpretive discipline.

Write in natural ${langName} only. The tone must be human, lucid, emotionally precise, sober, grounded, and credible. Do not sound mystical, inflated, generic, new-age, or like horoscope content. Do not flatter. Do not make deterministic predictions. Do not use astrology as decoration. Use astrology as a tool for synthesis, meaning, and psychological clarity.

PRIMARY GOAL
Generate a long-form premium natal reading that feels deeply personal, coherent from beginning to end, psychologically sharp, emotionally accurate, non-generic, rich enough to feel like a real paid reading, and approximately 9 pages in normal web/PDF formatting.

The reading must help the reader understand who they are structurally, how their emotional world works, how they love and protect themselves, what patterns and blocks tend to repeat, how their inner structure shows up in work and direction, and what practical movement is possible.

CORE INTERPRETIVE PRINCIPLES
1. The natal chart is the root. Everything important must emerge from the chart itself; do not invent themes that are weakly supported.
2. Synthesis first, interpretation second. Identify the dominant themes, then build around them. No placement-by-placement laundry list.
3. Predict patterns, not events. Focus on inner terrain, developmental tensions, recurring dynamics, growth challenges. No claims that specific outer events must happen.
4. Every chart is unique. Avoid prefabricated interpretations. The reading must feel like a coherent portrait of one person, not a reusable template.
5. Meaning over jargon. Astrological references add credibility, but always translate them immediately into clear human language.

INTERNAL METHOD (DO NOT OUTPUT THIS PROCESS)
A. Read PRIORITY MARKERS + Sun/Moon/Ascendant. Extract 4–6 dominant themes for THIS chart.
B. Identify the central tension: where the chart contradicts itself, which polarities organize the personality.
C. Map each section to 1–2 dominant themes. Adjacent sections share at most one theme, treated from a different angle.
D. Choose the concrete markers that support each section. Every paragraph leans on at least one marker.
E. Write. If a section overlaps another, change angle — same theme, different lens.

INTAKE ANSWERS — IMPORTANT BEHAVIOR
The session includes answers to two context questions:
- "Reaction to ambiguity": how the person reacts when a relationship becomes uncertain
- "Focus area": which life pattern resonates most right now

Treat these as EMOTIONAL CALIBRATION signals, NOT facts to report.

Absolute rules:
- NEVER quote the user's answer, in full or in part
- NEVER place any fragment of the user's wording inside quotation marks (« », " ", " ", ' ', ', ')
- NEVER paraphrase the user's answer with the same words or structure
- NEVER write "tu hai detto…", "come hai scritto…", "la tua risposta…", "hai indicato…", or any direct reference to the answer
- NEVER make the user's answer the source of an interpretation
- ALL content must derive from the natal chart
- When a chart finding resonates with what the user named, describe the chart finding in your own astrological language — let recognition happen naturally, without naming the user's answer

USE OF "FOCUS AREA" AS EMPHASIS DIAL
"Focus area" works as an emphasis dial across the report (use it only to weight sections, never as material to quote):
- "Ritrovarmi nello stesso schema…" → SCHEMA-leaning: extra weight in "patterns_blocks" on the recurring loop, plus the schema axis of "relationships".
- "Chiedere sempre la stessa cosa…" → DESIDERIO-leaning: extra weight in "relationships" on the specific shape of the desire and on what the defense protects.
- "Rinunciare a parti importanti di me" → COSTO NASCOSTO-leaning: extra weight in "patterns_blocks" on what gets currently sacrificed, and in "relationships" on what part of the self the schema makes the reader rinunciare.
If the answer is missing or unclear, fall back to balanced weighting. If context conflicts with the chart, follow the chart. If teaser insights are provided, do not repeat them verbatim — build beyond them.

LIFE STAGE AND GENDER MODULATION
Age must shape the interpretation: the same configuration is not expressed the same way at 20 and at 50. Infer life stage from age and adapt emphasis, examples, tone, likely manifestations, and practical guidance. If gender can be inferred from the name with confidence, adapt ${langName} grammatical agreement accordingly. Chart remains primary; age and gender are secondary modifiers.

ASTROLOGICAL FOCUS & ORBS
Anchors (always present): Sun, Moon, Ascendant. Topical: Venus/Mars for relationships, MC/Saturn for work, Saturn/Pluto/Neptune/Lilith for deep structures and blocks. Houses and angles (MC/IC/DSC) matter when populated.
Orb rules: ≤4° always relevant; ≤6° for personal planets and Saturn/Pluto/Neptune/Lilith; ≤7° only for major Sun/Moon aspects. Ignore minor aspects unless tight and clearly significant. Angular planets (houses 1/4/7/10) and planets conjunct ASC/MC/DSC/IC (orb ≤8°) are always relevant.

USING ASTROLOGY IN PROSE
Each section anchors to 1–3 concrete chart elements (sign, planet, house, aspect), integrated into the prose — never listed, never the reading itself. Each reference is translated immediately into emotional, relational, or existential meaning.
- Choose the elements that are MOST DISTINCTIVE for THIS chart (drawn from PRIORITY MARKERS, tight aspects, angular placements). Don't fall back to the same anchors in every section.
- Sun, Moon and Ascendant must remain recognizable across the whole reading: each named with sign at least once, Sun and Moon also with house. But they don't need to dominate every section — let salience guide.
- Do NOT explain what a square, opposition, or conjunction is. Do NOT sound like a manual. Do NOT list placements without interpretation.

ANTI-REPETITION
Sections are distinct, never paraphrases. If a theme reappears, later sections deepen it from a new angle. "patterns_blocks" doesn't restate "identity" in new words; "relationships" doesn't repeat "emotions"; "advice" doesn't summarize — it converts insight into movement.

STYLE RULES
- Address the person using "tu" and his/her name.
- Natural ${langName} only. Strong but sober phrasing. Concrete psychological truth over pretty writing.
- No zodiac clichés, no fatalism, no therapy clichés, no generic self-help, no empty reassurance, no decorative verbosity.
- Metaphor only when it sharpens understanding. Intimate and intelligent, not theatrical.

SECTION GUIDANCE
Length targets and paragraph structure live in the OUTPUT schema. What matters for each section:

- "identity": foundational. Core structure, central tension, what the person seeks/protects/compensates at the deepest level.
- "emotions": lived inner experience. Emotional needs, sensitivity, regulation, internal oscillations, what destabilizes and what restores equilibrium.
- "relationships": the richest section — closes the teaser's curiosity gap. Must name with psychological precision: WHAT EACH DEFENSE IS PROTECTING (the signature move: every relational defense also guards something precious — fragility, self-image, unprocessed loss, identity vulnerability); THE SPECIFIC PSYCHOLOGICAL SHAPE OF DESIRE IN LOVE (concrete: care, recognition, complicity, vertigo, secure base, contained intensity, witnessed solitude, fusional closeness — not generic "amore vero"); WHAT PART OF THE SELF THE SCHEMA MAKES THE READER RINUNCIARE (the present cost — spontaneity, trust, expansiveness, identity coherence, a particular joy — not childhood origin); THE INTERNAL SIGNALS THAT ANNOUNCE THE SCHEMA ACTIVATING IN REAL TIME (a specific tightening, hyper-vigilance, emotional flooding, kind of fantasizing, withdrawal of presence — diagnostic markers usable independently of who the partner is). Also: what changes inwardly once the pattern is recognized (inner pacification, not behavioral change).
- "work": how the structure expresses in direction and meaningful effort. Relationship with purpose, style of effort, inner conflict around achievement, what kind of direction fits, what tends to block outer expression. Not a generic career horoscope.
- "patterns_blocks": recurring schemas AND the blocks that keep them in place — read together. Name the larger patterns that replay across areas of life (emotional loops, self-sabotage cycles, pursuit/withdrawal, over-control vs surrender, idealization vs disappointment, hunger for intensity vs safety). For each major block: where the person gets stuck, what protection it once was, and WHAT THE BLOCK IS CURRENTLY SACRIFICING OF THE SELF (present cost, not childhood origin — avoid "ferita interiore", "bambino interiore", "trauma originario"). Compassionate but not soft. Tells the truth clearly.
- "advice": translates the reading into practical guidance, specific and chart-derived. What to notice, what to stop reinforcing, what to tolerate better, what to practice, what choices strengthen the healthier expression of the chart. Usable in real life. Not a summary.
- "poem": transformative personal poem in ${langName}, 14–18 short lines. Clear, simple language. Intimate and direct. Not decorative, not mystical wallpaper, not literary performance. No zodiac signs; no technical astrological language; planets only if Sun, Moon, or Venus fit naturally. Something the reader can keep, reread, return to.

QUALITY CHECK BEFORE FINALIZING
Silently verify:
1. Every section has 1–3 concrete astrological references, integrated in prose (not listed).
2. All PRIORITY MARKERS are touched at least once across the report.
3. Sun, Moon, Ascendant are recognizable (sign for Asc; sign + house for Sun and Moon); Venus and Mars appear in "relationships".
4. ${langName} is fluent and sentences are tight. The tone offers recognition — not admiration, motivation, or deterministic claims.
5. No paragraph is generic enough to be reused for another chart.

OUTPUT FORMAT
Respond ONLY with the required tool call. The tool arguments must contain exactly these fields: identity, emotions, relationships, work, patterns_blocks, advice, poem. Each field is a plain ${langName} string with paragraphs separated by \\n\\n. No markdown, no bullet points inside the section text unless necessary, no extra fields.`;

        const userPrompt = `Natal chart:

PLANETS:
${planetsDescription}

HOUSES:
${housesDescription}
${anglesDescription ? `\nANGLES:\n${anglesDescription}\n` : ""}
MAJOR ASPECTS:
${aspectsDescription}
${salienceBlock ? `\n${salienceBlock}\n` : ""}
CONTEXT:
- Name: ${userName || "not provided"}
- Age: ${userAge !== null ? `${userAge} years` : "not available"}
${isAttivazione
  ? `- Reported symptom: ${quizAnswers.symptom || "not provided"}\n- Self-narrative: ${quizAnswers.narrative || "not provided"}`
  : `- Reaction to ambiguity: ${attachmentResponse || "not provided"}\n- Focus area: ${focusArea || "not provided"}`}
${teaserSummary ? `\nINSIGHTS ALREADY PROVIDED (do not repeat, expand):\n${teaserSummary}` : ""}

Generate the complete personalized report.`;

        // Schema selection per funnel: classica returns 8 fields (existing),
        // attivazione returns 6 fields (identity, emotions_relationships,
        // blocks_patterns, work_direction, advice, poem). The schema is
        // strictly enforced by the tool call so the LLM cannot drift.
        const reportSchemaProperties = isAttivazione
          ? {
              identity: { type: "string", description: "Identity section, 3-4 paragraphs separated by \\n\\n" },
              emotions_relationships: {
                type: "string",
                description: "Emotions and relationships section, 4-5 paragraphs separated by \\n\\n",
              },
              blocks_patterns: {
                type: "string",
                description:
                  "Blocks and recurring patterns section, 5-6 paragraphs separated by \\n\\n. Must explicitly name what each block is protecting.",
              },
              work_direction: {
                type: "string",
                description:
                  "Work and direction section, 4-5 paragraphs. Must name specific conditions under which the structure activates.",
              },
              advice: {
                type: "string",
                description: "Advice section, 3-4 paragraphs with concrete rhythm guidance integrated (timing, peaks, pauses).",
              },
              poem: { type: "string", description: "Free-verse poem, 14-18 lines" },
            }
          : {
              identity: { type: "string", description: "Identity section, 3-4 paragraphs separated by \\n\\n" },
              emotions: { type: "string", description: "Emotions section, 2-3 paragraphs" },
              relationships: { type: "string", description: "Relationships section, 3-4 paragraphs" },
              work: { type: "string", description: "Work section, 2-3 paragraphs" },
              patterns_blocks: {
                type: "string",
                description:
                  "Recurring patterns and blocks section, 4-5 paragraphs separated by \\n\\n. Read patterns and blocks as one continuous theme. For each major block, name what it is currently sacrificing of the self (present cost, not childhood origin).",
              },
              advice: { type: "string", description: "Advice section, 3 paragraphs" },
              poem: { type: "string", description: "Free-verse poem, 14-18 lines" },
            };
        const reportSchemaRequired = isAttivazione
          ? ["identity", "emotions_relationships", "blocks_patterns", "work_direction", "advice", "poem"]
          : ["identity", "emotions", "relationships", "work", "patterns_blocks", "advice", "poem"];

        const aiRequestBody = {
          model: LONG_REPORT_MODEL,
          reasoning: { effort: "medium" },
          max_tokens: 32768,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          // Structured output via response_format/json_schema (not forced
          // tool-calling): DeepSeek V4 Pro reliably honors json_schema but does
          // NOT reliably emit a forced tool call on a full-size report. The
          // schema is identical to the old tool's parameters.
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "return_report",
              strict: true,
              schema: {
                type: "object",
                properties: reportSchemaProperties,
                required: reportSchemaRequired,
                additionalProperties: false,
              },
            },
          },
        };

        const MAX_ATTEMPTS = 3;
        // Safety net only — above the slowest observed DeepSeek+reasoning full
        // report (~270s at effort=high; medium is faster), so we never abort a
        // run that's still on track. Catches genuine hangs before the edge ceiling.
        const FETCH_TIMEOUT_MS = 300_000;
        // Exponential backoff before each retry (attempt 2 ≈ 2s, attempt 3 ≈ 5s)
        // plus jitter, so a transient 503 "model overloaded" burst is absorbed
        // inside this invocation instead of waiting for the 10-min watchdog.
        const RETRY_BACKOFF_MS = [0, 2_000, 5_000];
        // Stop retrying once the loop has burned this much wall-clock. The edge
        // runtime reclaims the background task around its ceiling; a retry that
        // starts too late would be killed mid-write, losing the 'failed' status
        // the watchdog relies on to re-claim. Hand off to recover-pending-reports.
        const RETRY_BUDGET_MS = 150_000;
        const loopStartedAt = Date.now();
        let lastError = "";
        let lastAttempt = 0;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          if (attempt > 0) {
            if (Date.now() - loopStartedAt > RETRY_BUDGET_MS) {
              console.warn(
                `[generate-report] Retry budget (${RETRY_BUDGET_MS}ms) exhausted after ${Date.now() - loopStartedAt}ms; handing off to watchdog`,
              );
              break;
            }
            const base = RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1];
            await new Promise((resolve) => setTimeout(resolve, base + Math.floor(Math.random() * 500)));
          }
          lastAttempt = attempt + 1;
          const t0 = Date.now();
          const metricBase = {
            functionName: "generate-report",
            model: aiRequestBody.model,
            quizSessionId,
            attempt: lastAttempt,
          };

          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
          let response: Response;
          try {
            response = await fetch(LLM_CHAT_COMPLETIONS_URL, {
              method: "POST",
              headers: llmHeaders(),
              body: JSON.stringify(aiRequestBody),
              signal: controller.signal,
            });
          } catch (err) {
            const name = err instanceof Error ? err.name : "";
            if (name === "AbortError") {
              console.warn(
                `[generate-report] Attempt ${attempt + 1}: client abort after ${FETCH_TIMEOUT_MS}ms`,
              );
              await flushAiMetric(supabaseAdmin, {
                ...metricBase,
                durationMs: Date.now() - t0,
                success: false,
                httpStatus: null,
                errorCode: `client_timeout_${FETCH_TIMEOUT_MS}ms`,
              });
              lastError = `Client timeout after ${FETCH_TIMEOUT_MS}ms`;
              continue;
            }
            throw err;
          } finally {
            clearTimeout(timer);
          }

          if (!response.ok) {
            const errText = await response.text();
            console.error(`AI gateway error (attempt ${attempt + 1}):`, response.status, errText);
            await flushAiMetric(supabaseAdmin, {
              ...metricBase,
              durationMs: Date.now() - t0,
              success: false,
              httpStatus: response.status,
              errorCode: `http_${response.status}`,
            });

            if (response.status === 429) {
              throw new Error(`AI gateway 429: ${errText.slice(0, 500) || "Rate limit exceeded"}`);
            }
            if (response.status === 402) {
              throw new Error(`AI gateway 402: ${errText.slice(0, 500) || "Payment required"}`);
            }

            lastError = `AI gateway ${response.status}: ${errText.slice(0, 500)}`;
            continue;
          }

          const rawText = await response.text();

          if (!rawText.trim()) {
            console.warn(
              `Attempt ${attempt + 1}/${MAX_ATTEMPTS}: empty response body from AI gateway after ${Date.now() - t0}ms (http ${response.status})`,
            );
            await flushAiMetric(supabaseAdmin, {
              ...metricBase,
              durationMs: Date.now() - t0,
              success: false,
              httpStatus: response.status,
              errorCode: "empty_body",
            });
            lastError = "AI returned empty response";
            continue;
          }

          let result;
          try {
            result = JSON.parse(rawText);
          } catch (e) {
            console.error(
              `Attempt ${attempt + 1}: failed to parse response JSON. Raw (first 500 chars):`,
              rawText.substring(0, 500),
            );
            await flushAiMetric(supabaseAdmin, {
              ...metricBase,
              durationMs: Date.now() - t0,
              success: false,
              httpStatus: response.status,
              errorCode: "json_parse_error",
            });
            lastError = `Failed to parse AI response: ${e}`;
            continue;
          }

          const content = result.choices?.[0]?.message?.content;

          if (!content || typeof content !== "string" || !content.trim()) {
            // Encode finish_reason + has_usage in error_code so the metrics
            // table tells us why content was missing without a schema migration.
            // "length" = model hit max_tokens; "stop:no_usage" = gateway truncation.
            const finishReason: string = result?.choices?.[0]?.finish_reason ?? "none";
            const hasUsage = !!result?.usage;
            const errorCode = `missing_content:${finishReason}${hasUsage ? "" : ":no_usage"}`;
            console.error(
              `Attempt ${attempt + 1}: no content in response (finish_reason=${finishReason}, has_usage=${hasUsage}):`,
              JSON.stringify(result).substring(0, 500),
            );
            await flushAiMetric(supabaseAdmin, {
              ...metricBase,
              durationMs: Date.now() - t0,
              success: false,
              httpStatus: response.status,
              errorCode,
              usage: result?.usage,
            });
            lastError = "AI returned no content";
            continue;
          }

          let parsed;
          try {
            parsed = safeParseJson(content);
          } catch (e) {
            console.error(
              `Attempt ${attempt + 1}: failed to parse JSON content. Raw (first 500 chars):`,
              content.substring(0, 500),
            );
            await flushAiMetric(supabaseAdmin, {
              ...metricBase,
              durationMs: Date.now() - t0,
              success: false,
              httpStatus: response.status,
              errorCode: "content_parse_error",
              usage: result?.usage,
            });
            lastError = `Failed to parse AI content: ${e}`;
            continue;
          }

          recordAiMetric(supabaseAdmin, {
            ...metricBase,
            durationMs: Date.now() - t0,
            success: true,
            httpStatus: response.status,
            usage: result?.usage,
          });

          // Some LLM tool-call payloads double-escape line breaks, leaving a
          // literal backslash + "n" inside string fields after JSON.parse.
          // Convert those to real newlines before storing so both the on-page
          // renderer and the PDF generator break paragraphs correctly.
          parsed = unescapeWhitespaceLiterals(parsed);

          await supabaseAdmin
            .from("quiz_sessions")
            .update({
              full_report: parsed,
              processing_status: "report_ready",
              processing_error: null,
              report_attempts: lastAttempt,
            })
            .eq("id", quizSessionId)
            .is("full_report", null);

          // Only update profile/user_reports + send "report-ready" email when
          // the report is already linked to a profile (claimed mode). In
          // pre-claim mode (generation kicked off right after payment, before
          // signup), sync-checkout-session will do the linking and the email
          // will be sent on first access.
          if (profile?.id && userReport?.id) {
            await supabaseAdmin
              .from("profiles")
              .update({ quiz_session_id: quizSessionId, stripe_session_id: userReport.stripe_session_id })
              .eq("id", profile.id);

            await supabaseAdmin
              .from("user_reports")
              .update({ is_active: true, updated_at: new Date().toISOString() })
              .eq("id", userReport.id);

            const recipient = profile?.email || "";
            if (recipient && !skipEmail) {
              sendTransactionalEmailBackground({
                templateName: "report-ready",
                recipientEmail: recipient,
                idempotencyKey: `report-ready-${quizSessionId}`,
                templateData: {
                  name: userName || "",
                  sessionId: userReport.stripe_session_id || undefined,
                  lang,
                  market: (quizSession as any).market === "es" ? "es" : "it",
                },
              });
            }
          } else {
            console.log(
              `[generate-report] Pre-claim completion for ${quizSessionId} — skipping profile updates and email`,
            );
          }

          console.log(`[generate-report] Completed ${quizSessionId} attempt=${attempt + 1}/${MAX_ATTEMPTS}`);
          return;
        }

        throw new Error(lastError || "AI generation failed");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[generate-report] Background generation failed for ${quizSessionId}:`, message);
        await supabaseAdmin
          .from("quiz_sessions")
          .update({
            processing_status: "failed",
            processing_error: message.slice(0, 1000),
            report_attempts: lastAttempt,
          })
          .eq("id", quizSessionId)
          .is("full_report", null);
      }
    })();

    EdgeRuntime.waitUntil(generationTask);

    return new Response(JSON.stringify({ started: true, alreadyExists: false }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-report error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Awaited sibling of recordAiMetric (fire-and-forget): used on the retryable
// failure branches so the row is flushed before the loop sleeps/continues.
// Without this, a 2nd/3rd attempt's metric can be lost when the background
// worker is reclaimed, which is why retries were invisible in the table.
// Kept local to avoid a _shared change that would force redeploying every
// ai-metrics importer.
async function flushAiMetric(supabase: any, args: RecordAiMetricArgs): Promise<void> {
  try {
    const { error } = await supabase.from("ai_generation_metrics").insert({
      function_name: args.functionName,
      model: args.model ?? null,
      quiz_session_id: args.quizSessionId ?? null,
      transit_cycle_id: args.transitCycleId ?? null,
      attempt: args.attempt,
      duration_ms: Math.max(0, Math.round(args.durationMs)),
      success: args.success,
      http_status: args.httpStatus ?? null,
      error_code: args.errorCode ?? null,
      prompt_tokens: args.usage?.prompt_tokens ?? null,
      completion_tokens: args.usage?.completion_tokens ?? null,
      total_tokens: args.usage?.total_tokens ?? null,
    });
    if (error) console.warn("[generate-report] metric flush failed:", error);
  } catch (err) {
    console.warn("[generate-report] metric flush threw:", err);
  }
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (_) {
    // Try sanitizing
    let cleaned = raw
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, (c) => (c === "\n" || c === "\t" ? c : ""));

    // Detect truncation: fix unbalanced braces
    const openBraces = (cleaned.match(/{/g) || []).length;
    const closeBraces = (cleaned.match(/}/g) || []).length;
    if (openBraces > closeBraces) {
      // Try to find the last complete key-value and close
      const lastQuote = cleaned.lastIndexOf('"');
      if (lastQuote > 0) {
        // Find the last complete value
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

// Walks the parsed AI tool-call payload and converts literal escape
// sequences (e.g. "\\n", "\\r\\n", "\\t") inside string values back into
// real whitespace characters. The model occasionally returns
// arguments where these sequences survived JSON.parse as plain text,
// which then renders as visible "\n\n" in both the on-page report and
// the generated PDF.
function unescapeWhitespaceLiterals(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")
      .replace(/\\t/g, "    ");
  }
  if (Array.isArray(value)) {
    return value.map((item) => unescapeWhitespaceLiterals(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = unescapeWhitespaceLiterals(v);
    }
    return out;
  }
  return value;
}
