import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
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

interface MergeCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (vars: { primaryEmail: string; secondaryEmail: string; note?: string }) => void;
  busy: boolean;
  /** Email del cliente attualmente aperto. */
  currentEmail: string;
}

export default function MergeCustomerDialog({
  open,
  onClose,
  onSubmit,
  busy,
  currentEmail,
}: MergeCustomerDialogProps) {
  const [otherEmail, setOtherEmail] = useState("");
  const [note, setNote] = useState("");
  // Quale tenere come principale: per default quella attualmente aperta.
  const [currentIsPrimary, setCurrentIsPrimary] = useState(true);

  useEffect(() => {
    if (open) {
      setOtherEmail("");
      setNote("");
      setCurrentIsPrimary(true);
    }
  }, [open]);

  const current = currentEmail.trim().toLowerCase();
  const other = otherEmail.trim().toLowerCase();
  const isValid = other.includes("@") && other.length > 3 && other !== current;

  const primaryEmail = currentIsPrimary ? current : other;
  const secondaryEmail = currentIsPrimary ? other : current;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({ primaryEmail, secondaryEmail, note: note.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unisci con un altro cliente</DialogTitle>
          <DialogDescription>
            Usa questa funzione solo se hai verificato che si tratta della{" "}
            <strong>stessa persona</strong>. Tutti i report, pagamenti e transiti
            delle due email verranno mostrati come un unico cliente. L'operazione è
            reversibile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="other-email">Altra email da unire</Label>
            <Input
              id="other-email"
              type="email"
              placeholder="altra@email.com"
              value={otherEmail}
              onChange={(e) => setOtherEmail(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Email principale (il login da tenere)</Label>
            <div className="grid gap-2">
              <label className="flex items-start gap-2 rounded-md border border-border p-2 text-sm">
                <input
                  type="radio"
                  name="primary"
                  className="mt-1"
                  checked={currentIsPrimary}
                  onChange={() => setCurrentIsPrimary(true)}
                  disabled={busy}
                />
                <span className="break-all">
                  <span className="font-medium">{current}</span>
                  <span className="block text-xs text-muted-foreground">
                    cliente attualmente aperto
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 rounded-md border border-border p-2 text-sm">
                <input
                  type="radio"
                  name="primary"
                  className="mt-1"
                  checked={!currentIsPrimary}
                  onChange={() => setCurrentIsPrimary(false)}
                  disabled={busy || !isValid}
                />
                <span className="break-all">
                  <span className="font-medium">{other || "altra email"}</span>
                  <span className="block text-xs text-muted-foreground">
                    l'altra email
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merge-note">Nota (facoltativa)</Label>
            <Input
              id="merge-note"
              placeholder="es. stesso cliente, conferma via email"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
            />
          </div>

          {isValid && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Il login con <strong>{secondaryEmail}</strong> non mostrerà più i
                report: tutto sarà accessibile con <strong>{primaryEmail}</strong>.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={busy || !isValid} className="gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Unisci clienti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
