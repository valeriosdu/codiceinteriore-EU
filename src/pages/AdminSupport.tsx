// Admin tool for the AI support autoresponder (/admin/support).
// Lists tickets ingested from Zoho, shows the customer data the AI used and an
// editable draft, and lets the admin regenerate, link a customer, or send.
// Auth: shared admin password convention (localStorage "ci_admin_secret"); edge
// functions verify x-admin-secret. Send is gated server-side in Phase 1
// (SUPPORT_SEND_ENABLED) — the Invia button then returns a dry-run notice.

import { Fragment, useEffect, useRef, useState } from "react";
import {
  Loader2,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  FileText,
  Send,
  AlertTriangle,
  UserPlus,
  ExternalLink,
  Languages,
  Trash2,
  Ban,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { clearAdminSecret, getAdminSecret, setAdminSecret } from "@/hooks/admin/adminSecretStorage";

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const LIST_URL = `${BASE_URL}/functions/v1/admin-support-list`;
const REGEN_URL = `${BASE_URL}/functions/v1/admin-regenerate-draft`;
const LINK_URL = `${BASE_URL}/functions/v1/admin-link-customer`;
const SEND_URL = `${BASE_URL}/functions/v1/support-send`;
const TRANSLATE_URL = `${BASE_URL}/functions/v1/admin-translate`;
const ACTION_URL = `${BASE_URL}/functions/v1/admin-support-action`;

type Status = "received" | "drafting" | "drafted" | "draft_failed" | "answered" | "ignored";

type Candidate = { email: string; name: string | null; score: number };
type AttachItem = { kind?: string; session_id: string; label?: string };
type ReportSummary = { id?: string; kind?: string; name?: string | null; status?: string | null; ready?: boolean };
type OrderSummary = {
  product?: string | null;
  purchase_type?: string | null;
  status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  is_orphan?: boolean;
};
type DataSummary = {
  matched?: boolean;
  name?: string | null;
  email?: string | null;
  orders?: OrderSummary[];
  reports?: ReportSummary[];
  synastry?: ReportSummary[];
  transit_subscription?: { status?: string | null; current_period_end?: string | null } | null;
  feedback_count?: number;
  latest_feedback_rating?: unknown;
  prior_contacts?: number;
};

type Ticket = {
  id: string;
  created_at: string;
  updated_at: string;
  market: string | null;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  body_plain: string | null;
  attachment_count: number;
  received_at: string | null;
  category: string | null;
  triage_reason: string | null;
  resolved_email: string | null;
  resolved_profile_id: string | null;
  candidate_matches: Candidate[] | null;
  draft_body: string | null;
  reply_language: string | null;
  data_summary: DataSummary | null;
  ai_note: string | null;
  ai_confidence: string | null;
  flag_for_human: boolean;
  model_used: string | null;
  sent_body: string | null;
  answered_at: string | null;
  status: Status;
  retry_count: number;
  error: string | null;
  manually_linked: boolean;
  force_support: boolean;
  attachments: AttachItem[] | null;
};

type Aggregate = {
  total: number;
  by_status: Record<string, number>;
  flagged: number;
};

type ListResponse = { items: Ticket[]; total: number; aggregate: Aggregate };

// Multi-select status chips (toggle several at once).
const STATUS_FILTERS: { value: Status; label: string }[] = [
  { value: "drafted", label: "Da rivedere" },
  { value: "answered", label: "Risposte" },
  { value: "received", label: "In coda" },
  { value: "drafting", label: "In elaborazione" },
  { value: "draft_failed", label: "Errore" },
  { value: "ignored", label: "Ignorati" },
];
// Default view keeps active tickets AND answered ones (so sent stay visible).
const DEFAULT_STATUSES: Status[] = ["received", "drafting", "drafted", "answered"];

const money = (cents?: number | null, currency?: string | null) => {
  if (typeof cents !== "number") return null;
  const v = (cents / 100).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v} ${currency || "EUR"}`;
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Rome",
    });
  } catch {
    return "—";
  }
};

const truncate = (s: string | null | undefined, max: number) =>
  !s ? "" : s.length > max ? s.slice(0, max - 1) + "…" : s;

const StatusBadge = ({ status }: { status: Status }) => {
  const tone =
    status === "answered"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
      : status === "draft_failed"
        ? "bg-destructive/10 text-destructive border-destructive/30"
        : status === "drafting"
          ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
          : status === "drafted"
            ? "bg-violet-500/10 text-violet-700 border-violet-500/30"
            : status === "ignored"
              ? "bg-muted text-muted-foreground border-border"
              : "bg-amber-500/15 text-amber-700 border-amber-500/30";
  return (
    <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border font-medium ${tone}`}>
      {status}
    </span>
  );
};

