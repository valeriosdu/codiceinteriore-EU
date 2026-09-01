// process-synastry-insights: orchestratore del teaser pre-pagamento per la sinastria.
//
// 1. Invoca synastry-chart (calcola synastry_data + archetype + scores + SVG bi-wheel)
// 2. Chiama Gemini Flash per generare il teaser_highlight in italiano
// 3. Salva teaser_highlight, setta processing_status = "insights_ready"
//
// Background via EdgeRuntime.waitUntil, ritorna 202 immediatamente.
// Non-auth (public): serve il teaser anonimo pre-Stripe.
//
// Plan: lazy-wishing-kay.md sez. B2.

// @ts-ignore deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { recordAiMetric } from "../_shared/ai-metrics.ts";
import { getArchetypeMeta } from "../_shared/synastry-archetypes.ts";
import { topAspects } from "../_shared/synastry-derive.ts";
import { formatAspectForBrief } from "../_shared/synastry-aspect-labels.ts";
import { calcolaEta, fasciaEtaCoppia, gapSignificativo } from "../_shared/synastry-age-bands.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import { resolvePromptLang, outputLanguageDirective, OUTPUT_LANGUAGE_NAME } from "../_shared/prompts/lang.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};
declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") ?? "";

const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// Gemini Flash ritorna 503 (overloaded) / 429 a intermittenza: retry con
// backoff. flash-lite e' veloce (~3s), un paio di retry restano nella finestra
// di polling del teaser di coppia.
async function geminiFetchWithRetry(body: string): Promise<Response> {
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
    await response.text().catch(() => {});
    await new Promise((r) => setTimeout(r, attempt * 1000));
  }
}

