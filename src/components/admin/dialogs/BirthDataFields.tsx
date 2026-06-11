import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import PlaceAutocomplete, {
  type PlaceAutocompleteHandle,
} from "@/components/PlaceAutocomplete";

export interface BirthDataFormState {
  userName: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  place: string;
  coords: { lat: number; lng: number; tz: number; tzIana?: string } | null;
  initialPlace: string; // per rilevare cambi di luogo
  focusArea: string;
  attachmentResponse: string;
}

export function buildInitialState(initial?: Partial<{
  userName: string;
  birthDate: { day?: number; month?: number; year?: number } | null;
  birthTime: { hour?: number; minute?: number } | null;
  birthPlace: string;
  birthLat: number;
  birthLng: number;
  birthTimezone: number;
  focusArea: string;
  attachmentResponse: string;
}>): BirthDataFormState {
  return {
    userName: initial?.userName ?? "",
    day: initial?.birthDate?.day != null ? String(initial.birthDate.day) : "",
    month: initial?.birthDate?.month != null ? String(initial.birthDate.month) : "",
    year: initial?.birthDate?.year != null ? String(initial.birthDate.year) : "",
    hour: initial?.birthTime?.hour != null ? String(initial.birthTime.hour) : "",
    minute: initial?.birthTime?.minute != null ? String(initial.birthTime.minute) : "",
    place: initial?.birthPlace ?? "",
    initialPlace: initial?.birthPlace ?? "",
    coords:
      initial?.birthLat != null && initial?.birthLng != null && initial?.birthTimezone != null
        ? { lat: initial.birthLat, lng: initial.birthLng, tz: initial.birthTimezone }
        : null,
    focusArea: initial?.focusArea ?? "",
    attachmentResponse: initial?.attachmentResponse ?? "",
  };
}

interface BirthDataFieldsProps {
  state: BirthDataFormState;
  onChange: (
    next:
      | BirthDataFormState
      | ((prev: BirthDataFormState) => BirthDataFormState),
  ) => void;
  disabled?: boolean;
  showFocus?: boolean;
  showAttachment?: boolean;
  nameLabel?: string;
  namePlaceholder?: string;
}

export default function BirthDataFields({
  state,
  onChange,
  disabled,
  showFocus = true,
  showAttachment = true,
  nameLabel = "Nome",
  namePlaceholder = "Nome del cliente",
}: BirthDataFieldsProps) {
  const placeRef = useRef<PlaceAutocompleteHandle>(null);
  // Versione funzionale: PlaceAutocomplete.handleChange chiama onTextChange e
  // onClear in rapida successione. Con la forma "valore" (onChange({...state,
  // ...patch})), entrambe le invocazioni leggono lo `state` chiuso allo stesso
  // render e la seconda sovrascrive la prima — risultato: il carattere appena
  // digitato sparisce.
  const update = (patch: Partial<BirthDataFormState>) =>
    onChange((prev) => ({ ...prev, ...patch }));

  const placeChanged = state.place.trim() !== state.initialPlace.trim();

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">{nameLabel}</label>
        <Input
          value={state.userName}
          onChange={(e) => update({ userName: e.target.value })}
          disabled={disabled}
          placeholder={namePlaceholder}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Giorno</label>
          <Input
            type="number"
            min={1}
            max={31}
            value={state.day}
            onChange={(e) => update({ day: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Mese</label>
          <Input
            type="number"
            min={1}
            max={12}
            value={state.month}
            onChange={(e) => update({ month: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Anno</label>
          <Input
            type="number"
            min={1900}
            max={2100}
            value={state.year}
            onChange={(e) => update({ year: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Ora</label>
          <Input
            type="number"
            min={0}
            max={23}
            value={state.hour}
            onChange={(e) => update({ hour: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Minuti</label>
          <Input
            type="number"
            min={0}
            max={59}
            value={state.minute}
            onChange={(e) => update({ minute: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Luogo di nascita</label>
        <PlaceAutocomplete
          ref={placeRef}
          value={state.place}
          onChange={(p) =>
            update({
              place: p.name,
              coords: {
                lat: p.lat,
                lng: p.lng,
                tz: p.timezone,
                tzIana: p.timezoneIana,
              },
            })
          }
          onTextChange={(t) => update({ place: t })}
          onClear={() => update({ coords: null })}
          placeholder="Cerca città..."
        />
        {placeChanged && (
          <p className="text-[11px] text-amber-700">
            {state.coords
              ? "Coordinate risolte — verranno salvate."
              : "Seleziona la città dalla lista per ottenere le coordinate."}
          </p>
        )}
      </div>

      {showFocus && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Area di focus</label>
          <Input
            value={state.focusArea}
            onChange={(e) => update({ focusArea: e.target.value })}
            disabled={disabled}
          />
        </div>
      )}

      {showAttachment && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Reazione all'ambiguità</label>
          <Input
            value={state.attachmentResponse}
            onChange={(e) => update({ attachmentResponse: e.target.value })}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

export function validateBirthFields(state: BirthDataFormState, requirePlace = true): string | null {
  const day = Number(state.day);
  const month = Number(state.month);
  const year = Number(state.year);
  if (!day || day < 1 || day > 31) return "Giorno non valido";
  if (!month || month < 1 || month > 12) return "Mese non valido";
  if (!year || year < 1900 || year > 2100) return "Anno non valido";
  const hour = Number(state.hour);
  const minute = Number(state.minute);
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return "Ora non valida";
  if (Number.isNaN(minute) || minute < 0 || minute > 59) return "Minuti non validi";
  if (requirePlace && !state.place.trim()) return "Luogo di nascita richiesto";
  if (requirePlace && state.place.trim() !== state.initialPlace.trim() && !state.coords) {
    return "Seleziona la nuova città dalla lista per risolvere le coordinate";
  }
  return null;
}

export function useResetOnOpen(open: boolean, factory: () => BirthDataFormState) {
  const [state, setState] = useState<BirthDataFormState>(factory);
  useEffect(() => {
    if (open) setState(factory());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return [state, setState] as const;
}
