import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSynastrySessionPublic } from '@/lib/sessionAccess';

export type SynastrySnapshot = {
  id: string;
  processing_status: string | null;
  processing_error: string | null;
  archetype: string | null;
  archetype_label: string | null;
  score_overall: number | null;
  scores: any;
  teaser_highlight: any;
  bi_wheel_svg: string | null;
  full_report: any;
};

const POLL_INTERVAL_MS = 2000;
const DEFAULT_TIMEOUT_MS = 90_000;

export function useSynastryStatus(sessionId: string | null) {
  const [snapshot, setSnapshot] = useState<SynastrySnapshot | null>(null);
  const cancelRef = useRef(false);

  const fetchOnce = useCallback(async () => {
    if (!sessionId) return null;
    return (await fetchSynastrySessionPublic(sessionId)) as unknown as SynastrySnapshot | null;
  }, [sessionId]);

  useEffect(() => {
    cancelRef.current = false;
    if (!sessionId) return;

    const tick = async () => {
      const snap = await fetchOnce();
      if (snap) setSnapshot(snap);
    };
    void tick();

    const interval = setInterval(() => {
      if (cancelRef.current) return;
      void tick();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelRef.current = true;
      clearInterval(interval);
    };
  }, [sessionId, fetchOnce]);

  return { snapshot, fetchOnce };
}

export async function pollUntilStatus(
  sessionId: string,
  predicate: (snap: SynastrySnapshot) => boolean,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<SynastrySnapshot | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const snap = (await fetchSynastrySessionPublic(sessionId)) as unknown as SynastrySnapshot | null;
    if (snap && predicate(snap)) return snap;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}
