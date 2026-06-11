import { AlertTriangle, CreditCard, Loader2, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CheckoutRow,
  CustomerDetail,
} from "@/hooks/admin/useAdminCustomerDetail";
import { formatDate, formatEuros } from "./formatters";
import type { CustomerActionHandlers } from "./actions";

interface PaymentsTabProps {
  detail: CustomerDetail;
  actions?: CustomerActionHandlers;
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "muted",
  expired: "muted",
};

const toneClasses: Record<"success" | "warning" | "danger" | "muted", string> = {
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

export default function PaymentsTab({ detail, actions }: PaymentsTabProps) {
  if (detail.checkouts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
        Nessun checkout per questa email.
      </div>
    );
  }

  // Email principale del cliente (lower-case) usata per evidenziare i checkout
  // pagati con un'email alternativa.
  const mainEmailKey = (detail.profile?.email ?? detail.email).trim().toLowerCase();

  // Le righe purchase_type='transits_subscription' sono "sessioni di attivazione":
  // create da create-transit-checkout per correlazione, ma restano payment_status='unpaid'
  // perché il provisioning della subscription passa da stripe-subscription-webhook
  // (vedi stripe-reconcile.ts: le sessioni mode=subscription sono delegate al
  // subscription webhook, che scrive solo su transit_subscriptions e non torna a
  // chiudere la riga checkout). Le mostriamo separate per non confondere chi legge.
  const oneTimeCheckouts: CheckoutRow[] = [];
  const subscriptionSeeds: CheckoutRow[] = [];
  for (const c of detail.checkouts) {
    if (c.purchase_type === "transits_subscription") {
      subscriptionSeeds.push(c);
    } else {
      oneTimeCheckouts.push(c);
    }
  }

  return (
    <div className="space-y-3">
      {oneTimeCheckouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          Nessun pagamento una tantum.
        </div>
      ) : (
        oneTimeCheckouts.map((c) => (
          <PaymentCard key={c.id} c={c} actions={actions} mainEmailKey={mainEmailKey} />
        ))
      )}

      {subscriptionSeeds.length > 0 && (
        <details className="rounded-2xl border border-border bg-surface">
          <summary className="cursor-pointer select-none px-5 py-4 text-sm text-muted-foreground hover:text-foreground">
            Sessioni di attivazione abbonamento ({subscriptionSeeds.length})
          </summary>
          <div className="space-y-2 border-t border-border px-5 pb-5 pt-3">
            <p className="text-xs text-muted-foreground">
              Sessioni Stripe create da "Attiva abbonamento Transiti". Restano{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">unpaid</code> per design:
              il provisioning e gli addebiti ricorrenti dell'abbonamento sono gestiti
              dal webhook subscription e visibili nel tab Transiti.
            </p>
            {subscriptionSeeds.map((c) => (
              <SubscriptionSeedRow key={c.id} c={c} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function SubscriptionSeedRow({ c }: { c: CheckoutRow }) {
  const statusTone = STATUS_TONE[c.payment_status] ?? "muted";
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="font-mono text-xs text-muted-foreground break-all">
          {c.stripe_session_id}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDate(c.created_at, true)} · {c.payment_provider}
        </div>
      </div>
      <span
        className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses[statusTone]}`}
      >
        {c.payment_status}
      </span>
    </div>
  );
}

function PaymentCard({
  c,
  actions,
  mainEmailKey,
}: {
  c: CheckoutRow;
  actions?: CustomerActionHandlers;
  mainEmailKey: string;
}) {
  const statusTone = STATUS_TONE[c.payment_status] ?? "muted";
  const recovering = actions?.isPending?.[`recover:${c.stripe_session_id}`];
  const checkoutEmailKey = (c.customer_email ?? "").trim().toLowerCase();
  const isAlternativeEmail =
    checkoutEmailKey !== "" && checkoutEmailKey !== mainEmailKey;
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
            <h3 className="font-medium text-foreground">
              {c.product_code ?? c.purchase_type ?? "Checkout"}
            </h3>
            <span className="text-sm text-muted-foreground">
              {formatEuros(c.amount_total, c.currency)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-mono break-all">
            {c.stripe_session_id}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses[statusTone]}`}
          >
            {c.payment_status}
          </span>
          {c.is_orphan && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700"
              title="Pagato ma nessun account collegato"
            >
              <AlertTriangle className="h-3 w-3" />
              Orfano
            </span>
          )}
          {c.includes_transits && (
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              + Transiti {c.transit_months}m
            </span>
          )}
          {isAlternativeEmail && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700"
              title="Il cliente ha pagato con un'email diversa da quella del profilo"
            >
              <Mail className="h-3 w-3" />
              Email diversa
            </span>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
        <Field label="Provider">{c.payment_provider}</Field>
        <Field label="Tipo acquisto">{c.purchase_type}</Field>
        <Field label="Pagato il">{formatDate(c.payment_completed_at, true)}</Field>
        <Field label="Creato">{formatDate(c.created_at, true)}</Field>
        {isAlternativeEmail && (
          <Field label="Email usata">
            <span className="break-all">{c.customer_email}</span>
          </Field>
        )}
        {c.quiz_session_id && (
          <Field label="Quiz collegato">
            <span className="font-mono text-xs break-all">{c.quiz_session_id}</span>
          </Field>
        )}
        {c.claimed_at && (
          <Field label="Account collegato">{formatDate(c.claimed_at, true)}</Field>
        )}
        {c.recovery_invited_at && (
          <Field label="Invito recovery">
            {formatDate(c.recovery_invited_at, true)} (×{c.recovery_invite_count})
          </Field>
        )}
      </dl>

      {actions && c.is_orphan && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.onRecoverOrphan(c)}
            disabled={recovering}
          >
            {recovering ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            )}
            Recupera (crea account)
          </Button>
        </div>
      )}
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground break-words">{children}</dd>
    </div>
  );
}
