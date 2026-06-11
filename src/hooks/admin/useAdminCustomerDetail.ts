import { useQuery } from "@tanstack/react-query";

export interface ProfileRow {
  id: string;
  user_id: string;
  email: string | null;
  quiz_session_id: string | null;
  stripe_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizSessionDetail {
  id: string;
  user_name: string | null;
  birth_place: string | null;
  birth_date: { day?: number; month?: number; year?: number } | null;
  birth_time: { hour?: number; minute?: number } | null;
  birth_lat: number | null;
  birth_lng: number | null;
  focus_area: string | null;
  funnel_slug: string | null;
  processing_status: string;
  processing_error: string | null;
  report_attempts: number;
  has_full_report: boolean;
  has_natal_chart: boolean;
  created_at: string;
}

export interface CheckoutRow {
  id: string;
  stripe_session_id: string;
  customer_email: string | null;
  payment_provider: string;
  payment_status: string;
  payment_completed_at: string | null;
  amount_total: number | null;
  currency: string;
  product_code: string | null;
  purchase_type: string;
  includes_transits: boolean;
  transit_months: number;
  quiz_session_id: string | null;
  synastry_session_id?: string | null;
  claimed_profile_id: string | null;
  claimed_at: string | null;
  recovery_invited_at: string | null;
  recovery_invite_count: number;
  created_at: string;
  is_orphan: boolean;
}

export interface TransitCycleRow {
  id: string;
  profile_id: string;
  quiz_session_id: string;
  entitlement_id: string;
  period_start: string;
  period_end: string;
  status: string;
  fetch_status: string;
  interpretation_status: string;
  processing_error: string | null;
  retry_count: number;
  snapshot_count: number;
  created_at: string;
  updated_at: string;
}

export interface TransitSubscriptionRow {
  id: string;
  profile_id: string;
  quiz_session_id: string;
  status: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackRow {
  id: string;
  profile_id: string;
  quiz_session_id: string;
  rating: string;
  reasons: string[];
  comment: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface SynastryScores {
  intimacy?: number;
  romance?: number;
  communication?: number;
  stability?: number;
  growth?: number;
  tension?: number;
}

export interface SynastrySessionRow {
  id: string;
  person_a_name: string | null;
  person_b_name: string | null;
  archetype: string | null;
  archetype_label: string | null;
  score_overall: number | null;
  scores: SynastryScores | null;
  processing_status: string | null;
  processing_error: string | null;
  has_full_report: boolean;
  has_synastry_data: boolean;
  created_at: string;
}

export interface ContactSubmissionRow {
  id: string;
  email: string;
  name: string;
  reason: string | null;
  message: string;
  created_at: string;
}

export interface CustomerDetail {
  email: string;
  display_email: string | null;
  merged_emails?: string[];
  profile: ProfileRow | null;
  quiz_sessions: QuizSessionDetail[];
  synastry_sessions?: SynastrySessionRow[];
  checkouts: CheckoutRow[];
  transit_cycles: TransitCycleRow[];
  transit_subscription: TransitSubscriptionRow | null;
  subscription_cycles_count: number;
  subscription_revenue_cents: number;
  feedback: FeedbackRow[];
  contacts_log: {
    count: number;
    latest_at: string | null;
    items: ContactSubmissionRow[];
  };
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-customer-detail`;

interface UseAdminCustomerDetailParams {
  secret: string;
  email: string;
  onAuthError?: () => void;
}

export function useAdminCustomerDetail({
  secret,
  email,
  onAuthError,
}: UseAdminCustomerDetailParams) {
  return useQuery<CustomerDetail>({
    queryKey: ["admin", "customer", email.toLowerCase()],
    enabled: Boolean(secret && email),
    staleTime: 15_000,
    // Auto-refresh while a report/chart is actively generating (e.g. just after
    // "Rigenera") so the finished report appears without a manual reload. We poll
    // only on transient "worker is on it" states — not `pending`/`insights_ready`,
    // which abandoned sessions sit on and would poll forever.
    refetchInterval: (query) => {
      const d = query.state.data;
      const ACTIVE = new Set(["chart_processing", "insights_processing", "report_processing"]);
      const busy =
        d?.quiz_sessions?.some((q) => ACTIVE.has(q.processing_status)) ||
        d?.synastry_sessions?.some((s) => s.processing_status != null && ACTIVE.has(s.processing_status));
      return busy ? 5000 : false;
    },
    queryFn: async () => {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ email }),
      });

      if (res.status === 401 || res.status === 403) {
        onAuthError?.();
        throw new Error("Sessione admin scaduta o password non valida.");
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `Errore caricamento cliente (HTTP ${res.status}).`);
      }
      return (await res.json()) as CustomerDetail;
    },
  });
}
