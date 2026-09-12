import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Loader2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";

interface TransitsUpsellCardProps {
  /**
   * Il cliente ha gia' avuto dei transiti (Report.tsx lo passa quando esiste
   * almeno un ciclo). Dice solo questo: se la finestra pagata sia ancora
   * aperta lo decide accessEndsAt, non questo flag.
   */
  subscriptionOnly?: boolean;
  accessEndsAt?: string | null;
  /**
   * La lettura per cui si stanno comprando i transiti. Un abbonamento ne copre
   * una sola, e il server non puo' indovinarla: senza questo id ricade sulla
   * lettura piu' recente, che e' come i transiti finivano su quella sbagliata.
   */
  quizSessionId?: string | null;
}

const TransitsUpsellCard = ({
  subscriptionOnly = false,
  accessEndsAt = null,
  quizSessionId = null,
}: TransitsUpsellCardProps) => {
  const [loading, setLoading] = useState(false);
  const { m, market, formatDate } = useI18n();
  const t = m.transits.upsell;
  const priceLabel = m.common.priceLabel(market.prices.transitSubscription);
  const formattedAccessEndsAt = (() => {
    if (!accessEndsAt) return null;
    const date = new Date(accessEndsAt);
    if (Number.isNaN(date.getTime())) return null;
    return formatDate(date);
  })();
  // Questa card viene mostrata anche a chi ha soltanto cicli vecchi da
  // consultare: l'abbonamento e' finito, ma le letture pagate restano leggibili
  // (Report.tsx, ramo hasAccess). Senza confrontare la data con oggi scriveva
  // "Attivi / Hai i transiti di questo mese" sopra una scadenza passata da mesi.
  const hasTransitHistory = subscriptionOnly || Boolean(formattedAccessEndsAt);
  const accessEndsAtTime = accessEndsAt ? new Date(accessEndsAt).getTime() : Number.NaN;
  const accessIsCurrent = Number.isFinite(accessEndsAtTime) && accessEndsAtTime > Date.now();

  const startCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-transit-checkout", {
        body: { mode: "subscription", quizSessionId },
      });
      if (error) throw error;
      if (!data?.url) throw new Error(t.errors.noUrl);
      window.location.href = data.url;
    } catch (err) {
      console.error("transit checkout error:", err);
      toast.error(err instanceof Error ? err.message : t.errors.checkout);
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-label={
        hasTransitHistory ? (accessIsCurrent ? t.ariaActive : t.ariaExpired) : t.ariaInactive
      }
      className="rounded-2xl border border-border/70 bg-surface px-6 py-8 sm:px-8 sm:py-10 shadow-sm"
    >
      {hasTransitHistory ? (
        <>
          <div
            className={
              accessIsCurrent
                ? "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs lg:text-sm font-medium text-primary"
                : "inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/45 px-3 py-1 text-xs lg:text-sm font-medium text-muted-foreground"
            }
          >
            {accessIsCurrent ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <CalendarClock className="h-3.5 w-3.5" />
            )}
            {accessIsCurrent ? t.activeBadge : t.expiredBadge}
          </div>

          <h3 className="mt-4 font-display text-2xl sm:text-[26px] font-semibold text-foreground leading-snug">
            {accessIsCurrent ? t.activeTitle : t.expiredTitle}
          </h3>

          <div className="mt-5 rounded-xl border border-border/70 bg-background/45 px-4 py-3 flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-xs lg:text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {accessIsCurrent ? t.validUntil : t.validUntilExpired}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {formattedAccessEndsAt || t.validUntilFallback}
              </p>
            </div>
          </div>

          <p className="mt-4 text-[15px] lg:text-base text-muted-foreground leading-relaxed max-w-prose">
            {accessIsCurrent ? t.activeBody : t.expiredBody}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.18em] font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            {t.kicker}
          </div>

          <h3 className="mt-3 font-display text-2xl sm:text-[26px] font-semibold text-foreground leading-snug">
            {t.title}
          </h3>

          <p className="mt-3 text-[15px] lg:text-base text-muted-foreground leading-relaxed max-w-prose">
            {t.body}
          </p>

          <div className="mt-5 rounded-xl border border-border/70 bg-background/45 px-4 py-4">
            <p className="text-xs lg:text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t.monthlyListTitle}
            </p>
            <ul className="mt-3 space-y-2 text-[15px] lg:text-base text-foreground/85 leading-relaxed">
              {t.monthlyList.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
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
          ) : hasTransitHistory ? (
            accessIsCurrent ? t.ctaActive(priceLabel) : t.ctaExpired(priceLabel)
          ) : (
            t.ctaInactive(priceLabel)
          )}
        </Button>
        <p className="mt-2 text-xs lg:text-sm text-muted-foreground text-center">
          {hasTransitHistory ? t.renewNoteActive : t.renewNoteInactive}
        </p>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-xs lg:text-sm text-muted-foreground">
        <Lock className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
        {t.secureNote}
      </p>
    </motion.section>
  );
};

export default TransitsUpsellCard;
