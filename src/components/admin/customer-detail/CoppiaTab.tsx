import { useState } from "react";
import { Heart, FileDown, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type {
  CustomerDetail,
  SynastrySessionRow,
  SynastryScores,
} from "@/hooks/admin/useAdminCustomerDetail";
import { formatDate } from "./formatters";

function compressScore(raw: number): number {
  return Math.round(30 + (raw / 100) * 67);
}

const DOMAIN_LABELS: { key: keyof SynastryScores; label: string }[] = [
  { key: "intimacy", label: "Sintonia emotiva" },
  { key: "romance", label: "Attrazione" },
  { key: "communication", label: "Comunicazione" },
  { key: "stability", label: "Stabilita" },
  { key: "growth", label: "Crescita" },
  { key: "tension", label: "Tensione" },
];

interface CoppiaTabProps {
  detail: CustomerDetail;
  secret: string;
  onRegenerate?: (session: SynastrySessionRow) => void;
  onDelete?: (session: SynastrySessionRow) => void;
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  report_ready: "success",
  insights_ready: "warning",
  synastry_ready: "warning",
  report_processing: "warning",
  failed: "danger",
  deleted: "muted",
};

const toneClasses: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export default function CoppiaTab({
  detail,
  secret,
  onRegenerate,
  onDelete,
}: CoppiaTabProps) {
  const sessions = detail.synastry_sessions ?? [];
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingPrevId, setDownloadingPrevId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
        Nessuna sinastria di coppia per questa email.
      </div>
    );
  }

  const handleDownload = async (session: SynastrySessionRow) => {
    setDownloadingId(session.id);
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/functions/v1/admin-download-synastry-report?synastrySessionId=${encodeURIComponent(session.id)}`,
        {
          method: 'GET',
          headers: { 'x-admin-secret': secret },
        },
      );
      const contentType = resp.headers.get('content-type') ?? '';
      if (!resp.ok) {
        const body = contentType.includes('application/json')
          ? await resp.json().catch(() => ({}))
          : {};
        throw new Error((body as any)?.error || `HTTP ${resp.status}`);
      }

      if (contentType.includes('application/json')) {
        const body = await resp.json();
        if (!body?.url) throw new Error('URL mancante');
        const a = document.createElement('a');
        a.href = body.url;
        a.download = body.filename ?? `codice-interiore-coppia-${session.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `codice-interiore-coppia-${session.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('PDF admin download error:', e);
      toast.error(`Download PDF fallito: ${e instanceof Error ? e.message : 'errore sconosciuto'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadPrevious = async (session: SynastrySessionRow) => {
    setDownloadingPrevId(session.id);
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/functions/v1/admin-download-synastry-report?synastrySessionId=${encodeURIComponent(session.id)}&version=previous`,
        { method: 'GET', headers: { 'x-admin-secret': secret } },
      );
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error((body as any)?.error || `HTTP ${resp.status}`);
      }
      const body = await resp.json();
      if (!body?.url) throw new Error('URL mancante');
      const a = document.createElement('a');
      a.href = body.url;
      a.download = `codice-interiore-coppia-${session.id}-previous.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('PDF previous download error:', e);
      toast.error(`Nessuna versione precedente disponibile`);
    } finally {
      setDownloadingPrevId(null);
    }
  };

  return (
    <div className="space-y-3">
      {sessions.map((s) => {
        const tone = STATUS_TONE[s.processing_status ?? ""] ?? "muted";
        const isDownloading = downloadingId === s.id;
        const isDownloadingPrev = downloadingPrevId === s.id;
        return (
          <article
            key={s.id}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex flex-wrap items-start gap-4 justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-primary" aria-hidden />
                  <h3 className="font-display text-base font-semibold">
                    {s.person_a_name ?? "—"} &amp; {s.person_b_name ?? "—"}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Creata {formatDate(s.created_at)}
                </p>
                {s.archetype_label && (
                  <p className="text-sm text-foreground mt-2">
                    Archetipo: <strong>{s.archetype_label}</strong>
                  </p>
                )}
                {s.score_overall != null && (
                  <div className="mt-2 text-sm space-y-1">
                    <p className="text-foreground">
                      Score raw: <strong>{Math.round(s.score_overall)}</strong>/100
                      {" · "}
                      Mostrato: <strong>{compressScore(Math.max(0, Math.min(100, Math.round(s.score_overall))))}</strong>/100
                    </p>
                    {s.scores && (
                      <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-1">
                        {DOMAIN_LABELS.map(({ key, label }) => (
                          <span key={key}>
                            {label}: <strong className="text-foreground">{Math.round(Number(s.scores![key] ?? 0))}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${toneClasses[tone]}`}
                >
                  {s.processing_status ?? "—"}
                </span>
                <div className="flex gap-2 flex-wrap justify-end">
                  {s.has_full_report && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDownload(s)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent/30 disabled:opacity-50"
                      >
                        {isDownloading
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <FileDown className="w-3.5 h-3.5" />
                        }
                        {isDownloading ? "Scaricando..." : "PDF"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPrevious(s)}
                        disabled={isDownloadingPrev}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent/30 disabled:opacity-50 text-muted-foreground"
                      >
                        {isDownloadingPrev
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <FileDown className="w-3.5 h-3.5" />
                        }
                        {isDownloadingPrev ? "Scaricando..." : "PDF prec."}
                      </button>
                    </>
                  )}
                  {onRegenerate && (
                    <button
                      type="button"
                      onClick={() => onRegenerate(s)}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent/30"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Rigenera
                    </button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(s)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Cancella
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {s.processing_error && (
              <p className="mt-3 text-xs text-destructive">
                Errore: {s.processing_error}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
