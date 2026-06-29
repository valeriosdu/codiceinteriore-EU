import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, LayoutDashboard, LifeBuoy, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import CustomerHeader from "@/components/admin/customer-detail/CustomerHeader";
import AnagraficaTab from "@/components/admin/customer-detail/AnagraficaTab";
import ReportsTab from "@/components/admin/customer-detail/ReportsTab";
import PaymentsTab from "@/components/admin/customer-detail/PaymentsTab";
import TransitsTab from "@/components/admin/customer-detail/TransitsTab";
import FeedbackTab from "@/components/admin/customer-detail/FeedbackTab";
import CoppiaTab from "@/components/admin/customer-detail/CoppiaTab";
import ConfirmActionDialog from "@/components/admin/dialogs/ConfirmActionDialog";
import EditBirthDataDialog from "@/components/admin/dialogs/EditBirthDataDialog";
import CreateReportDialog from "@/components/admin/dialogs/CreateReportDialog";
import RecoverOrphanDialog from "@/components/admin/dialogs/RecoverOrphanDialog";
import TriggerTransitDialog from "@/components/admin/dialogs/TriggerTransitDialog";
import NewTransitCycleDialog from "@/components/admin/dialogs/NewTransitCycleDialog";
import EditEmailDialog from "@/components/admin/dialogs/EditEmailDialog";
import MergeCustomerDialog from "@/components/admin/dialogs/MergeCustomerDialog";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import {
  useAdminCustomerDetail,
  type CheckoutRow,
  type QuizSessionDetail,
  type SynastrySessionRow,
  type TransitCycleRow,
  type TransitSubscriptionRow,
} from "@/hooks/admin/useAdminCustomerDetail";
import { useAdminMutations } from "@/hooks/admin/useAdminMutations";
import type { CustomerActionHandlers } from "@/components/admin/customer-detail/actions";

