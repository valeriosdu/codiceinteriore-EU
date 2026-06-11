import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET")!;

type MetricRow = {
  id: string;
  created_at: string;
  function_name: string;
  model: string | null;
  quiz_session_id: string | null;
  transit_cycle_id: string | null;
  attempt: number;
  duration_ms: number;
  success: boolean;
  http_status: number | null;
  error_code: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
};

// Mirrors admin-dashboard's parser so the UI can share its period filter.
// Accepts either explicit ISO `from`/`to` or wall-clock `from_date`/`to_date`
// + `tz` (defaults to Europe/Rome).
function zonedWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = fmt.formatToParts(new Date(guess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const tzAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second"),
  );
  const offset = tzAsUtc - guess;
  return new Date(guess - offset);
}

function parseRange(url: URL): { from: string; to: string; tz: string } {
  const tz = url.searchParams.get("tz") || "Europe/Rome";
  const fromDate = url.searchParams.get("from_date");
  const toDate = url.searchParams.get("to_date");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  let from: Date;
  let to: Date;

  if (fromDate && toDate) {
    const [fy, fm, fd] = fromDate.split("-").map(Number);
    const [ty, tm, td] = toDate.split("-").map(Number);
    if (!fy || !fm || !fd || !ty || !tm || !td) {
      throw new Error("Invalid from_date/to_date");
    }
    from = zonedWallClockToUtc(fy, fm, fd, 0, 0, 0, tz);
    to = zonedWallClockToUtc(ty, tm, td, 23, 59, 59, tz);
  } else if (fromParam && toParam) {
    from = new Date(fromParam);
    to = new Date(toParam);
  } else {
    const now = new Date();
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    to = now;
  }

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Invalid from/to date");
  }
  return { from: from.toISOString(), to: to.toISOString(), tz };
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function summarize(rows: MetricRow[]) {
  const durations = rows.map((r) => r.duration_ms).sort((a, b) => a - b);
  const total = rows.length;
  const successCount = rows.filter((r) => r.success).length;
  const promptTokens = rows.reduce((acc, r) => acc + (r.prompt_tokens || 0), 0);
  const completionTokens = rows.reduce((acc, r) => acc + (r.completion_tokens || 0), 0);
  const totalTokens = rows.reduce((acc, r) => acc + (r.total_tokens || 0), 0);
  const avg = total > 0 ? Math.round(durations.reduce((acc, n) => acc + n, 0) / total) : null;

  // attempts breakdown (1 = first try, >=2 = retry)
  const firstTry = rows.filter((r) => r.attempt === 1).length;
  const retried = rows.filter((r) => r.attempt > 1).length;

  // error breakdown — only for failures
  const errorCounts: Record<string, number> = {};
  for (const r of rows) {
    if (r.success) continue;
    const code = r.error_code || "unknown";
    errorCounts[code] = (errorCounts[code] || 0) + 1;
  }

  return {
    count: total,
    success_count: successCount,
    success_rate_pct: total > 0 ? Math.round((successCount / total) * 1000) / 10 : null,
    duration_ms: {
      avg,
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      max: total > 0 ? durations[durations.length - 1] : null,
      min: total > 0 ? durations[0] : null,
    },
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: totalTokens,
    },
    attempts: {
      first_try: firstTry,
      retried,
    },
    errors: errorCounts,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret");
    if (!adminSecret || adminSecret !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const { from, to, tz } = parseRange(url);

    const { data, error } = await supabase
      .from("ai_generation_metrics")
      .select(
        "id, created_at, function_name, model, quiz_session_id, transit_cycle_id, attempt, duration_ms, success, http_status, error_code, prompt_tokens, completion_tokens, total_tokens",
      )
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false })
      .limit(20000);

    if (error) throw error;
    const rows = (data || []) as MetricRow[];

    const byFunction: Record<string, MetricRow[]> = {};
    for (const r of rows) {
      if (!byFunction[r.function_name]) byFunction[r.function_name] = [];
      byFunction[r.function_name].push(r);
    }

    const perFunction = Object.entries(byFunction)
      .map(([name, fnRows]) => ({ function_name: name, ...summarize(fnRows) }))
      .sort((a, b) => b.count - a.count);

    const overall = summarize(rows);

    // Top 20 slowest generations (any function) — useful to spot tail
    // latencies and long-running prompts.
    const slowest = [...rows]
      .sort((a, b) => b.duration_ms - a.duration_ms)
      .slice(0, 20)
      .map((r) => ({
        id: r.id,
        created_at: r.created_at,
        function_name: r.function_name,
        model: r.model,
        duration_ms: r.duration_ms,
        success: r.success,
        attempt: r.attempt,
        error_code: r.error_code,
        quiz_session_id: r.quiz_session_id,
        transit_cycle_id: r.transit_cycle_id,
        total_tokens: r.total_tokens,
      }));

    return new Response(
      JSON.stringify({
        range: { from, to, tz },
        overall,
        per_function: perFunction,
        slowest,
        meta: {
          generated_at: new Date().toISOString(),
          rows_scanned: rows.length,
          truncated: rows.length >= 20000,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("admin-ai-metrics error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
