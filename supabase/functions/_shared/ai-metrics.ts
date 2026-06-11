// Fire-and-forget telemetry for LLM calls. The contract: this MUST NOT
// throw or block the caller. Telemetry failures get a console.warn and
// the caller proceeds as if nothing happened.

export type AiUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
} | null | undefined;

export type RecordAiMetricArgs = {
  functionName: string;
  model?: string | null;
  quizSessionId?: string | null;
  transitCycleId?: string | null;
  attempt: number;
  durationMs: number;
  success: boolean;
  httpStatus?: number | null;
  errorCode?: string | null;
  usage?: AiUsage;
};

export function recordAiMetric(supabase: any, args: RecordAiMetricArgs): void {
  try {
    void supabase
      .from("ai_generation_metrics")
      .insert({
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
      })
      .then(
        (res: { error?: unknown } | null | undefined) => {
          if (res && (res as any).error) {
            console.warn("[ai-metrics] insert failed:", (res as any).error);
          }
        },
        (err: unknown) => {
          console.warn("[ai-metrics] insert threw:", err);
        },
      );
  } catch (err) {
    console.warn("[ai-metrics] recordAiMetric threw synchronously:", err);
  }
}
