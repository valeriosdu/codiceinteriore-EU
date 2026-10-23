// Provider config for the LONG-FORM report generations only:
//   - generate-report          (natal report)
//   - generate-synastry-report (coppia / synastry)
//   - process-transit-cycle    (monthly transits)
//
// Switched from Google Gemini (direct, the generativelanguage OpenAI-compat
// endpoint) to OpenRouter on 2026-06-17 because Gemini was returning frequent
// 503 "model overloaded" errors that stalled paid report generation for minutes
// at a time. OpenRouter is OpenAI-compatible, so only the base URL, auth header,
// model id and the reasoning-param shape change — the request/response contract
// (including the forced tool_choice used for structured output) is identical.
//
// Scope: ONLY these three functions route through here. The short teaser/insight
// and Q&A paths (process-session-insights, process-synastry-insights,
// process-astrology-questions) intentionally stay on Gemini directly.
//
// OpenRouter-only by design — NO automatic Gemini fallback. Each caller keeps its
// own retry loop and recover-pending-reports re-drives anything left unfinished.

export const LLM_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";

// Gemini 3.8 Flash on OpenRouter (64k max output, above our 16k/32k max_tokens).
// Switched from deepseek/deepseek-v4-pro on 2026-10-23: its Finnish reports came
// back with systematically dropped doubled letters ("etä" for "että") and at
// half the normal length (2 of the last 10), and its Finnish prose was clumsy.
// To go back, set this to "deepseek/deepseek-v4-pro".
export const LONG_REPORT_MODEL = "google/gemini-3.8-flash";

export function getLlmApiKey(): string {
  return Deno.env.get("OPENROUTER_API_KEY") || "";
}

// Headers for an OpenRouter chat/completions call. HTTP-Referer / X-Title are
// OpenRouter's optional attribution fields (shown in their dashboard).
export function llmHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getLlmApiKey()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://www.codiceinteriore.it",
    "X-Title": "Codice Interiore",
  };
}
