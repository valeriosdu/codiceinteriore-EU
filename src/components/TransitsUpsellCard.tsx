import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Loader2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TransitsUpsellCardProps {
  /**
   * Kept for API compatibility with callers that bundled a premium month;
   * the upsell is subscription-only now so the flag has no behavioural effect.
   */
  subscriptionOnly?: boolean;
  accessEndsAt?: string | null;
}

const formatAccessDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const TransitsUpsellCard = ({ subscriptionOnly = false, accessEndsAt = null }: TransitsUpsellCardProps) => {
  const [loading, setLoading] = useState(false);
  const formattedAccessEndsAt = formatAccessDate(accessEndsAt);
  const hasActiveTransitAccess = subscriptionOnly || Boolean(formattedAccessEndsAt);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-transit-checkout", {
        body: { mode: "subscription" },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("URL non disponibile");
      window.location.href = data.url;
    } catch (err) {
      console.error("transit checkout error:", err);
      toast.error(
        err instanceof Error ? err.message : "Non siamo riusciti ad aprire il pagamento. Riprova tra un istante.",
      );
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-label={hasActiveTransitAccess ? "Transiti del mese attivi" : "Attiva la lettura mensile dei transiti"}
      className="rounded-2xl border border-border/70 bg-surface px-6 py-8 sm:px-8 sm:py-10 shadow-sm"
    >
      {hasActiveTransitAccess ? (
        <>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs lg:text-sm font-medium text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Attivi
          </div>

          <h3 className="mt-4 font-display text-2xl sm:text-[26px] font-semibold text-foreground leading-snug">
            Hai i transiti di questo mese
          </h3>

          <div className="mt-5 rounded-xl border border-border/70 bg-background/45 px-4 py-3 flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-xs lg:text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">Validi fino al</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {formattedAccessEndsAt || "fine del periodo incluso"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-[15px] lg:text-base text-muted-foreground leading-relaxed max-w-prose">
            Ti restano fino alla data indicata. Per continuare anche dopo, puoi rinnovare con la lettura mensile,
            oppure fermarti qui.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.18em] font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Transiti del mese
          </div>

          <h3 className="mt-3 font-display text-2xl sm:text-[26px] font-semibold text-foreground leading-snug">
            Hai letto il tuo Tema Natale. Adesso puoi leggere il momento presente.
          </h3>

          <p className="mt-3 text-[15px] lg:text-base text-muted-foreground leading-relaxed max-w-prose">
            La carta natale è la tua struttura, decisa dalla nascita: non cambia. Il cielo, però, si muove ogni giorno.
            I pianeti ogni giorno si sovrappongono ai punti della tua carta (il tuo Sole, Luna, Ascendente, etc.) e ne
            attivano certe parti a seconda dell'aspetto che formano.
          </p>

          <div className="mt-5 rounded-xl border border-border/70 bg-background/45 px-4 py-4">
            <p className="text-xs lg:text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Ogni mese ricevi una lettura che ti dice:
            </p>
            <ul className="mt-3 space-y-2 text-[15px] lg:text-base text-foreground/85 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-primary mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" aria-hidden />
                <span>Quali aree della tua carta sono in tensione, favorite o sotto pressione, e cosa osservare</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" aria-hidden />
                <span>I momenti chiave del mese, con date precise, e cosa favorire settimana per settimana</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" aria-hidden />
                <span>Quanto dura quello che stai attraversando, e cosa arriva dopo</span>
              </li>
            </ul>
          </div>
        </>
      )}

      <div className="mt-7">
        <Button
          variant="premium"
          size="lg"
          onClick={startCheckout}
          disabled={loading}
          className="w-full lg:text-base lg:h-12"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasActiveTransitAccess ? (
            "Continua con i transiti mensili - 9,90 €/mese"
          ) : (
            "Leggi i transiti del mese - 9,90 €/mese"
          )}
        </Button>
        <p className="mt-2 text-xs lg:text-sm text-muted-foreground text-center">
          {hasActiveTransitAccess
            ? "Rinnovo mensile, disdici quando vuoi"
            : "Una nuova lettura ogni mese. Disdici quando vuoi."}
        </p>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-xs lg:text-sm text-muted-foreground">
        <Lock className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
        Pagamento sicuro - Accesso immediato
      </p>
    </motion.section>
  );
};

export default TransitsUpsellCard;