export default function AdminCustomerDetail() {
  const { secret, isAuthed, login, clearOnAuthError } = useAdminAuth();
  const navigate = useNavigate();
  const { emailEncoded } = useParams<{ emailEncoded: string }>();
  // decodeURIComponent throwa su sequenze % malformate. Difensivo perché un
  // bookmark vecchio o un link guasto non deve crashare la pagina.
  const email = useMemo(() => {
    if (!emailEncoded) return "";
    try {
      return decodeURIComponent(emailEncoded);
    } catch {
      return emailEncoded;
    }
  }, [emailEncoded]);

  const query = useAdminCustomerDetail({
    secret,
    email,
    onAuthError: clearOnAuthError,
  });

  const mutations = useAdminMutations({
    secret,
    email,
    onAuthError: clearOnAuthError,
  });

  // Dialog state — un dialog per volta è il pattern più semplice e l'admin
  // non beneficia da poter aprirne due in parallelo.
  const [editQuiz, setEditQuiz] = useState<QuizSessionDetail | null>(null);
  const [deleteQuiz, setDeleteQuiz] = useState<QuizSessionDetail | null>(null);
  const [regenerateQuiz, setRegenerateQuiz] = useState<QuizSessionDetail | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [recoverOrphanCheckout, setRecoverOrphanCheckout] = useState<CheckoutRow | null>(null);
  const [triggerCycle, setTriggerCycle] = useState<TransitCycleRow | null>(null);
  const [deleteCycle, setDeleteCycle] = useState<TransitCycleRow | null>(null);
  const [newCycleTarget, setNewCycleTarget] = useState<{
    quizSessionId: string;
    lastCycleEnd: string | null;
  } | null>(null);
  const [recoverSub, setRecoverSub] = useState<TransitSubscriptionRow | null>(null);
  const [regenerateSynastry, setRegenerateSynastry] = useState<SynastrySessionRow | null>(null);
  const [deleteSynastry, setDeleteSynastry] = useState<SynastrySessionRow | null>(null);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  useEffect(() => {
    if (email) document.title = `${email} · Admin · Codice Interiore`;
  }, [email]);

  // Mappa "azione+id → in corso" così i singoli card mostrano lo spinner solo
  // sul proprio bottone. Le chiavi derivano da `mutation.variables` (e non dallo
  // state dei dialog) così lo spinner resta visibile anche se l'utente chiude
  // il dialog prima che la mutation completi.
  const isPending: CustomerActionHandlers["isPending"] = useMemo(() => {
    const map: Record<string, boolean> = {};
    const m = mutations;
    if (m.regenerateReport.isPending && m.regenerateReport.variables) {
      map[`regenerate:${m.regenerateReport.variables.quizSessionId}`] = true;
    }
    if (m.deleteReport.isPending && m.deleteReport.variables) {
      map[`delete:${m.deleteReport.variables.quizSessionId}`] = true;
    }
    if (m.updateBirthData.isPending && m.updateBirthData.variables) {
      map[`edit:${m.updateBirthData.variables.quizSessionId}`] = true;
    }
    if (m.recoverOrphan.isPending && m.recoverOrphan.variables) {
      map[`recover:${m.recoverOrphan.variables.stripeSessionId}`] = true;
    }
    if (m.triggerTransitCycle.isPending && m.triggerTransitCycle.variables?.transitCycleId) {
      map[`triggerCycle:${m.triggerTransitCycle.variables.transitCycleId}`] = true;
    }
    if (m.deleteTransitCycle.isPending && m.deleteTransitCycle.variables) {
      map[`deleteCycle:${m.deleteTransitCycle.variables.transitCycleId}`] = true;
    }
    if (m.extendEntitlement.isPending && m.extendEntitlement.variables) {
      map[`extend:${m.extendEntitlement.variables.entitlementId}`] = true;
    }
    if (m.recoverTransitSubscription.isPending && m.recoverTransitSubscription.variables) {
      map[`recoverSub:${m.recoverTransitSubscription.variables.subscription_id}`] = true;
    }
    if (m.downloadPdf.isPending && m.downloadPdf.variables) {
      const v = m.downloadPdf.variables;
      if (v.kind === "transit" && v.transitCycleId) {
        map[`downloadTransit:${v.transitCycleId}`] = true;
      } else {
        map[`download:${v.sessionId}`] = true;
      }
    }
    if (m.createReport.isPending) map["create"] = true;
    if (m.createTransit.isPending) {
      map["create"] = true;
      if (m.createTransit.variables?.quizSessionId) {
        map[`newCycle:${m.createTransit.variables.quizSessionId}`] = true;
      }
    }
    if (m.createSynastry.isPending) map["create"] = true;
    if (m.mergeCustomer.isPending) map["merge"] = true;
    return map;
  }, [
    mutations.regenerateReport.isPending,
    mutations.regenerateReport.variables,
    mutations.deleteReport.isPending,
    mutations.deleteReport.variables,
    mutations.updateBirthData.isPending,
    mutations.updateBirthData.variables,
    mutations.recoverOrphan.isPending,
    mutations.recoverOrphan.variables,
    mutations.triggerTransitCycle.isPending,
    mutations.triggerTransitCycle.variables,
    mutations.deleteTransitCycle.isPending,
    mutations.deleteTransitCycle.variables,
    mutations.extendEntitlement.isPending,
    mutations.extendEntitlement.variables,
    mutations.recoverTransitSubscription.isPending,
    mutations.recoverTransitSubscription.variables,
    mutations.downloadPdf.isPending,
    mutations.downloadPdf.variables,
    mutations.createReport.isPending,
    mutations.createTransit.isPending,
    mutations.createSynastry.isPending,
    mutations.mergeCustomer.isPending,
  ]);

  const actions: CustomerActionHandlers = {
    isPending,
    onEditQuiz: (qs) => setEditQuiz(qs),
    onGenerateReport: (qs) => mutations.updateBirthData.mutate({ quizSessionId: qs.id }),
    onRegenerateReport: (qs) => setRegenerateQuiz(qs),
    onDeleteReport: (qs) => setDeleteQuiz(qs),
    onDownloadNatalPdf: (qs) =>
      mutations.downloadPdf.mutate({ sessionId: qs.id, kind: "natale" }),
    onRecoverOrphan: (c) => setRecoverOrphanCheckout(c),
    onTriggerCycle: (c) => setTriggerCycle(c),
    onDeleteTransitCycle: (c) => setDeleteCycle(c),
    onDownloadTransitPdf: (c) =>
      mutations.downloadPdf.mutate({
        sessionId: c.quiz_session_id,
        kind: "transit",
        transitCycleId: c.id,
      }),
    onExtendEntitlement: (entitlementId, endsAt) =>
      mutations.extendEntitlement.mutate({ entitlementId, endsAt }),
    onRecoverSubscription: (s) => setRecoverSub(s),
    onCreateNewTransitCycle: (quizSessionId, lastCycleEnd) =>
      setNewCycleTarget({ quizSessionId, lastCycleEnd }),
    onCreateNewReport: () => setCreateOpen(true),
    onMergeCustomer: () => setMergeOpen(true),
  };

  return (
    <AdminAuthGate
      isAuthed={isAuthed}
      onLogin={login}
      title="Area Admin · Cliente"
      description="Inserisci la password admin per vedere la scheda cliente."
    >
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/clienti">
                <ArrowLeft className="h-4 w-4 mr-2" /> Tutti i clienti
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <a href="/admin/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </a>
              </Button>
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <a href="/admin/astrology-guide">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Guida astrologica</span>
                </a>
              </Button>
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <a href="/admin/support">
                  <LifeBuoy className="h-4 w-4" />
                  <span className="hidden sm:inline">Assistenza</span>
                </a>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-6 space-y-5">
          {query.isLoading && (
            <div className="rounded-2xl border border-border bg-surface p-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Caricamento scheda cliente…
            </div>
          )}

          {query.error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-3 text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Errore caricamento</div>
                <p className="text-sm mt-1">
                  {query.error instanceof Error ? query.error.message : "Errore sconosciuto"}
                </p>
              </div>
            </div>
          )}

          {query.data && (
            <>
              <CustomerHeader detail={query.data} actions={actions} />

              <Tabs defaultValue="anagrafica" className="space-y-4">
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="anagrafica">Anagrafica</TabsTrigger>
                  <TabsTrigger value="reports">
                    Report ({query.data.quiz_sessions.length})
                  </TabsTrigger>
                  <TabsTrigger value="payments">
                    Pagamenti (
                    {
                      query.data.checkouts.filter(
                        (c) => c.purchase_type !== "transits_subscription",
                      ).length
                    }
                    )
                  </TabsTrigger>
                  <TabsTrigger value="transits">
                    Transiti ({query.data.transit_cycles.length})
                  </TabsTrigger>
                  <TabsTrigger value="coppia">
                    Coppia ({query.data.synastry_sessions?.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="feedback">
                    Feedback ({query.data.feedback.length + query.data.contacts_log.count})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="anagrafica">
                  <AnagraficaTab
                    detail={query.data}
                    onEditEmail={query.data.profile ? () => setEditEmailOpen(true) : undefined}
                    onSendRecovery={
                      query.data.profile
                        ? () =>
                            mutations.updateUserAuth.mutate({
                              userId: query.data!.profile!.user_id,
                              sendRecovery: true,
                            })
                        : undefined
                    }
                    recoveryBusy={mutations.updateUserAuth.isPending}
                    onUnmerge={(secondaryEmail) =>
                      mutations.unmergeCustomer.mutate({ secondaryEmail })
                    }
                    unmergeBusy={mutations.unmergeCustomer.isPending}
                  />
                </TabsContent>
                <TabsContent value="reports">
                  <ReportsTab detail={query.data} actions={actions} />
                </TabsContent>
                <TabsContent value="payments">
                  <PaymentsTab detail={query.data} actions={actions} />
                </TabsContent>
                <TabsContent value="transits">
                  <TransitsTab detail={query.data} actions={actions} />
                </TabsContent>
                <TabsContent value="coppia">
                  <CoppiaTab
                    detail={query.data}
                    secret={secret}
                    onRegenerate={(s) => setRegenerateSynastry(s)}
                    onDelete={(s) => setDeleteSynastry(s)}
                  />
                </TabsContent>
                <TabsContent value="feedback">
                  <FeedbackTab detail={query.data} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>

      {/* Dialogs (montati solo quando hanno un target) */}
      <EditBirthDataDialog
        open={editQuiz != null}
        onClose={() => setEditQuiz(null)}
        busy={mutations.updateBirthData.isPending}
        quiz={editQuiz}
        onSubmit={(vars) => {
          mutations.updateBirthData.mutate(vars, {
            onSuccess: () => setEditQuiz(null),
          });
        }}
      />

      <ConfirmActionDialog
        open={regenerateQuiz != null}
        onClose={() => setRegenerateQuiz(null)}
        busy={mutations.regenerateReport.isPending}
        title="Rigenera report"
        description={
          <span>
            Rigenera il report per <strong>{regenerateQuiz?.user_name ?? "—"}</strong>?
            Verranno effettuate nuove chiamate a freeastroapi + Gemini (costo).
          </span>
        }
        confirmLabel="Rigenera"
        onConfirm={() => {
          if (!regenerateQuiz) return;
          mutations.regenerateReport.mutate(
            { quizSessionId: regenerateQuiz.id, includeTransits: true },
            { onSuccess: () => setRegenerateQuiz(null) },
          );
        }}
      />

      <ConfirmActionDialog
        open={deleteQuiz != null}
        onClose={() => setDeleteQuiz(null)}
        busy={mutations.deleteReport.isPending}
        title="Cancella report"
        description={
          <span>
            Soft-delete del report di{" "}
            <strong>{deleteQuiz?.user_name ?? "—"}</strong>: il cliente non potrà più
            accedervi, il pagamento resta a libro. Indica il motivo per il log.
          </span>
        }
        confirmLabel="Cancella"
        confirmVariant="destructive"
        requireReason
        onConfirm={(reason) => {
          if (!deleteQuiz) return;
          mutations.deleteReport.mutate(
            { quizSessionId: deleteQuiz.id, reason },
            { onSuccess: () => setDeleteQuiz(null) },
          );
        }}
      />

      <CreateReportDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        busyNatal={mutations.createReport.isPending}
        busyTransit={mutations.createTransit.isPending}
        busySynastry={mutations.createSynastry.isPending}
        prefilledEmail={email}
        availableReports={query.data?.quiz_sessions ?? []}
        onSubmitNatal={(payload) => {
          mutations.createReport.mutate(payload, {
            onSuccess: () => setCreateOpen(false),
          });
        }}
        onSubmitTransit={(payload) => {
          mutations.createTransit.mutate(payload, {
            onSuccess: () => setCreateOpen(false),
          });
        }}
        onSubmitSynastry={(payload) => {
          mutations.createSynastry.mutate(payload, {
            onSuccess: () => setCreateOpen(false),
          });
        }}
      />

      <RecoverOrphanDialog
        open={recoverOrphanCheckout != null}
        onClose={() => setRecoverOrphanCheckout(null)}
        busy={mutations.recoverOrphan.isPending}
        checkout={recoverOrphanCheckout}
        onSubmit={(vars) => {
          mutations.recoverOrphan.mutate(vars, {
            onSuccess: () => setRecoverOrphanCheckout(null),
          });
        }}
      />

      <TriggerTransitDialog
        open={triggerCycle != null}
        onClose={() => setTriggerCycle(null)}
        busy={mutations.triggerTransitCycle.isPending}
        cycle={triggerCycle}
        onSubmit={(vars) => {
          mutations.triggerTransitCycle.mutate(vars, {
            onSuccess: () => setTriggerCycle(null),
          });
        }}
      />

      <ConfirmActionDialog
        open={deleteCycle != null}
        onClose={() => setDeleteCycle(null)}
        busy={mutations.deleteTransitCycle.isPending}
        title="Cancella ciclo transiti"
        description={
          <span>
            Cancella il ciclo{" "}
            <strong>
              {deleteCycle
                ? `${deleteCycle.period_start} → ${deleteCycle.period_end}`
                : "—"}
            </strong>
            ? L'operazione non e' reversibile (il ciclo è rigenerabile creandone
            uno nuovo).
          </span>
        }
        confirmLabel="Cancella"
        confirmVariant="destructive"
        onConfirm={() => {
          if (!deleteCycle) return;
          mutations.deleteTransitCycle.mutate(
            { transitCycleId: deleteCycle.id },
            { onSuccess: () => setDeleteCycle(null) },
          );
        }}
      />

      <NewTransitCycleDialog
        open={newCycleTarget != null}
        onClose={() => setNewCycleTarget(null)}
        busy={mutations.createTransit.isPending}
        quizSessionId={newCycleTarget?.quizSessionId ?? null}
        lastCycleEnd={newCycleTarget?.lastCycleEnd ?? null}
        onSubmit={(vars) => {
          mutations.createTransit.mutate(vars, {
            onSuccess: () => setNewCycleTarget(null),
          });
        }}
      />

      <ConfirmActionDialog
        open={recoverSub != null}
        onClose={() => setRecoverSub(null)}
        busy={mutations.recoverTransitSubscription.isPending}
        title="Riconcilia subscription transiti"
        description={
          <span>
            Riconcilia l'abbonamento{" "}
            <span className="font-mono text-xs">
              {recoverSub?.stripe_subscription_id}
            </span>{" "}
            interrogando Stripe e ricreando le righe locali se mancanti. Non
            invia email al cliente.
          </span>
        }
        confirmLabel="Riconcilia"
        onConfirm={() => {
          if (!recoverSub) return;
          mutations.recoverTransitSubscription.mutate(
            { subscription_id: recoverSub.stripe_subscription_id, skipEmail: true },
            { onSuccess: () => setRecoverSub(null) },
          );
        }}
      />

      <ConfirmActionDialog
        open={regenerateSynastry != null}
        onClose={() => setRegenerateSynastry(null)}
        busy={mutations.regenerateSynastry.isPending}
        title="Rigenera sinastria"
        description={
          <span>
            Rigenera il report sinastria di{" "}
            <strong>
              {regenerateSynastry?.person_a_name ?? "—"} &amp;{" "}
              {regenerateSynastry?.person_b_name ?? "—"}
            </strong>
            ? Verranno effettuate nuove chiamate a Gemini (costo).
          </span>
        }
        confirmLabel="Rigenera"
        onConfirm={() => {
          if (!regenerateSynastry) return;
          mutations.regenerateSynastry.mutate(
            { synastrySessionId: regenerateSynastry.id },
            { onSuccess: () => setRegenerateSynastry(null) },
          );
        }}
      />

      <ConfirmActionDialog
        open={deleteSynastry != null}
        onClose={() => setDeleteSynastry(null)}
        busy={mutations.deleteSynastry.isPending}
        title="Cancella sinastria"
        description={
          <span>
            Cancella la sinastria di{" "}
            <strong>
              {deleteSynastry?.person_a_name ?? "—"} &amp;{" "}
              {deleteSynastry?.person_b_name ?? "—"}
            </strong>
            ? L'operazione non e' reversibile.
          </span>
        }
        confirmLabel="Cancella"
        confirmVariant="destructive"
        onConfirm={() => {
          if (!deleteSynastry) return;
          mutations.deleteSynastry.mutate(
            { synastrySessionId: deleteSynastry.id },
            { onSuccess: () => setDeleteSynastry(null) },
          );
        }}
      />

      <MergeCustomerDialog
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        busy={mutations.mergeCustomer.isPending}
        currentEmail={query.data?.email ?? email}
        onSubmit={(vars) => {
          mutations.mergeCustomer.mutate(vars, {
            onSuccess: () => {
              setMergeOpen(false);
              navigate(`/admin/clienti/${encodeURIComponent(vars.primaryEmail)}`, {
                replace: true,
              });
            },
          });
        }}
      />

      {query.data?.profile && (
        <EditEmailDialog
          open={editEmailOpen}
          onClose={() => setEditEmailOpen(false)}
          busy={mutations.updateUserAuth.isPending}
          userId={query.data.profile.user_id}
          currentEmail={query.data.profile.email ?? email}
          onSubmit={(vars) => {
            mutations.updateUserAuth.mutate(vars, {
              onSuccess: () => {
                setEditEmailOpen(false);
                if (vars.newEmail) {
                  navigate(`/admin/clienti/${encodeURIComponent(vars.newEmail)}`, { replace: true });
                }
              },
            });
          }}
        />
      )}
    </AdminAuthGate>
  );
}
