import { useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
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
import { toast } from "sonner";
import BirthDataFields, {
  buildInitialState,
  useResetOnOpen,
  validateBirthFields,
} from "./BirthDataFields";
import type { CreateCustomerPayload } from "@/hooks/admin/useAdminMutations";

interface CreateCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCustomerPayload) => void;
  busy: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateCustomerDialog({
  open,
  onClose,
  onSubmit,
  busy,
}: CreateCustomerDialogProps) {
  const [state, setState] = useResetOnOpen(open, () => buildInitialState());
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (open) setEmail("");
  }, [open]);

  const handleSubmit = () => {
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      toast.error("Inserisci un'email valida.");
      return;
    }
    if (!state.userName.trim()) {
      toast.error("Il nome è obbligatorio.");
      return;
    }

    // Birth data is optional, but if the admin started entering it we require the
    // complete set (and resolved coordinates) so the draft can be generated later.
    const hasAnyBirth =
      state.day.trim() !== "" ||
      state.month.trim() !== "" ||
      state.year.trim() !== "" ||
      state.hour.trim() !== "" ||
      state.minute.trim() !== "" ||
      state.place.trim() !== "";

    const payload: CreateCustomerPayload = {
      email: trimmedEmail,
      userName: state.userName.trim(),
    };

    if (hasAnyBirth) {
      const err = validateBirthFields(state, true);
      if (err) {
        toast.error(err);
        return;
      }
      if (!state.coords) {
        toast.error("Seleziona il luogo dalla lista per risolvere le coordinate.");
        return;
      }
      payload.birthDate = {
        day: Number(state.day),
        month: Number(state.month),
        year: Number(state.year),
      };
      payload.birthTime = {
        hour: Number(state.hour),
        minute: Number(state.minute),
      };
      payload.birthPlace = state.place.trim();
      payload.birthLat = state.coords.lat;
      payload.birthLng = state.coords.lng;
      payload.birthTimezone = state.coords.tz;
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nuovo cliente
          </DialogTitle>
          <DialogDescription>
            Registra un cliente in anagrafica. I dati di nascita sono opzionali.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Email cliente</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              placeholder="cliente@esempio.com"
            />
          </div>

          <BirthDataFields
            state={state}
            onChange={setState}
            disabled={busy}
            showFocus={false}
            showAttachment={false}
          />

          <div className="rounded-xl border border-border bg-surface p-3 text-xs text-muted-foreground">
            Non verrà generato nessun report adesso (nessun costo Gemini). Potrai
            generarlo dalla scheda cliente quando vuoi.
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={busy} className="gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Crea cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
