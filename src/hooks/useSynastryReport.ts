import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isLovablePreview } from '@/lib/preview-mode';

export interface SynastrySessionSummary {
  id: string;
  person_a_name: string | null;
  person_b_name: string | null;
  archetype: string | null;
  score_overall: number | null;
  scores: Record<string, number> | null;
  full_report: Record<string, string> | null;
  bi_wheel_svg: string | null;
}

const SYNASTRY_SELECT = `
  synastry_session_id,
  synastry_sessions (
    id,
    person_a_name,
    person_b_name,
    archetype,
    score_overall,
    scores,
    full_report,
    bi_wheel_svg
  )
`;

export function useSynastryReport(profileId: string | null, email: string | null) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SynastrySessionSummary[]>([]);

  useEffect(() => {
    if (isLovablePreview() || !profileId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const orClauses = [`claimed_profile_id.eq.${profileId}`];
        if (email) orClauses.push(`customer_email.ilike.${email}`);

        const { data: rows } = await (supabase as any)
          .from('checkout_sessions')
          .select(SYNASTRY_SELECT)
          .or(orClauses.join(','))
          .eq('payment_status', 'paid')
          .not('synastry_session_id', 'is', null)
          .order('created_at', { ascending: false });

        if (cancelled) return;

        const seen = new Set<string>();
        const unique: SynastrySessionSummary[] = [];
        for (const r of rows || []) {
          const s = r.synastry_sessions;
          if (s?.id && !seen.has(s.id)) {
            seen.add(s.id);
            unique.push(s);
          }
        }
        setSessions(unique);
      } catch (err) {
        console.error('useSynastryReport error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profileId, email]);

  return { loading, sessions };
}