const StatCard = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="font-display text-2xl font-semibold text-foreground">{value}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </CardContent>
  </Card>
);

const CustomerSummary = ({ ds, ticketCount }: { ds: DataSummary; ticketCount: number }) => {
  const orders = ds.orders || [];
  const paid = orders.filter((o) => o.status === "paid");
  const totalCents = paid.reduce((s, o) => s + (typeof o.amount_total === "number" ? o.amount_total : 0), 0);
  const currency = paid.find((o) => o.currency)?.currency || "EUR";
  const reports = ds.reports || [];
  const readyReports = reports.filter((r) => r.ready).length;
  const products = Array.from(new Set(paid.map((o) => o.product).filter(Boolean))) as string[];
  const sub = ds.transit_subscription?.status || null;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      <div>
        <span className="text-muted-foreground">Speso: </span>
        <span className="font-medium text-foreground">{money(totalCents, currency) ?? "—"}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Ordini pagati: </span>
        <span className="font-medium text-foreground">{paid.length}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Report pronti: </span>
        <span className="font-medium text-foreground">
          {readyReports}/{reports.length}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Ticket: </span>
        <span className="font-medium text-foreground">{ticketCount}</span>
      </div>
      <div className="col-span-2">
        <span className="text-muted-foreground">Acquisti: </span>
        <span className="font-medium text-foreground">{products.length ? products.join(", ") : "—"}</span>
      </div>
      {sub && (
        <div className="col-span-2">
          <span className="text-muted-foreground">Abbonamento transiti: </span>
          <span className="font-medium text-foreground">{sub}</span>
        </div>
      )}
      {typeof ds.prior_contacts === "number" && ds.prior_contacts > 0 && (
        <div className="col-span-2">
          <span className="text-muted-foreground">Messaggi dal modulo contatti: </span>
          <span className="font-medium text-foreground">{ds.prior_contacts}</span>
        </div>
      )}
    </div>
  );
};

const PAGE_SIZE = 100;

