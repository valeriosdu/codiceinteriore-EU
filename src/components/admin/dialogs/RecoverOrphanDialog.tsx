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
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import type { CheckoutRow } from "@/hooks/admin/useAdminCustomerDetail";

interface RecoverOrphanDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (vars: { stripeSessionId: string; sendInvite: boolean; overrideEmail?: string }) => void;
  busy: boolean;
  checkout: CheckoutRow | null;
}

export default function RecoverOrphanDialog({
  open,
  onClose,
  onSubmit,
  busy,
  checkout,
}: RecoverOrphanDialogProps) {
  const [sendInvite, setSendInvite] = useState(true);
  const [overrideEmail, setOverrideEmail] = useState("");

  useEffect(() => {
    if (open) {
      setSendInvite(true);
      setOverrideEmail("");
    }
  }, [open]);

  if (!checkout) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recupera pagamento orfano</DialogTitle>
          <DialogDescription>
            Verrà creato un account per l'email del checkout e collegata la
            quiz_session corrispondente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <div className="font-mono text-xs break-all">{checkout.stripe_session_id}</div>
            <div className="text-muted-foreground">
              Email: <span className="text-foreground">{checkout.customer_email}</span>
            </div>
            {checkout.product_code && (
              <div className="text-muted-foreground">
                Prodotto: <span className="text-foreground">{checkout.product_code}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Email corretta del cliente (opzionale)
            </label>
            <Input
              type="email"
              placeholder={checkout.customer_email || "Usa email del checkout"}
              value={overrideEmail}
              onChange={(e) => setOverrideEmail(e.target.value)}
              disabled={busy}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Se l'email del checkout è sbagliata, inserisci quella corretta.
              L'account verrà creato con questa email e il checkout aggiornato.
            </p>
          </div>

          <label className="flex items-start gap-2">
            <Checkbox
              checked={sendInvite}
              onCheckedChange={(v) => setSendInvite(v === true)}
              disabled={busy}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Invia email d'invito</span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                Il cliente riceve il link per impostare la password e accedere al report.
                Se disattivato, l'account viene creato silenziosamente (utile in caso di
                richiesta supporto in corso).
              </span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annulla
          </Button>
          <Button
            onClick={() => {
              const trimmed = overrideEmail.trim().toLowerCase();
              onSubmit({
                stripeSessionId: checkout.stripe_session_id,
                sendInvite,
                ...(trimmed ? { overrideEmail: trimmed } : {}),
              });
            }}
            disabled={busy}
            className="gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Recupera{sendInvite ? " e invia invito" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
