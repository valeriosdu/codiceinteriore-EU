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

const MONTHS_IT = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];

// Wheel options, built once. Wheels open centered on these anchors while unset.
// Minutes stay in 5-minute steps.
const pad2 = (n: number) => String(n).padStart(2, '0');
const DAY_ITEMS: WheelItem[] = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
const MONTH_ITEMS: WheelItem[] = MONTHS_IT.map((m, i) => ({ value: i + 1, label: m }));
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

const DURATION_OPTIONS: { id: RelationshipDuration | 'skip'; label: string }[] = [
  { id: 'under_1y', label: 'Meno di 1 anno' },
  { id: '1_to_3y', label: '1-3 anni' },
  { id: '3_to_7y', label: '3-7 anni' },
  { id: '7_to_15y', label: '7-15 anni' },
  { id: 'over_15y', label: 'Oltre 15 anni' },
  { id: 'skip', label: 'Preferisco non rispondere' },
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
  const [step, setStep] = useState(1);
  const stepKey = STEPS[step - 1];
  const placeRef = useRef<PlaceAutocompleteHandle>(null);
  const [placeError, setPlaceError] = useState('');
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [placeText, setPlaceText] = useState('');

  useEffect(() => {
    document.title = 'Sinastria di Coppia - Quiz | Codice Interiore';
    markSynastryFunnelStage('quiz');
  }, []);

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
          setPlaceError(
            "Non riusciamo a trovare questo luogo. Scegli un suggerimento dall'elenco.",
          );
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

  // Render labels dinamici (es. "nome del partner" oppure "nome di Anna")
  const personPossessive = (which: 'a' | 'b') => {
    if (which === 'a') return data.personA.name ? data.personA.name : 'tuo';
    return data.personB.name ? data.personB.name : 'del/della partner';
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-xl mx-auto px-4 pt-10 pb-24">
        {/* Indicatore step */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Passo {step} di {STEPS.length}</span>
            {which && (
              <span>
                {which === 'a' ? 'Persona 1 (te)' : 'Persona 2 (partner)'}
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
              {which === 'a' ? 'Quando sei nato/a' : 'Quando e nato/a il tuo partner'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Scorri per scegliere giorno, mese e anno.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <PickerField
                label="Giorno"
                items={DAY_ITEMS}
                value={target.birthDate.day ?? null}
                anchor={DAY_ANCHOR}
                onChange={(v) => updateTarget({ birthDate: { ...target.birthDate, day: v } })}
              />
              <PickerField
                label="Mese"
                items={MONTH_ITEMS}
                value={target.birthDate.month ?? null}
                anchor={MONTH_ANCHOR}
                onChange={(v) => updateTarget({ birthDate: { ...target.birthDate, month: v } })}
              />
              <PickerField
                label="Anno"
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
              {which === 'a' ? 'A che ora sei nato/a' : 'A che ora e nato/a il tuo partner'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Se non la conosci con precisione, indica l'orario piu vicino possibile,
              o spunta "non la conosco" qui sotto.
            </p>
            {target.timeKnown && (
              <div className="grid grid-cols-2 gap-2">
                <PickerField
                  label="Ora"
                  items={HOUR_ITEMS}
                  value={target.birthTime.hour ?? null}
                  anchor={HOUR_ANCHOR}
                  onChange={(v) => updateTarget({ birthTime: { ...target.birthTime, hour: v } })}
                />
                <PickerField
                  label="Minuti"
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
              Non la conosco
            </label>
            {!target.timeKnown && (
              <p className="text-xs text-muted-foreground">
                Senza l'ora la sinastria sara parziale per questa persona
                (niente case e ascendente). Procedi tranquillamente, il resto dell'analisi
                resta valido.
              </p>
            )}
          </div>
        )}

        {(stepKey === 'place_a' || stepKey === 'place_b') && target && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {which === 'a' ? 'Dove sei nato/a' : 'Dove e nato/a il tuo partner'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Citta. Inizia a digitare e scegli dai suggerimenti.
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
              placeholder="es. Milano, Roma, Napoli..."
            />
            {placeError ? (
              <p className="text-xs text-destructive">{placeError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Scegli un luogo dai suggerimenti per una lettura piu precisa.
              </p>
            )}
          </div>
        )}

        {(stepKey === 'name_a' || stepKey === 'name_b') && target && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {which === 'a' ? 'Come ti chiami' : 'Come si chiama il tuo partner'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Solo il nome di battesimo, lo useremo nel report.
            </p>
            <input
              type="text"
              value={target.name}
              onChange={(e) => updateTarget({ name: e.target.value })}
              placeholder={which === 'a' ? 'Il tuo nome' : 'Nome del partner'}
              className="h-12 w-full rounded-lg border border-input bg-background px-4 text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              autoFocus
            />
          </div>
        )}

        {stepKey === 'context' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-1">
                Da quanto state insieme?
              </h2>
              <p className="text-sm text-muted-foreground">
                Opzionale. Aiuta la lettura a calibrarsi sulla fase della relazione.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((opt) => {
                const selected = opt.id === 'skip'
                  ? data.relationshipDuration === 'prefer_not_to_say'
                  : data.relationshipDuration === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      updateData({
                        relationshipDuration: opt.id === 'skip' ? 'prefer_not_to_say' : opt.id,
                      })
                    }
                    className={`h-11 px-4 rounded-lg border text-sm text-left transition-colors ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background hover:bg-accent/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                Focus della lettura (opzionale)
              </label>
              <input
                type="text"
                value={data.focusRelational}
                onChange={(e) => updateData({ focusRelational: e.target.value })}
                placeholder="Es. capire le sfide, decidere se sposarci, sciogliere un blocco..."
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
              Indietro
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
              ? 'Verifico...'
              : step === STEPS.length
                ? 'Calcola la sinastria'
                : 'Avanti'}
          </button>
        </div>
      </main>
    </div>
  );
}
