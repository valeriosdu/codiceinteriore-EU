import { useState } from "react";
import { Calendar, CalendarPlus, Download, Loader2, RotateCw, Sparkles, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CustomerDetail,
  TransitCycleRow,
  TransitSubscriptionRow,
} from "@/hooks/admin/useAdminCustomerDetail";
import { formatDate } from "./formatters";
import type { CustomerActionHandlers } from "./actions";

interface TransitsTabProps {
  detail: CustomerDetail;
  actions?: CustomerActionHandlers;
}

const SUB_STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  active: "success",
  trialing: "success",
  past_due: "warning",
  unpaid: "warning",
  canceled: "muted",
  incomplete: "warning",
  incomplete_expired: "muted",
};

const CYCLE_STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  completed: "success",
  ready: "success",
  pending: "warning",
  processing: "warning",
  failed: "danger",
  error: "danger",
};

const toneClasses: Record<"success" | "warning" | "danger" | "muted", string> = {
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

function Pill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export default function TransitsTab({ detail, actions }: TransitsTabProps) {
  const sub = detail.transit_subscription;
  const cycles = detail.transit_cycles;

  // Per "regalare"/rigenerare transiti serve un report natale completo.
  // Preferiamo il quiz_session di un ciclo esistente; altrimenti il più
  // recente con report. Così il pulsante è disponibile anche quando il
  // cliente non ha ancora transiti.
  const eligibleQuizSessionId =
    cycles[0]?.quiz_session_id ??
    detail.quiz_sessions.find((q) => q.has_full_report)?.id ??
    null;
  const lastCycleEnd = cycles[0]?.period_end ?? null;

  const newCycleButton =
    actions && eligibleQuizSessionId ? (
      <Button
        variant="default"
        size="sm"
        onClick={() =>
          actions.onCreateNewTransitCycle(eligibleQuizSessionId, lastCycleEnd)
        }
        disabled={actions.isPending?.[`newCycle:${eligibleQuizSessionId}`]}
      >
        {actions.isPending?.[`newCycle:${eligibleQuizSessionId}`] ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
        )}
        Nuovo ciclo transiti
      </Button>
    ) : null;

  if (!sub && cycles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground space-y-4">
        <p>Nessun transito o abbonamento per questo cliente.</p>
        {newCycleButton ? (
          <div className="flex justify-center">{newCycleButton}</div>
        ) : (
          <p className="text-xs">
            Per generare transiti serve prima un report natale completo per
            questo cliente.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {newCycleButton && <div className="flex justify-end">{newCycleButton}</div>}
      {sub && <SubscriptionCard sub={sub} actions={actions} />}
      {cycles.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Cicli ({cycles.length})
          </h3>
          {cycles.map((c) => (
            <CycleCard key={c.id} c={c} actions={actions} />
          ))}
        </section>
      )}
    </div>
  );
}

function SubscriptionCard({
  sub,
  actions,
}: {
  sub: TransitSubscriptionRow;
  actions?: CustomerActionHandlers;
}) {
  const tone = SUB_STATUS_TONE[sub.status] ?? "muted";
  const recovering = actions?.isPending?.[`recoverSub:${sub.stripe_subscription_id}`];
  const showRecover =
    sub.status === "past_due" || sub.status === "unpaid" || sub.status === "incomplete";
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">
            Abbonamento transiti
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill tone={tone}>{sub.status}</Pill>
          {sub.cancel_at_period_end && <Pill tone="warning">Cancella a fine periodo</Pill>}
          {sub.status === "trialing" && sub.current_period_end && (
            <Pill tone="success">Primo addebito il {formatDate(sub.current_period_end)}</Pill>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
        <Field label="Periodo corrente">
          {formatDate(sub.current_period_start)} → {formatDate(sub.current_period_end)}
        </Field>
        <Field label="Stripe customer">
          <span className="font-mono text-xs break-all">{sub.stripe_customer_id}</span>
        </Field>
        <Field label="Stripe subscription">
          <span className="font-mono text-xs break-all">{sub.stripe_subscription_id}</span>
        </Field>
        <Field label="Creato">{formatDate(sub.created_at, true)}</Field>
        {sub.canceled_at && (
          <Field label="Cancellato il">{formatDate(sub.canceled_at, true)}</Field>
        )}
      </dl>
      {actions && showRecover && (
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.onRecoverSubscription(sub)}
            disabled={recovering}
          >
            {recovering ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Wrench className="h-3.5 w-3.5 mr-1.5" />
            )}
            Riconcilia da Stripe
          </Button>
        </div>
      )}
    </article>
  );
}

function defaultExtendDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function CycleCard({
  c,
  actions,
}: {
  c: TransitCycleRow;
  actions?: CustomerActionHandlers;
}) {
  const [extendDate, setExtendDate] = useState(defaultExtendDate);
  const fetchTone = CYCLE_STATUS_TONE[c.fetch_status] ?? "muted";
  const interpTone = CYCLE_STATUS_TONE[c.interpretation_status] ?? "muted";
  const triggering = actions?.isPending?.[`triggerCycle:${c.id}`];
  const extending = actions?.isPending?.[`extend:${c.entitlement_id}`];
  const downloadingPdf = actions?.isPending?.[`downloadTransit:${c.id}`];
  const deleting = actions?.isPending?.[`deleteCycle:${c.id}`];
  const isReady =
    c.interpretation_status === "completed" || c.interpretation_status === "ready";
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h4 className="font-medium text-foreground">
            {formatDate(c.period_start)} → {formatDate(c.period_end)}
          </h4>
          <div className="text-xs text-muted-foreground font-mono break-all">{c.id}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill tone={fetchTone}>fetch: {c.fetch_status}</Pill>
          <Pill tone={interpTone}>interp: {c.interpretation_status}</Pill>
        </div>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Field label="Stato">{c.status}</Field>
        <Field label="Snapshot">{c.snapshot_count}</Field>
        {c.retry_count > 1 && <Field label="Tentativi">{c.retry_count}</Field>}
        <Field label="Aggiornato">{formatDate(c.updated_at, true)}</Field>
      </dl>
      {c.processing_error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <strong>Errore:</strong>{" "}
          <span className="font-mono break-words">{c.processing_error}</span>
        </div>
      )}
      {actions && (
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onTriggerCycle(c)}
              disabled={triggering}
            >
              {triggering ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RotateCw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Forza ciclo
            </Button>
            {isReady && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => actions.onDownloadTransitPdf(c)}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                )}
                Scarica PDF
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.onDeleteTransitCycle(c)}
              disabled={deleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Cancella
            </Button>
          </div>
          {c.entitlement_id && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => actions.onExtendEntitlement(c.entitlement_id, extendDate)}
                disabled={extending || !extendDate}
              >
                {extending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                )}
                Estendi entitlement
              </Button>
            </div>
          )}
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
