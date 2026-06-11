import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import BirthDataFields, {
  buildInitialState,
  useResetOnOpen,
  validateBirthFields,
  type BirthDataFormState,
} from "./BirthDataFields";
import type {
  CreateReportPayload,
  CreateSynastryPayload,
  CreateTransitPayload,
} from "@/hooks/admin/useAdminMutations";
import type { QuizSessionDetail } from "@/hooks/admin/useAdminCustomerDetail";

type CreateKind = "natal" | "transit" | "synastry";

interface CreateReportDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmitNatal: (payload: CreateReportPayload) => void;
  onSubmitTransit: (payload: CreateTransitPayload) => void;
  onSubmitSynastry: (payload: CreateSynastryPayload) => void;
  busyNatal: boolean;
  busyTransit: boolean;
  busySynastry: boolean;
  prefilledEmail?: string;
  availableReports: QuizSessionDetail[];
}

export default function CreateReportDialog({
  open,
  onClose,
  onSubmitNatal,
  onSubmitTransit,
  onSubmitSynastry,
  busyNatal,
  busyTransit,
  busySynastry,
  prefilledEmail,
  availableReports,
}: CreateReportDialogProps) {
  const [kind, setKind] = useState<CreateKind>("natal");
  const busy = busyNatal || busyTransit || busySynastry;

  useEffect(() => {
    if (open) setKind("natal");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea nuovo</DialogTitle>
          <DialogDescription>
            Scegli il tipo di prodotto da generare per questo cliente.
          </DialogDescription>
        </DialogHeader>

        <KindSelector value={kind} onChange={setKind} disabled={busy} />

        {kind === "natal" && (
          <NatalForm
            open={open}
            busy={busyNatal}
            prefilledEmail={prefilledEmail}
            onCancel={onClose}
            onSubmit={onSubmitNatal}
          />
        )}
        {kind === "transit" && (
          <TransitForm
            busy={busyTransit}
            availableReports={availableReports}
            onCancel={onClose}
            onSubmit={onSubmitTransit}
          />
        )}
        {kind === "synastry" && (
          <SynastryForm
            open={open}
            busy={busySynastry}
            customerEmail={prefilledEmail}
            onCancel={onClose}
            onSubmit={onSubmitSynastry}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function KindSelector({
  value,
  onChange,
  disabled,
}: {
  value: CreateKind;
  onChange: (k: CreateKind) => void;
  disabled?: boolean;
}) {
  const options: { value: CreateKind; label: string; hint: string }[] = [
    { value: "natal", label: "Report natale", hint: "Crea una nuova quiz_session + report Gemini" },
    { value: "transit", label: "Transiti", hint: "Triggera un ciclo transiti su un report esistente" },
    { value: "synastry", label: "Sinastria coppia", hint: "Crea una sinastria con 2 set di dati di nascita" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`text-left rounded-xl border px-3 py-2.5 transition ${
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border hover:bg-accent/30"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <div className="font-medium text-sm">{opt.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{opt.hint}</div>
          </button>
        );
      })}
    </div>
  );
}

function NatalForm({
  open,
  busy,
  prefilledEmail,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  prefilledEmail?: string;
  onCancel: () => void;
  onSubmit: (payload: CreateReportPayload) => void;
}) {
  const [state, setState] = useResetOnOpen(open, () => buildInitialState());
  const [email, setEmail] = useState(prefilledEmail ?? "");

  useEffect(() => {
    if (open) setEmail(prefilledEmail ?? "");
  }, [open, prefilledEmail]);

  const handleSubmit = () => {
    if (!state.userName.trim()) {
      toast.error("Il nome è obbligatorio.");
      return;
    }
    const err = validateBirthFields(state, true);
    if (err) {
      toast.error(err);
      return;
    }
    if (!state.coords) {
      toast.error("Seleziona il luogo dalla lista per risolvere le coordinate.");
      return;
    }

    onSubmit({
      email: email.trim() || undefined,
      userName: state.userName.trim(),
      birthDate: {
        day: Number(state.day),
        month: Number(state.month),
        year: Number(state.year),
      },
      birthTime: {
        hour: Number(state.hour),
        minute: Number(state.minute),
      },
      birthPlace: state.place.trim(),
      birthLat: state.coords.lat,
      birthLng: state.coords.lng,
      birthTimezone: state.coords.tz,
      focusArea: state.focusArea.trim() || undefined,
      attachmentResponse: state.attachmentResponse.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Email cliente (opzionale)</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          placeholder="cliente@esempio.com"
        />
      </div>

      <BirthDataFields state={state} onChange={setState} disabled={busy} />

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Annulla
        </Button>
        <Button onClick={handleSubmit} disabled={busy} className="gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Crea report
        </Button>
      </DialogFooter>
    </div>
  );
}

function TransitForm({
  busy,
  availableReports,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  availableReports: QuizSessionDetail[];
  onCancel: () => void;
  onSubmit: (payload: CreateTransitPayload) => void;
}) {
  const eligible = availableReports.filter((qs) => qs.has_full_report);
  const [quizSessionId, setQuizSessionId] = useState<string>("");
  const [periodStart, setPeriodStart] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    if (eligible.length > 0 && !quizSessionId) {
      setQuizSessionId(eligible[0].id);
    }
  }, [eligible, quizSessionId]);

  const handleSubmit = () => {
    if (!quizSessionId) {
      toast.error("Seleziona un report natale esistente.");
      return;
    }
    if (!periodStart) {
      toast.error("Imposta la data di partenza dei transiti.");
      return;
    }
    onSubmit({ quizSessionId, periodStart });
  };

  if (eligible.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Nessun report natale completo trovato per questo cliente. I transiti
          richiedono un report natale già pronto: crea prima un report natale.
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Chiudi
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-3 text-xs text-muted-foreground">
        Verrà creato un entitlement comped + ciclo transiti per il report
        selezionato. Costo: chiamate freeastroapi + Gemini.
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Report natale</label>
        <select
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
          value={quizSessionId}
          onChange={(e) => setQuizSessionId(e.target.value)}
          disabled={busy}
        >
          {eligible.map((qs) => (
            <option key={qs.id} value={qs.id}>
              {qs.user_name ?? "—"} · {qs.birth_place ?? "—"} ·{" "}
              {new Date(qs.created_at).toLocaleDateString("it-IT")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Data di partenza</label>
        <Input
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          disabled={busy}
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">
          I transiti vengono calcolati a partire da questa data (default: oggi).
        </p>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Annulla
        </Button>
        <Button onClick={handleSubmit} disabled={busy} className="gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Crea transiti
        </Button>
      </DialogFooter>
    </div>
  );
}

function SynastryForm({
  open,
  busy,
  customerEmail,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  customerEmail?: string;
  onCancel: () => void;
  onSubmit: (payload: CreateSynastryPayload) => void;
}) {
  const [personA, setPersonA] = useResetOnOpen(open, () => buildInitialState());
  const [personB, setPersonB] = useResetOnOpen(open, () => buildInitialState());
  const [timeAKnown, setTimeAKnown] = useState(true);
  const [timeBKnown, setTimeBKnown] = useState(true);
  const [relationshipDuration, setRelationshipDuration] = useState("");

  useEffect(() => {
    if (open) {
      setTimeAKnown(true);
      setTimeBKnown(true);
      setRelationshipDuration("");
    }
  }, [open]);

  const validatePerson = (
    state: BirthDataFormState,
    timeKnown: boolean,
    label: string,
  ): string | null => {
    if (!state.userName.trim()) return `${label}: nome obbligatorio`;
    const day = Number(state.day);
    const month = Number(state.month);
    const year = Number(state.year);
    if (!day || day < 1 || day > 31) return `${label}: giorno non valido`;
    if (!month || month < 1 || month > 12) return `${label}: mese non valido`;
    if (!year || year < 1900 || year > 2100) return `${label}: anno non valido`;
    if (timeKnown) {
      const hour = Number(state.hour);
      const minute = Number(state.minute);
      if (Number.isNaN(hour) || hour < 0 || hour > 23) return `${label}: ora non valida`;
      if (Number.isNaN(minute) || minute < 0 || minute > 59) return `${label}: minuti non validi`;
    }
    if (!state.place.trim()) return `${label}: luogo di nascita richiesto`;
    if (!state.coords) return `${label}: seleziona il luogo dalla lista per le coordinate`;
    return null;
  };

  const handleSubmit = () => {
    if (!customerEmail) {
      toast.error("Manca l'email del cliente.");
      return;
    }
    const errA = validatePerson(personA, timeAKnown, "Persona A");
    if (errA) {
      toast.error(errA);
      return;
    }
    const errB = validatePerson(personB, timeBKnown, "Persona B");
    if (errB) {
      toast.error(errB);
      return;
    }

    onSubmit({
      customerEmail,
      relationshipDuration: relationshipDuration.trim() || undefined,
      personA: {
        name: personA.userName.trim(),
        birthDate: {
          day: Number(personA.day),
          month: Number(personA.month),
          year: Number(personA.year),
        },
        birthTime: timeAKnown
          ? { hour: Number(personA.hour), minute: Number(personA.minute) }
          : null,
        timeKnown: timeAKnown,
        birthPlace: personA.place.trim(),
        birthLat: personA.coords!.lat,
        birthLng: personA.coords!.lng,
        birthTimezone: personA.coords!.tz,
        birthTimezoneIana: personA.coords!.tzIana,
      },
      personB: {
        name: personB.userName.trim(),
        birthDate: {
          day: Number(personB.day),
          month: Number(personB.month),
          year: Number(personB.year),
        },
        birthTime: timeBKnown
          ? { hour: Number(personB.hour), minute: Number(personB.minute) }
          : null,
        timeKnown: timeBKnown,
        birthPlace: personB.place.trim(),
        birthLat: personB.coords!.lat,
        birthLng: personB.coords!.lng,
        birthTimezone: personB.coords!.tz,
        birthTimezoneIana: personB.coords!.tzIana,
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-3 text-xs text-muted-foreground">
        La sinastria sarà legata all'email{" "}
        <strong className="text-foreground break-all">{customerEmail ?? "—"}</strong> via
        checkout comped, così compare nel tab Coppia del cliente.
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Durata della relazione (opzionale)
        </label>
        <Input
          value={relationshipDuration}
          onChange={(e) => setRelationshipDuration(e.target.value)}
          disabled={busy}
          placeholder='es. "3 anni"'
        />
      </div>

      <div className="rounded-2xl border border-border p-4 space-y-4">
        <h4 className="font-display text-sm font-semibold">Persona A</h4>
        <BirthDataFields
          state={personA}
          onChange={setPersonA}
          disabled={busy}
          showFocus={false}
          showAttachment={false}
          nameLabel="Nome Persona A"
          namePlaceholder="Nome"
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={timeAKnown}
            onCheckedChange={(v) => setTimeAKnown(v === true)}
            disabled={busy}
          />
          Ora di nascita nota
        </label>
      </div>

      <div className="rounded-2xl border border-border p-4 space-y-4">
        <h4 className="font-display text-sm font-semibold">Persona B</h4>
        <BirthDataFields
          state={personB}
          onChange={setPersonB}
          disabled={busy}
          showFocus={false}
          showAttachment={false}
          nameLabel="Nome Persona B"
          namePlaceholder="Nome"
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={timeBKnown}
            onCheckedChange={(v) => setTimeBKnown(v === true)}
            disabled={busy}
          />
          Ora di nascita nota
        </label>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Annulla
        </Button>
        <Button onClick={handleSubmit} disabled={busy} className="gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Crea sinastria
        </Button>
      </DialogFooter>
    </div>
  );
}
