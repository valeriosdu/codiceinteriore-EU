import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAstrologyGuide } from "./AstrologyGuideContext";
import { PACK_CREDITS } from "./constants";
import { useI18n } from "@/i18n/I18nProvider";

const BuyMoreCreditsCard = () => {
  const { credits, buyPack, buyingPack } = useAstrologyGuide();
  const { m, market } = useI18n();
  const g = m.astrologyGuide;
  const packPrice = m.common.priceLabel(market.prices.astroPack);
  const balance = credits?.balance ?? 0;
  const isExhausted = balance <= 0;
  // With a comfortable balance the card only appears via ?openGuide=pack or the
  // menu entry: "about to run out" would be false and the balance line below
  // would contradict it.
  const isRunningLow = balance > 0 && balance <= 2;
  const headline = isExhausted
    ? g.buyMore.exhaustedHeadline
    : isRunningLow
      ? g.buyMore.nearEndHeadline
      : g.buyMore.addHeadline;
  const sub = isExhausted
    ? g.buyMore.exhaustedSub(PACK_CREDITS)
    : isRunningLow
      ? g.buyMore.nearEndSub(PACK_CREDITS)
      : g.buyMore.addSub(PACK_CREDITS);

  return (
    <div className="border-t border-border/60 bg-secondary/40 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{headline}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{sub}</p>
          {!isExhausted && (
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              {g.buyMore.balance(balance)}
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
        {g.buyMore.buyCta(PACK_CREDITS, packPrice)}
      </Button>
    </div>
  );
};

export default BuyMoreCreditsCard;
