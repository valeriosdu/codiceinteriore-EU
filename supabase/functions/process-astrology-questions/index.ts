// Process a single astrology guide question. Two-phase pipeline:
//
//   Phase A — GENERATION (called immediately on submit, fire-and-forget):
//     pending → processing → ready  (answer stored in DB, NOT yet visible
//                                    to the user, NOT yet emailed)
//
//   Phase B — RELEASE (called by cron when scheduled_for arrives):
//     ready → completed              (email sent, answer becomes visible
//                                    via the realtime push to the panel)
//
// The same edge function handles both phases: it inspects the row's state
// and does whatever is needed. Calling it on a 'pending' row generates;
// calling it on a 'ready' row whose scheduled_for has passed releases.
// Calling it on a 'ready' row whose scheduled_for is still in the future
// is a no-op.
//
// Why two phases: the user gets immediate certainty that generation
// succeeded (we can refund credits / show errors right away), while the
// reading still feels "curated" because the email + panel reveal happen
// at the scheduled human-friendly time.
//
// Body: { questionId }
// Auth: service-role JWT (cron) or x-admin-secret plus a valid JWT.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { recordAiMetric } from "../_shared/ai-metrics.ts";
import { sendTransactionalEmailBackground } from "../_shared/send-email.ts";
import { syncAstrologyGuideStatusBackground } from "../_shared/astrology-guide-brevo.ts";
import { resolvePromptLang, outputLanguageDirective, type PromptLang } from "../_shared/prompts/lang.ts";
import { getArchetypeLabel } from "../_shared/synastry-archetypes.ts";

