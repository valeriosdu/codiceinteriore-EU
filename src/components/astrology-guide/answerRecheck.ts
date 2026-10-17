// Quando ricontrollare le risposte della Guida ancora in attesa. Sta in un
// modulo suo, senza dipendenze, per poterlo testare senza il client Supabase.
//
// Il cron process-astrology-questions rilascia ogni 5 minuti: si guarda poco
// dopo l'orario previsto, poi ogni 2 minuti per al massimo mezz'ora.
const RELEASE_GRACE_MS = 6 * 60 * 1000;
const RECHECK_MS = 2 * 60 * 1000;
const RECHECK_WINDOW_MS = 30 * 60 * 1000;
// Oltre ~24,8 giorni setTimeout scatta subito: un orario malformato nel futuro
// lontano produrrebbe una raffica di refresh.
const MAX_TIMER_MS = 24 * 60 * 60 * 1000;

const WAITING_STATUSES = new Set(["pending", "processing", "ready"]);

type QuestionTiming = { status: string; scheduled_for: string | null };

export type AnswerRecheckPlan = {
  /** Orario previsto della prima risposta in attesa (ms epoch). */
  nextRelease: number;
  /** Fra quanto ricontrollare; null = finestra scaduta, solo al ritorno sulla scheda. */
  delayMs: number | null;
};

/** null se non c'e' nessuna domanda in attesa. */
export function planAnswerRecheck(questions: QuestionTiming[], now: number): AnswerRecheckPlan | null {
  const waiting = questions.filter((q) => WAITING_STATUSES.has(q.status));
  if (waiting.length === 0) return null;

  const releaseTimes = waiting
    .map((q) => (q.scheduled_for ? Date.parse(q.scheduled_for) : NaN))
    .filter((t) => Number.isFinite(t));
  const nextRelease = releaseTimes.length ? Math.min(...releaseTimes) : now;
  const dueAt = nextRelease + RELEASE_GRACE_MS;

  if (now >= dueAt + RECHECK_WINDOW_MS) return { nextRelease, delayMs: null };
  return { nextRelease, delayMs: Math.min(Math.max(dueAt - now, RECHECK_MS), MAX_TIMER_MS) };
}
