// Mutation centralizzate per le azioni admin sulla scheda cliente.
// Ogni mutation invalida sia il dettaglio del cliente corrente sia la lista
// (prefix ['admin','customers']) così la pagina lista vede subito gli effetti.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface UseAdminMutationsArgs {
  secret: string;
  email?: string;
  onAuthError?: () => void;
}

async function callEdge<TBody extends Record<string, unknown>, TResp = unknown>(
  fnName: string,
  body: TBody,
  secret: string,
  onAuthError?: () => void,
): Promise<TResp> {
  const res = await fetch(`${BASE_URL}/functions/v1/${fnName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401 || res.status === 403) {
    onAuthError?.();
    throw new Error("Sessione admin scaduta o password non valida.");
  }
  const json: { error?: string } & Record<string, unknown> = await res
    .json()
    .catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || `Errore (HTTP ${res.status}).`);
  }
  return json as TResp;
}

export interface BirthDataUpdate {
  userName?: string;
  focusArea?: string;
  attachmentResponse?: string;
  birthDate?: { day: number; month: number; year: number };
  birthTime?: { hour: number; minute: number };
  birthPlace?: string;
  birthLat?: number;
  birthLng?: number;
  birthTimezone?: number;
  includeTransits?: boolean;
}

export interface CreateReportPayload {
  email?: string;
  userName: string;
  birthDate: { day: number; month: number; year: number };
  birthTime: { hour: number; minute: number };
  birthPlace: string;
  birthLat: number;
  birthLng: number;
  birthTimezone: number;
  focusArea?: string;
  attachmentResponse?: string;
}

// Anagrafica-only customer registration (no report, no Gemini cost). Email is
// required because it's what surfaces the customer in /admin/clienti; birth data
// is optional and only stored for a later generation.
export interface CreateCustomerPayload {
  email: string;
  userName: string;
  birthDate?: { day: number; month: number; year: number };
  birthTime?: { hour: number; minute: number };
  birthPlace?: string;
  birthLat?: number;
  birthLng?: number;
  birthTimezone?: number;
  focusArea?: string;
  attachmentResponse?: string;
}

export interface CreateTransitPayload {
  quizSessionId: string;
  periodStart?: string;
}

export interface SynastryPersonPayload {
  name: string;
  birthDate: { day: number; month: number; year: number };
  birthTime: { hour: number; minute: number } | null;
  timeKnown: boolean;
  birthPlace: string;
  birthLat: number;
  birthLng: number;
  birthTimezone: number;
  birthTimezoneIana?: string;
}

export interface CreateSynastryPayload {
  customerEmail: string;
  relationshipDuration?: string;
  personA: SynastryPersonPayload;
  personB: SynastryPersonPayload;
}

export function useAdminMutations({ secret, email, onAuthError }: UseAdminMutationsArgs) {
  const qc = useQueryClient();

  const invalidate = () => {
    if (email) {
      qc.invalidateQueries({ queryKey: ["admin", "customer", email.toLowerCase()] });
    }
    qc.invalidateQueries({ queryKey: ["admin", "customers"] });
  };

  const regenerateReport = useMutation({
    mutationFn: (vars: { quizSessionId: string; includeTransits?: boolean }) =>
      callEdge(
        "admin-regenerate-report",
        {
          quizSessionId: vars.quizSessionId,
          includeTransits: vars.includeTransits ?? true,
          ...(email ? { email } : {}),
        },
        secret,
        onAuthError,
      ),
    onSuccess: () => {
      toast.success("Rigenerazione avviata.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteReport = useMutation({
    mutationFn: (vars: { quizSessionId: string; reason?: string }) =>
      callEdge(
        "admin-delete-report",
        { quizSessionId: vars.quizSessionId, reason: vars.reason ?? "" },
        secret,
        onAuthError,
      ),
    onSuccess: () => {
      toast.success("Report cancellato.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateBirthData = useMutation({
    mutationFn: (vars: { quizSessionId: string } & BirthDataUpdate) => {
      const { quizSessionId, ...rest } = vars;
      return callEdge(
        "admin-update-quiz-session",
        { quizSessionId, ...rest },
        secret,
        onAuthError,
      );
    },
    onSuccess: () => {
      toast.success("Dati aggiornati. Rigenerazione in corso.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createReport = useMutation({
    mutationFn: (vars: CreateReportPayload) =>
      callEdge("admin-create-quiz-session", vars as unknown as Record<string, unknown>, secret, onAuthError),
    onSuccess: () => {
      toast.success("Nuovo report creato. Generazione in corso.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createCustomer = useMutation({
    mutationFn: (vars: CreateCustomerPayload) =>
      callEdge(
        "admin-create-quiz-session",
        { ...vars, skipGeneration: true } as unknown as Record<string, unknown>,
        secret,
        onAuthError,
      ),
    onSuccess: () => {
      toast.success("Cliente creato.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createTransit = useMutation({
    mutationFn: (vars: CreateTransitPayload) =>
      callEdge(
        "admin-create-transit-cycle",
        vars as unknown as Record<string, unknown>,
        secret,
        onAuthError,
      ),
    onSuccess: () => {
      toast.success("Ciclo transiti avviato.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const regenerateSynastry = useMutation({
    mutationFn: (vars: { synastrySessionId: string }) =>
      callEdge(
        "admin-regenerate-synastry-report",
        vars as unknown as Record<string, unknown>,
        secret,
        onAuthError,
      ),
    onSuccess: () => {
      toast.success("Rigenerazione sinastria avviata.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteSynastry = useMutation({
    mutationFn: (vars: { synastrySessionId: string }) =>
      callEdge(
        "admin-delete-synastry-report",
        vars as unknown as Record<string, unknown>,
        secret,
        onAuthError,
      ),
    onSuccess: () => {
      toast.success("Sinastria eliminata.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createSynastry = useMutation({
    mutationFn: (vars: CreateSynastryPayload) =>
      callEdge(
        "admin-create-synastry-session",
        vars as unknown as Record<string, unknown>,
        secret,
        onAuthError,
      ),
    onSuccess: () => {
      toast.success("Sinastria creata. Generazione in corso.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteTransitCycle = useMutation({
    mutationFn: (vars: { transitCycleId: string }) =>
      callEdge(
        "admin-delete-transit-cycle",
        vars as unknown as Record<string, unknown>,
        secret,
        onAuthError,
      ),
    onSuccess: () => {
      toast.success("Ciclo transiti cancellato.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const recoverOrphan = useMutation({
    mutationFn: (vars: { stripeSessionId: string; sendInvite: boolean; overrideEmail?: string }) =>
      callEdge(
        "admin-recover-orphan-checkout",
        {
          stripeSessionId: vars.stripeSessionId,
          sendInvite: vars.sendInvite,
          ...(vars.overrideEmail ? { overrideEmail: vars.overrideEmail } : {}),
        },
        secret,
        onAuthError,
      ),
    onSuccess: (_data, vars) => {
      toast.success(
        vars.sendInvite
          ? "Account creato e invito inviato."
          : "Account creato (nessuna email inviata).",
      );
      // delay leggero: il claim può finire poco dopo la response
      setTimeout(invalidate, 1500);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const triggerTransitCycle = useMutation({
    mutationFn: (vars: {
      transitCycleId?: string;
      entitlementId?: string;
      quizSessionId?: string;
      reset?: boolean;
      forceInterpretation?: boolean;
      fullReset?: boolean;
    }) => callEdge("admin-trigger-transit-cycle", vars, secret, onAuthError),
    onSuccess: () => {
      toast.success("Ciclo transiti avviato.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const extendEntitlement = useMutation({
    mutationFn: (vars: { entitlementId: string; endsAt: string }) =>
      callEdge("admin-extend-entitlement", vars, secret, onAuthError),
    onSuccess: () => {
      toast.success("Entitlement esteso.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const recoverTransitSubscription = useMutation({
    mutationFn: (vars: { subscription_id: string; skipEmail?: boolean }) =>
      callEdge("admin-recover-transit-subscription", vars, secret, onAuthError),
    onSuccess: () => {
      toast.success("Subscription transiti riconciliata.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /**
   * Download di un PDF (natale o transiti). Apre il signed URL in una nuova tab.
   * Non è una vera mutation, ma viene tracciata come tale per riusare lo stesso
   * pattern di error toast e per esporre `isPending` allo UI.
   *
   * I parametri della querystring sono snake_case perché è il contratto già
   * esposto da supabase/functions/admin-download-report/index.ts (session_id,
   * transit=1, cycle_id).
   */
  const downloadPdf = useMutation({
    mutationFn: async (vars: {
      sessionId: string;
      kind?: "natale" | "transit";
      transitCycleId?: string;
    }) => {
      const params = new URLSearchParams({ session_id: vars.sessionId });
      if (vars.kind === "transit") params.set("transit", "1");
      if (vars.transitCycleId) params.set("cycle_id", vars.transitCycleId);

      const fallbackTab = window.open("about:blank", "_blank");

      try {
        const res = await fetch(
          `${BASE_URL}/functions/v1/admin-download-report?${params.toString()}`,
          { headers: { "x-admin-secret": secret } },
        );
        if (res.status === 401 || res.status === 403) {
          onAuthError?.();
          if (fallbackTab && !fallbackTab.closed) fallbackTab.close();
          throw new Error("Sessione admin scaduta.");
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (fallbackTab && !fallbackTab.closed) fallbackTab.close();
          throw new Error(json?.error || `Errore download (HTTP ${res.status}).`);
        }
        const url = json?.url as string | undefined;
        if (!url) {
          if (fallbackTab && !fallbackTab.closed) fallbackTab.close();
          throw new Error("Risposta senza URL.");
        }
        if (fallbackTab && !fallbackTab.closed) {
          fallbackTab.location.href = url;
        } else {
          window.open(url, "_blank", "noopener");
        }
        return json;
      } catch (err) {
        if (fallbackTab && !fallbackTab.closed) fallbackTab.close();
        throw err;
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const mergeCustomer = useMutation({
    mutationFn: (vars: { primaryEmail: string; secondaryEmail: string; note?: string }) =>
      callEdge<Record<string, unknown>, { ok: boolean; primary_email?: string }>(
        "admin-merge-customers",
        { action: "merge", ...vars },
        secret,
        onAuthError,
      ),
    onSuccess: () => {
      toast.success("Clienti uniti.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const unmergeCustomer = useMutation({
    mutationFn: (vars: { secondaryEmail: string }) =>
      callEdge<Record<string, unknown>, { ok: boolean; primary_email?: string }>(
        "admin-merge-customers",
        { action: "unmerge", ...vars },
        secret,
        onAuthError,
      ),
    onSuccess: () => {
      toast.success("Unione annullata.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateUserAuth = useMutation({
    mutationFn: (vars: { userId: string; newEmail?: string; sendRecovery?: boolean }) =>
      callEdge<Record<string, unknown>, { ok: boolean; email?: string }>(
        "admin-update-user-auth",
        vars,
        secret,
        onAuthError,
      ),
    onSuccess: (_data, vars) => {
      toast.success(
        vars.newEmail
          ? "Email aggiornata. Link di recovery inviato."
          : "Link di recovery inviato.",
      );
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    regenerateReport,
    deleteReport,
    updateBirthData,
    createReport,
    createCustomer,
    createTransit,
    createSynastry,
    regenerateSynastry,
    deleteSynastry,
    deleteTransitCycle,
    recoverOrphan,
    triggerTransitCycle,
    extendEntitlement,
    recoverTransitSubscription,
    downloadPdf,
    updateUserAuth,
    mergeCustomer,
    unmergeCustomer,
  };
}
