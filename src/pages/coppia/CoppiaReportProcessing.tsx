// Poll fino a quando il full_report e' pronto. La generazione e' triggerata
// dal webhook Stripe (stripe-reconcile), questa pagina aspetta che si completi.

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchSynastrySessionPublic } from '@/lib/sessionAccess';
import { useSynastry } from '@/context/SynastryContext';

const POLL_INTERVAL = 3000;
const TIMEOUT_MS = 180_000;

export default function CoppiaReportProcessing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const stripeSessionId = params.get('session_id') || '';
  const { data, updateData } = useSynastry();
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState('Stiamo preparando il vostro report');
  const ranRef = useRef(false);

  useEffect(() => {
    document.title = 'Sinastria - Generazione | Codice Interiore';
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      // Step 1: trova synastry_session_id da checkout_sessions tramite stripe_session_id
      let synastrySessionId = data.sessionId;

      if (!synastrySessionId && stripeSessionId) {
        const { data: row } = await supabase
          .from('checkout_sessions')
          .select('synastry_session_id')
          .eq('stripe_session_id', stripeSessionId)
          .maybeSingle();
        synastrySessionId = (row as any)?.synastry_session_id ?? null;
        if (synastrySessionId) updateData({ sessionId: synastrySessionId });
      }

      if (!synastrySessionId) {
        setError('Non riesco a trovare la tua sessione. Contattaci se il problema persiste.');
        return;
      }

      // Step 2: poll until full_report is ready
      const started = Date.now();
      while (Date.now() - started < TIMEOUT_MS) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
        const s = (await fetchSynastrySessionPublic(synastrySessionId)) as any;
        if (!s) continue;

        if (s.full_report) {
          updateData({
            archetype: s.archetype,
            archetypeLabel: s.archetype_label,
            scoreOverall: s.score_overall,
            scores: s.scores,
            teaserHighlight: s.teaser_highlight,
            biWheelSvg: s.bi_wheel_svg,
            fullReport: s.full_report,
            processingStatus: s.processing_status,
          });
          navigate('/coppia/report', { replace: true });
          return;
        }

        if (s.processing_status === 'failed') {
          setError(s.processing_error || 'Generazione fallita. Contattaci se il problema persiste.');
          return;
        }

        if (s.processing_status === 'report_processing') {
          setProgressNote('Sto scrivendo il vostro report. Pochi minuti...');
        } else if (s.processing_status === 'synastry_ready' || s.processing_status === 'insights_ready') {
          setProgressNote('Sto avviando la scrittura del report...');

          // Se siamo authed, trigghera generate-synastry-report (in caso il webhook non l'abbia fatto)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.functions
              .invoke('generate-synastry-report', { body: { synastrySessionId } })
              .catch((e) => console.warn('[CoppiaReportProcessing] trigger failed:', e));
          }
        }
      }

      setError('La generazione sta richiedendo piu del previsto. Riprova fra qualche minuto.');
    };

    void run();
  }, [data.sessionId, stripeSessionId, navigate, updateData]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {error ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-3">
              C'e un problema
            </h1>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
          </>
        ) : (
          <>
            <div className="inline-block mb-6">
              <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-3">
              {progressNote}
            </h1>
            <p className="text-sm text-muted-foreground">
              La generazione del report richiede da 1 a 3 minuti.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