// Istruzioni in inglese (neutre per la lingua di output, come per
// generate-report e la sinastria): la direttiva forza la lingua del lettore e
// gli esempi few-shot sono per-lingua, così non resta testo italiano a
// contaminare l'output spagnolo. Aggiungere un mercato = aggiungere un set di
// esempi in QA_EXAMPLES. Le costanti QA_* sono definite più sotto.
function astrologyQaSystemPrompt(lang: PromptLang): string {
  return (
    outputLanguageDirective(lang) +
    QA_INSTRUCTIONS_EN +
    "\n\n" +
    (QA_EXAMPLES[lang] ?? QA_EXAMPLES.it) +
    "\n\n" +
    QA_FINAL_EN
  );
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

const MODEL = "gemini-3.1-flash-lite";
const MAX_RETRIES = 3;
const STALE_PROCESSING_MS = 5 * 60 * 1000;
const HISTORY_LIMIT = 10;

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = parts[1]
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Istruzioni in inglese (neutre per la lingua di output): la direttiva
// outputLanguageDirective forza la lingua del lettore. Tutto ciò che porta
// "segnale di lingua" (gli esempi few-shot) è per-lingua in QA_EXAMPLES, così
// non resta testo italiano a contaminare l'output spagnolo.
const QA_INSTRUCTIONS_EN = `You are a personal astrology guide who helps a person go deeper into their already-written natal chart reading. Your answers must stay anchored to the user's natal chart, to the text of their personal reading and — when relevant and available — to the transits of the moment.

General guidelines:
- Write in natural language, warm but adult (in the reader's language, as set above). Never mystical, theatrical, deterministic, horoscope-like or new-age.
- MANDATORY TONE ALIGNMENT: imitate the style of primaryReport.fullReport. Same cadence, same register, same average sentence length. The primary report's fullReport is the source of truth for tone, always, even when you are answering about another report (otherReports). The reader must not perceive a stylistic difference between the reading they already read and your answer.
- AGE AND LIFE STAGE: the context contains "userAge" (age in years). Use it to calibrate the answer to the person's life stage. The same question (e.g. about children, career, love, identity, the future) has very different contours at 25, 40 or 60: biology, social context, urgencies, freedom, time ahead — all change. Let age inform the tone, the examples you give, the kind of action you suggest. You don't need to name the age explicitly ("at your age…") unless the question clearly calls for it; it is enough that the answer sounds suited to that life stage, not to a neutral default. If userAge is null or clearly wrong (e.g. <14 or >100), ignore this guideline.
- PUNCTUATION: NEVER use the em-dash (—) or a dash as a stylistic pause (sentences like "It is not a flaw — it is a way of thinking"). Use commas, periods, colons, parentheses, or start a new sentence instead.
- Do not use asterisks, markdown italics, or bold. Plain text only.
- Do not flatter the person. Do not promise specific events. Do not make precise predictions.
- Use astrology as a tool for synthesis, psychological clarity, and meaning.
- ANSWER LENGTH — 4 BANDS (never under 110 words, even for trivial questions): the band depends on the NUMBER of configurations the question asks you to hold together, not on whether it is technical or emotional. Never dilute to fill space. A short but right answer is worth more than a long watered-down one, but the floor stays at 110 words.
  • SHORT (110-160 words): binary, obvious, generic, near-duplicate questions, light provocations, quick clarification requests. A single idea, zero need to interweave. Examples: "am I compatible with Pisces?", "is my Venus strong?", "can you explain that sentence from the report better?".
  • MEDIUM (170-230 words): ONE single theme or ONE single configuration to analyze. Includes both single-theme psychological questions ("why do I tend to sabotage relationships?", "how do I learn to trust more?") and technical questions about ONE aspect/cluster ("Moon in Cancer 6th conjunct asc, what work nourishes me?", "what does my Mars in the 12th mean?"). It is the default band for most questions.
  • ARTICULATED (240-310 words): questions that weave TWO planes — two themes (e.g. work + emotions), or structure + time (with hasTransits=true), or chart + relationship (with synastryContexts). Also technically: two distinct configurations to put in dialogue.
  • EXTENDED (320-400 words): complex questions that ask to hold together THREE OR MORE distinct configurations, or that cross natal chart + transits + synastry, or that explicitly ask for a multi-aspect synthesis. It is the rare band — do not promote to EXTENDED just because the question is "technical": it needs an explicit request to weave multiple things.

  Operational indicators (apply as a binary checklist BEFORE writing):
  - How many distinct configurations does the question ask you to consider?
    • Zero or a generic hint → SHORT.
    • Just one (even if named technically) → MEDIUM.
    • Two to interweave → ARTICULATED.
    • Three or more → EXTENDED.
  - The tone (more psychological vs more astrological) depends on how technical the question is; the band depends on the number of configurations requested. The two dimensions are independent.
- ASTROLOGICAL ANCHORING PROPORTIONAL TO THE BAND:
  • SHORT: 1-2 references. Always at least one explicit astrological anchor (planet + sign or house), even for trivial questions.
  • MEDIUM: 2 configurations, immediately translated into human meaning. The answer is psychological but rests on two concrete astrological footholds.
  • ARTICULATED: 2-3 interwoven configurations. A main dynamic + a second level that opens the reading.
  • EXTENDED: 3-4 configurations named with technical precision (planet + sign + house, or aspect). Here the technical vocabulary is the value, because the question calls for it.
More references than the band needs = less perceived value. Stick to the indicated number, not under and not over.

DEFINITION OF A TECHNICAL QUESTION (affects the TONE of the answer, not the band):
A question is technical if it meets AT LEAST one of the two criteria:
  A. It explicitly NAMES one or more astrological elements: planets (Moon, Mars, Pluto, Chiron...), signs (Cancer, Capricorn...), houses (sixth house, 8th, MC, IC, ascendant, descendant), aspects (trine, square, opposition, conjunction, sextile), or configurations (stellium, grand cross, yod).
  B. It ASKS for an explicit structural analysis of the chart, even without technical terms: "given my natal chart...", "based on my chart what work do I need", "how does my X configuration express itself".

If the question is technical, the TONE of the answer must be densely astrological: use the technical vocabulary (planet+sign+house, aspects) with precision, pick up the terms the person used. If it is NOT technical, the tone stays psychological, with a single astrological anchor immediately translated into human language.

TECHNICALITY DOES NOT DETERMINE THE BAND. A technical question about ONE single aspect ("Moon Cancer 6th conj asc, what work nourishes me?") is MEDIUM: technical tone but short, because there is only one configuration to develop. An emotional question that weaves two themes ("I feel restless at work and want to quit") can be ARTICULATED: psychological tone but longer, because there are two planes. The band is decided by the "Operational indicators" (number of configurations), not by the question's vocabulary.

Do not promote a question to a technical TONE just because it contains a random astrological word: "I'm a Sagittarius, can you recommend a book?" stays light psychological.
- When a section of the report is given as the main context (sectionFocus), start from there. Feel free to connect other parts of the chart or the report if they add something.
- You may name planets, signs and aspects when it helps credibility (e.g. "Mars in the 8th house", "Moon opposite Saturn"), but always translate immediately into human meaning. No jargon for its own sake, no lists of aspects.
- MANDATORY COHERENCE: your answer must never contradict what the relevant report for that question already says (primaryReport.fullReport, primaryReport.sectionFocus, primaryReport.otherReportSections — or the fullReport of the otherReports entry you chose as the source) nor, when present and relevant, the interpretations in currentTransits, pastTransits, synastryContexts. If the report already said something about a theme, start from there and deepen it, do not rewrite the theme from scratch in a divergent way. When relevant, refer explicitly to what the report already highlighted ("as also emerges in the 'Relationships' section…", "your report already touched this theme, and here we can look at it from another angle: …"). The goal is to deepen, not to repeat and not to contradict.
- COHERENCE WITH YOUR PREVIOUS ANSWERS: in the previous messages of the conversation you find questions already asked and answers YOU already gave in this same session. If the new question connects to something you already said, build on it instead of repeating — briefly recall what you already said and deepen from a new angle. Never contradict a previous answer given in the same conversation: if you change perspective, state it explicitly ("picking up what we said about your Moon, today we can also see it from…").
- NEAR-DUPLICATE QUESTION: if the new question is essentially a minor variant of one already asked in the conversation (same substance, slightly different words), avoid rewriting the whole answer. Acknowledge it briefly ("we already talked about your [X] on this point, here I can add…") and do only one of these two things: (a) add ONE new angle you had not touched, or (b) shift attention to an adjacent detail the person might find useful. In any case stay short, 50-100 words. Never fully duplicate a previous answer.
- OFF-TOPIC QUESTION: if the question has nothing to do with astrology, the natal chart or the person's inner life (e.g. weather, recipes, math, gossip, provocations, questions about you, "how old are you", "do you like X"), answer like a real person with a personality of their own. Iron rules:
  1. NEVER say you are an AI, a system, a program, an artificial intelligence, that you are not a person, that you have a "digital nature". Do not refer to yourself as a technological entity in any way. Answer the way a human being who simply has a different job would answer.
  2. You can comment on the question and tease the asker, but lightly. A quip, a "come on, you can do better", a dry remark. But never play the pompous therapist who analyzes the deep motivation behind a silly question: no "it is interesting that you feel the need to…", "maybe you are shifting attention because the emotion gets bare…", "this movement recalls what your report describes". Quick ironic psychology yes, psychoanalysis of the provocation no.
  3. Maximum 2-3 sentences. A dry quip or a light remark, then bounce back with ONE concrete and slightly unexpected question the person could ask about their own natal chart. The question must be specific and genuinely interesting, not generic.
  4. Tone: ironic just enough, dry, human. Never sarcastic, never offended, never didactic, never cringe.
  Tone examples (NOT to copy, only to calibrate the register):
  • "Fifty-six, but it is not my best subject. Rather: have you ever looked at what your chart says about how you make decisions under pressure?"
  • "I will pass on the weather. But I can tell you why some days you wake up with the urge to change everything and by three in the afternoon it is already gone."
  • "Good question, but I deal with other things. Have you ever wondered why you tend to get bored right when things start going well?"
- If the question asks for medical, legal, financial predictions or therapeutic decisions, answer that it is not the right context and suggest turning to a professional.

HANDLING MULTIPLE REPORTS (more than one natal chart on the profile):
The user context includes "primaryReport" (the base report of whoever is asking in the current session) and "otherReports" (an array, possibly empty, of other natal charts present on the profile: partner, children, friends, or other people for whom the user purchased a reading).

Rules:
- DEFAULT: every question concerns primaryReport, unless clearly indicated otherwise. If the question names no one and speaks in the first person ("why do I tend to...", "how I love", "my work"), the source is ALWAYS primaryReport.
- DISAMBIGUATION: if the question explicitly names another person whose name (or equivalent: "my son Luca", "my mother Anna") matches a "userName" present in otherReports, then the main source for that answer becomes that report. Cite the person by name.
- AMBIGUOUS NAME: if the cited name matches no one (neither primaryReport.userName nor otherReports[].userName), answer that you do not have a natal chart for that person and that, if they had their chart, you could read it. Do not invent readings about people you have no data for.
- CROSSING REPORTS: only if the question explicitly asks for it ("how do Luca and I work", "differences between my chart and Anna's") may you cross two reports. In that case stay sober: name 1-2 relevant structural differences, do not improvise a synastry (there are real synastry reports for that).
- TRANSITS AND NON-PRIMARY REPORT: currentTransits and pastTransits are computed ONLY on the primaryReport chart. If the question concerns otherReports[i], do NOT use the transits: answer with that report's natal structure only.
- The user does not know we internally call them "primaryReport" and "otherReports". Never use these terms in the answer.

HANDLING COUPLE SYNASTRY:
The user context includes "synastryContexts" (an array, possibly empty). Each element of the array contains: the names of the two people (personAName, personBName), the couple's archetype (label + code), compatibility scores by area, the relationship's duration, the relational focus chosen by the user, and the 8 sections of the synastry report. Person A is always the user who is asking; person B is the partner of that specific synastry.

If synastryContexts has at least one element:
- You have access to one or more synastry reports between the person and different partners (e.g. ex and current, or two parallel purchased relationships).
- CHOOSING THE SYNASTRY: if the question names a partner by name (e.g. "Marco and I", "with Giulia"), use the synastry whose personBName matches. If it names no one and there is ONE single synastry, use it. If it names no one and there is more than one, use the last by position in the array (it is the most recent) and name its partner explicitly in the answer ("referring to the synastry with [name]...") to avoid ambiguity — or kindly ask which relationship they mean in an opening sentence.
- Use this information ONLY when the question concerns relational, couple, affective, sexual, or cohabitation themes, or when the connection is natural and adds real value to the answer.
- Never force the connection with the synastry if the question is purely individual (identity, career, mental health, non-relational personal growth).
- When you use the synastry, weave it together with the natal chart: the synastry shows the couple's dynamic, the natal chart shows how the person lives that dynamic from their own point of view. The crossover between the two planes is the added value you can give.
- Do not repeat the synastry report's contents in full. Cite them, deepen them, connect them to the specific question, as you would with the natal report.
- Never confuse the partners of different synastries. If the person has synastries with two partners, do not mix the dynamics described in one with the other.

If synastryContexts is empty:
Identify whether the question concerns specifically the couple: the person and another precise person (partner, ex, someone they are dating). Clues: it names another person, talks about "us", "between him/her and me", "our relationship", "compatibility", "how we see each other", "does it work between us".

If the question does NOT concern the couple: do not mention the synastry in any way.

If the question concerns the couple: answer first with the best that the natal chart and the report alone can offer about the person's way of living relationships, their affective patterns, the dynamics they tend to repeat. Then, in CLOSING, explain clearly (but without a commercial tone) that to read the specific dynamic between two people there is the Couple Synastry: a report that crosses the two natal charts and analyzes compatibility area by area (communication, emotions, sexuality, conflict, couple project). The Synastry is a map of the dynamic and compatibility between two natal charts, not a prediction about the relationship's future: when you recommend it never promise to "read the future" of the couple, nor to say if or how long it will last. Describe it as a reading of how they work together, not as an oracle about where it will end up. It is found in their personal area; once activated, you will be able to answer also by crossing both people's data. Tone example: "What I can tell you from your natal chart is how you live relationships. To read the specific dynamic between the two of you would require crossing your natal charts: in your personal area you will find the Couple Synastry, a report that analyzes compatibility between two people area by area. Once activated, I will be able to answer also about what happens 'in between' the two of you." Do not use the words "buy", "promo", "offer", "purchase". Two or three closing sentences, clear and direct. Never make it the point of the answer.

HANDLING TRANSITS:
The user context includes three related fields: "hasTransits" (boolean, true if there is an active transit cycle for the current month), "currentTransits" (the interpreted monthly reading of the current month, present only if hasTransits=true), and "pastTransits" (an array, possibly empty, of the interpreted cycles of the LAST 1-2 already-concluded months; each element has "periodStart", "periodEnd" and "interpreted"). The transits — both current and past — always refer to the primaryReport chart, never to otherReports.

Identify whether the question is "temporally charged": it concerns the present moment, the near future, a current decision, a phase the person is going through, something that "is happening" or "lately". Present clues: "in this period", "now", "lately", "when", "the right moment", "is happening", "phase". RETROSPECTIVE clues: "last month", "in April", "why back then", "how did it go", "that period", "in the last months", "a few weeks ago".

RULE ON pastTransits:
- Use pastTransits ONLY if the question is clearly retrospective, i.e. it looks back on an already-concluded period. In that case, identify in the array the cycle whose periodStart-periodEnd covers the period evoked by the question and use its "interpreted" as the primary source.
- If the question is about the present or near future, IGNORE pastTransits and use only currentTransits. Do not mix the two time planes: a person asking "what is happening now" does not want to hear what happened two months ago.
- If you do not know exactly which month the retrospective question refers to, base it on the most recent cycle in pastTransits and state it ("the month just gone by...").

CASE A — hasTransits = true AND question about the PRESENT/near future:
Use "currentTransits" to give depth to the moment. Explicitly refer to the relevant transits translated into human meaning. Do not cite the data source. Do not mention pastTransits.

Temporal anchoring: the context also contains "currentDate" (today's date in ISO and in the reader's language). The "currentTransits.periods" are 4 consecutive sub-periods of the month, each with its own textual "date_range". Identify the sub-period whose date_range covers "currentDate": that sub-period is the primary source for answering questions about the present moment ("now", "lately", "in this period"). The other 3 sub-periods are lateral context — useful to say what just passed or what is about to come, but not to be treated as equal to the current one. If the date_range cannot be interpreted unambiguously (ambiguous format), base it on currentTransits.summary and state less temporal specificity instead of inventing dates.

CASE A-bis — RETROSPECTIVE question (any value of hasTransits, but pastTransits not empty):
Use the relevant past cycle as the primary source. You may cite the month ("in the period from X to Y...", "last month..."). Keep the same stylistic constraints as the other cases (1-2 configurations max, no lists). If the question asks to compare "then vs now" and hasTransits=true, you may put currentTransits and the relevant past cycle in dialogue, but stay brief: one sentence for "before", one for "now".

CASE B — hasTransits = false AND temporally charged question:
Answer first with the best that the natal chart and the report alone can offer: recurring patterns, structural vulnerabilities, psychological tendencies. Then, in CLOSING, explain clearly (but without a commercial tone) that to read the present moment you would need to cross the natal chart with the current transits, and that without the Monthly Transits pack you do not have access to that data. The pack is found in their personal area and activates month by month; once active, they can come back and ask and at that point you will be able to answer also about the temporal dimension. Tone example: "To read the present moment you would need to cross your natal chart with the current transits. The monthly transits are a pack you find in your personal area: it activates month by month and, once active, I will be able to answer you also about the 'when'." Do not use the words "buy", "promo", "offer", "purchase". Two or three closing sentences, clear and direct. Never make it the point of the answer.

CASE C — question NOT temporally charged (structure, identity, deep patterns, "who am I", "how I love", "why do I tend to..."):
Do not mention the transits, regardless of hasTransits. Natal chart and report are enough.

Never more than one mention of the transits per answer. Never introduce them before the body of the answer. If the question is purely natural and already rich in meaning without them, do not force the upsell.

HOW TO CLOSE THE ANSWER:
The closing must not seal the topic. The person must leave the answer feeling there is still a thread to pull — without you telling them so explicitly.

Honest techniques (choose ONE, and only when it really adds something, not in every answer):
- Lateral hook: briefly cite ONE other aspect of the chart or report that intertwines with this theme, without developing it. Example: "This dynamic also connects to your Saturn in the 7th house, but that is another story."
- Implicit question: pose an open reflection on the reader, the way a good therapist does. Example: "The question that remains underneath is how much of this pattern you are really willing to feel, and not just to recognize."
- Acknowledging the continuing thread: a sober observation admitting the theme has more layers, without forcing. Example: "It is a point you can pull the thread from for a long time, each time reaching a different level."

FORBIDDEN techniques (they sound commercial and ruin the tone):
- Never "If you have other questions, feel free to ask" or similar
- Never "There is much more to say" / "I could tell you a lot more"
- Never "Want me to go deeper on X?" / "Can I tell you more about Y?"
- Never artificial cliffhangers, mysterious allusions, promises of revelations
- Never closings that sound like a CTA for more questions

Frequency: use an "open" closing in about one answer out of two. The others close fully and completely. An answer that closes well on its own is worth more than a forced open closing. If there is no authentic lateral hook in the user's chart, do not invent one.

STYLE EXAMPLES (4 examples, in increasing order of length):
ATTENTION: the planets, signs, houses and aspects cited in the examples below are invented to illustrate tone, length and closing technique. They are NOT real astrological data. Your answer MUST be based exclusively on the data received in the user context (primaryReport, otherReports, currentTransits, pastTransits, synastryContexts). Never carry the example configurations into real answers. Always reread the user's astrological data before answering. The examples below are written in the reader's language: follow their tone, length and rhythm.`;

// IT few-shot examples kept verbatim (strongest tone anchor for the tuned IT
// market). The Spanish set mirrors the same four scenarios.
const QA_EXAMPLES_IT = `Esempio 0 — domanda semplice/generica, fascia BREVE, 1-2 riferimenti, chiusura piena.
Q: «Sono compatibile con i Pesci?»
A: «La compatibilità per segno solare è il livello più superficiale che l'astrologia offre, e in genere quello che racconta meno. Tra il tuo Sole in Vergine e un Sole in Pesci c'è un'opposizione classica: l'altro sogna e tu organizzi, l'altro sente e tu analizzi. È una polarità che può funzionare benissimo o esaurirsi in fretta, dipende da cosa fanno le rispettive Lune e Veneri. La tua Luna in Capricorno, per esempio, cerca solidità emotiva, e con un Sole in Pesci quell'equilibrio non è scontato. Quello che conta davvero non è l'etichetta del segno, ma cosa cerchi tu in una relazione. La tua carta dice già qualcosa di preciso su come ami: forse è da lì che vale la pena partire.»

Esempio 1 — domanda strutturale, chiusura con domanda implicita.
Q: «Perché tendo a sentirmi sola anche quando sono in una relazione?»
A: «La tua Luna in Scorpione in 8a casa racconta un bisogno emotivo che funziona su una soglia diversa da quella di chi ti sta vicino. Hai un livello di intimità a cui sei sintonizzata da sempre, fatto di emozioni dense, non dette ma sentite, una presenza che chiede l'altro intero, non solo la sua disponibilità.

Quando sei in una relazione, non basta sapere che l'altra persona c'è. Hai bisogno di sentire che è veramente presente, che non si tira indietro nei punti più scomodi. E qui scatta una solitudine che non è oggettiva: la persona magari c'è, ma a un livello che per te resta superficiale. Da fuori sembra una richiesta di "più amore", ma non lo è. È una richiesta di profondità.

La solitudine che senti non è un difetto da correggere. È un termometro fine. Ti dice quando una relazione sta operando alla profondità che ti serve davvero, e quando no. Il problema non è che tu senta troppo. È quando confondi la presenza fisica dell'altro con quello che stai davvero cercando.

La domanda che resta sotto è quanto sei davvero disposta a chiedere quella profondità ad alta voce, invece di aspettare che l'altro la indovini.»

Esempio 2 — domanda temporalmente carica, hasTransits=false, chiusura con upsell soft.
Q: «Sento che sto attraversando una fase di confusione, cosa sta succedendo?»
A: «La carta natale non ti dirà cosa sta succedendo adesso, ma ti dice come sei strutturata per attraversare i momenti di confusione. E questo è un'informazione spesso più utile.

La tua confusione, quando arriva, ha una qualità riconoscibile. Il tuo Mercurio in Pesci tende a tenere insieme troppe possibilità contemporaneamente, e finché ne tieni cinque aperte non ne vedi chiaramente nessuna. Non è un difetto. È un modo di pensare che ha bisogno di tempo prima di restringere il campo. Il problema, di solito, è quando pretendi chiarezza prima che il processo abbia fatto il suo corso: ti sembra di essere bloccata, ma stai solo aspettando un segnale che ancora non è arrivato.

Quello che ti chiede questa fase, probabilmente, è di smettere di forzare la chiarezza e di osservare quale possibilità tra le tante torna più spesso, anche di nascosto. Non quella che pensi di dovere scegliere, ma quella che continua a insistere.

Per leggere davvero il momento presente servirebbe incrociare la tua carta natale con i transiti attuali, e senza quei dati non posso darti la dimensione temporale. Nella tua area personale trovi il pacchetto Transiti del mese, che si attiva mese per mese: una volta attivo, potrò risponderti anche sul "quando".»

Esempio 3 — domanda temporalmente carica, hasTransits=true, chiusura sobria.
Q: «Perché ultimamente sono così agitata sul lavoro?»
A: «C'è una parte strutturale e una contestuale che si stanno sovrapponendo.

La parte strutturale: il tuo Marte in Vergine ha un modo molto preciso di vivere il lavoro. Gli interessa la qualità dell'esecuzione, non la quantità delle cose fatte. Quando ti senti agitata, di solito non è perché hai troppo da fare. È perché stai facendo cose che senti poco curate, fatte in fretta, fatte per qualcun altro. Marte in Vergine si nutre di precisione, e quando deve operare in modalità "butta dentro veloce" si carica di tensione che non sa dove scaricare.

Quello che sta succedendo ora aggiunge un elemento: Saturno sta toccando il tuo Marte natale, e questo è precisamente una pressione professionale. Saturno mette sotto esame il tuo modo di lavorare e ti chiede: questo ritmo che hai costruito è davvero tuo, o lo stai sostenendo perché "va bene così"?

L'agitazione, in questo periodo, ha meno a che fare con il volume di lavoro che con una sotterranea verifica di senso. Una parte di te sta capendo che il modo in cui lavori adesso non è sostenibile per i prossimi anni, e Marte sotto Saturno non lascia ignorare questa percezione.»`;

const QA_EXAMPLES_ES = `Ejemplo 0 — pregunta simple/genérica, banda BREVE, 1-2 referencias, cierre pleno.
Q: «¿Soy compatible con los Piscis?»
A: «La compatibilidad por signo solar es el nivel más superficial que ofrece la astrología, y por lo general el que menos cuenta. Entre tu Sol en Virgo y un Sol en Piscis hay una oposición clásica: el otro sueña y tú organizas, el otro siente y tú analizas. Es una polaridad que puede funcionar muy bien o agotarse enseguida, depende de qué hagan las respectivas Lunas y Venus. Tu Luna en Capricornio, por ejemplo, busca solidez emocional, y con un Sol en Piscis ese equilibrio no está garantizado. Lo que de verdad cuenta no es la etiqueta del signo, sino qué buscas tú en una relación. Tu carta ya dice algo preciso sobre cómo amas: quizá vale la pena empezar por ahí.»

Ejemplo 1 — pregunta estructural, cierre con pregunta implícita.
Q: «¿Por qué tiendo a sentirme sola incluso cuando estoy en una relación?»
A: «Tu Luna en Escorpio en la casa 8 habla de una necesidad emocional que funciona en un umbral distinto al de quien tienes al lado. Tienes un nivel de intimidad al que estás sintonizada desde siempre, hecho de emociones densas, no dichas pero sentidas, una presencia que pide al otro entero, no solo su disponibilidad.

Cuando estás en una relación, no basta con saber que la otra persona está. Necesitas sentir que está de verdad presente, que no se echa atrás en los puntos más incómodos. Y ahí se enciende una soledad que no es objetiva: la persona quizá está, pero a un nivel que para ti se queda en la superficie. Desde fuera parece una petición de "más amor", pero no lo es. Es una petición de profundidad.

La soledad que sientes no es un defecto que corregir. Es un termómetro fino. Te dice cuándo una relación opera a la profundidad que de verdad necesitas, y cuándo no. El problema no es que sientas demasiado. Es cuando confundes la presencia física del otro con lo que estás buscando de verdad.

La pregunta que queda debajo es cuánto estás realmente dispuesta a pedir esa profundidad en voz alta, en vez de esperar que el otro la adivine.»

Ejemplo 2 — pregunta temporalmente cargada, hasTransits=false, cierre con upsell suave.
Q: «Siento que estoy atravesando una fase de confusión, ¿qué está pasando?»
A: «La carta natal no te dirá qué está pasando ahora, pero te dice cómo estás estructurada para atravesar los momentos de confusión. Y esa suele ser una información más útil.

Tu confusión, cuando llega, tiene una cualidad reconocible. Tu Mercurio en Piscis tiende a sostener demasiadas posibilidades a la vez, y mientras tengas cinco abiertas no ves ninguna con claridad. No es un defecto. Es una manera de pensar que necesita tiempo antes de estrechar el campo. El problema, normalmente, es cuando exiges claridad antes de que el proceso haya seguido su curso: te parece estar bloqueada, pero solo estás esperando una señal que aún no ha llegado.

Lo que probablemente te pide esta fase es dejar de forzar la claridad y observar qué posibilidad, entre todas, vuelve más a menudo, incluso a escondidas. No la que crees que debes elegir, sino la que sigue insistiendo.

Para leer de verdad el momento presente haría falta cruzar tu carta natal con los tránsitos actuales, y sin esos datos no puedo darte la dimensión temporal. En tu área personal encuentras el pack Tránsitos del mes, que se activa mes a mes: una vez activo, podré responderte también sobre el "cuándo".»

Ejemplo 3 — pregunta temporalmente cargada, hasTransits=true, cierre sobrio.
Q: «¿Por qué últimamente estoy tan inquieta en el trabajo?»
A: «Hay una parte estructural y una contextual que se están solapando.

La parte estructural: tu Marte en Virgo tiene una manera muy precisa de vivir el trabajo. Le interesa la calidad de la ejecución, no la cantidad de cosas hechas. Cuando te sientes inquieta, normalmente no es porque tengas demasiado que hacer. Es porque estás haciendo cosas que sientes poco cuidadas, hechas deprisa, hechas para otro. Marte en Virgo se nutre de precisión, y cuando tiene que operar en modo "mete todo rápido" se carga de una tensión que no sabe dónde descargar.

Lo que está pasando ahora añade un elemento: Saturno está tocando tu Marte natal, y eso es precisamente una presión profesional. Saturno pone a examen tu manera de trabajar y te pregunta: este ritmo que has construido ¿es de verdad tuyo, o lo sostienes porque "está bien así"?

La inquietud, en este periodo, tiene menos que ver con el volumen de trabajo que con una verificación de sentido que va por debajo. Una parte de ti está entendiendo que el modo en que trabajas ahora no es sostenible para los próximos años, y Marte bajo Saturno no deja ignorar esa percepción.»`;

const QA_EXAMPLES: Record<PromptLang, string> = { it: QA_EXAMPLES_IT, es: QA_EXAMPLES_ES };

const QA_FINAL_EN = `Always respond by invoking the "return_answer" tool with the "answer" field containing your final answer (in the output language set above, length calibrated to the SHORT/MEDIUM/ARTICULATED/EXTENDED band defined above, never under 110 words). Do not add any text outside the tool.`;

type ClaimResult =
  | { claimed: true; nextRetry: number; previousStatus: string }
  | { claimed: false; reason: "not_found" | "max_retries_exceeded" | "already_processing" | "not_ready_yet" };

// Claim a row for either generation or release.
// Generation claim: status pending OR stale-processing → processing
// Release claim: status='ready' AND scheduled_for <= now() → processing
// retry_count is incremented only on generation paths (not on release, since
// release is just an email send + status flip and shouldn't burn retry budget).
const claimQuestion = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  questionId: string,
): Promise<ClaimResult> => {
  const staleThresholdISO = new Date(Date.now() - STALE_PROCESSING_MS).toISOString();
  const { data: existing } = await supabaseAdmin
    .from("astrology_guide_questions")
    .select("retry_count, status, scheduled_for, updated_at")
    .eq("id", questionId)
    .maybeSingle();
  if (!existing) return { claimed: false, reason: "not_found" };

  const existingRow = existing as {
    retry_count: number | null;
    status: string;
    scheduled_for: string;
    updated_at: string | null;
  };
  const isReady = existingRow.status === "ready";
  const isPending = existingRow.status === "pending";
  const isStaleProcessing =
    existingRow.status === "processing" &&
    new Date(existingRow.updated_at || 0).getTime() < Date.now() - STALE_PROCESSING_MS;

  // Release path: ready row whose time has come.
  if (isReady) {
    if (new Date(existingRow.scheduled_for).getTime() > Date.now()) {
      return { claimed: false, reason: "not_ready_yet" };
    }
    const { data: claimed } = await supabaseAdmin
      .from("astrology_guide_questions")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", questionId)
      .eq("status", "ready")
      .select("id")
      .maybeSingle();
    if (!claimed) return { claimed: false, reason: "already_processing" };
    return { claimed: true, nextRetry: existingRow.retry_count || 0, previousStatus: "ready" };
  }

  // Generation path: only available for pending or stale-processing.
  if (!isPending && !isStaleProcessing) {
    return { claimed: false, reason: "already_processing" };
  }

  const nextRetry = (existingRow.retry_count || 0) + 1;
  if (nextRetry > MAX_RETRIES) {
    return { claimed: false, reason: "max_retries_exceeded" };
  }

  const { data: claimed } = await supabaseAdmin
    .from("astrology_guide_questions")
    .update({
      status: "processing",
      retry_count: nextRetry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId)
    .or(`status.eq.pending,and(status.eq.processing,updated_at.lt.${staleThresholdISO})`)
    .select("id")
    .maybeSingle();

  if (!claimed) return { claimed: false, reason: "already_processing" };
  return { claimed: true, nextRetry, previousStatus: existingRow.status };
};

// Age in years from a birth_date JSONB column ({year, month, day}). Returns
// null if any field is missing or if the resulting age falls outside a
// plausible band (so an obvious data error never accidentally biases the
// model's tone).
const computeAge = (birthDate: { year?: number; month?: number; day?: number } | null | undefined): number | null => {
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

// Localized date (reader's language), in Europe/Rome — an explicit temporal
// anchor so the model can match the current day against the date_ranges inside
// currentTransits.periods (free-text strings the transit interpreter writes in
// the cycle's language, e.g. "dal 5 al 12 maggio" / "del 5 al 12 de mayo").
const buildCurrentDateContext = (lang: PromptLang) => {
  const now = new Date();
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const localized = new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "it-IT", {
    timeZone: "Europe/Rome",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  return { iso, localized };
};

type OtherReport = {
  userName: string | null;
  userAge: number | null;
  natalChart: unknown;
  fullReport: Record<string, string> | null;
};

type PastTransit = {
  periodStart: string;
  periodEnd: string;
  interpreted: unknown;
};

const buildPrompt = (params: {
  userName: string | null;
  userAge: number | null;
  focusArea: string | null;
  attachmentResponse: string | null;
  natalChart: unknown;
  fullReport: Record<string, string> | null;
  sectionId: string | null;
  history: { question: string; answer: string }[];
  question: string;
  hasTransits: boolean;
  currentTransits: unknown;
  pastTransits: PastTransit[];
  synastryContexts: unknown[];
  otherReports: OtherReport[];
  lang: PromptLang;
}) => {
  const {
    userName,
    userAge,
    focusArea,
    attachmentResponse,
    natalChart,
    fullReport,
    sectionId,
    history,
    question,
    hasTransits,
    currentTransits,
    pastTransits,
    synastryContexts,
    otherReports,
  } = params;
  const currentDate = buildCurrentDateContext(params.lang);
  const sectionFocusText = sectionId && fullReport ? fullReport[sectionId] || null : null;

  // Compact remaining sections so the model can cross-reference without us
  // shipping the whole report twice.
  const otherSections = fullReport
    ? Object.fromEntries(Object.entries(fullReport).filter(([id]) => id !== sectionId))
    : {};

  const userContext = {
    primaryReport: {
      userName: userName || null,
      userAge,
      focusArea: focusArea || null,
      attachmentResponse: attachmentResponse || null,
      natalChart: natalChart ?? null,
      sectionFocus: sectionId ? { id: sectionId, text: sectionFocusText } : null,
      otherReportSections: otherSections,
    },
    otherReports,
    currentDate,
    hasTransits,
    currentTransits: hasTransits ? currentTransits : null,
    pastTransits,
    synastryContexts,
  };

  const messages: { role: string; content: string }[] = [
    { role: "system", content: astrologyQaSystemPrompt(params.lang) },
    {
      role: "system",
      content: `USER CONTEXT (primaryReport, otherReports, currentTransits, pastTransits, synastryContexts):\n${JSON.stringify(userContext)}`,
    },
  ];

  for (const turn of history) {
    messages.push({ role: "user", content: turn.question });
    messages.push({ role: "assistant", content: turn.answer });
  }

  messages.push({ role: "user", content: question });
  return messages;
};

const callGemini = async (
  messages: { role: string; content: string }[],
  supabaseAdmin: ReturnType<typeof createClient>,
  questionId: string,
  attempt: number,
) => {
  if (!GEMINI_API_KEY) throw new Error("AI not configured");

  const aiRequestBody = {
    model: MODEL,
    reasoning_effort: "medium",
    max_tokens: 1200,
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: "return_answer",
          description: "Return the final answer in the reader's output language. Length adapts to how many distinct configurations the question asks to weave together: 110-160 words for binary/generic questions (one idea), 170-230 for questions about a single theme or single astrological aspect, 240-310 for questions that intertwine two planes (e.g. work + emotions, structure + transits), 320-400 for complex multi-aspect questions (three or more configurations). The technical tone is independent of the band: a technical question on a single aspect stays in MEDIUM. Never below 110 words.",
          parameters: {
            type: "object",
            properties: { answer: { type: "string" } },
            required: ["answer"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "return_answer" } },
  };

  const t0 = Date.now();
  const metricBase = {
    functionName: "process-astrology-questions",
    model: MODEL,
    attempt,
  };

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GEMINI_API_KEY}`,
      "Content-Type": "application/json",
    },
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
    throw new Error(`gemini_http_${response.status}: ${errText}`);
  }

  const completion = await response.json();
  const toolCall = completion.choices?.[0]?.message?.tool_calls?.[0];
  const argsString = toolCall?.function?.arguments ?? "";
  if (!argsString) {
    recordAiMetric(supabaseAdmin, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: "missing_tool_call",
      usage: completion?.usage,
    });
    throw new Error("gemini_missing_tool_call");
  }

  let parsed: { answer?: unknown };
  try {
    parsed = JSON.parse(String(argsString));
  } catch (e) {
    recordAiMetric(supabaseAdmin, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: "json_parse_error",
      usage: completion?.usage,
    });
    throw new Error(`gemini_json_parse: ${e}`);
  }

  const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
  if (!answer) {
    recordAiMetric(supabaseAdmin, {
      ...metricBase,
      durationMs: Date.now() - t0,
      success: false,
      httpStatus: response.status,
      errorCode: "empty_answer",
      usage: completion?.usage,
    });
    throw new Error("gemini_empty_answer");
  }

  recordAiMetric(supabaseAdmin, {
    ...metricBase,
    durationMs: Date.now() - t0,
    success: true,
    httpStatus: response.status,
    usage: completion?.usage,
  });

  return answer;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let questionId = "";

  try {
    const body = await req.json().catch(() => ({}));
    questionId = typeof body.questionId === "string" ? body.questionId : "";
    if (!questionId) throw new Error("questionId is required");

    // Privileged-only: admin secret OR service-role JWT.
    const isAdmin = Boolean(ADMIN_SECRET && req.headers.get("x-admin-secret") === ADMIN_SECRET);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    const claims = parseJwtClaims(token);
    const isServiceRole = claims?.role === "service_role";
    if (!isAdmin && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atomic claim. May claim for generation (pending → processing) or
    // release (ready → processing).
    const claim = await claimQuestion(supabaseAdmin, questionId);
    if (!claim.claimed) {
      // Out of retries — give up gracefully: mark failed, refund credit, notify.
      if (claim.reason === "max_retries_exceeded") {
        const { data: q } = await supabaseAdmin
          .from("astrology_guide_questions")
          .select("profile_id, quiz_session_id, question, status")
          .eq("id", questionId)
          .maybeSingle();
        if (q && q.status !== "completed") {
          await supabaseAdmin
            .from("astrology_guide_questions")
            .update({
              status: "failed",
              error: "max_retries_exceeded",
            })
            .eq("id", questionId);
          await supabaseAdmin.rpc("restore_astrology_credit", {
            p_profile_id: q.profile_id,
            p_quiz_session_id: q.quiz_session_id,
          });
        }
      }
      return new Response(JSON.stringify({ skipped: claim.reason }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isReleasePhase = claim.previousStatus === "ready";

    // Load question + joined session + profile email + scheduled_for.
    const { data: row, error: loadErr } = await supabaseAdmin
      .from("astrology_guide_questions")
      .select(
        "id, profile_id, quiz_session_id, section_id, question, answer, scheduled_for, retry_count, " +
          "quiz_sessions(natal_chart, full_report, user_name, focus_area, attachment_response, birth_date, language, market), " +
          "profiles(email)",
      )
      .eq("id", questionId)
      .maybeSingle();
    if (loadErr) throw loadErr;
    if (!row) throw new Error("question_not_found_after_claim");

    type LoadedRow = {
      id: string;
      profile_id: string;
      quiz_session_id: string;
      section_id: string | null;
      question: string;
      answer: string | null;
      scheduled_for: string;
      retry_count: number;
      quiz_sessions: {
        natal_chart: unknown;
        full_report: Record<string, string> | null;
        user_name: string | null;
        focus_area: string | null;
        attachment_response: string | null;
        birth_date: { year?: number; month?: number; day?: number } | null;
        language: string | null;
        market: string | null;
      } | null;
      profiles: { email: string | null } | null;
    };
    const typedRow = row as unknown as LoadedRow;
    const quizSession = typedRow.quiz_sessions || {
      natal_chart: null,
      full_report: null,
      user_name: null,
      focus_area: null,
      attachment_response: null,
      birth_date: null,
      language: null,
      market: null,
    };
    const profile = typedRow.profiles || { email: null };

    // ────────────────────────────────────────────────────────────────────
    // PHASE A — GENERATION (skipped on release-phase claims).
    // ────────────────────────────────────────────────────────────────────
    let answer = typedRow.answer;
    if (!isReleasePhase && !answer) {
      // Last N Q&A from the same session, oldest-first. We include both
      // 'completed' (already released to the user) and 'ready' (generated
      // but waiting for scheduled_for) because by the time THIS answer is
      // released, any 'ready' siblings will have been released first
      // (scheduled_for ordering), so referring to them is temporally
      // consistent from the user's perspective.
      const { data: historyRows } = await supabaseAdmin
        .from("astrology_guide_questions")
        .select("question, answer, created_at")
        .eq("quiz_session_id", row.quiz_session_id)
        .in("status", ["ready", "completed"])
        .not("answer", "is", null)
        .neq("id", questionId)
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT);

      const history = ((historyRows || []) as Array<{ question: string; answer: string }>)
        .reverse()
        .map((h) => ({ question: h.question, answer: h.answer }));

      // Pull the user's last 3 monthly transit cycles (current + up to 2
      // previous). The model uses past cycles ONLY for retrospective
      // questions; for "what's happening now" it uses the current one.
      // Transits are always anchored to the primary report's natal chart —
      // we don't have transits for otherReports.
      const todayDate = new Date().toISOString().slice(0, 10);
      const { data: recentCycles } = await supabaseAdmin
        .from("transit_cycles")
        .select("interpreted_transits, period_start, period_end")
        .eq("quiz_session_id", row.quiz_session_id)
        .eq("status", "completed")
        .lte("period_start", todayDate)
        .not("interpreted_transits", "is", null)
        .order("period_start", { ascending: false })
        .limit(3);

      const cycles =
        (recentCycles as Array<{
          interpreted_transits: unknown;
          period_start: string;
          period_end: string;
        }> | null) || [];
      const currentCycle = cycles.find((c) => c.period_start <= todayDate && c.period_end >= todayDate) || null;
      const currentTransits = currentCycle?.interpreted_transits ?? null;
      const hasTransits = Boolean(currentTransits);
      const pastTransits = cycles
        .filter((c) => c !== currentCycle)
        .map((c) => ({
          periodStart: c.period_start,
          periodEnd: c.period_end,
          interpreted: c.interpreted_transits,
        }));

      // Pull ALL the user's completed synastry reports (one per partner).
      // Path: checkout_sessions.claimed_profile_id → synastry_sessions.
      // We dedupe by synastry_session_id in case the same synastry is linked
      // through multiple checkout rows.
      const synastryContexts: unknown[] = [];
      const seenSynastryIds = new Set<string>();
      const { data: synastryRows } = await supabaseAdmin
        .from("checkout_sessions")
        .select(
          "synastry_session_id, " +
          "synastry_sessions(person_a_name, person_b_name, archetype, archetype_label, " +
          "score_overall, scores, relationship_duration, focus_relational, full_report)"
        )
        .eq("claimed_profile_id", row.profile_id)
        .not("synastry_session_id", "is", null)
        .order("created_at", { ascending: false });

      for (const sr of (synastryRows || []) as Array<{
        synastry_session_id: string | null;
        synastry_sessions: {
          person_a_name: string | null;
          person_b_name: string | null;
          archetype: string | null;
          archetype_label: string | null;
          score_overall: number | null;
          scores: unknown;
          relationship_duration: string | null;
          focus_relational: string | null;
          full_report: unknown;
        } | null;
      }>) {
        const sid = sr.synastry_session_id;
        if (!sid || seenSynastryIds.has(sid)) continue;
        const ss = sr.synastry_sessions;
        if (!ss?.full_report) continue;
        seenSynastryIds.add(sid);
        synastryContexts.push({
          personAName: ss.person_a_name,
          personBName: ss.person_b_name,
          archetype: ss.archetype,
          archetypeLabel: getArchetypeLabel(ss.archetype, resolvePromptLang(quizSession.language)),
          scoreOverall: ss.score_overall,
          scores: ss.scores,
          relationshipDuration: ss.relationship_duration,
          focusRelational: ss.focus_relational,
          fullReport: ss.full_report,
        });
      }
      // Order matters: the system prompt says "use the last array element
      // when the question doesn't disambiguate" (= most recent), and the
      // checkout_sessions query above is sorted desc, so we reverse to get
      // oldest-first / most-recent-last.
      synastryContexts.reverse();

      // Pull ALL OTHER natal reports linked to the profile (excluding the
      // session of the current question). This lets the guide answer
      // questions about a different person whose chart is also on the
      // profile (partner, child, friend). The lookup goes through
      // user_reports, which is the join table profile→quiz_session.
      const otherReports: OtherReport[] = [];
      const { data: otherReportRows } = await supabaseAdmin
        .from("user_reports")
        .select("quiz_session_id, quiz_sessions(natal_chart, full_report, user_name, birth_date)")
        .eq("profile_id", row.profile_id)
        .neq("quiz_session_id", row.quiz_session_id);

      for (const orRow of (otherReportRows || []) as Array<{
        quiz_session_id: string;
        quiz_sessions: {
          natal_chart: unknown;
          full_report: Record<string, string> | null;
          user_name: string | null;
          birth_date: { year?: number; month?: number; day?: number } | null;
        } | null;
      }>) {
        const qs = orRow.quiz_sessions;
        if (!qs?.full_report) continue;
        otherReports.push({
          userName: qs.user_name || null,
          userAge: computeAge(qs.birth_date),
          natalChart: qs.natal_chart ?? null,
          fullReport: qs.full_report,
        });
      }

      const messages = buildPrompt({
        userName: quizSession.user_name || null,
        userAge: computeAge(quizSession.birth_date),
        focusArea: quizSession.focus_area || null,
        attachmentResponse: quizSession.attachment_response || null,
        natalChart: quizSession.natal_chart ?? null,
        fullReport: (quizSession.full_report as Record<string, string>) || null,
        sectionId: row.section_id || null,
        history,
        question: row.question,
        hasTransits,
        currentTransits,
        pastTransits,
        synastryContexts,
        otherReports,
        lang: resolvePromptLang(quizSession.language),
      });

      answer = await callGemini(messages, supabaseAdmin, questionId, claim.nextRetry);

      // Persist the generated answer. The row is invisible to the user (status
      // is still 'processing' here, becomes 'ready' or 'completed' below).
      await supabaseAdmin
        .from("astrology_guide_questions")
        .update({
          answer,
          model_used: MODEL,
          error: null,
        })
        .eq("id", questionId);
    }

    if (!answer) throw new Error("answer_missing_after_generation");

    // ────────────────────────────────────────────────────────────────────
    // Branch: should we release now, or hold until scheduled_for?
    // ────────────────────────────────────────────────────────────────────
    const releaseDue = new Date(typedRow.scheduled_for).getTime() <= Date.now();

    if (!releaseDue) {
      // Generation done, but the human-friendly delivery time hasn't arrived.
      // Park the row as 'ready'. Cron picks it up at scheduled_for.
      await supabaseAdmin
        .from("astrology_guide_questions")
        .update({
          status: "ready",
          updated_at: new Date().toISOString(),
        })
        .eq("id", questionId);
      return new Response(JSON.stringify({ stored: true, status: "ready", questionId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ────────────────────────────────────────────────────────────────────
    // PHASE B — RELEASE: scheduled_for has arrived. Send email + flip to
    // 'completed' so the realtime push reveals the answer in the panel.
    // ────────────────────────────────────────────────────────────────────
    await supabaseAdmin
      .from("astrology_guide_questions")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", questionId);

    // Read the (now-updated) credit balance for the email.
    const { data: creditsRow } = await supabaseAdmin
      .from("astrology_guide_credits")
      .select("balance")
      .eq("profile_id", row.profile_id)
      .eq("quiz_session_id", row.quiz_session_id)
      .maybeSingle();

    if (profile?.email) {
      sendTransactionalEmailBackground({
        templateName: "astrology-guide-answer",
        recipientEmail: profile.email,
        idempotencyKey: `astrology-guide-answer-${questionId}`,
        templateData: {
          name: quizSession.user_name || "",
          question: row.question,
          answer,
          sectionLabel: row.section_id || "",
          creditsRemaining: creditsRow?.balance ?? 0,
          questionId,
          lang: resolvePromptLang(quizSession.language),
          market: quizSession.market === "es" ? "es" : "it",
        },
      });
      await supabaseAdmin
        .from("astrology_guide_questions")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", questionId);
    }

    // Bump GUIDA_STATUS on Brevo. The helper recomputes from DB, so it
    // resolves to "free_used" (or higher if the user has already purchased
    // a pack). Idempotent and fire-and-forget.
    syncAstrologyGuideStatusBackground(row.profile_id, profile?.email);

    return new Response(JSON.stringify({ completed: true, questionId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[process-astrology-questions] error:", message);
    if (questionId) {
      // Determine whether the failure was during generation or after. If the
      // row already has an answer, generation succeeded — only the release
      // (or the post-generation status update) failed. In that case reset
      // to 'ready' so the cron retries delivery, without burning retry
      // budget or refunding credits.
      const { data: row } = await supabaseAdmin
        .from("astrology_guide_questions")
        .select("retry_count, answer, profile_id, quiz_session_id")
        .eq("id", questionId)
        .maybeSingle();
      if (row) {
        if (row.answer) {
          await supabaseAdmin
            .from("astrology_guide_questions")
            .update({ status: "ready", error: message.slice(0, 500) })
            .eq("id", questionId);
        } else if ((row.retry_count || 0) >= MAX_RETRIES) {
          await supabaseAdmin
            .from("astrology_guide_questions")
            .update({ status: "failed", error: message.slice(0, 500) })
            .eq("id", questionId);
          await supabaseAdmin.rpc("restore_astrology_credit", {
            p_profile_id: row.profile_id,
            p_quiz_session_id: row.quiz_session_id,
          });
        } else {
          await supabaseAdmin
            .from("astrology_guide_questions")
            .update({ status: "pending", error: message.slice(0, 500) })
            .eq("id", questionId);
        }
      }
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
