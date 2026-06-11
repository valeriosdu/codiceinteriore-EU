import { useEffect, useRef } from "react";
import { MessageCircle, X } from "lucide-react";
import { useAstrologyGuide } from "./AstrologyGuideContext";
import AstrologyGuideMessage from "./AstrologyGuideMessage";
import AstrologyGuideComposer from "./AstrologyGuideComposer";
import BuyMoreCreditsCard from "./BuyMoreCreditsCard";
import { INCLUDED_FREE_CREDITS, PACK_CREDITS, PACK_PRICE_LABEL } from "./constants";

const AstrologyGuideWidget = () => {
  const { isOpen, toggle, close, questions, credits, loading } = useAstrologyGuide();
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
          aria-label="Apri la Guida astrologica"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 px-5 py-3.5 hover:opacity-95 transition"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-base font-medium">Guida astrologica</span>
          {showFreeBadge && (
            <span className="ml-1 text-[10px] uppercase tracking-wider bg-primary-foreground/20 px-2 py-0.5 rounded-full">
              {freeRemaining} gratis
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 sm:inset-auto sm:bottom-5 sm:right-5"
          role="dialog"
          aria-label="Guida astrologica"
        >
          <div className="w-full sm:w-[440px] h-[100dvh] sm:h-[680px] sm:max-h-[88vh] flex flex-col bg-background border border-border rounded-none sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Guida astrologica
                </h3>
                <span className="text-base text-muted-foreground">
                  {balance} {balance === 1 ? "domanda" : "domande"}
                  {showFreeBadge ? (
                    <span className="ml-1 text-[11px] uppercase tracking-wider text-primary">
                      · {freeRemaining} gratis
                    </span>
                  ) : null}
                </span>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Chiudi"
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
                      Hai esaurito le tue domande
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed max-w-[320px]">
                      Aggiungi un nuovo pacchetto da {PACK_CREDITS} domande per continuare
                      ad approfondire la tua carta.
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
                      La tua guida astrologica personale
                    </p>
                    <p className="text-base text-muted-foreground leading-relaxed max-w-[320px]">
                      Fai domande sul tuo tema natale e, se hai acquistato la sinastria
                      di coppia o i transiti del mese, anche su quelli: le risposte sono
                      sempre personalizzate sui tuoi dati astrologici.
                    </p>
                  </div>

                  <div className="w-full max-w-[340px] bg-secondary/40 rounded-xl p-4 space-y-3 text-left">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Come funziona
                    </p>
                    {[
                      "Fai una domanda qui sotto, libera o partendo dai suggerimenti.",
                      "La risposta arriva entro qualche ora in orari lavorativi.",
                      "La leggi qui e nella tua email.",
                    ].map((step, i) => (
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
                      <span className="text-muted-foreground">Prime 2 domande</span>
                      {showFreeBadge ? (
                        <span className="text-primary font-medium">Gratuite ✦</span>
                      ) : (
                        <span className="text-foreground">—</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm px-1">
                      <span className="text-muted-foreground">Domande aggiuntive</span>
                      <span className="text-foreground">{PACK_CREDITS} domande extra a {PACK_PRICE_LABEL}</span>
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
