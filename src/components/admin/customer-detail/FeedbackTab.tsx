import { MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import type {
  CustomerDetail,
  FeedbackRow,
} from "@/hooks/admin/useAdminCustomerDetail";
import { formatDate } from "./formatters";

interface FeedbackTabProps {
  detail: CustomerDetail;
}

const RATING_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  positive: "success",
  mixed: "warning",
  negative: "danger",
};

const toneClasses: Record<"success" | "warning" | "danger" | "muted", string> = {
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

export default function FeedbackTab({ detail }: FeedbackTabProps) {
  const hasFeedback = detail.feedback.length > 0;
  const hasContacts = detail.contacts_log.count > 0;

  if (!hasFeedback && !hasContacts) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
        Nessun feedback o messaggio di supporto.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {hasFeedback && (
        <section className="space-y-3">
          <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <ThumbsUp className="h-4 w-4" />
            Feedback report ({detail.feedback.length})
          </h3>
          {detail.feedback.map((f) => (
            <FeedbackCard key={f.id} f={f} />
          ))}
        </section>
      )}

      {hasContacts && (
        <section className="space-y-3">
          <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messaggi di supporto ({detail.contacts_log.count})
          </h3>
          {detail.contacts_log.items.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-border bg-surface p-5 space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{c.reason ?? "Contatto generico"}</span>
                <span>{formatDate(c.created_at, true)}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{c.message}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function FeedbackCard({ f }: { f: FeedbackRow }) {
  const tone = RATING_TONE[f.rating] ?? "muted";
  const Icon = tone === "danger" ? ThumbsDown : ThumbsUp;
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon
            className={`h-4 w-4 ${
              tone === "danger"
                ? "text-destructive"
                : tone === "warning"
                  ? "text-amber-600"
                  : "text-emerald-600"
            }`}
          />
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
          >
            {f.rating}
          </span>
          <span className="text-xs text-muted-foreground">via {f.source}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(f.created_at, true)}
        </span>
      </div>
      {f.reasons && f.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {f.reasons.map((r) => (
            <span
              key={r}
              className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {r}
            </span>
          ))}
        </div>
      )}
      {f.comment && (
        <p className="text-sm text-foreground whitespace-pre-wrap">{f.comment}</p>
      )}
      <div className="text-xs text-muted-foreground font-mono break-all">
        quiz: {f.quiz_session_id}
      </div>
    </article>
  );
}
