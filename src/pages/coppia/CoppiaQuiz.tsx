// Quiz sinastria di coppia: 6 step.
//
// Erano 9 schermate con un campo ciascuna. Una schermata per persona con nome,
// data, ora e luogo insieme sforava il viewport (anche e soprattutto sui telefoni
// piccoli) e scorreva proprio in mezzo alle ruote. Divisione attuale: le due
// schermate restano per persona (nome + data + luogo), l'ora va su una schermata
// sua con entrambe le persone. E' il campo che pesa di piu' ed e' quello che la
// gente spesso deve andare a cercare: chiederle insieme fa prendere la decisione
// "le sappiamo o no?" una volta sola.
//
//   1. Da quanto state insieme?        (card, auto-avanza) -> relationship_duration
//   2. Chi ha fatto il primo passo?    (card, auto-avanza) -> solo client, non salvata
//   3. I tuoi dati                     nome + data + luogo
//   4. Cosa vorreste capire di piu'?   (card, auto-avanza) -> focus_relational
//   5. I dati del/della partner        nome + data + luogo
//   6. Le ore di nascita               entrambe
//
// Chrome e interazioni allineati al quiz natale (src/pages/Quiz.tsx): Header con
// tasto indietro, ProgressBar, transizioni AnimatePresence, card che avanzano da
// sole al tap. Il bottone esplicito resta solo sulle schermate dati, cosi il
// calcolo non parte mai per un tap di troppo.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import PlaceAutocomplete, {
  type PlaceAutocompleteHandle,
} from '@/components/PlaceAutocomplete';
import {
  useSynastry,
  FirstMove,
  RelationshipDuration,
  SynastryPersonData,
  isBirthDateComplete,
  isBirthTimeComplete,
  markSynastryFunnelStage,
} from '@/context/SynastryContext';
import PickerField from '@/components/PickerField';
import { type WheelItem } from '@/components/WheelPicker';
import { useIsMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/i18n/I18nProvider';
import { ROUTES } from '@/lib/routes';

// Wheel options, built once. Wheels open centered on these anchors while unset.
// Minutes stay in 5-minute steps.
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

// 5 righe per ruota sono 200px l'una: con nome e luogo sulla stessa schermata
// sfora il viewport. A 3 righe sono 120px e ci sta tutto senza scroll.
const WHEEL_ROWS = 3;

// 'prefer_not_to_say' e' il valore che process-synastry-insights legge: la sua
// etichetta nel catalogo si chiama 'skip'.
const DURATION_IDS: RelationshipDuration[] = [
  'under_1y', '1_to_3y', '3_to_7y', '7_to_15y', 'over_15y', 'prefer_not_to_say',
];

const FIRST_MOVE_IDS: FirstMove[] = ['self', 'partner', 'neither'];

type StepKey = 'duration' | 'first_move' | 'person_a' | 'focus' | 'person_b' | 'times';

const STEPS: StepKey[] = ['duration', 'first_move', 'person_a', 'focus', 'person_b', 'times'];

// Domande a scelta singola: il tap salva e avanza da solo, senza bottone.
const AUTO_ADVANCE_STEPS: StepKey[] = ['duration', 'first_move', 'focus'];

function aOrB(step: StepKey): 'a' | 'b' | null {
  if (step === 'person_a') return 'a';
  if (step === 'person_b') return 'b';
  return null;
}

const optionCardClasses = (selected: boolean) =>
  `p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left ${
    selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
  }`;

export default function CoppiaQuiz() {
  const navigate = useNavigate();
  const { data, updatePersonA, updatePersonB, updateData } = useSynastry();
  const { m, market } = useI18n();
  const cq = m.coppia.quiz;
  const isMobile = useIsMobile();
  const MONTH_ITEMS: WheelItem[] = useMemo(
    () => m.quiz.months.map((label, i) => ({ value: i + 1, label: label.toLowerCase() })),
    [m.quiz.months],
  );
  const [step, setStep] = useState(1);
  const stepKey = STEPS[step - 1];
  const placeRef = useRef<PlaceAutocompleteHandle>(null);
  const [placeError, setPlaceError] = useState('');
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [placeText, setPlaceText] = useState('');

  useEffect(() => {
    document.title = m.coppia.titles.quiz(market.siteName);
    markSynastryFunnelStage('quiz');
  }, [m, market.siteName]);

  // Entrando in una schermata persona, sincronizza il testo del campo luogo con
  // il valore gia salvato nel context (es. tornando indietro).
  useEffect(() => {
    if (stepKey === 'person_a') setPlaceText(data.personA.birthPlace || '');
    else if (stepKey === 'person_b') setPlaceText(data.personB.birthPlace || '');
    setPlaceError('');
  }, [stepKey]);

  const which = aOrB(stepKey);
  const target: SynastryPersonData | null =
    which === 'a' ? data.personA : which === 'b' ? data.personB : null;
  const updateTarget = which === 'a' ? updatePersonA : updatePersonB;

  // Stessa regola di Quiz.tsx. Sulle ruote basta un gesto su una qualsiasi: le
  // altre valgono il valore che gia mostrano (handleNext lo scrive). Il <select>
  // desktop mostra '—' per un campo non scelto, quindi li' servono tutti.
  const dateIsValid = (d: SynastryPersonData['birthDate']) =>
    isMobile ? d.day != null || d.month != null || d.year != null : isBirthDateComplete(d);
  const timeIsValid = (p: SynastryPersonData) =>
    !p.timeKnown ||
    (isMobile
      ? p.birthTime.hour != null || p.birthTime.minute != null
      : isBirthTimeComplete(p.birthTime));

  const filledDate = (d: SynastryPersonData['birthDate']) => ({
    day: d.day ?? DAY_ANCHOR,
    month: d.month ?? MONTH_ANCHOR,
    year: d.year ?? YEAR_ANCHOR,
  });
  const filledTime = (t: SynastryPersonData['birthTime']) => ({
    hour: t.hour ?? HOUR_ANCHOR,
    minute: t.minute ?? MINUTE_ANCHOR,
  });

  const canContinue = (() => {
    if (stepKey === 'times') return timeIsValid(data.personA) && timeIsValid(data.personB);
    if (!target) return false;
    return (
      target.name.trim().length >= 2 &&
      dateIsValid(target.birthDate) &&
      placeText.trim().length > 2 &&
      !resolvingPlace
    );
  })();

  // Senza questa riga il bottone resta disabilitato senza dire perche', che e'
  // il dead click piu' frequente del funnel. Sulle ruote si chiede un gesto, sul
  // <select> di sceglierli tutti.
  const missingHint = (() => {
    if (stepKey === 'times') {
      if (timeIsValid(data.personA) && timeIsValid(data.personB)) return '';
      return isMobile ? cq.time.confirmHint : cq.missing.time;
    }
    if (target && !dateIsValid(target.birthDate)) {
      return isMobile ? cq.date.confirmHint : cq.missing.date;
    }
    return '';
  })();

  const handleNext = async () => {
    // Sulle schermate persona: prima di avanzare, garantisci che le coordinate
    // corrispondano al testo digitato (auto-resolve come fa Quiz.tsx).
    if (target) {
      const trimmedPlace = placeText.trim();
      const normalize = (s: string) => s.trim().toLowerCase();
      const hasCoords =
        target.birthLat != null &&
        target.birthLng != null &&
        normalize(target.birthPlace) === normalize(trimmedPlace) &&
        trimmedPlace.length >= 2;

      if (!hasCoords) {
        setPlaceError('');
        setResolvingPlace(true);
        const resolvedName = await placeRef.current?.resolve();
        setResolvingPlace(false);
        if (!resolvedName) {
          setPlaceError(cq.place.error);
          return;
        }
        setPlaceText(resolvedName);
        updateTarget({ birthPlace: resolvedName });
      } else {
        updateTarget({ birthPlace: trimmedPlace });
      }

      // Una ruota lasciata intatta vale il valore che mostra: va scritto prima
      // di avanzare, perche' useSynastrySession trasforma una data parziale in
      // null e la carta non verrebbe calcolata.
      updateTarget({ birthDate: filledDate(target.birthDate) });
    }

    if (stepKey === 'times') {
      if (data.personA.timeKnown) updatePersonA({ birthTime: filledTime(data.personA.birthTime) });
      if (data.personB.timeKnown) updatePersonB({ birthTime: filledTime(data.personB.birthTime) });
    }

    if (step === STEPS.length) {
      navigate(ROUTES.coupleProcessing);
      return;
    }
    setStep((s) => s + 1);
  };

  // Tap-to-advance delle card: salva la risposta e avanza dopo un attimo, cosi
  // l'evidenziazione della scelta si vede. Il passo e' condizionato a quello da
  // cui si parte: un secondo tap dentro i 180ms fa scattare due timer, e senza
  // la condizione il secondo salterebbe una domanda intera.
  const advanceFrom = (from: number, delayMs = 180) => {
    setTimeout(() => setStep((s) => (s === from ? from + 1 : s)), delayMs);
  };

  const nameA = data.personA.name.trim() || cq.times.you;
  const nameB = data.personB.name.trim() || cq.times.partner;

  const ctaLabel = resolvingPlace
    ? cq.resolving
    : step === STEPS.length
      ? cq.finalCta
      : cq.next;

  const helperText =
    stepKey === 'person_b'
      ? cq.helper.almostDone
      : stepKey === 'times'
        ? cq.helper.lastStep
        : undefined;

  const renderPersonStep = (person: SynastryPersonData) => (
    <>
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {which === 'a' ? cq.people.titleA : cq.people.titleB}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {which === 'a' ? cq.people.hintA : cq.people.hintB}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`coppia-name-${which}`} className="text-xs text-muted-foreground">
          {cq.people.nameLabel}
        </label>
        <input
          id={`coppia-name-${which}`}
          type="text"
          value={person.name}
          onChange={(e) => updateTarget({ name: e.target.value })}
          placeholder={which === 'a' ? cq.name.placeholderA : cq.name.placeholderB}
          className="h-12 w-full rounded-lg border border-input bg-background px-4 text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
        />
      </div>

      {/* Niente etichetta di gruppo "Data di nascita": Giorno/Mese/Anno la
          rendono ridondante, e sono 24px che servono altrove. */}
      <div className="grid grid-cols-3 gap-2">
        <PickerField
          label={cq.date.day}
          items={DAY_ITEMS}
          value={person.birthDate.day}
          anchor={DAY_ANCHOR}
          visibleCount={WHEEL_ROWS}
          onChange={(v) => updateTarget({ birthDate: { ...person.birthDate, day: v } })}
        />
        <PickerField
          label={cq.date.month}
          items={MONTH_ITEMS}
          value={person.birthDate.month}
          anchor={MONTH_ANCHOR}
          visibleCount={WHEEL_ROWS}
          onChange={(v) => updateTarget({ birthDate: { ...person.birthDate, month: v } })}
        />
        <PickerField
          label={cq.date.year}
          items={YEAR_ITEMS}
          value={person.birthDate.year}
          anchor={YEAR_ANCHOR}
          visibleCount={WHEEL_ROWS}
          onChange={(v) => updateTarget({ birthDate: { ...person.birthDate, year: v } })}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">{cq.people.placeLabel}</label>
        <PlaceAutocomplete
          ref={placeRef}
          value={placeText}
          onChange={(placeData) => {
            setPlaceText(placeData.name);
            setPlaceError('');
            updateTarget({
              birthPlace: placeData.name,
              birthLat: placeData.lat,
              birthLng: placeData.lng,
              birthTimezone: placeData.timezone,
              birthTimezoneIana: placeData.timezoneIana,
            });
          }}
          onTextChange={(t) => {
            setPlaceText(t);
            if (placeError) setPlaceError('');
          }}
          onClear={() => {
            if (
              person.birthLat != null ||
              person.birthLng != null ||
              person.birthTimezone != null ||
              person.birthTimezoneIana ||
              person.birthPlace
            ) {
              updateTarget({
                birthLat: null,
                birthLng: null,
                birthTimezone: null,
                birthTimezoneIana: null,
                birthPlace: '',
              });
            }
          }}
          placeholder={cq.place.placeholder}
        />
        {placeError ? (
          <p className="text-xs text-destructive">{placeError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{cq.place.suggestionHint}</p>
        )}
      </div>
    </>
  );

  const renderTimeRow = (
    person: SynastryPersonData,
    label: string,
    update: (updates: Partial<SynastryPersonData>) => void,
  ) => (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
        <label className="inline-flex shrink-0 items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={!person.timeKnown}
            onChange={(e) =>
              update({
                timeKnown: !e.target.checked,
                birthTime: e.target.checked ? { hour: null, minute: null } : person.birthTime,
              })
            }
          />
          {cq.time.unknownLabel}
        </label>
      </div>
      {person.timeKnown ? (
        <div className="grid grid-cols-2 gap-2">
          <PickerField
            label={cq.time.hour}
            items={HOUR_ITEMS}
            value={person.birthTime.hour}
            anchor={HOUR_ANCHOR}
            visibleCount={WHEEL_ROWS}
            onChange={(v) => update({ birthTime: { ...person.birthTime, hour: v } })}
          />
          <PickerField
            label={cq.time.minute}
            items={MINUTE_ITEMS}
            value={person.birthTime.minute}
            anchor={MINUTE_ANCHOR}
            visibleCount={WHEEL_ROWS}
            onChange={(v) => update({ birthTime: { ...person.birthTime, minute: v } })}
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{cq.time.unknownNote}</p>
      )}
    </div>
  );

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <Header
        backButton={
          step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label={cq.back}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          ) : undefined
        }
      />

      <div className="container max-w-md mx-auto flex-1 flex flex-col py-2 sm:py-4 min-h-0">
        <ProgressBar current={step} total={STEPS.length} label={helperText} />

        <div className="flex-1 flex items-center py-3 sm:py-6 min-h-0 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepKey}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-5"
            >
              {stepKey === 'duration' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-foreground leading-snug">
                    {cq.context.title}
                  </h2>
                  <div className="grid grid-cols-2 gap-2.5">
                    {DURATION_IDS.map((id) => (
                      <div
                        key={id}
                        className={`${optionCardClasses(data.relationshipDuration === id)} ${
                          id === 'prefer_not_to_say' ? 'col-span-2' : ''
                        }`}
                        onClick={() => {
                          updateData({ relationshipDuration: id });
                          advanceFrom(step);
                        }}
                      >
                        <p className="text-sm font-medium text-foreground">
                          {cq.context.durations[id === 'prefer_not_to_say' ? 'skip' : id]}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {stepKey === 'first_move' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-foreground leading-snug">
                    {cq.firstMove.question}
                  </h2>
                  <div className="space-y-2.5">
                    {FIRST_MOVE_IDS.map((id) => (
                      <div
                        key={id}
                        className={optionCardClasses(data.firstMove === id)}
                        onClick={() => {
                          updateData({ firstMove: id });
                          advanceFrom(step);
                        }}
                      >
                        <p className="text-sm font-medium text-foreground">{cq.firstMove.options[id]}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {stepKey === 'focus' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-foreground leading-snug">
                    {cq.focus.question}
                  </h2>
                  <div className="space-y-2.5">
                    {cq.focus.options.map((option) => (
                      <div
                        key={option}
                        className={optionCardClasses(data.focusRelational === option)}
                        onClick={() => {
                          updateData({ focusRelational: option });
                          advanceFrom(step);
                        }}
                      >
                        <p className="text-sm font-medium text-foreground">{option}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateData({ focusRelational: '' });
                      advanceFrom(step, 0);
                    }}
                    className="mx-auto block py-1 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    {cq.focus.skip}
                  </button>
                </>
              )}

              {stepKey === 'times' && (
                <>
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-foreground">
                      {cq.times.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">{cq.times.hint}</p>
                  </div>
                  {renderTimeRow(data.personA, nameA, updatePersonA)}
                  {renderTimeRow(data.personB, nameB, updatePersonB)}
                </>
              )}

              {target && renderPersonStep(target)}
            </motion.div>
          </AnimatePresence>
        </div>

        {!AUTO_ADVANCE_STEPS.includes(stepKey) && (
          <div className="pb-4 sm:pb-6 shrink-0">
            {missingHint && (
              <p className="pb-2 text-center text-xs text-muted-foreground">{missingHint}</p>
            )}
            <Button variant="premium" size="quiz" onClick={handleNext} disabled={!canContinue}>
              {ctaLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
