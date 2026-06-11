import { useMemo } from "react";
import { Link2, Mail, Plus, Receipt, ShieldCheck, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomerBadges from "@/components/admin/CustomerBadges";
import type { CustomerDetail } from "@/hooks/admin/useAdminCustomerDetail";
import { formatDate, formatEuros } from "./formatters";
import type { CustomerActionHandlers } from "./actions";

interface CustomerHeaderProps {
  detail: CustomerDetail;
  actions?: CustomerActionHandlers;
}

export default function CustomerHeader({ detail, actions }: CustomerHeaderProps) {
  const stats = useMemo(() => {
    // "Spesa totale" = pagamenti una tantum + incassi ricorrenti subscription.
    // I checkout di tipo 'transits_subscription' sono solo sessioni di
    // correlazione (restano payment_status='unpaid' per design), quindi vanno
    // esclusi dalla somma una tantum. Gli incassi subscription arrivano dalla
    // RPC come somma dei cicli fatturati × prezzo.
    const oneTimeSpend = detail.checkouts
      .filter(
        (c) => c.payment_status === "paid" && c.purchase_type !== "transits_subscription",
      )
      .reduce((sum, c) => sum + (c.amount_total ?? 0), 0);
    const subscriptionSpend = detail.subscription_revenue_cents ?? 0;
    const lifetimeSpend = oneTimeSpend + subscriptionSpend;
    const paidOneTimeCheckouts = detail.checkouts.filter(
      (c) => c.payment_status === "paid" && c.purchase_type !== "transits_subscription",
    ).length;
    const subscriptionCycles = detail.subscription_cycles_count ?? 0;
    const paidCheckouts = paidOneTimeCheckouts + subscriptionCycles;
    const hasOrphan = detail.checkouts.some((c) => c.is_orphan);
    const hasError = detail.quiz_sessions.some((qs) => qs.processing_status === "error");
    const isSubscriber =
      detail.transit_subscription != null &&
      ["active", "trialing"].includes(detail.transit_subscription.status);
    const lastActivity = detail.quiz_sessions[0]?.created_at ?? detail.checkouts[0]?.created_at ?? null;
    const lastName = detail.quiz_sessions[0]?.user_name ?? null;
    // Email distinte usate per i pagamenti, diverse dall'email principale del
    // cliente (case-insensitive). Tipico quando il cliente paga con autofill di
    // un'altra carta, o regala il report a se stesso con un'email alternativa.
    const mainEmail = (detail.profile?.email ?? detail.display_email ?? detail.email)
      .trim()
      .toLowerCase();
    const altEmailSet = new Map<string, string>(); // lower → display preservato
    for (const c of detail.checkouts) {
      const raw = (c.customer_email ?? "").trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (key !== mainEmail && !altEmailSet.has(key)) altEmailSet.set(key, raw);
    }
    const alternativeEmails = Array.from(altEmailSet.values());
    return {
      lifetimeSpend,
      oneTimeSpend,
      subscriptionSpend,
      paidCheckouts,
      hasOrphan,
      hasError,
      isSubscriber,
      lastActivity,
      lastName,
      reportsCount: detail.quiz_sessions.length,
      alternativeEmails,
    };
  }, [detail]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>{detail.profile ? "Profilo registrato" : "Nessun profilo registrato"}</span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-semibold text-foreground break-words">
            {stats.lastName ?? "—"}
          </h2>
          <div className="mt-1 text-sm text-muted-foreground break-all">
            {detail.display_email ?? detail.email}
          </div>
          {stats.alternativeEmails.length > 0 && (
            <div className="mt-2 inline-flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-700">
              <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div className="break-all">
                <span className="font-medium">
                  {stats.alternativeEmails.length === 1
                    ? "Pagamento con email diversa: "
                    : "Pagamenti con email diverse: "}
                </span>
                {stats.alternativeEmails.join(", ")}
              </div>
            </div>
          )}
          {detail.profile && (
            <div className="mt-1 text-xs text-muted-foreground font-mono break-all">
              profile_id: {detail.profile.id}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <CustomerBadges
            hasOrphanCheckout={stats.hasOrphan}
            hasErrorReport={stats.hasError}
            isSubscriber={stats.isSubscriber}
            hasProfile={detail.profile != null}
            paidCheckoutsCount={stats.paidCheckouts}
          />
          {actions && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => actions.onMergeCustomer()}
                disabled={actions.isPending["merge"]}
                title="Unisci con un altro cliente (stessa persona, due email)"
              >
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
                Unisci
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => actions.onCreateNewReport()}
                disabled={actions.isPending["create"]}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Crea nuovo
              </Button>
            </div>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
        <Stat
          icon={<Wallet className="h-4 w-4" />}
          label="Spesa totale"
          value={formatEuros(stats.lifetimeSpend)}
          subValue={
            stats.subscriptionSpend > 0
              ? `Una tantum ${formatEuros(stats.oneTimeSpend)} · Abbonamenti ${formatEuros(stats.subscriptionSpend)}`
              : undefined
          }
        />
        <Stat icon={<Receipt className="h-4 w-4" />} label="Pagamenti" value={String(stats.paidCheckouts)} />
        <Stat icon={<User className="h-4 w-4" />} label="Report" value={String(stats.reportsCount)} />
        <Stat icon={<Mail className="h-4 w-4" />} label="Ultima attività" value={formatDate(stats.lastActivity)} />
      </dl>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
      {subValue && (
        <dd className="mt-0.5 text-xs text-muted-foreground">{subValue}</dd>
      )}
    </div>
  );
}
