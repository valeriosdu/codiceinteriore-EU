import { ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import CustomerBadges from "./CustomerBadges";
import type { CustomerSummary } from "@/hooks/admin/useAdminCustomersList";

interface CustomerListTableProps {
  customers: CustomerSummary[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  error: string | null;
}

const euroFmt = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

const formatLifetime = (cents: number) => {
  if (!cents) return "—";
  return euroFmt.format(cents / 100);
};

const formatRelative = (iso: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function CustomerListTable({
  customers,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  error,
}: CustomerListTableProps) {
  const navigate = useNavigate();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const goToCustomer = (email: string) => {
    navigate(`/admin/clienti/${encodeURIComponent(email)}`);
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
        {error}
      </div>
    );
  }

  if (!loading && customers.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center text-muted-foreground">
        Nessun cliente corrisponde ai filtri attuali.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Report</TableHead>
              <TableHead className="hidden md:table-cell">Pagamenti</TableHead>
              <TableHead className="hidden lg:table-cell">Spesa totale</TableHead>
              <TableHead className="hidden lg:table-cell">Ultima attività</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow
                key={c.email}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => goToCustomer(c.email)}
              >
                <TableCell className="py-3">
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">
                      {c.display_name ?? "—"}
                    </div>
                    <div className="text-sm text-muted-foreground break-all">
                      {c.display_email ?? c.email}
                    </div>
                    <div className="md:hidden text-xs text-muted-foreground">
                      {c.quiz_sessions_count} report · {c.checkouts_paid_count} pag. ·{" "}
                      {formatLifetime(c.lifetime_spend_cents)}
                    </div>
                    <CustomerBadges
                      hasOrphanCheckout={c.has_orphan_checkout}
                      hasErrorReport={c.has_error_report}
                      isSubscriber={c.is_subscriber}
                      hasProfile={c.has_profile}
                      paidCheckoutsCount={c.checkouts_paid_count}
                    />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {c.quiz_sessions_count}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {c.checkouts_paid_count}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm font-medium">
                  {formatLifetime(c.lifetime_spend_cents)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatRelative(c.last_activity_at)}
                </TableCell>
                <TableCell className="w-10 text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {loading && (
          <div className="flex items-center justify-center gap-2 border-t border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Aggiornamento…
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
        <div className="text-muted-foreground">
          {total === 0
            ? "Nessun risultato"
            : `${from}–${to} di ${total}`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
          >
            Precedente
          </Button>
          <span className="text-muted-foreground">
            Pagina {page} di {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
          >
            Successiva
          </Button>
        </div>
      </div>
    </div>
  );
}
