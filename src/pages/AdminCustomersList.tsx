import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, MessageCircle, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import CustomerSearchBar from "@/components/admin/CustomerSearchBar";
import CustomerListTable from "@/components/admin/CustomerListTable";
import CreateCustomerDialog from "@/components/admin/dialogs/CreateCustomerDialog";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import { useAdminMutations } from "@/hooks/admin/useAdminMutations";
import {
  useAdminCustomersList,
  type CustomerFilter,
  type CustomerSort,
} from "@/hooks/admin/useAdminCustomersList";

const PAGE_SIZE = 50;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function AdminCustomersList() {
  const { secret, isAuthed, login, logout, clearOnAuthError } = useAdminAuth();
  const navigate = useNavigate();
  const mutations = useAdminMutations({ secret, onAuthError: clearOnAuthError });

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [sort, setSort] = useState<CustomerSort>("last_activity");
  const [page, setPage] = useState(1);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedQ = useDebounced(q, 250);

  // Reset alla pagina 1 quando cambiano i criteri di ricerca/filtro/sort
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filter, sort, hideEmpty]);

  useEffect(() => {
    document.title = "Clienti · Admin · Codice Interiore";
  }, []);

  const query = useAdminCustomersList({
    secret,
    q: debouncedQ,
    filter,
    sort,
    page,
    pageSize: PAGE_SIZE,
    hideEmpty,
    onAuthError: clearOnAuthError,
  });

  const data = query.data;
  const errorMessage = query.error instanceof Error ? query.error.message : null;

  return (
    <AdminAuthGate
      isAuthed={isAuthed}
      onLogin={login}
      title="Area Admin · Clienti"
      description="Inserisci la password admin per accedere alla lista clienti."
    >
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h1 className="font-display text-lg font-semibold text-foreground">
                    Clienti
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vista CRM: 1 riga = 1 email (profili registrati + orfani).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuovo cliente</span>
              </Button>
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
              <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Esci</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-6 space-y-5">
          <CustomerSearchBar
            q={q}
            onQChange={setQ}
            filter={filter}
            onFilterChange={setFilter}
            sort={sort}
            onSortChange={setSort}
            hideEmpty={hideEmpty}
            onHideEmptyChange={setHideEmpty}
            total={data?.total}
            loading={query.isFetching}
          />

          <CustomerListTable
            customers={data?.customers ?? []}
            loading={query.isFetching}
            total={data?.total ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            error={errorMessage}
          />
        </main>
      </div>

      <CreateCustomerDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        busy={mutations.createCustomer.isPending}
        onSubmit={(payload) => {
          mutations.createCustomer.mutate(payload, {
            onSuccess: () => {
              setCreateOpen(false);
              navigate(`/admin/clienti/${encodeURIComponent(payload.email)}`);
            },
          });
        }}
      />
    </AdminAuthGate>
  );
}
