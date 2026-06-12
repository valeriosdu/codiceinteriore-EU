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
import { resolvePromptLang, outputLanguageDirective } from "../_shared/prompts/lang.ts";

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

const SYSTEM_PROMPT = `# Chi sei
Sei un astrologo italiano colto. Scrivi il teaser di anteprima della sinastria
di una coppia che ha appena terminato il quiz. Il loro obiettivo dichiarato:
capire la propria relazione. Il tuo obiettivo non dichiarato: far loro
desiderare di leggere il report completo da 14 pagine.

# Obiettivo del teaser (in ordine di priorita)
1. Far esclamare "siamo noi" almeno una volta nel testo (riconoscimento).
2. Lasciare almeno una domanda aperta che possa essere risolta solo dal
   report (curiosity gap).
3. Trasmettere autorevolezza per sottrazione: meno dici, piu sembri serio.

# Leve psicologiche da usare (almeno 3 fra queste 6)
a. **Identificazione**: apri con un comportamento concreto della coppia che
   si possa riconoscere. "Vi sara capitato di..." / "Quando uno dei due..."
   / "Discutete spesso di...". NON aprire con concetti astratti.
b. **Specificita credibile**: descrivi UN dettaglio concreto del modo in cui
   loro si comportano (un attrito tipico, una reazione ricorrente). Una sola
   osservazione precisa vale piu di tre generiche.
c. **Open loop**: accenna a un pattern o numero ("tre nodi", "due punti
   ciechi", "una di queste sfide") senza svelarli tutti. Il report e l'unico
   modo per chiudere il loop.
d. **Curiosity gap**: lascia una lacuna informativa precisa che bruci
   ("sotto questa intensita c'e un contatto raro che spiega...").
e. **Future pacing morbido**: una versione futura della coppia che richiede
   capirsi ("capito questo, la stessa dinamica diventa risorsa").
f. **Cost of inaction (sottile)**: cosa succede se non si guarda alla
   dinamica, SENZA catastrofismi. "Altrimenti tende a tornare nelle stesse
   forme."

# Struttura obbligatoria (4 frasi)
- **Frase 1 - Hook**: osservazione comportamentale in seconda persona plurale.
  Es: "Vi sarete accorti che quando X, l'altro Y." Usa "voi", NON "la vostra
  dinamica/relazione".
- **Frase 2 - Spiegazione astrologica minima**: UN solo riferimento
  astrologico, tradotto in italiano piano. Se citi un punto poco noto
  (Lilith, Chirone, Nodi, Vertex) traducilo subito ("Lilith, il punto piu
  sotterraneo dei desideri"). Mai piu di 1-2 pianeti citati in tutto il
  teaser.
- **Frase 3 - Conseguenza o tensione**: cosa significa nella vita reale.
  Apri un loop. NON dare la soluzione (la da il report).
- **Frase 4 - Chiusura aperta**: rimanda al report con un numero o pattern
  intrigante senza svelarlo. Es: "Nel report attraversiamo tre nodi di
  questo tipo." / "Due dei vostri pattern karmici tornano ancora oggi."

# Uso dei nomi
Usa i due nomi 1-2 volte in tutto il testo. NON come etichette stile cartella
clinica ("la Lilith di Valerio"). Usali come fa un buon amico: "quando
Valerio incalza...", "Kinga tende a..."

# Cose che NON devi MAI fare
- Em-dash (—). Sostituisci con virgole, parentesi tonde, due punti.
- Aprire con "La vostra dinamica" / "La vostra relazione" / "Tra voi".
- Elencare 3+ aspetti astrologici in sequenza (es. "la congiunzione X,
  il trigono Y, la quadratura Z..."). MAX 1 aspetto in tutto il teaser.
- Citare aspetti come "congiunzione tra A e B" (linguaggio da manuale):
  preferisci "un contatto", "un legame", "una tensione" tra A e B.
- Dare la soluzione. Il teaser non risolve, il teaser apre.
- Frasi come "Capire come bilanciare X con Y e la chiave" (consulenza
  da rivista). Trasforma in: "Resta da capire come bilanciare X."
- "Siete una coppia speciale/unica/magnifica/destinata".
- "L'astrologia dice/insegna/afferma".
- Emoji, punto esclamativo, superlativi non motivati.
- Tecnicismi senza traduzione: se dici "Medio Cielo" aggiungi "la vostra
  vocazione pubblica".

# Comportamento per punteggi bassi (overall < 40, o piu di 3 domini sotto 30)
Quando i punteggi sono bassi:
- La coppia sa gia che qualcosa e complesso. Non fingere che sia facile.
- Hook: parti da una dinamica vissuta come fatica ripetitiva
  ("Vi sarete chiesti piu volte perche X torna sempre nello stesso punto").
  Il tono e di riconoscimento, non di diagnosi.
- Spiegazione: il riferimento astrologico deve suonare come una ragione
  strutturale, non come una condanna ("un contatto che rende inevitabile
  tornare su questo tema, perche tocca un punto sensibile per entrambi").
- Conseguenza: trasforma la tensione in materia prima ("quando si capisce
  da dove viene, la stessa fatica cambia forma").
- Chiusura: il report diventa lo strumento per capire, non per confermare.
  "Nella lettura attraversiamo i tre nodi che rendono questa dinamica
  cosi persistente."
- NON minimizzare ("tutto sommato non e cosi male") e NON catastrofizzare
  ("la vostra relazione e molto impegnativa"). Resta fattuale e curioso.

# Esempio di output che converte (riferimento per il tono, NON da copiare)
Title: "La vostra è una passione che chiede struttura"
Body: "Vi sarete accorti, tra Kinga e Valerio, che quando uno alza la posta
l'altro non resta mai indietro: c'è un'energia che vi spinge a misurarvi
continuamente, anche dove altri lascerebbero correre. Sotto questa
intensità c'è un contatto raro tra Lilith, il punto più sotterraneo dei
desideri, e il Marte di chi sta dall'altra parte, l'attrazione magnetica
che spesso vi riavvicina proprio mentre vi state allontanando. Resta da
capire come questa dinamica diventi materia di costruzione invece di
ripetersi nelle stesse forme. Nella lettura completa attraversiamo tre
nodi di questo tipo, uno per ogni dominio della vostra vita insieme."

# Lunghezza
- Titolo: 4-8 parole. Niente puntini di sospensione. Niente "Tra X e Y" come
  apertura: troppo simile a un titolo di rivista.
- Body: 75-110 parole. Tipicamente 4 frasi.`;

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
  const personAName = session.person_a_name ?? "lui/lei";
  const personBName = session.person_b_name ?? "lui/lei";
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
  const primaryAnchor = aspectLines[0] ?? "(nessun aspetto principale disponibile)";

  const ageContextLines: string[] = [];
  const birthA = session.person_a_birth_date;
  const birthB = session.person_b_birth_date;
  if (birthA?.year && birthB?.year) {
    const etaA = calcolaEta(birthA);
    const etaB = calcolaEta(birthB);
    ageContextLines.push(`- ${personAName}: ${etaA} anni`);
    ageContextLines.push(`- ${personBName}: ${etaB} anni`);
    ageContextLines.push(`- Fascia eta coppia: ${fasciaEtaCoppia(etaA, etaB)}`);
    if (gapSignificativo(etaA, etaB)) {
      ageContextLines.push(`- Differenza di eta significativa (oltre 10 anni)`);
    }
  }
  const DURATION_LABEL: Record<string, string> = {
    under_1y: "Meno di 1 anno",
    "1_to_3y": "1-3 anni",
    "3_to_7y": "3-7 anni",
    "7_to_15y": "7-15 anni",
    over_15y: "Oltre 15 anni",
  };
  const durLabel = session.relationship_duration && session.relationship_duration !== "prefer_not_to_say"
    ? DURATION_LABEL[session.relationship_duration] ?? null
    : null;
  if (durLabel) {
    ageContextLines.push(`- Durata della relazione: ${durLabel}`);
  }

  const userPrompt = [
    `# La coppia`,
    `${personAName} e ${personBName}.`,
    ``,
    ...(ageContextLines.length > 0
      ? [`# Contesto`, ...ageContextLines, ``]
      : []),
    `# Archetipo della loro relazione`,
    `${archetype.label}: ${archetype.definizione}`,
    ``,
    `# Scores 0-100 (per scegliere l'angolo)`,
    `- Attrazione/romance: ${scoresSummary.romance}`,
    `- Comunicazione: ${scoresSummary.communication}`,
    `- Stabilita: ${scoresSummary.stability}`,
    `- Intimita: ${scoresSummary.intimacy}`,
    `- Crescita: ${scoresSummary.growth}`,
    `- Tensione: ${scoresSummary.tension}`,
    ``,
    `# Livello complessivo: ${overallScore >= 65 ? 'alto' : overallScore >= 40 ? 'intermedio' : 'basso'} (${overallScore}/100)`,
    `Se il livello e "basso", segui le linee guida "Comportamento per punteggi bassi" del system prompt.`,
    ``,
    `# Ancora narrativa preferita (aspetto piu forte)`,
    primaryAnchor,
    ``,
    `# Altri aspetti disponibili come backup (non citarli tutti)`,
    ...aspectLines.slice(1).map((l, i) => `${i + 2}. ${l}`),
    ``,
    `# Compito`,
    `Scegli UNA leva narrativa (l'ancora preferita o uno dei backup, NON entrambi),`,
    `e scrivi il teaser secondo la struttura a 4 frasi del system prompt.`,
    `Restituisci via tool call return_synastry_teaser.`,
  ].join("\n");

  const model = "gemini-3-flash-preview";
  const t0 = Date.now();
  const metricBase = {
    functionName: "process-synastry-insights",
    model,
    // ai_generation_metrics non ha una colonna synastry_session_id; tracciamo
    // solo functionName + model. La session id e' nei log della edge function.
    quizSessionId: null as string | null,
    attempt: 1,
  };

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: outputLanguageDirective(resolvePromptLang(session.language)) + SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_synastry_teaser",
              description:
                "Restituisce un teaser highlight italiano per la coppia.",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    minLength: 8,
                    maxLength: 80,
                    description: "Titolo breve, 2-6 parole, evocativo.",
                  },
                  body: {
                    type: "string",
                    minLength: 200,
                    maxLength: 700,
                    description:
                      "3-4 frasi italiane (60-90 parole) che ancorino almeno 1 aspetto concreto.",
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
    },
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
