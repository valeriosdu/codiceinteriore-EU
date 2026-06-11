import { Pencil, KeyRound, Link2Off, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomerDetail } from "@/hooks/admin/useAdminCustomerDetail";
import { formatBirth, formatDate, formatTime } from "./formatters";

interface AnagraficaTabProps {
  detail: CustomerDetail;
  onEditEmail?: () => void;
  onSendRecovery?: () => void;
  recoveryBusy?: boolean;
  onUnmerge?: (secondaryEmail: string) => void;
  unmergeBusy?: boolean;
}

export default function AnagraficaTab({
  detail,
  onEditEmail,
  onSendRecovery,
  recoveryBusy,
  onUnmerge,
  unmergeBusy,
}: AnagraficaTabProps) {
  const latestQuiz = detail.quiz_sessions[0] ?? null;
  const mergedEmails = detail.merged_emails ?? [];

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {mergedEmails.length > 0 && (
        <Card title="Email unite" fullWidth>
          <p className="text-sm text-muted-foreground">
            Questo cliente raccoglie i dati di{" "}
            {mergedEmails.length === 1 ? "un'altra email" : "altre email"} unite a{" "}
            <strong className="break-all">{detail.email}</strong>.
          </p>
          <ul className="space-y-2">
            {mergedEmails.map((em) => (
              <li
                key={em}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-2.5 text-sm"
              >
                <span className="break-all font-medium">{em}</span>
                {onUnmerge && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => onUnmerge(em)}
                    disabled={unmergeBusy}
                    title="Annulla l'unione di questa email"
                  >
                    {unmergeBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Link2Off className="h-3.5 w-3.5" />
                    )}
                    Annulla unione
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card title="Profilo">
        {detail.profile ? (
          <Dl>
            <DlRow label="Email">
              <span className="flex items-center gap-2 flex-wrap">
                {detail.profile.email ?? "—"}
                {onEditEmail && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEditEmail} title="Modifica email">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onSendRecovery && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSendRecovery} disabled={recoveryBusy} title="Invia link password">
                    <KeyRound className="h-3.5 w-3.5" />
                  </Button>
                )}
              </span>
            </DlRow>
            <DlRow label="user_id">
              <span className="font-mono text-xs break-all">{detail.profile.user_id}</span>
            </DlRow>
            <DlRow label="profile_id">
              <span className="font-mono text-xs break-all">{detail.profile.id}</span>
            </DlRow>
            <DlRow label="Registrato il">{formatDate(detail.profile.created_at, true)}</DlRow>
            <DlRow label="Quiz di registrazione">
              {detail.profile.quiz_session_id ? (
                <span className="font-mono text-xs break-all">
                  {detail.profile.quiz_session_id}
                </span>
              ) : (
                "—"
              )}
            </DlRow>
          </Dl>
        ) : (
          <EmptyState>
            Nessun profilo registrato. Il cliente esiste solo come{" "}
            <strong>email di checkout</strong>: potrebbe essere un{" "}
            <strong>orfano</strong> recuperabile dal tab Pagamenti.
          </EmptyState>
        )}
      </Card>

      <Card title="Dati di nascita (ultimo quiz)">
        {latestQuiz ? (
          <Dl>
            <DlRow label="Nome">{latestQuiz.user_name ?? "—"}</DlRow>
            <DlRow label="Data di nascita">{formatBirth(latestQuiz.birth_date)}</DlRow>
            <DlRow label="Ora di nascita">{formatTime(latestQuiz.birth_time)}</DlRow>
            <DlRow label="Luogo">{latestQuiz.birth_place ?? "—"}</DlRow>
            <DlRow label="Coordinate">
              {latestQuiz.birth_lat != null && latestQuiz.birth_lng != null
                ? `${latestQuiz.birth_lat.toFixed(4)}, ${latestQuiz.birth_lng.toFixed(4)}`
                : "—"}
            </DlRow>
            <DlRow label="Focus area">{latestQuiz.focus_area ?? "—"}</DlRow>
            <DlRow label="Funnel">{latestQuiz.funnel_slug ?? "—"}</DlRow>
            <DlRow label="Quiz creato il">{formatDate(latestQuiz.created_at, true)}</DlRow>
          </Dl>
        ) : (
          <EmptyState>Nessun quiz completato per questa email.</EmptyState>
        )}
      </Card>

      {detail.contacts_log.count > 0 && (
        <Card title={`Messaggi di supporto (${detail.contacts_log.count})`} fullWidth>
          <ul className="space-y-3">
            {detail.contacts_log.items.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-border bg-background p-3 text-sm"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.reason ?? "Contatto"}</span>
                  <span>{formatDate(c.created_at, true)}</span>
                </div>
                <p className="mt-1 text-foreground whitespace-pre-wrap">{c.message}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Card({
  title,
  children,
  fullWidth,
}: {
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-5 space-y-4 ${
        fullWidth ? "md:col-span-2" : ""
      }`}
    >
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Dl({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-2 text-sm">{children}</dl>;
}

function DlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground sm:w-40 shrink-0">
        {label}
      </dt>
      <dd className="text-foreground break-words">{children}</dd>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
