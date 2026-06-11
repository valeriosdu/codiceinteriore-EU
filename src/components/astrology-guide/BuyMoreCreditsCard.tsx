import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAstrologyGuide } from "./AstrologyGuideContext";
import { PACK_CREDITS, PACK_PRICE_LABEL } from "./constants";

const BuyMoreCreditsCard = () => {
  const { credits, buyPack, buyingPack } = useAstrologyGuide();
  const balance = credits?.balance ?? 0;
  const isExhausted = balance <= 0;
  const headline = isExhausted
    ? "Hai usato tutte le tue domande"
    : "Stai per finire le domande";
  const sub = isExhausted
    ? `Acquista ${PACK_CREDITS} nuove domande per continuare ad approfondire la tua carta.`
    : `Aggiungi altre ${PACK_CREDITS} domande così non ti fermi proprio sul più bello.`;

  return (
    <div className="border-t border-border/60 bg-secondary/40 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{headline}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{sub}</p>
          {!isExhausted && (
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Saldo attuale: {balance} {balance === 1 ? "domanda" : "domande"}.
            </p>
          )}
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => void buyPack()}
        disabled={buyingPack}
        className="w-full gap-2"
      >
        {buyingPack ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        Acquista {PACK_CREDITS} domande · {PACK_PRICE_LABEL}
      </Button>
    </div>
  );
};

export default BuyMoreCreditsCard;