const buildSynastryTeaserPrompt = (langName: string): string => `# Who you are
You are a cultured astrologer. You write the synastry preview teaser for a couple who just finished the quiz. Their stated goal: to understand their relationship. Your unstated goal: to make them want to read the full 14-page report.

# Teaser objective (in priority order)
1. Make them think "that's us" at least once in the text (recognition).
2. Leave at least one open question that only the report can resolve (curiosity gap).
3. Convey authority by subtraction: the less you say, the more serious you seem.

# Psychological levers to use (at least 3 of these 6)
a. **Identification**: open with a concrete, recognizable behavior of the couple. Equivalents of "You've probably found yourselves...", "When one of you...", "You often argue about...". Do NOT open with abstract concepts.
b. **Credible specificity**: describe ONE concrete detail of how they behave (a typical friction, a recurring reaction). One precise observation is worth more than three generic ones.
c. **Open loop**: hint at a pattern or a number ("three knots", "two blind spots", "one of these challenges") without revealing them all. The report is the only way to close the loop.
d. **Curiosity gap**: leave a precise information gap that burns (the equivalent of "beneath this intensity there's a rare contact that explains...").
e. **Soft future pacing**: a future version of the couple that requires understanding themselves ("once you get this, the same dynamic becomes a resource").
f. **Cost of inaction (subtle)**: what happens if they don't look at the dynamic, WITHOUT catastrophizing. "Otherwise it tends to keep returning in the same forms."

# Mandatory structure (4 sentences)
- **Sentence 1 - Hook**: a behavioral observation addressed to the couple in the second person plural, informal (the couple as "you" together). Example intent: "You've probably noticed that when X, the other Y." Address them directly as a couple; do NOT open with "your dynamic / your relationship".
- **Sentence 2 - Minimal astrological explanation**: ONE single astrological reference, rendered in plain ${langName}. If you cite a lesser-known point (Lilith, Chiron, Nodes, Vertex) translate it immediately (e.g. "Lilith, the most buried point of desire"). Never more than 1-2 planets named in the whole teaser.
- **Sentence 3 - Consequence or tension**: what it means in real life. Open a loop. Do NOT give the solution (the report does that).
- **Sentence 4 - Open ending**: point to the report with an intriguing number or pattern without revealing it. Example intent: "In the report we cross three knots of this kind." / "Two of your karmic patterns still return today."

# Use of names
Use the two names 1-2 times in the whole text. NOT as clinical-file labels (avoid the equivalent of "Valerio's Lilith"). Use them the way a good friend would: "when Valerio pushes...", "Kinga tends to...".

# Things you must NEVER do
- Em-dashes (—). Replace with commas, parentheses, or colons.
- Open with the equivalent of "Your dynamic" / "Your relationship" / "Between you".
- List 3+ astrological aspects in sequence (e.g. "the conjunction X, the trine Y, the square Z..."). MAX 1 aspect in the whole teaser.
- Cite aspects as "conjunction between A and B" (manual-like language): prefer "a contact", "a bond", "a tension" between A and B.
- Give the solution. The teaser does not resolve, the teaser opens.
- Magazine-consulting phrases like "Understanding how to balance X with Y is the key". Turn it into: "What remains is to understand how to balance X."
- "You are a special/unique/wonderful/destined couple".
- "Astrology says/teaches/states".
- Emoji, exclamation marks, unmotivated superlatives.
- Technical terms without translation: if you say "Midheaven" add the equivalent of "your public vocation".

# Behavior for low scores (overall < 40, or more than 3 domains below 30)
When the scores are low:
- The couple already knows something is complex. Do not pretend it is easy.
- Hook: start from a dynamic experienced as repetitive strain (the equivalent of "You've probably asked yourselves more than once why X always comes back to the same point"). The tone is recognition, not diagnosis.
- Explanation: the astrological reference must sound like a structural reason, not a sentence ("a contact that makes it inevitable to return to this theme, because it touches a sensitive point for both of you").
- Consequence: turn the tension into raw material ("once you understand where it comes from, the same strain changes shape").
- Ending: the report becomes the tool to understand, not to confirm. "In the reading we cross the three knots that make this dynamic so persistent."
- Do NOT minimize ("all in all it's not that bad") and do NOT catastrophize ("your relationship is very demanding"). Stay factual and curious.

# Example of a converting output (reference for tone, NOT to copy — shown here in English, but you MUST write in ${langName})
Title: "Yours is a passion that asks for structure"
Body: "You've probably noticed, between Kinga and Valerio, that when one raises the stakes the other never falls behind: there's an energy that pushes you to measure yourselves constantly, even where others would let it go. Beneath this intensity there's a rare contact between Lilith, the most buried point of desire, and the Mars of the one on the other side, the magnetic attraction that often pulls you back together right as you're drifting apart. What remains is to understand how this dynamic can become material for building instead of repeating in the same forms. In the full reading we cross three knots of this kind, one for each domain of your life together."

# Length
- Title: 4-8 words. No ellipsis. No "Between X and Y" opening: too close to a magazine headline.
- Body: 75-110 words. Typically 4 sentences.`;

interface SynastrySession {
  id: string;
  person_a_name: string | null;
  person_b_name: string | null;
  person_a_birth_date: any;
  person_b_birth_date: any;
  relationship_duration: string | null;
  synastry_data: any;
  archetype: string | null;
  archetype_label: string | null;
  teaser_highlight: any;
  processing_status: string | null;
  language: string | null;
}

async function invokeSynastryChart(
  supabaseUrl: string,
  serviceRole: string,
  synastrySessionId: string,
): Promise<void> {
  const res = await fetch(`${supabaseUrl}/functions/v1/synastry-chart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRole}`,
      apikey: serviceRole,
    },
    body: JSON.stringify({ synastrySessionId }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`synastry-chart failed ${res.status}: ${t.slice(0, 300)}`);
  }
}

