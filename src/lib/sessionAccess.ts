// Capability-style access to quiz_sessions / synastry_sessions for the
// ANONYMOUS funnel (pre-/activate). The tables are no longer world-readable;
// these helpers go through SECURITY DEFINER RPCs that require the session
// UUID (which the browser already holds in localStorage / context) and
// return only the columns the funnel needs.
//
// Authenticated pages (report, admin-adjacent) keep reading the tables
// directly — they are covered by owner-scoped RLS policies, so they do not
// use these helpers.
//
// The RPCs are not in the generated Supabase types yet, so calls are cast
// to `any` (same pattern the synastry code already uses for its tables).

import { supabase } from '@/integrations/supabase/client';

export type QuizSessionPublic = {
  id: string;
  user_name: string | null;
  processing_status: string | null;
  teaser_insights: unknown;
  natal_chart: unknown;
  natal_chart_svg: string | null;
};

export type SynastrySessionPublic = {
  id: string;
  processing_status: string | null;
  processing_error: string | null;
  archetype: string | null;
  archetype_label: string | null;
  score_overall: number | null;
  scores: unknown;
  teaser_highlight: unknown;
  bi_wheel_svg: string | null;
  full_report: unknown;
};

export async function createQuizSession(
  payload: Record<string, unknown>,
): Promise<string | null> {
  const { data, error } = await (supabase as any).rpc('create_quiz_session', {
    p_payload: payload,
  });
  if (error) {
    console.error('[createQuizSession] error:', error);
    return null;
  }
  return (data as string) ?? null;
}

export async function fetchQuizSessionPublic(
  sessionId: string,
): Promise<QuizSessionPublic | null> {
  const { data, error } = await (supabase as any).rpc('get_quiz_session_public', {
    p_session_id: sessionId,
  });
  if (error) {
    console.warn('[fetchQuizSessionPublic] error:', error);
    return null;
  }
  const rows = data as QuizSessionPublic[] | null;
  return rows && rows.length > 0 ? rows[0] : null;
}

export async function createSynastrySession(
  payload: Record<string, unknown>,
): Promise<string | null> {
  const { data, error } = await (supabase as any).rpc('create_synastry_session', {
    p_payload: payload,
  });
  if (error) {
    console.error('[createSynastrySession] error:', error);
    return null;
  }
  return (data as string) ?? null;
}

export async function fetchSynastrySessionPublic(
  sessionId: string,
): Promise<SynastrySessionPublic | null> {
  const { data, error } = await (supabase as any).rpc('get_synastry_session_public', {
    p_session_id: sessionId,
  });
  if (error) {
    console.warn('[fetchSynastrySessionPublic] error:', error);
    return null;
  }
  const rows = data as SynastrySessionPublic[] | null;
  return rows && rows.length > 0 ? rows[0] : null;
}
