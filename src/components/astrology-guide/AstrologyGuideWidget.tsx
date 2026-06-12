import { useEffect, useRef } from "react";
import { MessageCircle, X } from "lucide-react";
import { useAstrologyGuide } from "./AstrologyGuideContext";
import AstrologyGuideMessage from "./AstrologyGuideMessage";
import AstrologyGuideComposer from "./AstrologyGuideComposer";
import BuyMoreCreditsCard from "./BuyMoreCreditsCard";
import { INCLUDED_FREE_CREDITS, PACK_CREDITS } from "./constants";
import { useI18n } from "@/i18n/I18nProvider";

const AstrologyGuideWidget = () => {
  const { isOpen, toggle, close, questions, credits, loading } = useAstrologyGuide();
  const { m, market } = useI18n();
  const g = m.astrologyGuide;
  const packPrice = m.common.priceLabel(market.prices.astroPack);
  const threadRef = useRef<HTMLDivElement>(null);
  const balance = credits?.balance ?? 0;
  const totalGranted = credits?.total_granted ?? 0;
  const totalUsed = credits?.total_used ?? 0;
  const freeRemaining = Math.max(0, INCLUDED_FREE_CREDITS - totalUsed);
  const showFreeBadge = totalGranted > 0 && freeRemaining > 0;
  const noCredits = balance <= 0;
  const hasMessages = questions.length > 0;

  // Auto-scroll to the latest message when the panel opens or new ones land.
  const lastAnswer = questions[questions.length - 1]?.answer ?? null;
  useEffect(() => {
    if (!isOpen) return;
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [isOpen, questions.length, lastAnswer]);

  if (loading && !isOpen) return null;

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={toggle}
          aria-label={g.openAria}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 px-5 py-3.5 hover:opacity-95 transition"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-base font-medium">{g.name}</span>
          {showFreeBadge && (
            <span className="ml-1 text-[10px] uppercase tracking-wider bg-primary-foreground/20 px-2 py-0.5 rounded-full">
              {g.freeBadge(freeRemaining)}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 sm:inset-auto sm:bottom-5 sm:right-5"
          role="dialog"
          aria-label={g.name}
        >
          <div className="w-full sm:w-[440px] h-[100dvh] sm:h-[680px] sm:max-h-[88vh] flex flex-col bg-background border border-border rounded-none sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {g.name}
                </h3>
                <span className="text-base text-muted-foreground">
                  {g.questionsCount(balance)}
                  {showFreeBadge ? (
                    <span className="ml-1 text-[11px] uppercase tracking-wider text-primary">
                      {' '}{g.freeInline(freeRemaining)}
                    </span>
                  ) : null}
                </span>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={g.closeAria}
                className="p-1.5 rounded hover:bg-secondary transition"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
              {!hasMessages && noCredits && totalGranted > 0 ? (
                <div className="flex flex-col items-center text-center px-2 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-display text-lg font-semibold text-foreground">
                      {g.empty.exhaustedTitle}
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed max-w-[320px]">
                      {g.empty.exhaustedBody(PACK_CREDITS)}
                    </p>
                  </div>
                </div>
              ) : !hasMessages ? (
                <div className="flex flex-col items-center text-center px-2 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>

                  <div className="space-y-2">
                    <p className="font-display text-lg font-semibold text-foreground">
                      {g.empty.introTitle}
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed max-w-[320px]">
                      {g.empty.introBody}
                    </p>
                  </div>

                  <div className="w-full max-w-[340px] bg-secondary/40 rounded-xl p-4 space-y-3 text-left">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {g.empty.howTitle}
                    </p>
                    {g.empty.howSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 text-base">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-foreground/85 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full max-w-[340px] space-y-1.5">
                    <div className="flex items-center justify-between text-sm px-1">
                      <span className="text-muted-foreground">{g.empty.firstQuestions}</span>
                      {showFreeBadge ? (
                        <span className="text-primary font-medium">{g.empty.free}</span>
                      ) : (
                        <span className="text-foreground">—</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm px-1">
                      <span className="text-muted-foreground">{g.empty.additional}</span>
                      <span className="text-foreground">{g.empty.additionalValue(PACK_CREDITS, packPrice)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                questions.map((q) => <AstrologyGuideMessage key={q.id} question={q} />)
              )}
            </div>

            {noCredits ? <BuyMoreCreditsCard /> : <AstrologyGuideComposer />}

            {!noCredits && balance <= 2 && totalGranted > 0 && totalUsed > 0 && (
              <BuyMoreCreditsCard />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AstrologyGuideWidget;
