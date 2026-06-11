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
import { useState } from "react";

interface ConfirmActionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  busy?: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: "default" | "destructive";
  requireReason?: boolean;
}

export default function ConfirmActionDialog({
  open,
  onClose,
  onConfirm,
  busy,
  title,
  description,
  confirmLabel = "Conferma",
  confirmVariant = "default",
  requireReason = false,
}: ConfirmActionDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(requireReason ? reason.trim() : undefined);
  };

  const canConfirm = !busy && (!requireReason || reason.trim().length > 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !busy) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground">{description}</div>
          </DialogDescription>
        </DialogHeader>

        {requireReason && (
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Motivo (richiesto)</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="es. supporto cliente — refund"
              disabled={busy}
              autoFocus
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annulla
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
