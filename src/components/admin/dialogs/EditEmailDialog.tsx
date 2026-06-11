import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface EditEmailDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (vars: { userId: string; newEmail: string; sendRecovery: boolean }) => void;
  busy: boolean;
  userId: string;
  currentEmail: string;
}

export default function EditEmailDialog({
  open,
  onClose,
  onSubmit,
  busy,
  userId,
  currentEmail,
}: EditEmailDialogProps) {
  const [email, setEmail] = useState("");
  const [sendRecovery, setSendRecovery] = useState(true);

  useEffect(() => {
    if (open) {
      setEmail("");
      setSendRecovery(true);
    }
  }, [open]);

  const trimmed = email.trim().toLowerCase();
  const isValid = trimmed.includes("@") && trimmed.length > 3 && trimmed !== currentEmail.toLowerCase();

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({ userId, newEmail: trimmed, sendRecovery });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica email cliente</DialogTitle>
          <DialogDescription>
            L'email verra' aggiornata sia nell'account auth che nel profilo.
            L'email attuale e': <strong>{currentEmail}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-email">Nuova email</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="nuova@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={sendRecovery}
              onCheckedChange={(v) => setSendRecovery(v === true)}
              disabled={busy}
            />
            Invia link per impostare la password
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={busy || !isValid} className="gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Aggiorna email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
