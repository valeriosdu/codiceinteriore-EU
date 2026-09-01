import { keepPreviousData, useQuery } from "@tanstack/react-query";

export type CustomerFilter = "all" | "orphan" | "error" | "subscriber" | "no_report" | "has_transits" | "has_synastry" | "has_guide";
export type CustomerSort = "last_activity" | "lifetime_spend";

export interface CustomerSummary {
  email: string;
  display_email: string | null;
  display_name: string | null;
  has_profile: boolean;
  profile_id: string | null;
  quiz_sessions_count: number;
  checkouts_paid_count: number;
  has_orphan_checkout: boolean;
  has_error_report: boolean;
  is_subscriber: boolean;
  last_activity_at: string | null;
  lifetime_spend_cents: number;
}

export interface CustomersListResponse {
  total: number;
  page: number;
  page_size: number;
  customers: CustomerSummary[];
}

export interface UseAdminCustomersListParams {
  secret: string;
  q: string;
  filter: CustomerFilter;
  sort: CustomerSort;
  page: number;
  pageSize: number;
  hideEmpty: boolean;
  market: string;
  onAuthError?: () => void;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-customers-list`;

export function useAdminCustomersList({
  secret,
  q,
  filter,
  sort,
  page,
  pageSize,
  hideEmpty,
  market,
  onAuthError,
}: UseAdminCustomersListParams) {
  return useQuery<CustomersListResponse>({
    queryKey: ["admin", "customers", { q, filter, sort, page, pageSize, hideEmpty, market }],
    enabled: Boolean(secret),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({
          q: q || undefined,
          filter,
          sort,
          page,
          page_size: pageSize,
          hide_empty: hideEmpty,
          market: market === "all" ? undefined : market,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        onAuthError?.();
        throw new Error("Sessione admin scaduta o password non valida.");
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `Errore caricamento lista (HTTP ${res.status}).`);
      }
      return (await res.json()) as CustomersListResponse;
    },
  });
}
