import { AlertTriangle, Mail, Sparkles, Wand2 } from "lucide-react";

type Tone = "success" | "warning" | "danger" | "muted" | "info";

const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
  info: "bg-primary/10 text-primary border-primary/30",
};

function Pill({
  tone,
  icon,
  children,
}: {
  tone: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}

interface CustomerBadgesProps {
  hasOrphanCheckout: boolean;
  hasErrorReport: boolean;
  isSubscriber: boolean;
  hasProfile: boolean;
  /** Numero di checkout pagati associati al cliente. Determina se è davvero "solo quiz". */
  paidCheckoutsCount: number;
}

export default function CustomerBadges({
  hasOrphanCheckout,
  hasErrorReport,
  isSubscriber,
  hasProfile,
  paidCheckoutsCount,
}: CustomerBadgesProps) {
  // "Solo quiz" = il cliente ha completato un quiz ma non ha alcun pagamento
  // (né paid claimato, né orfano). Prima il badge dipendeva da !hasProfile, che
  // produceva un falso positivo sulla "ghost row" di un checkout con email
  // diversa dal profilo claimato.
  const isOnlyQuiz = paidCheckoutsCount === 0 && !hasOrphanCheckout;

  return (
    <div className="flex flex-wrap gap-1.5">
      {hasOrphanCheckout && (
        <Pill tone="warning" icon={<Mail className="h-3 w-3" />}>
          Orfano
        </Pill>
      )}
      {hasErrorReport && (
        <Pill tone="danger" icon={<AlertTriangle className="h-3 w-3" />}>
          Report errore
        </Pill>
      )}
      {isSubscriber && (
        <Pill tone="success" icon={<Sparkles className="h-3 w-3" />}>
          Abbonato
        </Pill>
      )}
      {!hasProfile && paidCheckoutsCount > 0 && !hasOrphanCheckout && (
        <Pill tone="muted" icon={<Mail className="h-3 w-3" />}>
          No account
        </Pill>
      )}
      {isOnlyQuiz && (
        <Pill tone="muted" icon={<Wand2 className="h-3 w-3" />}>
          Solo quiz
        </Pill>
      )}
    </div>
  );
}
