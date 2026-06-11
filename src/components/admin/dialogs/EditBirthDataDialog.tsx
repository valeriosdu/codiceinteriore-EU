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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState } from "react";
import BirthDataFields, {
  buildInitialState,
  useResetOnOpen,
  validateBirthFields,
  type BirthDataFormState,
} from "./BirthDataFields";
import type { QuizSessionDetail } from "@/hooks/admin/useAdminCustomerDetail";
import type { BirthDataUpdate } from "@/hooks/admin/useAdminMutations";

interface EditBirthDataDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (vars: { quizSessionId: string } & BirthDataUpdate) => void;
  busy: boolean;
  quiz: QuizSessionDetail | null;
}

export default function EditBirthDataDialog({
  open,
  onClose,
  onSubmit,
  busy,
  quiz,
}: EditBirthDataDialogProps) {
  const [state, setState] = useResetOnOpen(open, () =>
    buildInitialState({
      userName: quiz?.user_name ?? "",
      birthDate: quiz?.birth_date,
      birthTime: quiz?.birth_time,
      birthPlace: quiz?.birth_place ?? "",
      birthLat: quiz?.birth_lat ?? undefined,
      birthLng: quiz?.birth_lng ?? undefined,
      birthTimezone: undefined,
      focusArea: quiz?.focus_area ?? "",
    }),
  );
  const [regenerateTransits, setRegenerateTransits] = useState(true);

  if (!quiz) return null;

  const handleSubmit = () => {
    const err = validateBirthFields(state, /* requirePlace */ true);
    if (err) {
      toast.error(err);
      return;
    }

    const payload: { quizSessionId: string } & BirthDataUpdate = {
      quizSessionId: quiz.id,
      userName: state.userName.trim() || undefined,
      focusArea: state.focusArea.trim() || undefined,
      attachmentResponse: state.attachmentResponse.trim() || undefined,
      birthDate: {
        day: Number(state.day),
        month: Number(state.month),
        year: Number(state.year),
      },
      birthTime: {
        hour: Number(state.hour),
        minute: Number(state.minute),
      },
      includeTransits: regenerateTransits,
    };

    const placeChanged = state.place.trim() !== state.initialPlace.trim();
    if (placeChanged && state.coords) {
      payload.birthPlace = state.place.trim();
      payload.birthLat = state.coords.lat;
      payload.birthLng = state.coords.lng;
      payload.birthTimezone = state.coords.tz;
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifica dati di nascita</DialogTitle>
          <DialogDescription>
            Salvando, il report verrà rigenerato automaticamente. Costo: nuove chiamate
            a freeastroapi + Gemini.
          </DialogDescription>
        </DialogHeader>

        <BirthDataFields state={state} onChange={setState} disabled={busy} />

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={regenerateTransits}
            onCheckedChange={(v) => setRegenerateTransits(v === true)}
            disabled={busy}
          />
          Rigenera anche cicli transiti
        </label>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={busy} className="gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Salva e rigenera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
