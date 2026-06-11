import type {
  CheckoutRow,
  QuizSessionDetail,
  TransitCycleRow,
  TransitSubscriptionRow,
} from "@/hooks/admin/useAdminCustomerDetail";

// Interfaccia delle azioni che i tab possono invocare. La fornisce
// AdminCustomerDetail tramite useAdminMutations + state dei dialog. Se omessa,
// i tab restano puramente read-only (utile per render isolato in test).
export interface CustomerActionHandlers {
  isPending: Record<string, boolean>;

  onEditQuiz: (qs: QuizSessionDetail) => void;
  onGenerateReport: (qs: QuizSessionDetail) => void;
  onRegenerateReport: (qs: QuizSessionDetail) => void;
  onDeleteReport: (qs: QuizSessionDetail) => void;
  onDownloadNatalPdf: (qs: QuizSessionDetail) => void;

  onRecoverOrphan: (checkout: CheckoutRow) => void;

  onTriggerCycle: (cycle: TransitCycleRow) => void;
  onDeleteTransitCycle: (cycle: TransitCycleRow) => void;
  onDownloadTransitPdf: (cycle: TransitCycleRow) => void;
  onExtendEntitlement: (entitlementId: string, endsAt: string) => void;
  onRecoverSubscription: (sub: TransitSubscriptionRow) => void;
  onCreateNewTransitCycle: (quizSessionId: string, lastCycleEnd: string | null) => void;

  onCreateNewReport: () => void;
  onMergeCustomer: () => void;
}
