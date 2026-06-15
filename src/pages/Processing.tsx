import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuiz, getFunnelStage } from '@/context/QuizContext';
import { supabase } from '@/integrations/supabase/client';
import { createQuizSession, fetchQuizSessionPublic } from '@/lib/sessionAccess';
import { useI18n } from '@/i18n/I18nProvider';

// Hard ceiling for waiting in the browser. The background job continues
// even if we navigate away — TeaserResult will keep polling.
const HANDOFF_TIMEOUT_MS = 35000;
const POLL_INTERVAL_MS = 3000;

const Processing = () => {
  const navigate = useNavigate();
  const { data, updateData } = useQuiz();
  const { m, market } = useI18n();
  const messages = m.processing.messages;
  const waitingMessage = m.processing.waiting;
  const [currentIndex, setCurrentIndex] = useState(0);
  const fetchStarted = useRef(false);
  const [ready, setReady] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  // Pipeline: create session → chart → kick off background insights → poll until ready
  useEffect(() => {
    if (fetchStarted.current) return;
    fetchStarted.current = true;

    // If the user is navigating back here from later in the funnel (e.g. browser
    // back from /teaser), don't recreate the session — that would burn another
    // freeastroapi + Gemini cycle on the same data. Send them forward instead.
    const stage = getFunnelStage();
    if (stage === 'teaser' || stage === 'offer') {
      navigate(data.subjectIsOther ? '/checkout' : '/teaser', { replace: true });
      return;
    }

    const run = async () => {
      if (!data.birthDate || !data.birthTime || data.birthLat == null || data.birthTimezone == null) {
        console.error('Missing birth data for chart calculation');
        setReady(true);
        return;
      }

      try {
        // Step 0: Create session.
        // funnel_slug is the canonical angle (set by Quiz.tsx from URL param).
        // quiz_answers carries angle-specific responses as JSONB; classica
        // sticks to the dedicated columns (attachment_response, focus_area)
        // for back-compat, while attivazione writes its symptom + narrative
        // answers into quiz_answers and leaves the dedicated columns empty.
        const funnelSlug = data.funnelSlug || 'classica';
        const quizAnswers: Record<string, string> = {};
        if (data.desiredAngle) quizAnswers.intent = data.desiredAngle;
        if (funnelSlug === 'attivazione') {
          if (data.symptomResponse) quizAnswers.symptom = data.symptomResponse;
          if (data.narrativeResponse) quizAnswers.narrative = data.narrativeResponse;
        }

        const insertPayload: Record<string, unknown> = {
          user_name: data.userName,
          birth_date: data.birthDate,
          birth_time: data.birthTime,
          birth_place: data.birthPlace,
          birth_lat: data.birthLat,
          birth_lng: data.birthLng,
          birth_timezone: data.birthTimezone,
          birth_timezone_iana: data.birthTimezoneIana,
          processing_status: 'pending',
          funnel_slug: funnelSlug,
          quiz_answers: quizAnswers,
          language: market.language,
          market: market.id,
        };
        if (funnelSlug === 'classica') {
          insertPayload.attachment_response = data.attachmentResponse;
          insertPayload.focus_area = data.focusArea;
        }

        const sessionId = await createQuizSession(insertPayload);

        if (!sessionId) {
          console.error('Session insert error');
          setReady(true);
          return;
        }

        sessionIdRef.current = sessionId;
        updateData({ sessionId });

        // Step 1: Trigger SERVER-SIDE background chart + insight generation.
        // We don't await its completion — we poll the DB instead, so the job
        // continues even if the user navigates away.
        supabase.functions
          .invoke('process-session-insights', { body: { sessionId } })
          .catch((e) => console.warn('[Processing] Failed to trigger background job:', e));

        // Step 3: Poll until insights are ready (or failed)
        const startedAt = Date.now();
        while (Date.now() - startedAt < HANDOFF_TIMEOUT_MS) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          const row = await fetchQuizSessionPublic(sessionId);

          if (row?.processing_status === 'insights_ready' && row.teaser_insights && row.natal_chart) {
            updateData({
              natalChart: row.natal_chart as any,
              natalChartSvg: (row as any).natal_chart_svg ?? null,
              teaserInsights: row.teaser_insights as { title: string; body: string }[],
            });
            setReady(true);
            return;
          }
          if (row?.processing_status === 'failed') {
            console.warn('[Processing] Background job marked failed; handing off to teaser');
            setReady(true);
            return;
          }
        }

        // Hand off to TeaserResult, which will keep polling.
        console.log('[Processing] Handoff timeout; teaser will continue polling');
        setReady(true);
      } catch (err) {
        console.error('Processing failed:', err);
        setReady(true);
      }
    };

    run();
  }, []);

  // Animation progression
  useEffect(() => {
    if (currentIndex < messages.length - 1) {
      const timer = setTimeout(() => setCurrentIndex((i) => i + 1), 2200);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setAnimationDone(true), 2200);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Navigate when both animation and data handoff are done. Buyers
  // purchasing for someone else skip the teaser and go straight to the
  // minimal checkout — they've already seen the product (they own a report).
  useEffect(() => {
    if (ready && animationDone) {
      navigate(data.subjectIsOther ? '/checkout' : '/teaser', { replace: true });
    }
  }, [ready, animationDone, navigate, data.subjectIsOther]);

  const progress = ((currentIndex + 1) / messages.length) * 100;
  const showWaiting = animationDone && !ready;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-12 text-center">
        <img src={market.logo} alt={market.siteName} className="h-8" />

        <div className="h-24 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={showWaiting ? 'waiting' : currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-foreground/80 text-sm leading-relaxed"
            >
              {showWaiting ? waitingMessage : messages[currentIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-center gap-2">
            {messages.map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                animate={{
                  backgroundColor: i <= currentIndex ? 'hsl(14, 45%, 38%)' : 'hsl(35, 12%, 90%)',
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Processing;
