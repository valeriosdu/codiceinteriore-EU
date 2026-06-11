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

interface NewTransitCycleDialogProps {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  quizSessionId: string | null;
  lastCycleEnd: string | null;
  onSubmit: (vars: { quizSessionId: string; periodStart?: string }) => void;
}

type Mode = "today" | "continue" | "specific";

function addOneMonth(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() + 1);
  return dt.toISOString().slice(0, 10);
}

function formatItDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NewTransitCycleDialog({
  open,
  onClose,
  busy,
  quizSessionId,
  lastCycleEnd,
  onSubmit,
}: NewTransitCycleDialogProps) {
  const [mode, setMode] = useState<Mode>("today");
  const [specificDate, setSpecificDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    if (open) {
      setMode("today");
      setSpecificDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  if (!quizSessionId) return null;

  const todayYmd = new Date().toISOString().slice(0, 10);
  const todayEnd = addOneMonth(todayYmd);
  const continueEnd = lastCycleEnd ? addOneMonth(lastCycleEnd) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuovo ciclo transiti</DialogTitle>
          <DialogDescription>
            Crea un nuovo periodo di transiti per questo cliente. La pipeline AI
            verrà avviata in background.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <RadioOption
            checked={mode === "today"}
            onCheck={() => setMode("today")}
            disabled={busy}
            label="Prossimi 30 giorni (da oggi)"
            description={`Periodo previsto: ${formatItDate(todayYmd)} → ${formatItDate(todayEnd)} (calcolato lato server nel timezone di nascita).`}
          />
          <RadioOption
            checked={mode === "continue"}
            onCheck={() => lastCycleEnd && setMode("continue")}
            disabled={busy || !lastCycleEnd}
            label="Continua dall'ultimo ciclo"
            description={
              lastCycleEnd && continueEnd
                ? `Periodo previsto: ${formatItDate(lastCycleEnd)} → ${formatItDate(continueEnd)}. Utile per evitare gap dopo un mese scaduto.`
                : "Disponibile solo se esiste già un ciclo precedente."
            }
          />
          <RadioOption
            checked={mode === "specific"}
            onCheck={() => setMode("specific")}
            disabled={busy}
            label="Da una data specifica"
            description={
              specificDate
                ? `Periodo previsto: ${formatItDate(specificDate)} → ${formatItDate(addOneMonth(specificDate))}. I transiti vengono calcolati a partire dalla data scelta.`
                : "Scegli la data di partenza del ciclo."
            }
          />
          {mode === "specific" && (
            <div className="ml-5">
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                disabled={busy}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annulla
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                quizSessionId,
                ...(mode === "continue" && lastCycleEnd
                  ? { periodStart: lastCycleEnd }
                  : {}),
                ...(mode === "specific" && specificDate
                  ? { periodStart: specificDate }
                  : {}),
              })
            }
            disabled={
              busy ||
              (mode === "continue" && !lastCycleEnd) ||
              (mode === "specific" && !specificDate)
            }
            className="gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Crea ciclo
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
      } disabled:opacity-50 disabled:cursor-not-allowed`}
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
