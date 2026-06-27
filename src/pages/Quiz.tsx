import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuiz } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import ProgressBar from '@/components/ProgressBar';
import PlaceAutocomplete, { type PlaceAutocompleteHandle } from '@/components/PlaceAutocomplete';
import Header from '@/components/Header';
import { trackEvent } from '@/lib/analytics';
import PickerField from '@/components/PickerField';
import { type WheelItem } from '@/components/WheelPicker';
import { useI18n } from '@/i18n/I18nProvider';

// Wheel options, built once. The wheels open centered on these anchors while the
// field is still unset (birth year ~1980, mid-day/month/hour), then the user
// swipes to their value. Minutes stay in 5-minute steps.
const pad2 = (n: number) => String(n).padStart(2, '0');
const DAY_ITEMS: WheelItem[] = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
const YEAR_ITEMS: WheelItem[] = (() => {
  const current = new Date().getFullYear();
  return Array.from({ length: current - 1920 + 1 }, (_, i) => {
    const y = current - i;
    return { value: y, label: String(y) };
  });
})();
const HOUR_ITEMS: WheelItem[] = Array.from({ length: 24 }, (_, i) => ({ value: i, label: pad2(i) }));
const MINUTE_ITEMS: WheelItem[] = Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: pad2(i * 5) }));

const DAY_ANCHOR = 15;
const MONTH_ANCHOR = 6;
const YEAR_ANCHOR = 1980;
const HOUR_ANCHOR = 12;
const MINUTE_ANCHOR = 0;

type StepKey =
  | 'intent'
  | 'attachment'
  | 'symptom'
  | 'narrative'
  | 'date'
  | 'time'
  | 'place'
  | 'focus'
  | 'name';
// Default self-flow (attachment+focus, the "classica"/relazioni angle). The
// generic discovery landing (the homepage /) prepends 'intent' via ?discover=1.
// Angle-targeted landings (e.g. /lp/classica = relazioni) keep this flow without
// the intent question — the angle is implied by the URL.
const FULL_STEPS: StepKey[] = ['attachment', 'date', 'time', 'place', 'focus', 'name'];
// Attivazione angle (/lp/attivazione, ?funnel=attivazione). Replaces classica's
// attachment+focus with two angle-specific questions: sintomo (opening) and
// narrazione (penultimate). Skeleton steps in the middle are identical.
const ATTIVAZIONE_STEPS: StepKey[] = ['symptom', 'date', 'time', 'place', 'narrative', 'name'];
const GIFT_STEPS: StepKey[] = ['date', 'time', 'place', 'name'];