const AdminSupport = () => {
  const [secret, setSecret] = useState<string>(() => getAdminSecret());
  const [secretInput, setSecretInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [statuses, setStatuses] = useState<Status[]>(DEFAULT_STATUSES);
  const [emailFilter, setEmailFilter] = useState("");
  const [emailQuery, setEmailQuery] = useState("");

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // `${id}:${action}`
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [linkEmail, setLinkEmail] = useState<Record<string, string>>({});
  // Italian translations of the customer email + draft, for the operator to read
  // foreign-language tickets. The reply stays in the customer's language.
  const [translated, setTranslated] = useState<Record<string, { customer: string; draft: string }>>({});
  // Per-ticket attachment selection (session_ids to attach). Initialized from the
  // AI's suggestion (ticket.attachments) when a ticket is first expanded.
  const [attachSel, setAttachSel] = useState<Record<string, Set<string>>>({});

  const abortRef = useRef<AbortController | null>(null);

  const load = async () => {
    if (!secret) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setAuthError(false);
    try {
      const res = await fetch(LIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({
          statuses,
          email: emailQuery || null,
          limit: PAGE_SIZE,
          offset: 0,
        }),
        signal: controller.signal,
      });
      if (res.status === 403) {
        setAuthError(true);
        clearAdminSecret();
        setSecret("");
        toast.error("Password non valida.");
        return;
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error ? `Errore: ${errBody.error}` : "Errore nel caricamento.");
      }
      const json = (await res.json()) as ListResponse;
      if (controller.signal.aborted) return;
      setData(json);
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      toast.error(err instanceof Error ? err.message : "Errore nel caricamento.");
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (secret) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, statuses, emailQuery]);

  const toggleStatus = (s: Status) =>
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  useEffect(() => {
    const handle = setTimeout(() => setEmailQuery(emailFilter.trim()), 400);
    return () => clearTimeout(handle);
  }, [emailFilter]);

  const callFn = async (url: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify(payload),
    });
    if (res.status === 403) {
      clearAdminSecret();
      setSecret("");
      throw new Error("Sessione admin scaduta.");
    }
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error((json.error as string) || `HTTP ${res.status}`);
    return json;
  };

  const handleRegenerate = async (t: Ticket, forceSupport = false) => {
    const key = `${t.id}:regen`;
    if (busy) return;
    setBusy(key);
    try {
      await callFn(REGEN_URL, { ticketId: t.id, forceSupport });
      toast.success("Rigenerazione avviata. Aggiorna tra qualche secondo.");
      setTimeout(() => void load(), 4000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore.");
    } finally {
      setBusy(null);
    }
  };

  const handleLink = async (t: Ticket, email: string) => {
    const clean = email.trim().toLowerCase();
    if (!clean) {
      toast.error("Inserisci un'email.");
      return;
    }
    const key = `${t.id}:link`;
    if (busy) return;
    setBusy(key);
    try {
      await callFn(LINK_URL, { ticketId: t.id, email: clean });
      toast.success("Cliente collegato. Rigenerazione in corso.");
      setTimeout(() => void load(), 4000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore.");
    } finally {
      setBusy(null);
    }
  };

  // Ready reports available to attach (from the data the AI pulled).
  const readyReports = (t: Ticket): ReportSummary[] =>
    (t.data_summary?.reports || []).filter((r) => r.ready && r.id);

  // Current attachment selection: operator edits in attachSel, else the AI's suggestion.
  const selectedAttachIds = (t: Ticket): Set<string> =>
    attachSel[t.id] ?? new Set((t.attachments || []).map((a) => a.session_id));

  const toggleAttach = (t: Ticket, sessionId: string) =>
    setAttachSel((m) => {
      const cur = new Set(m[t.id] ?? new Set((t.attachments || []).map((a) => a.session_id)));
      if (cur.has(sessionId)) cur.delete(sessionId);
      else cur.add(sessionId);
      return { ...m, [t.id]: cur };
    });

  const handleAction = async (t: Ticket, action: "ignore" | "delete") => {
    const label = action === "delete" ? "Eliminare" : "Ignorare";
    if (!confirm(`${label} questo ticket di ${t.from_email}?`)) return;
    const key = `${t.id}:${action}`;
    if (busy) return;
    setBusy(key);
    try {
      await callFn(ACTION_URL, { ticketId: t.id, action });
      toast.success(action === "delete" ? "Ticket eliminato." : "Ticket ignorato.");
      setExpandedId(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore.");
    } finally {
      setBusy(null);
    }
  };

  const handleSend = async (t: Ticket) => {
    const text = (draftEdits[t.id] ?? t.draft_body ?? "").trim();
    if (!text) {
      toast.error("La risposta è vuota.");
      return;
    }
    const sel = selectedAttachIds(t);
    const attachments: AttachItem[] = readyReports(t)
      .filter((r) => sel.has(r.id!))
      .map((r) => ({ kind: "natal", session_id: r.id!, label: r.name ? `Carta natal - ${r.name}` : "Carta natal" }));
    const attachNote = attachments.length ? ` con ${attachments.length} allegato/i` : "";
    if (!confirm(`Inviare la risposta a ${t.from_email}${attachNote}?`)) return;
    const key = `${t.id}:send`;
    if (busy) return;
    setBusy(key);
    try {
      const res = await callFn(SEND_URL, { ticketId: t.id, text, attachments });
      if (res.dryRun) {
        toast.info("Invio in modalità test (Phase 1): la risposta NON è stata inviata.");
      } else {
        toast.success("Risposta inviata.");
      }
      setTimeout(() => void load(), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore.");
    } finally {
      setBusy(null);
    }
  };

  const handleTranslate = async (t: Ticket) => {
    const key = `${t.id}:translate`;
    if (busy) return;
    setBusy(key);
    try {
      const customerText = t.body_plain || "";
      const draftText = draftEdits[t.id] ?? t.draft_body ?? "";
      const res = await callFn(TRANSLATE_URL, { texts: [customerText, draftText], target: "it" });
      const out = Array.isArray(res.translations) ? (res.translations as string[]) : [];
      setTranslated((m) => ({ ...m, [t.id]: { customer: out[0] ?? "", draft: out[1] ?? "" } }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore traduzione.");
    } finally {
      setBusy(null);
    }
  };

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim()) return;
    setAdminSecret(secretInput.trim());
    setSecret(secretInput.trim());
    setSecretInput("");
  };

  if (!secret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="font-display">Assistenza · Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSecretSubmit} className="space-y-3">
              <Input
                type="password"
                placeholder="Password admin"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={!secretInput.trim()}>
                Accedi
              </Button>
              {authError && <p className="text-xs text-destructive text-center">Password non valida.</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const aggregate = data?.aggregate;
  const items = data?.items || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="font-display text-base font-semibold">Assistenza · Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <a href="/admin/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <a href="/admin/clienti">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Clienti</span>
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Aggiorna</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearAdminSecret();
                setSecret("");
                setData(null);
              }}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Esci</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto py-8 space-y-6">
        {aggregate && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard label="Totale" value={aggregate.total} />
            <StatCard
              label="Da rivedere"
              value={aggregate.by_status.drafted ?? 0}
              hint={`${aggregate.flagged} da controllare`}
            />
            <StatCard
              label="In coda"
              value={(aggregate.by_status.received ?? 0) + (aggregate.by_status.drafting ?? 0)}
            />
            <StatCard label="Risposte" value={aggregate.by_status.answered ?? 0} />
            <StatCard label="Errore" value={aggregate.by_status.draft_failed ?? 0} />
            <StatCard label="Ignorati" value={aggregate.by_status.ignored ?? 0} />
          </div>
        )}

        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Stati (selezione multipla)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FILTERS.map((o) => {
                    const on = statuses.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggleStatus(o.value)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                <Input
                  type="text"
                  placeholder="mittente o cliente collegato…"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead>Mittente</TableHead>
                    <TableHead>Oggetto</TableHead>
                    <TableHead className="w-[60px]">Mkt</TableHead>
                    <TableHead className="w-[110px]">Stato</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && !data && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                        Caricamento…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nessun ticket con questi filtri.
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((t) => {
                    const open = expandedId === t.id;
                    const toggle = () => setExpandedId(open ? null : t.id);
                    const matched = Boolean(t.resolved_email);
                    const candidates = t.candidate_matches || [];
                    return (
                      <Fragment key={t.id}>
                        <TableRow className="cursor-pointer hover:bg-secondary/50">
                          <TableCell className="text-xs text-muted-foreground" onClick={toggle}>
                            {formatDate(t.received_at || t.created_at)}
                          </TableCell>
                          <TableCell className="text-xs" onClick={toggle}>
                            <div className="flex flex-col">
                              <span className="text-foreground">{t.from_email}</span>
                              {t.from_name && <span className="text-muted-foreground/80">{t.from_name}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm" onClick={toggle}>
                            <div className="flex items-center gap-2">
                              {t.flag_for_human && <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                              <span>{truncate(t.subject, 70) || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs uppercase text-muted-foreground" onClick={toggle}>
                            {t.market || "it"}
                          </TableCell>
                          <TableCell onClick={toggle}>
                            <StatusBadge status={t.status} />
                          </TableCell>
                          <TableCell onClick={toggle}>
                            {open ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                        </TableRow>

                        {open && (
                          <TableRow className="bg-secondary/30">
                            <TableCell colSpan={6} className="py-4">
                              <div className="grid md:grid-cols-2 gap-5 text-sm">
                                {/* Inbound + customer panel */}
                                <div className="space-y-4">
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Email del cliente
                                        {t.attachment_count > 0 && (
                                          <span className="ml-2 normal-case font-normal">
                                            · {t.attachment_count} allegato/i (apri in Zoho)
                                          </span>
                                        )}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[11px] gap-1"
                                        disabled={busy === `${t.id}:translate`}
                                        onClick={() => void handleTranslate(t)}
                                      >
                                        {busy === `${t.id}:translate` ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Languages className="h-3 w-3" />
                                        )}
                                        Traduci in IT
                                      </Button>
                                    </div>
                                    <p className="text-foreground/90 whitespace-pre-wrap rounded-lg bg-background p-3 border border-border/60 max-h-64 overflow-auto">
                                      {t.body_plain || "(corpo vuoto)"}
                                    </p>
                                    {translated[t.id]?.customer && (
                                      <div className="mt-2 rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700/80 mb-1">
                                          🇮🇹 Traduzione IT
                                        </p>
                                        <p className="text-foreground/90 whitespace-pre-wrap text-sm max-h-64 overflow-auto">
                                          {translated[t.id].customer}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                      Cliente
                                    </p>
                                    {matched ? (
                                      <div className="rounded-lg bg-background p-3 border border-border/60 space-y-2">
                                        <a
                                          className="text-primary inline-flex items-center gap-1 hover:underline font-medium"
                                          href={`/admin/clienti/${encodeURIComponent(t.resolved_email!)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          {t.resolved_email}
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                        {t.data_summary && (
                                          <CustomerSummary
                                            ds={t.data_summary}
                                            ticketCount={
                                              items.filter(
                                                (x) =>
                                                  x.resolved_email &&
                                                  t.resolved_email &&
                                                  x.resolved_email.toLowerCase() === t.resolved_email.toLowerCase(),
                                              ).length
                                            }
                                          />
                                        )}
                                        {t.data_summary && (
                                          <details className="text-xs text-muted-foreground">
                                            <summary className="cursor-pointer">Dettaglio dati AI</summary>
                                            <pre className="whitespace-pre-wrap break-words mt-1">
                                              {JSON.stringify(t.data_summary, null, 2)}
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 space-y-2">
                                        <p className="text-xs text-amber-800 font-medium">
                                          Cliente non identificato dall'email del mittente.
                                        </p>
                                        {candidates.length > 0 && (
                                          <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                              Possibili clienti
                                            </p>
                                            {candidates.map((c) => (
                                              <div key={c.email} className="flex items-center justify-between gap-2">
                                                <a
                                                  className="text-primary text-xs inline-flex items-center gap-1 hover:underline"
                                                  href={`/admin/clienti/${encodeURIComponent(c.email)}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  {c.email}
                                                  {c.name ? ` · ${c.name}` : ""}
                                                  <ExternalLink className="h-3 w-3" />
                                                </a>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-7 text-xs gap-1"
                                                  disabled={busy === `${t.id}:link`}
                                                  onClick={() => void handleLink(t, c.email)}
                                                >
                                                  <UserPlus className="h-3 w-3" />
                                                  Collega
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        <div className="flex gap-2 items-center pt-1">
                                          <Input
                                            type="text"
                                            placeholder="collega un'altra email…"
                                            value={linkEmail[t.id] ?? ""}
                                            onChange={(e) =>
                                              setLinkEmail((m) => ({ ...m, [t.id]: e.target.value }))
                                            }
                                            className="h-8 text-xs"
                                          />
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs"
                                            disabled={busy === `${t.id}:link`}
                                            onClick={() => void handleLink(t, linkEmail[t.id] ?? "")}
                                          >
                                            Collega
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {t.ai_note && (
                                    <div>
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                        Nota dell'AI {t.ai_confidence ? `· confidenza ${t.ai_confidence}` : ""}
                                      </p>
                                      <p className="text-xs text-foreground/80">{t.ai_note}</p>
                                    </div>
                                  )}
                                  {t.error && (
                                    <p className="text-xs text-destructive font-mono">{t.error}</p>
                                  )}
                                </div>

                                {/* Draft + actions */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                      Bozza di risposta
                                    </p>
                                    <div className="flex items-center gap-1">
                                      {t.status === "ignored" && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs gap-1"
                                          disabled={busy === `${t.id}:regen`}
                                          onClick={() => void handleRegenerate(t, true)}
                                        >
                                          {busy === `${t.id}:regen` ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                          Tratta come ticket
                                        </Button>
                                      )}
                                      {t.status !== "ignored" && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-xs gap-1 text-muted-foreground"
                                          disabled={busy === `${t.id}:ignore`}
                                          onClick={() => void handleAction(t, "ignore")}
                                        >
                                          {busy === `${t.id}:ignore` ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Ban className="h-3 w-3" />
                                          )}
                                          Ignora
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                                        disabled={busy === `${t.id}:delete`}
                                        onClick={() => void handleAction(t, "delete")}
                                      >
                                        {busy === `${t.id}:delete` ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3 w-3" />
                                        )}
                                        Elimina
                                      </Button>
                                    </div>
                                  </div>

                                  {t.status === "ignored" ? (
                                    <p className="text-xs text-muted-foreground">
                                      Ignorato ({t.category || "—"}
                                      {t.triage_reason ? `: ${t.triage_reason}` : ""}). Usa "Tratta come ticket"
                                      per generare una risposta.
                                    </p>
                                  ) : (
                                    <>
                                      <Textarea
                                        rows={10}
                                        value={draftEdits[t.id] ?? t.draft_body ?? ""}
                                        onChange={(e) => setDraftEdits((m) => ({ ...m, [t.id]: e.target.value }))}
                                        placeholder={
                                          t.status === "received" || t.status === "drafting"
                                            ? "Generazione bozza in corso…"
                                            : "Nessuna bozza."
                                        }
                                        className="text-sm"
                                      />
                                      {matched && readyReports(t).length > 0 && (
                                        <div className="rounded-lg border border-border/60 p-2 space-y-1">
                                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                            <Paperclip className="h-3 w-3" /> Allegati (PDF report)
                                          </p>
                                          {readyReports(t).map((r) => {
                                            const checked = selectedAttachIds(t).has(r.id!);
                                            return (
                                              <label
                                                key={r.id}
                                                className="flex items-center gap-2 text-xs cursor-pointer"
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={checked}
                                                  onChange={() => toggleAttach(t, r.id!)}
                                                />
                                                <span>{r.name ? `Carta natal · ${r.name}` : "Carta natal"}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 justify-end">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="gap-1.5"
                                          disabled={busy === `${t.id}:regen`}
                                          onClick={() => void handleRegenerate(t)}
                                        >
                                          {busy === `${t.id}:regen` ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <RefreshCw className="h-3.5 w-3.5" />
                                          )}
                                          Rigenera
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="gap-1.5"
                                          disabled={busy === `${t.id}:send` || t.status === "answered"}
                                          onClick={() => void handleSend(t)}
                                        >
                                          {busy === `${t.id}:send` ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Send className="h-3.5 w-3.5" />
                                          )}
                                          {t.status === "answered" ? "Inviata" : "Invia"}
                                        </Button>
                                      </div>
                                      {translated[t.id]?.draft && (
                                        <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                                          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700/80 mb-1">
                                            🇮🇹 Bozza tradotta (solo per te — la risposta resta in {t.reply_language || "lingua del cliente"})
                                          </p>
                                          <p className="text-foreground/90 whitespace-pre-wrap text-sm max-h-64 overflow-auto">
                                            {translated[t.id].draft}
                                          </p>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {data && data.total > items.length && (
              <p className="text-xs text-muted-foreground text-center">
                Mostrati {items.length} di {data.total}. Affina i filtri.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminSupport;
