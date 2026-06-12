// Quiz sinastria di coppia: 1 campo per step, 9 step totali.
// Pattern allineato al Quiz natale (src/pages/Quiz.tsx): local state per i
// campi attivi, propagazione al SynastryContext via updatePersonA/B al "Avanti".
//
// Step:
//   1. Data di nascita A
//   2. Ora di nascita A (con checkbox "non la conosco")
//   3. Luogo di nascita A (PlaceAutocomplete via city-search IT-first)
//   4. Nome di A
//   5. Data di nascita B
//   6. Ora di nascita B
//   7. Luogo di nascita B
//   8. Nome di B
//   9. Contesto coppia (durata relazione opzionale)

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaceAutocomplete, {
  type PlaceAutocompleteHandle,
} from '@/components/PlaceAutocomplete';
import {
  useSynastry,
  RelationshipDuration,
  SynastryPersonData,
  markSynastryFunnelStage,
} from '@/context/SynastryContext';
import PickerField from '@/components/PickerField';
import { type WheelItem } from '@/components/WheelPicker';
import { useI18n } from '@/i18n/I18nProvider';

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

const DURATION_IDS: (RelationshipDuration | 'skip')[] = [
  'under_1y', '1_to_3y', '3_to_7y', '7_to_15y', 'over_15y', 'skip',
];

type StepKey =
  | 'date_a' | 'time_a' | 'place_a' | 'name_a'
  | 'date_b' | 'time_b' | 'place_b' | 'name_b'
  | 'context';

const STEPS: StepKey[] = [
  'date_a', 'time_a', 'place_a', 'name_a',
  'date_b', 'time_b', 'place_b', 'name_b',
  'context',
];

function aOrB(step: StepKey): 'a' | 'b' | null {
  if (step.endsWith('_a')) return 'a';
  if (step.endsWith('_b')) return 'b';
  return null;
}