// Single-select "card" questions: tapping an answer commits and advances on its
// own, with no Continua button. These are the opening and closing questions of
// each funnel (the only steps rendered as answer boxes).
const AUTO_ADVANCE_STEPS: StepKey[] = ['intent', 'attachment', 'symptom', 'narrative', 'focus'];

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { data, updateData, resetQuizForNewPurchase } = useQuiz();
  const { m } = useI18n();
  const q = m.quiz;
  const MONTH_ITEMS: WheelItem[] = useMemo(
    () => q.months.map((monthLabel, i) => ({ value: i + 1, label: monthLabel })),
    [q.months],
  );

  // The /regalo route is the public entry point for the gift flow (e.g. shared
  // via email or campaigns). We reset on mount to make sure no leftover quiz
  // data from a previous in-progress session leaks into the new gift purchase.
  const isGiftRoute = location.pathname === '/regalo';
  useEffect(() => {
    if (isGiftRoute && !data.subjectIsOther) {
      resetQuizForNewPurchase();
    }
  }, [isGiftRoute]);

  // When the buyer is purchasing for someone else (entered via /regalo or
  // the "Acquista una nuova lettura" CTA on /report), the two contextual
  // questions (attachment, focus) are skipped — the buyer doesn't know how
  // the gift recipient would answer. natal chart calc is unaffected; LLM
  // prompts already fall back to "non fornita" when these fields are null.
  const forOther = data.subjectIsOther || isGiftRoute;
  const isDiscovery = searchParams.get('discover') === '1';
  const funnelParam = searchParams.get('funnel');
  const isAttivazione = funnelParam === 'attivazione';
  const STEPS: StepKey[] = forOther
    ? GIFT_STEPS
    : isAttivazione
      ? ATTIVAZIONE_STEPS
      : (isDiscovery ? ['intent', ...FULL_STEPS] : FULL_STEPS);
  const TOTAL_STEPS = STEPS.length;

  const initialStep = (() => {
    const s = parseInt(searchParams.get('step') || '1', 10);
    return s >= 1 && s <= TOTAL_STEPS ? s : 1;
  })();
  const [step, setStep] = useState(initialStep);
  const stepKey = STEPS[step - 1];

  // Local state
  const [intent, setIntent] = useState(data.desiredAngle || '');
  const [attachment, setAttachment] = useState(data.attachmentResponse || '');
  const [symptom, setSymptom] = useState(data.symptomResponse || '');
  const [narrative, setNarrative] = useState(data.narrativeResponse || '');
  // 0 / -1 = not picked yet. The wheels open on their anchor while unset, but
  // these only become valid once the user actually swipes/taps the wheel.
  const [day, setDay] = useState<number>(data.birthDate?.day || 0);
  const [month, setMonth] = useState<number>(data.birthDate?.month || 0);
  const [year, setYear] = useState<number>(data.birthDate?.year || 0);
  const [hour, setHour] = useState<number>(data.birthTime?.hour ?? -1);
  const [minute, setMinute] = useState<number>(data.birthTime?.minute ?? -1);
  const [place, setPlace] = useState(data.birthPlace || '');
  const [focus, setFocus] = useState(data.focusArea || '');
  const [userName, setUserName] = useState(data.userName || '');
  const [placeError, setPlaceError] = useState<string>('');
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const placeRef = useRef<PlaceAutocompleteHandle>(null);

  useEffect(() => {
    trackEvent('quiz_started', { initial_step: initialStep, for_other: forOther }, { once: true });
  }, [initialStep, forOther]);

  // Mirror the URL-derived angle into QuizContext so Processing.tsx can read
  // it when creating the session row. URL param is the source of truth; this
  // hook just persists it across the navigation chain (/quiz → /processing).
  useEffect(() => {
    const slug = isAttivazione ? 'attivazione' : 'classica';
    if (data.funnelSlug !== slug) {
      updateData({ funnelSlug: slug });
    }
  }, [isAttivazione]);

  const helperTextFor = (key: StepKey): string => {
    if (key === 'focus') return q.helper.focus;
    if (key === 'name') return q.helper.name;
    return '';
  };

  const canContinue = () => {
    switch (stepKey) {
      case 'intent': return intent !== '';
      case 'attachment': return attachment !== '';
      case 'symptom': return symptom !== '';
      case 'narrative': return narrative !== '';
      case 'date': return day > 0 && month > 0 && year > 0;
      case 'time': return hour >= 0 && minute >= 0;
      case 'place': return place.trim().length > 2 && !resolvingPlace;
      case 'focus': return focus !== '';
      case 'name': return userName.trim().length > 1;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (stepKey === 'intent') {
      updateData({ desiredAngle: intent });
      trackEvent('quiz_intent_selected', { angle: intent });
    } else if (stepKey === 'attachment') {
      updateData({ attachmentResponse: attachment });
    } else if (stepKey === 'symptom') {
      updateData({ symptomResponse: symptom });
    } else if (stepKey === 'narrative') {
      updateData({ narrativeResponse: narrative });
    } else if (stepKey === 'date') {
      updateData({ birthDate: { day, month, year } });
    } else if (stepKey === 'time') {
      updateData({ birthTime: { hour, minute } });
    } else if (stepKey === 'place') {
      // Ensure coordinates match the currently typed place name. Auto-resolve if needed.
      const trimmedPlace = place.trim();
      const normalize = (s: string) => s.trim().toLowerCase();
      const hasCoords =
        data.birthLat != null &&
        data.birthLng != null &&
        normalize(data.birthPlace) === normalize(trimmedPlace) &&
        trimmedPlace.length >= 2;

      if (!hasCoords) {
        setPlaceError('');
        setResolvingPlace(true);
        const resolvedName = await placeRef.current?.resolve();
        setResolvingPlace(false);
        if (!resolvedName) {
          setPlaceError(q.steps.place.error);
          return;
        }
        // resolve() updated the input text and QuizContext via onChange.
        // Sync local `place` so the displayed text matches the actual coords.
        setPlace(resolvedName);
        updateData({ birthPlace: resolvedName });
      } else {
        updateData({ birthPlace: trimmedPlace });
      }
    } else if (stepKey === 'focus') {
      updateData({ focusArea: focus });
    } else if (stepKey === 'name') {
      updateData({ userName });
      trackEvent('quiz_completed', { for_other: forOther });
      navigate('/processing');
      return;
    }
    setStep(s => s + 1);
  };

  // Tap-to-advance for the card questions: persist the picked answer, then move
  // on after a short beat so the selection highlight is visible. Reads the value
  // directly (state setters are async) so the commit never lags a render.
  const handleOptionSelect = (value: string) => {
    switch (stepKey) {
      case 'intent':
        setIntent(value);
        updateData({ desiredAngle: value });
        trackEvent('quiz_intent_selected', { angle: value });
        break;
      case 'attachment':
        setAttachment(value);
        updateData({ attachmentResponse: value });
        break;
      case 'symptom':
        setSymptom(value);
        updateData({ symptomResponse: value });
        break;
      case 'narrative':
        setNarrative(value);
        updateData({ narrativeResponse: value });
        break;
      case 'focus':
        setFocus(value);
        updateData({ focusArea: value });
        break;
      default:
        return;
    }
    setTimeout(() => setStep(s => s + 1), 180);
  };

  const optionCardClasses = (selected: boolean) =>
    `p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left ${
      selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
    }`;

  const ctaLabel =
    stepKey === 'name'
      ? (forOther ? q.cta.toPayment : q.cta.seeReading)
      : stepKey === 'place' && resolvingPlace
        ? q.cta.resolvingPlace
        : q.cta.continue;

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <Header backButton={step > 1 ? (
        <button
          onClick={() => setStep(s => s - 1)}
          className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={q.back}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      ) : undefined} />

      <div className="container max-w-md mx-auto flex-1 flex flex-col py-2 sm:py-4 min-h-0">
        <ProgressBar current={step} total={TOTAL_STEPS} label={helperTextFor(stepKey) || undefined} />

        <div className="flex-1 flex items-center py-3 sm:py-8 min-h-0 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepKey}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-6"
            >
              {stepKey === 'intent' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-foreground leading-snug">
                    {q.steps.intent.question}
                  </h2>
                  <div className="space-y-3">
                    {q.steps.intent.options.map(option => (
                      <div
                        key={option}
                        className={optionCardClasses(intent === option)}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <p className="text-sm font-medium text-foreground">{option}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {stepKey === 'attachment' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-foreground leading-snug">
                    {forOther ? q.steps.attachment.question.other : q.steps.attachment.question.self}
                  </h2>
                  <div className="space-y-3">
                    {(forOther
                      ? q.steps.attachment.options.other
                      : q.steps.attachment.options.self
                    ).map(option => (
                      <div
                        key={option}
                        className={optionCardClasses(attachment === option)}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <p className="text-sm font-medium text-foreground">{option}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {stepKey === 'symptom' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-foreground leading-snug">
                    {q.steps.symptom.question}
                  </h2>
                  <div className="space-y-3">
                    {q.steps.symptom.options.map(option => (
                      <div
                        key={option}
                        className={optionCardClasses(symptom === option)}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <p className="text-sm font-medium text-foreground">{option}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {stepKey === 'narrative' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-foreground leading-snug">
                    {q.steps.narrative.question}
                  </h2>
                  <div className="space-y-3">
                    {q.steps.narrative.options.map(option => (
                      <div
                        key={option}
                        className={optionCardClasses(narrative === option)}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <p className="text-sm font-medium text-foreground">{option}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {stepKey === 'date' && (
                <>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {forOther ? q.steps.date.title.other : q.steps.date.title.self}
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    <PickerField label={q.steps.date.day} items={DAY_ITEMS} value={day || null} anchor={DAY_ANCHOR} onChange={setDay} />
                    <PickerField label={q.steps.date.month} items={MONTH_ITEMS} value={month || null} anchor={MONTH_ANCHOR} onChange={setMonth} />
                    <PickerField label={q.steps.date.year} items={YEAR_ITEMS} value={year || null} anchor={YEAR_ANCHOR} onChange={setYear} />
                  </div>
                </>
              )}

              {stepKey === 'time' && (
                <>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {forOther ? q.steps.time.title.other : q.steps.time.title.self}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <PickerField label={q.steps.time.hour} items={HOUR_ITEMS} value={hour >= 0 ? hour : null} anchor={HOUR_ANCHOR} onChange={setHour} />
                    <PickerField label={q.steps.time.minute} items={MINUTE_ITEMS} value={minute >= 0 ? minute : null} anchor={MINUTE_ANCHOR} onChange={setMinute} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {q.steps.time.hint}
                  </p>
                </>
              )}

              {stepKey === 'place' && (
                <>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {forOther ? q.steps.place.title.other : q.steps.place.title.self}
                  </h2>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">{q.steps.place.label}</label>
                    <PlaceAutocomplete
                      ref={placeRef}
                      value={place}
                      onChange={(placeData) => {
                        setPlace(placeData.name);
                        setPlaceError('');
                        updateData({
                          birthLat: placeData.lat,
                          birthLng: placeData.lng,
                          birthTimezone: placeData.timezone,
                          birthTimezoneIana: placeData.timezoneIana,
                        });
                      }}
                      onTextChange={(t) => {
                        setPlace(t);
                        if (placeError) setPlaceError('');
                      }}
                      onClear={() => {
                        // Typed text diverged from the last confirmed pick — drop stale coords
                        // so the next "Continua" forces a fresh resolve.
                        if (
                          data.birthLat != null ||
                          data.birthLng != null ||
                          data.birthTimezone != null ||
                          data.birthPlace
                        ) {
                          updateData({
                            birthLat: null,
                            birthLng: null,
                            birthTimezone: null,
                            birthTimezoneIana: null,
                            birthPlace: '',
                          });
                        }
                      }}
                      onEnter={() => { if (canContinue()) handleNext(); }}
                      placeholder={q.steps.place.placeholder}
                    />
                    {placeError ? (
                      <p className="text-xs text-destructive">{placeError}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {q.steps.place.hint}
                      </p>
                    )}
                  </div>
                </>
              )}

              {stepKey === 'focus' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-foreground leading-snug">
                    {forOther ? q.steps.focus.question.other : q.steps.focus.question.self}
                  </h2>
                  <div className="space-y-3">
                    {(forOther
                      ? q.steps.focus.options.other
                      : q.steps.focus.options.self
                    ).map(option => (
                      <div
                        key={option}
                        className={optionCardClasses(focus === option)}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <p className="text-sm font-medium text-foreground">{option}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {stepKey === 'name' && (
                <>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {forOther ? q.steps.name.title.other : q.steps.name.title.self}
                  </h2>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">{q.steps.name.label}</label>
                    <input
                      type="text"
                      enterKeyHint="go"
                      className="h-12 w-full rounded-lg border border-input bg-background px-4 text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                      placeholder={q.steps.name.placeholder}
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (canContinue()) handleNext();
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {forOther ? q.steps.name.hint.other : q.steps.name.hint.self}
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {!AUTO_ADVANCE_STEPS.includes(stepKey) && (
          <div className="pb-4 sm:pb-8 shrink-0">
            <Button
              variant="premium"
              size="quiz"
              onClick={handleNext}
              disabled={!canContinue()}
            >
              {ctaLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
