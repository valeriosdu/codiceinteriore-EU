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
import { useEffect, useState } from "react";
import type { TransitCycleRow } from "@/hooks/admin/useAdminCustomerDetail";

interface TriggerTransitDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (vars: {
    transitCycleId: string;
    forceInterpretation: boolean;
    fullReset: boolean;
  }) => void;
  busy: boolean;
  cycle: TransitCycleRow | null;
}

type Mode = "interpretation" | "fullReset";

export default function TriggerTransitDialog({
  open,
  onClose,
  onSubmit,
  busy,
  cycle,
}: TriggerTransitDialogProps) {
  const [mode, setMode] = useState<Mode>("interpretation");

  useEffect(() => {
    if (open) setMode("interpretation");
  }, [open]);

  if (!cycle) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forza ciclo transiti</DialogTitle>
          <DialogDescription>
            Rigenera i transiti per il periodo del ciclo ({cycle.period_start} → {cycle.period_end}).
            Per generare un nuovo mese a partire da oggi, usa "Nuovo ciclo transiti".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="font-mono text-xs break-all">{cycle.id}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Stato: {cycle.status} · interp: {cycle.interpretation_status} · fetch:{" "}
              {cycle.fetch_status}
            </div>
          </div>

          <RadioOption
            checked={mode === "interpretation"}
            onCheck={() => setMode("interpretation")}
            disabled={busy}
            label="Solo interpretazione"
            description="Riusa i raw_transits in cache e rigenera solo l'interpretazione Gemini. Più veloce ed economico."
          />
          <RadioOption
            checked={mode === "fullReset"}
            onCheck={() => setMode("fullReset")}
            disabled={busy}
            label="Reset completo"
            description="Pulisce raw_transits + interpreted_transits e ri-fetcha tutto. Usalo quando i dati di nascita sono cambiati."
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annulla
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                transitCycleId: cycle.id,
                forceInterpretation: mode === "interpretation",
                fullReset: mode === "fullReset",
              })
            }
            disabled={busy}
            className="gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Avvia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RadioOption({
  checked,
  onCheck,
  disabled,
  label,
  description,
}: {
  checked: boolean;
  onCheck: () => void;
  disabled?: boolean;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onCheck}
      disabled={disabled}
      className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
        checked
          ? "border-primary/60 bg-primary/5"
          : "border-border bg-background hover:bg-muted/40"
      } disabled:opacity-50`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-3.5 w-3.5 rounded-full border ${
            checked
              ? "border-primary bg-primary ring-2 ring-primary/20"
              : "border-muted-foreground/40"
          }`}
        />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 ml-5">{description}</p>
    </button>
  );
}
