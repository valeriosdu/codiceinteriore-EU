import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useSynastry,
  markSynastryFunnelStage,
  getSynastryFunnelStage,
  isBirthDateComplete,
  toCompleteBirthDate,
} from '@/context/SynastryContext';
import { useSynastrySession } from '@/hooks/useSynastrySession';
import { useMetaConversions } from '@/hooks/useMetaConversions';
import { pollUntilStatus } from '@/hooks/useSynastryStatus';
import { useI18n } from '@/i18n/I18nProvider';

const TIMEOUT_MS = 90_000;

export default function CoppiaProcessing() {
  const navigate = useNavigate();
  const { data, updateData } = useSynastry();
  const { createSession, triggerInsights } = useSynastrySession();
  const { trackLead } = useMetaConversions();
  const { m, market } = useI18n();
  const cp = m.coppia.processing;
  const ranRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = m.coppia.titles.processing(market.siteName);

    // Idempotency: se l'utente e' gia stato sul teaser/offer (e quindi la sessione
    // esiste e i dati sono pronti), salta la creazione di una nuova sessione.
    const stage = getSynastryFunnelStage();
    if (stage === 'teaser' || stage === 'offer') {
      navigate('/coppia/teaser', { replace: true });
      return;
    }

    if (ranRef.current) return;
    if (!isBirthDateComplete(data.personA.birthDate) || !isBirthDateComplete(data.personB.birthDate)) {
      navigate('/coppia/quiz', { replace: true });
      return;
    }
    ranRef.current = true;

    const run = async () => {
      let sessionId = data.sessionId;
      if (!sessionId) {
        sessionId = await createSession();
      }
      if (!sessionId) {
        setErrorMessage(cp.errors.createSession);
        return;
      }

      // Quiz coppia completato: stesso confine funnel del Lead sul natale.
      trackLead({
        firstName: data.personA.name || undefined,
        sessionId,
        purchaseType: 'synastry_launch',
        birthDate: toCompleteBirthDate(data.personA.birthDate),
      });

      await triggerInsights(sessionId).catch((e) =>
        console.warn('[CoppiaProcessing] triggerInsights failed:', e),
      );

      const snap = await pollUntilStatus(
        sessionId,
        (s) =>
          Boolean(s.teaser_highlight) ||
          s.processing_status === 'insights_ready' ||
          s.processing_status === 'failed',
        TIMEOUT_MS,
      );

      if (!snap) {
        setErrorMessage(cp.errors.timeout);
        return;
      }

      if (snap.processing_status === 'failed') {
        setErrorMessage(snap.processing_error || cp.errors.failed);
        return;
      }

      updateData({
        archetype: snap.archetype,
        archetypeLabel: snap.archetype_label,
        scoreOverall: snap.score_overall,
        scores: snap.scores,
        teaserHighlight: snap.teaser_highlight,
        biWheelSvg: snap.bi_wheel_svg,
        processingStatus: snap.processing_status,
      });
      markSynastryFunnelStage('teaser');
      navigate('/coppia/teaser', { replace: true });
    };

    void run();
  }, [createSession, triggerInsights, trackLead, data.personA.birthDate, data.personB.birthDate, data.sessionId, navigate, updateData]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {errorMessage ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-3">
              {cp.errorTitle}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>
            <button
              type="button"
              onClick={() => navigate('/coppia/quiz')}
              className="h-11 px-6 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90"
            >
              {cp.backToQuiz}
            </button>
          </>
        ) : (
          <>
            <div className="inline-block mb-6">
              <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-3">
              {cp.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {cp.body}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