export default function CoppiaQuiz() {
  const navigate = useNavigate();
  const { data, updatePersonA, updatePersonB, updateData } = useSynastry();
  const { m, market } = useI18n();
  const cq = m.coppia.quiz;
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

  // Quando entriamo in uno step "place", sincronizza il testo del campo con
  // il valore gia salvato nel context (es. tornando indietro).
  useEffect(() => {
    if (stepKey === 'place_a') setPlaceText(data.personA.birthPlace || '');
    else if (stepKey === 'place_b') setPlaceText(data.personB.birthPlace || '');
    setPlaceError('');
  }, [stepKey]);

  const which = aOrB(stepKey);
  const target: SynastryPersonData | null =
    which === 'a' ? data.personA : which === 'b' ? data.personB : null;
  const updateTarget = which === 'a' ? updatePersonA : updatePersonB;

  // Validazione del singolo step
  const canContinue = useMemo(() => {
    if (!target && stepKey !== 'context') return false;
    switch (stepKey) {
      case 'date_a':
      case 'date_b': {
        // The 1980 anchor is shown but never written to context (only a real
        // onChange persists), so a complete date implies a deliberate pick.
        const d = target!.birthDate;
        return d.day != null && d.month != null && d.year != null;
      }
      case 'time_a':
      case 'time_b': {
        if (!target!.timeKnown) return true; // skip ok
        const t = target!.birthTime;
        return t.hour != null && t.minute != null;
      }
      case 'place_a':
      case 'place_b':
        return placeText.trim().length > 2 && !resolvingPlace;
      case 'name_a':
      case 'name_b':
        return target!.name.trim().length >= 2;
      case 'context':
        return true; // contesto e' interamente opzionale
      default:
        return false;
    }
  }, [stepKey, target, placeText, resolvingPlace]);

  const handleNext = async () => {
    // PLACE step: prima di avanzare, garantisci che le coordinate corrispondano
    // al testo digitato (auto-resolve come fa Quiz.tsx).
    if ((stepKey === 'place_a' || stepKey === 'place_b') && target) {
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
    }

    // Step finale: vai a /coppia/processing
    if (step === STEPS.length) {
      navigate('/coppia/processing');
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-xl mx-auto px-4 pt-10 pb-24">
        {/* Indicatore step */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{cq.stepOf(step, STEPS.length)}</span>
            {which && (
              <span>
                {which === 'a' ? cq.personA : cq.personB}
              </span>
            )}
          </div>
          <div className="h-1 w-full bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP CONTENT */}
        {(stepKey === 'date_a' || stepKey === 'date_b') && target && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {which === 'a' ? cq.date.titleA : cq.date.titleB}
            </h2>
            <p className="text-sm text-muted-foreground">
              {cq.date.hint}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <PickerField
                label={cq.date.day}
                items={DAY_ITEMS}
                value={target.birthDate.day ?? null}
                anchor={DAY_ANCHOR}
                onChange={(v) => updateTarget({ birthDate: { ...target.birthDate, day: v } })}
              />
              <PickerField
                label={cq.date.month}
                items={MONTH_ITEMS}
                value={target.birthDate.month ?? null}
                anchor={MONTH_ANCHOR}
                onChange={(v) => updateTarget({ birthDate: { ...target.birthDate, month: v } })}
              />
              <PickerField
                label={cq.date.year}
                items={YEAR_ITEMS}
                value={target.birthDate.year ?? null}
                anchor={YEAR_ANCHOR}
                onChange={(v) => updateTarget({ birthDate: { ...target.birthDate, year: v } })}
              />
            </div>
          </div>
        )}

        {(stepKey === 'time_a' || stepKey === 'time_b') && target && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {which === 'a' ? cq.time.titleA : cq.time.titleB}
            </h2>
            <p className="text-sm text-muted-foreground">
              {cq.time.hint}
            </p>
            {target.timeKnown && (
              <div className="grid grid-cols-2 gap-2">
                <PickerField
                  label={cq.time.hour}
                  items={HOUR_ITEMS}
                  value={target.birthTime.hour ?? null}
                  anchor={HOUR_ANCHOR}
                  onChange={(v) => updateTarget({ birthTime: { ...target.birthTime, hour: v } })}
                />
                <PickerField
                  label={cq.time.minute}
                  items={MINUTE_ITEMS}
                  value={target.birthTime.minute ?? null}
                  anchor={MINUTE_ANCHOR}
                  onChange={(v) => updateTarget({ birthTime: { ...target.birthTime, minute: v } })}
                />
              </div>
            )}
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={!target.timeKnown}
                onChange={(e) =>
                  updateTarget({
                    timeKnown: !e.target.checked,
                    birthTime: e.target.checked
                      ? { hour: null, minute: null }
                      : target.birthTime,
                  })
                }
              />
              {cq.time.unknownLabel}
            </label>
            {!target.timeKnown && (
              <p className="text-xs text-muted-foreground">
                {cq.time.unknownNote}
              </p>
            )}
          </div>
        )}

        {(stepKey === 'place_a' || stepKey === 'place_b') && target && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {which === 'a' ? cq.place.titleA : cq.place.titleB}
            </h2>
            <p className="text-sm text-muted-foreground">
              {cq.place.hint}
            </p>
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
                  target.birthLat != null ||
                  target.birthLng != null ||
                  target.birthTimezone != null ||
                  target.birthTimezoneIana ||
                  target.birthPlace
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
              <p className="text-xs text-muted-foreground">
                {cq.place.suggestionHint}
              </p>
            )}
          </div>
        )}

        {(stepKey === 'name_a' || stepKey === 'name_b') && target && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {which === 'a' ? cq.name.titleA : cq.name.titleB}
            </h2>
            <p className="text-sm text-muted-foreground">
              {cq.name.hint}
            </p>
            <input
              type="text"
              value={target.name}
              onChange={(e) => updateTarget({ name: e.target.value })}
              placeholder={which === 'a' ? cq.name.placeholderA : cq.name.placeholderB}
              className="h-12 w-full rounded-lg border border-input bg-background px-4 text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              autoFocus
            />
          </div>
        )}

        {stepKey === 'context' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-1">
                {cq.context.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {cq.context.hint}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DURATION_IDS.map((id) => {
                const selected = id === 'skip'
                  ? data.relationshipDuration === 'prefer_not_to_say'
                  : data.relationshipDuration === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      updateData({
                        relationshipDuration: id === 'skip' ? 'prefer_not_to_say' : id,
                      })
                    }
                    className={`h-11 px-4 rounded-lg border text-sm text-left transition-colors ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background hover:bg-accent/30'
                    }`}
                  >
                    {cq.context.durations[id]}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                {cq.context.focusLabel}
              </label>
              <input
                type="text"
                value={data.focusRelational}
                onChange={(e) => updateData({ focusRelational: e.target.value })}
                placeholder={cq.context.focusPlaceholder}
                className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-4 text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        <div className="mt-10 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="h-11 px-5 rounded-lg border border-border text-sm hover:bg-accent/30"
            >
              {cq.back}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue}
            className="h-11 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {resolvingPlace
              ? cq.resolving
              : step === STEPS.length
                ? cq.finalCta
                : cq.next}
          </button>
        </div>
      </main>
    </div>
  );
}