async function generateTeaserHighlight(
  session: SynastrySession,
  supabase: any,
): Promise<{ title: string; body: string }> {
  const archetype = getArchetypeMeta(session.archetype);
  const aspects = topAspects(session.synastry_data?.synastry?.aspects ?? [], 5);
  const personAName = session.person_a_name ?? "Partner A";
  const personBName = session.person_b_name ?? "Partner B";
  const aspectLines = aspects.map((a: any) =>
    formatAspectForBrief(a, personAName, personBName),
  );

  // Estrai scores per dare al modello un signal aggiuntivo sull'angolo
  // narrativo: alta romance -> teaser passione, alta tensione -> attrito
  // produttivo, alta stability -> stabilita che protegge, etc.
  const scoresRaw = session.synastry_data?.synastry?.scores ?? {};
  const scoresSummary = {
    romance: Math.round(Number(scoresRaw.romance ?? 0)),
    communication: Math.round(Number(scoresRaw.communication ?? 0)),
    stability: Math.round(Number(scoresRaw.stability ?? 0)),
    intimacy: Math.round(Number(scoresRaw.intimacy ?? 0)),
    growth: Math.round(Number(scoresRaw.growth ?? 0)),
    tension: Math.round(Number(scoresRaw.tension ?? 0)),
  };

  // Indica l'aspetto piu forte come "ancora narrativa" preferita: serve
  // a far convergere il modello su 1 angolo invece di mescolarne 3.
  const overallScore = Math.round(Number(scoresRaw.overall ?? 50));
  const primaryAnchor = aspectLines[0] ?? "(no primary aspect available)";

  const ageContextLines: string[] = [];
  const birthA = session.person_a_birth_date;
  const birthB = session.person_b_birth_date;
  if (birthA?.year && birthB?.year) {
    const etaA = calcolaEta(birthA);
    const etaB = calcolaEta(birthB);
    ageContextLines.push(`- ${personAName}: ${etaA} years old`);
    ageContextLines.push(`- ${personBName}: ${etaB} years old`);
    ageContextLines.push(`- Couple age band: ${fasciaEtaCoppia(etaA, etaB)}`);
    if (gapSignificativo(etaA, etaB)) {
      ageContextLines.push(`- Significant age difference (over 10 years)`);
    }
  }
  const DURATION_LABEL: Record<string, string> = {
    under_1y: "Less than 1 year",
    "1_to_3y": "1-3 years",
    "3_to_7y": "3-7 years",
    "7_to_15y": "7-15 years",
    over_15y: "Over 15 years",
  };
  const durLabel = session.relationship_duration && session.relationship_duration !== "prefer_not_to_say"
    ? DURATION_LABEL[session.relationship_duration] ?? null
    : null;
  if (durLabel) {
    ageContextLines.push(`- Relationship duration: ${durLabel}`);
  }

  const userPrompt = [
    `# The couple`,
    `${personAName} and ${personBName}.`,
    ``,
    ...(ageContextLines.length > 0
      ? [`# Context`, ...ageContextLines, ``]
      : []),
    `# Their relationship archetype`,
    `${archetype.label}: ${archetype.definizione}`,
    ``,
    `# Scores 0-100 (to choose the angle)`,
    `- Attraction/romance: ${scoresSummary.romance}`,
    `- Communication: ${scoresSummary.communication}`,
    `- Stability: ${scoresSummary.stability}`,
    `- Intimacy: ${scoresSummary.intimacy}`,
    `- Growth: ${scoresSummary.growth}`,
    `- Tension: ${scoresSummary.tension}`,
    ``,
    `# Overall level: ${overallScore >= 65 ? 'high' : overallScore >= 40 ? 'intermediate' : 'low'} (${overallScore}/100)`,
    `If the level is "low", follow the "Behavior for low scores" guidelines in the system prompt.`,
    ``,
    `# Preferred narrative anchor (strongest aspect)`,
    primaryAnchor,
    ``,
    `# Other aspects available as backup (do not cite them all)`,
    ...aspectLines.slice(1).map((l, i) => `${i + 2}. ${l}`),
    ``,
    `# Task`,
    `Choose ONE narrative lever (the preferred anchor or one of the backups, NOT both),`,
    `and write the teaser following the 4-sentence structure from the system prompt.`,
    `Return via the return_synastry_teaser tool call.`,
  ].join("\n");

  const model = "gemini-3.5-flash-lite";
  const t0 = Date.now();
  const metricBase = {
    functionName: "process-synastry-insights",
    model,
    // ai_generation_metrics non ha una colonna synastry_session_id; tracciamo
    // solo functionName + model. La session id e' nei log della edge function.
    quizSessionId: null as string | null,
    attempt: 1,
  };

  const lang = resolvePromptLang(session.language);
  const langName = OUTPUT_LANGUAGE_NAME[lang];
  const response = await geminiFetchWithRetry(
    JSON.stringify({
        model,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: outputLanguageDirective(lang) + buildSynastryTeaserPrompt(langName) },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_synastry_teaser",
              description:
                `Returns a teaser highlight for the couple, in ${langName}.`,
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    minLength: 8,
                    maxLength: 80,
                    description: `Short, evocative title, 4-8 words, in ${langName}.`,
                  },
                  body: {
                    type: "string",
                    minLength: 200,
                    maxLength: 700,
                    description:
                      `3-4 sentences in ${langName} (~75-110 words) that anchor at least 1 concrete aspect.`,
                  },
                },
                required: ["title", "body"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "return_synastry_teaser" },
        },
      }),
  );

  const elapsed = Date.now() - t0;

  if (!response.ok) {
    const t = await response.text().catch(() => "");
    recordAiMetric(supabase, {
      ...metricBase,
      durationMs: elapsed,
      success: false,
      httpStatus: response.status,
      errorCode: `http_${response.status}`,
    });
    throw new Error(`gemini flash ${response.status}: ${t.slice(0, 300)}`);
  }

  const json = await response.json();
  const choice = json?.choices?.[0];
  const toolCall = choice?.message?.tool_calls?.[0];
  const args = toolCall?.function?.arguments;
  let parsed: any = null;
  if (typeof args === "string") {
    try {
      parsed = JSON.parse(args);
    } catch {
      // fallthrough
    }
  } else if (args && typeof args === "object") {
    parsed = args;
  }

  recordAiMetric(supabase, {
    ...metricBase,
    durationMs: elapsed,
    success: true,
    httpStatus: response.status,
    usage: json?.usage,
  });

  if (!parsed || typeof parsed.title !== "string" || typeof parsed.body !== "string") {
    throw new Error("invalid teaser response");
  }
  return { title: parsed.title, body: parsed.body };
}

