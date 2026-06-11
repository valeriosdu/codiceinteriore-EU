// Admin tool for the Astrology Guide.
// Three operations:
//   1. List + search questions (by status, by email substring)
//   2. Manually grant credits to a user
//   3. Force-regenerate a single question
// Auth: shares the admin password convention with AdminDashboard / AdminCustomersList
// (sessionStorage key "ci_admin_secret"). Edge functions verify x-admin-secret.

import { Fragment, useEffect, useRef, useState } from "react";
import {
  Loader2,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Search,
  Plus,
  Mail,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

const SECRET_KEY = "ci_admin_secret";
const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const LIST_URL = `${BASE_URL}/functions/v1/admin-astrology-questions-list`;
const GRANT_URL = `${BASE_URL}/functions/v1/admin-grant-astrology-credits`;
const REGEN_URL = `${BASE_URL}/functions/v1/admin-regenerate-astrology-question`;
const LOOKUP_URL = `${BASE_URL}/functions/v1/admin-astrology-credits-lookup`;

type Status = "pending" | "processing" | "ready" | "completed" | "failed";

type Question = {
  id: string;
  profile_id: string;
  quiz_session_id: string;
  section_id: string | null;
  question: string;
  answer: string | null;
  status: Status;
  scheduled_for: string;
  processed_at: string | null;
  email_sent_at: string | null;
  is_free: boolean;
  retry_count: number;
  error: string | null;
  created_at: string;
  updated_at: string;
  email: string | null;
  user_name: string | null;
};

type Aggregate = {
  total: number;
  by_status: { pending: number; processing: number; ready?: number; completed: number; failed: number };
  is_free: number;
  is_paid: number;
  packs_purchased: number;
};

type ListResponse = {
  items: Question[];
  total: number;
  aggregate: Aggregate;
};

type CreditsLookupSession = {
  quiz_session_id: string;
  balance: number;
  total_granted: number;
  total_used: number;
  user_name: string | null;
  birth_place: string | null;
  session_created_at: string | null;
  last_question_at: string | null;
  last_question_status: string | null;
  total_questions: number;
};

type CreditsLookupMatch = {
  profile: { id: string; email: string; created_at: string };
  sessions: CreditsLookupSession[];
};

type CreditsLookupResponse = {
  matches: CreditsLookupMatch[];
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

const truncate = (s: string | null | undefined, max: number) => {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
};

const StatusBadge = ({ status }: { status: Status }) => {
  const tone =
    status === "completed"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
      : status === "failed"
        ? "bg-destructive/10 text-destructive border-destructive/30"
        : status === "processing"
          ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
          : status === "ready"
            ? "bg-violet-500/10 text-violet-700 border-violet-500/30"
            : "bg-amber-500/15 text-amber-700 border-amber-500/30";
  return (
    <span
      className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border font-medium ${tone}`}
    >
      {status}
    </span>
  );
};

const StatCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="font-display text-2xl font-semibold text-foreground">{value}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </CardContent>
  </Card>
);

const PAGE_SIZE = 100;

const AdminAstrologyGuide = () => {
  const [secret, setSecret] = useState<string>(() => sessionStorage.getItem(SECRET_KEY) || "");
  const [secretInput, setSecretInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [emailFilter, setEmailFilter] = useState("");
  const [emailQuery, setEmailQuery] = useState(""); // committed search term

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const [grantOpen, setGrantOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantAmount, setGrantAmount] = useState("10");
  const [grantReason, setGrantReason] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<CreditsLookupResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

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
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({
          status: statusFilter === "all" ? null : statusFilter,
          email: emailQuery || null,
          limit: PAGE_SIZE,
          offset: 0,
        }),
        signal: controller.signal,
      });
      if (res.status === 403) {
        setAuthError(true);
        sessionStorage.removeItem(SECRET_KEY);
        setSecret("");
        toast.error("Password non valida.");
        return;
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const serverMsg =
          errBody && typeof errBody.error === "string" ? errBody.error : null;
        throw new Error(
          serverMsg ? `Errore nel caricamento: ${serverMsg}` : "Errore nel caricamento.",
        );
      }
      const json = (await res.json()) as ListResponse;
      if (controller.signal.aborted) return;
      setData(json);
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      console.error(err);
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
  }, [secret, statusFilter, emailQuery]);

  // Live search: commit the typed email after a short pause so the list filters
  // as you type, without needing the "Cerca" button. Each committed value
  // triggers load() above; in-flight requests are aborted there.
  useEffect(() => {
    const handle = setTimeout(() => {
      setEmailQuery(emailFilter.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [emailFilter]);

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim()) return;
    sessionStorage.setItem(SECRET_KEY, secretInput.trim());
    setSecret(secretInput.trim());
    setSecretInput("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SECRET_KEY);
    setSecret("");
    setData(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailQuery(emailFilter.trim());
  };

  const handleRegenerate = async (q: Question) => {
    if (regenerating) return;
    if (!confirm(`Rigenerare la risposta per "${truncate(q.question, 80)}"?`)) return;
    setRegenerating(q.id);
    try {
      const res = await fetch(REGEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ questionId: q.id, immediate: true }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      toast.success("Rigenerazione avviata. Aggiorna tra qualche secondo.");
      // Refresh after a short delay so the worker has time to write back.
      setTimeout(() => void load(), 4000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore.");
    } finally {
      setRegenerating(null);
    }
  };

  const handleLookup = async () => {
    if (!grantEmail.trim()) {
      toast.error("Inserisci un'email.");
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const res = await fetch(LOOKUP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ email: grantEmail.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = (json as { error?: string }).error || `HTTP ${res.status}`;
        setLookupError(errMsg);
        return;
      }
      setLookupResult(json as CreditsLookupResponse);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Errore.");
    } finally {
      setLookupLoading(false);
    }
  };

  // Reset lookup state when the dialog closes or the email changes.
  const resetGrantDialog = () => {
    setGrantEmail("");
    setGrantAmount("10");
    setGrantReason("");
    setLookupResult(null);
    setLookupError(null);
  };

  const handleGrant = async () => {
    const amount = parseInt(grantAmount, 10);
    if (!grantEmail.trim()) {
      toast.error("Email obbligatoria.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100) {
      toast.error("Inserisci un numero di crediti tra 1 e 100.");
      return;
    }
    setGrantLoading(true);
    try {
      const res = await fetch(GRANT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({
          email: grantEmail.trim(),
          amount,
          reason: grantReason.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        new_balance?: number;
        error?: string;
      };
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      toast.success(
        `Crediti aggiunti. Nuovo balance: ${json.new_balance ?? "?"}.`,
      );
      setGrantOpen(false);
      resetGrantDialog();
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore.");
    } finally {
      setGrantLoading(false);
    }
  };

  if (!secret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="font-display">Guida astrologica · Admin</CardTitle>
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
              {authError && (
                <p className="text-xs text-destructive text-center">
                  Password non valida.
                </p>
              )}
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
            <h1 className="font-display text-base font-semibold">
              Guida astrologica · Admin
            </h1>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGrantOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Concedi crediti</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Aggiorna</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Esci</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto py-8 space-y-6">
        {aggregate && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard label="Totale" value={aggregate.total} />
            <StatCard
              label="In generazione"
              value={aggregate.by_status.pending + aggregate.by_status.processing}
              hint={`${aggregate.by_status.pending} pending · ${aggregate.by_status.processing} processing`}
            />
            <StatCard
              label="In attesa"
              value={aggregate.by_status.ready ?? 0}
              hint="Pronte da rilasciare"
            />
            <StatCard label="Completate" value={aggregate.by_status.completed} />
            <StatCard label="Fallite" value={aggregate.by_status.failed} />
            <StatCard
              label="Free / Paid"
              value={`${aggregate.is_free} / ${aggregate.is_paid}`}
            />
            <StatCard
              label="Pacchetti acquistati"
              value={aggregate.packs_purchased}
              hint="10 domande per pacchetto"
            />
          </div>
        )}

        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Stato
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as Status | "all")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    <SelectItem value="pending">Pending (in generazione)</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="ready">Ready (in attesa di rilascio)</SelectItem>
                    <SelectItem value="completed">Completate</SelectItem>
                    <SelectItem value="failed">Fallite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <form onSubmit={handleSearch} className="flex-1 flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email utente
                  </label>
                  <Input
                    type="text"
                    placeholder="anna@..."
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="outline" size="default" className="gap-1.5">
                  <Search className="h-4 w-4" />
                  Cerca
                </Button>
              </form>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Data</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Domanda</TableHead>
                    <TableHead className="w-[110px]">Stato</TableHead>
                    <TableHead className="w-[60px] text-right">Free</TableHead>
                    <TableHead className="w-[120px] text-right">Azioni</TableHead>
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
                        Nessuna domanda trovata con questi filtri.
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((q) => (
                    <Fragment key={q.id}>
                      <TableRow className="cursor-pointer hover:bg-secondary/50">
                        <TableCell
                          className="text-xs text-muted-foreground"
                          onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                        >
                          {formatDate(q.created_at)}
                        </TableCell>
                        <TableCell
                          className="text-xs"
                          onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                        >
                          <div className="flex flex-col">
                            <span className="text-foreground">{q.email || "—"}</span>
                            {q.user_name && (
                              <span className="text-muted-foreground/80">{q.user_name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-sm"
                          onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span>{truncate(q.question, 80)}</span>
                            {expandedId === q.id ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={q.status} />
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          {q.is_free ? "✦" : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegenerate(q)}
                            disabled={regenerating === q.id}
                            className="text-xs gap-1.5"
                          >
                            {regenerating === q.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Rigenera
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedId === q.id && (
                        <TableRow className="bg-secondary/30">
                          <TableCell colSpan={6} className="py-4">
                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                  Domanda completa
                                </p>
                                <p className="text-foreground/90 whitespace-pre-wrap">
                                  {q.question}
                                </p>
                              </div>
                              {q.answer && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                    Risposta
                                  </p>
                                  <div className="text-foreground/90 whitespace-pre-wrap rounded-lg bg-background p-3 border border-border/60">
                                    {q.answer}
                                  </div>
                                </div>
                              )}
                              {q.error && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-1">
                                    Errore
                                  </p>
                                  <p className="text-xs text-destructive font-mono">{q.error}</p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground pt-2 border-t border-border/40">
                                <div>
                                  <p className="font-medium text-muted-foreground">Programmato</p>
                                  <p>{formatDate(q.scheduled_for)}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-muted-foreground">Risposta</p>
                                  <p>{formatDate(q.processed_at)}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-muted-foreground">Email inviata</p>
                                  <p>{formatDate(q.email_sent_at)}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-muted-foreground">Sezione</p>
                                  <p>{q.section_id || "—"}</p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
            {data && data.total > items.length && (
              <p className="text-xs text-muted-foreground text-center">
                Mostrate {items.length} di {data.total}. Affina i filtri per vederne altre.
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={grantOpen}
        onOpenChange={(o) => {
          setGrantOpen(o);
          if (!o) resetGrantDialog();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crediti cliente</DialogTitle>
            <DialogDescription>
              Cerca un cliente per email (anche solo una parte) per vedere i crediti rimanenti,
              oppure aggiungi crediti al report più recente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email cliente
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleLookup();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="cliente@... o parte dell'email"
                    value={grantEmail}
                    onChange={(e) => {
                      setGrantEmail(e.target.value);
                      // Invalidate previous lookup when email changes
                      if (lookupResult || lookupError) {
                        setLookupResult(null);
                        setLookupError(null);
                      }
                    }}
                    className="pl-9"
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={lookupLoading || !grantEmail.trim()}
                  className="gap-1.5"
                >
                  {lookupLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Cerca
                </Button>
              </form>
              {lookupError && (
                <p className="text-xs text-destructive pt-1">{lookupError}</p>
              )}
            </div>

            {lookupResult && (
              <div className="space-y-2">
                {lookupResult.matches.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {lookupResult.matches.length} profili trovati. Clicca "Seleziona" per usare quell'email esatta nel form di sotto.
                  </p>
                )}
                {lookupResult.matches.map((m) => {
                  const isSelected =
                    grantEmail.trim().toLowerCase() === (m.profile.email || "").toLowerCase();
                  return (
                    <div
                      key={m.profile.id}
                      className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Crediti per{" "}
                          <span className="font-mono normal-case text-foreground">
                            {m.profile.email}
                          </span>
                        </p>
                        {lookupResult.matches.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            disabled={isSelected || !m.profile.email}
                            onClick={() => setGrantEmail(m.profile.email || "")}
                            className="h-7 text-xs"
                          >
                            {isSelected ? "Selezionato" : "Seleziona"}
                          </Button>
                        )}
                      </div>
                      {m.sessions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Profilo trovato ma nessun report associato.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {m.sessions.map((s) => (
                            <div
                              key={s.quiz_session_id}
                              className="rounded-md bg-background border border-border/60 px-3 py-2 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">
                                  {s.user_name || "—"}
                                  {s.birth_place ? ` · ${s.birth_place}` : ""}
                                </span>
                                <span className="text-muted-foreground tabular-nums">
                                  <span className="text-foreground font-semibold">
                                    {s.balance}
                                  </span>
                                  {" / "}
                                  {s.total_granted} totali
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>
                                  {s.total_used} usate · {s.total_questions} domande totali
                                </span>
                                {s.last_question_at && (
                                  <span>Ultima: {formatDate(s.last_question_at)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-border pt-3 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Concedi crediti
              </p>
              <p className="text-xs text-muted-foreground">
                I crediti vanno al report più recente associato a questa email.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Crediti
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Motivo (opzionale)
                  </label>
                  <Input
                    type="text"
                    placeholder="Recupero domanda sbagliata"
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)} disabled={grantLoading}>
              Chiudi
            </Button>
            <Button onClick={handleGrant} disabled={grantLoading} className="gap-1.5">
              {grantLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Concedi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAstrologyGuide;
