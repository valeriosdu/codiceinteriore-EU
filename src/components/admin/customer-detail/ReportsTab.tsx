import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Pencil,
  RotateCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CustomerDetail,
  QuizSessionDetail,
} from "@/hooks/admin/useAdminCustomerDetail";
import { formatBirth, formatDate } from "./formatters";
import type { CustomerActionHandlers } from "./actions";

interface ReportsTabProps {
  detail: CustomerDetail;
  actions?: CustomerActionHandlers;
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  completed: "success",
  ready: "success",
  pending: "warning",
  processing: "warning",
  error: "danger",
  failed: "danger",
  deleted: "muted",
};

const toneClasses: Record<"success" | "warning" | "danger" | "muted", string> = {
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "muted";
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "danger"
        ? AlertTriangle
        : Clock;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

export default function ReportsTab({ detail, actions }: ReportsTabProps) {
  if (detail.quiz_sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
        Nessun quiz/report per questa email.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {detail.quiz_sessions.map((qs) => (
        <ReportCard key={qs.id} qs={qs} actions={actions} />
      ))}
    </div>
  );
}

function ReportCard({
  qs,
  actions,
}: {
  qs: QuizSessionDetail;
  actions?: CustomerActionHandlers;
}) {
  const pending = actions?.isPending ?? {};
  const editing = pending[`edit:${qs.id}`];
  const regenerating = pending[`regenerate:${qs.id}`];
  const deleting = pending[`delete:${qs.id}`];
  const downloading = pending[`download:${qs.id}`];

  // Bozza anagrafica (creata da "Nuovo cliente" senza generare il report):
  // niente report e niente carta natale. La generazione si avvia da qui (riusa
  // admin-update-quiz-session che rilancia l'intera pipeline sui dati salvati).
  const isDraft = qs.processing_status === "draft";
  const canGenerate = isDraft && Boolean(qs.birth_place);

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <h3 className="font-medium text-foreground">{qs.user_name ?? "—"}</h3>
          </div>
          <div className="text-xs text-muted-foreground font-mono break-all">{qs.id}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusPill status={qs.processing_status} />
          {qs.has_full_report && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Report pronto
            </span>
          )}
          {qs.has_natal_chart && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Carta natale
            </span>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
        <Field label="Nascita">{formatBirth(qs.birth_date)}</Field>
        <Field label="Luogo">{qs.birth_place ?? "—"}</Field>
        <Field label="Focus">{qs.focus_area ?? "—"}</Field>
        <Field label="Funnel">{qs.funnel_slug ?? "—"}</Field>
        <Field label="Creato">{formatDate(qs.created_at, true)}</Field>
        <Field label="Tentativi">{String(qs.report_attempts)}</Field>
      </dl>

      {qs.processing_error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <strong>Errore:</strong>{" "}
          <span className="font-mono break-words">{qs.processing_error}</span>
        </div>
      )}

      {actions && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.onEditQuiz(qs)}
            disabled={editing}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Modifica dati
          </Button>
          {isDraft ? (
            <Button
              size="sm"
              onClick={() => actions.onGenerateReport(qs)}
              disabled={!canGenerate || editing}
              title={
                canGenerate
                  ? undefined
                  : "Aggiungi i dati di nascita (Modifica dati) per generare il report."
              }
            >
              {editing ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              )}
              Genera report
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onRegenerateReport(qs)}
              disabled={regenerating}
            >
              {regenerating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RotateCw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Rigenera
            </Button>
          )}
          {qs.has_full_report && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onDownloadNatalPdf(qs)}
              disabled={downloading}
            >
              {downloading ? (
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
            onClick={() => actions.onDeleteReport(qs)}
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
      )}
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