async function processSynastryInsightsJob(synastrySessionId: string): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Step 1: calcola synastry chart (idempotente: skippa se gia presente)
  await invokeSynastryChart(SUPABASE_URL, SERVICE_ROLE, synastrySessionId);

  // Step 2: ricarica la session con i dati aggiornati
  const { data: session, error } = await supabase
    .from("synastry_sessions")
    .select(
      "id, person_a_name, person_b_name, person_a_birth_date, person_b_birth_date, relationship_duration, synastry_data, archetype, archetype_label, teaser_highlight, processing_status, language",
    )
    .eq("id", synastrySessionId)
    .maybeSingle<SynastrySession>();

  if (error || !session) {
    throw new Error(`session not found after synastry-chart: ${error?.message}`);
  }

  // Step 3: idempotency lock atomico - solo se teaser_highlight e null
  if (session.teaser_highlight) {
    console.log("[process-synastry-insights] teaser already present, skipping");
    return;
  }

  await supabase
    .from("synastry_sessions")
    .update({ processing_status: "insights_processing" })
    .eq("id", synastrySessionId);

  // Step 4: genera teaser via Gemini Flash
  const highlight = await generateTeaserHighlight(session, supabase);

  // Step 5: salva con lock atomico
  const { error: updErr } = await supabase
    .from("synastry_sessions")
    .update({
      teaser_highlight: highlight,
      processing_status: "insights_ready",
    })
    .eq("id", synastrySessionId)
    .is("teaser_highlight", null);

  if (updErr) {
    console.warn("[process-synastry-insights] update failed:", updErr);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { allowed } = await checkRateLimit(req, {
    bucket: "process-synastry-insights",
    max: 30,
    windowSeconds: 60,
  });
  if (!allowed) return rateLimitResponse(corsHeaders);

  try {
    const { synastrySessionId } = await req.json();
    if (!synastrySessionId) {
      return new Response(JSON.stringify({ error: "synastrySessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Background execution
    EdgeRuntime.waitUntil(
      processSynastryInsightsJob(synastrySessionId).catch(async (err) => {
        console.error("[process-synastry-insights] background job failed:", err);
        try {
          const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
          await supabase
            .from("synastry_sessions")
            .update({
              processing_status: "failed",
              processing_error: String(err).slice(0, 1000),
            })
            .eq("id", synastrySessionId);
        } catch {
          // ignore
        }
      }),
    );

    return new Response(JSON.stringify({ ok: true, status: "queued" }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[process-synastry-insights] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
