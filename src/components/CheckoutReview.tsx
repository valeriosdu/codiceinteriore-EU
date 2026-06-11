import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Lock, Sparkles, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useMetaConversions } from "@/hooks/useMetaConversions";
import visaLogo from "@/assets/payments/visa.svg";
import mastercardLogo from "@/assets/payments/mastercard.svg";
import amexLogo from "@/assets/payments/amex.svg";
import applePayLogo from "@/assets/payments/apple-pay.svg";
import googlePayLogo from "@/assets/payments/google-pay.svg";
import paypalLogo from "@/assets/payments/paypal.svg";

const CARD_LOGOS = [
  { src: visaLogo, alt: "Visa" },
  { src: mastercardLogo, alt: "Mastercard" },
  { src: amexLogo, alt: "American Express" },
  { src: applePayLogo, alt: "Apple Pay" },
  { src: googlePayLogo, alt: "Google Pay" },
];

export type PurchaseType = "base" | "premium" | "synastry" | "synastry_launch";

const PRODUCTS: Record<
  PurchaseType,
  { name: string; price: string; bullets: string[]; sessionKind: "natal" | "synastry" }
> = {
  base: {
    name: "Lettura Completa del Tema Natale",
    price: "19€",
    bullets: ["Lettura completa di 10 pagine", "Accesso immediato online e via e-mail"],
    sessionKind: "natal",
  },
  premium: {
    name: "Lettura Completa + 1 Mese di Transiti",
    price: "29€",
    bullets: [
      "Lettura completa di 10 pagine",
      "1 mese di letture settimanali sui transiti",
      "Omaggio: poesia trasformativa personale",
    ],
    sessionKind: "natal",
  },
  synastry: {
    name: "Sinastria di Coppia",
    price: "19€",
    bullets: [
      "Otto sezioni sulla vostra relazione",
      "PDF da scaricare, accesso permanente",
      "Circa 10 pagine in italiano chiaro",
    ],
    sessionKind: "synastry",
  },
  synastry_launch: {
    name: "Sinastria di Coppia",
    price: "14,90€",
    bullets: [
      "Otto sezioni sulla vostra relazione",
      "PDF da scaricare, accesso permanente",
      "Circa 10 pagine in italiano chiaro",
    ],
    sessionKind: "synastry",
  },
};

interface CheckoutReviewProps {
  open: boolean;
  purchaseType: PurchaseType | null;
  sessionId: string;
  synastrySessionId?: string;
  firstName?: string;
  birthDate?: { day: number; month: number; year: number } | null;
  onClose: () => void;
  onMethodSelected?: (method: "stripe" | "paypal") => void;
}

const CheckoutReview = ({ open, purchaseType, sessionId, synastrySessionId, firstName, birthDate, onClose, onMethodSelected }: CheckoutReviewProps) => {
  const [loadingMethod, setLoadingMethod] = useState<"stripe" | "paypal" | null>(null);
  const { trackAddPaymentInfo } = useMetaConversions();
  const product = purchaseType ? PRODUCTS[purchaseType] : null;

  const handleSelect = async (method: "stripe" | "paypal") => {
    if (!purchaseType || !sessionId) {
      toast.error("Sessione non disponibile. Ricarica la pagina e riprova.");
      return;
    }

    setLoadingMethod(method);
    onMethodSelected?.(method);
    trackAddPaymentInfo({ firstName, sessionId, purchaseType, paymentMethod: method, birthDate });
    trackEvent("checkout_started", {
      method,
      purchase_type: purchaseType,
      session_id: sessionId,
    });

    try {
      const fnName = method === "stripe" ? "create-checkout" : "create-paypal-order";
      const isSynastry = product?.sessionKind === "synastry";
      const body = isSynastry
        ? { purchaseType, synastrySessionId: synastrySessionId || sessionId }
        : { purchaseType, sessionId };
      const { data, error } = await supabase.functions.invoke(fnName, { body });

      if (error || !data?.url) {
        throw new Error(error?.message || "Nessun URL ricevuto");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(`${method} checkout error:`, err);
      toast.error("Errore durante il pagamento. Riprova.");
      setLoadingMethod(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !loadingMethod && onClose()}>
      <DialogContent className="max-w-[480px] p-0 gap-0 bg-background border-border/60 rounded-2xl overflow-hidden">
        <div className="p-6 sm:p-7 space-y-6">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="font-display text-2xl font-semibold text-foreground">
              Riepilogo ordine
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Controlla i dettagli del tuo ordine.
            </DialogDescription>
          </DialogHeader>

          {product && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl bg-surface/60 p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-primary/80 font-medium">
                    <Sparkles className="h-3 w-3" />
                    Accesso immediato
                  </div>
                  <h3 className="font-display text-base font-semibold text-foreground leading-snug">
                    {product.name}
                  </h3>
                </div>
                <div className="font-display text-2xl font-semibold text-foreground whitespace-nowrap">
                  {product.price}
                </div>
              </div>

              <ul className="space-y-2 pt-1">
                {product.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <Check className="h-3.5 w-3.5 text-primary mt-1 flex-shrink-0" />
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {product && (
            <div className="flex items-baseline justify-between border-t border-border/40 pt-4">
              <span className="text-sm font-medium text-foreground/70">Totale</span>
              <span className="font-display text-2xl font-semibold text-foreground">{product.price}</span>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <p className="text-sm font-medium text-foreground/80">Come preferisci pagare?</p>

            <button
              type="button"
              onClick={() => handleSelect("stripe")}
              disabled={!!loadingMethod}
              className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-3.5 text-left transition-all hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[15px] leading-tight">Carta di credito o debito</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {CARD_LOGOS.map((logo) => (
                    <span
                      key={logo.alt}
                      className="flex items-center justify-center h-6 w-[54px] px-1 rounded-[5px] bg-white border border-black/[0.06] shadow-sm"
                    >
                      <img
                        src={logo.src}
                        alt={logo.alt}
                        className="max-h-[14px] max-w-full w-auto object-contain"
                        loading="lazy"
                      />
                    </span>
                  ))}
                </div>
              </div>
              {loadingMethod === "stripe" && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelect("paypal")}
              disabled={!!loadingMethod}
              className="w-full rounded-xl border-2 border-border bg-card text-foreground px-4 py-3.5 text-left transition-all hover:border-primary/50 hover:bg-surface/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <img src={paypalLogo} alt="PayPal" className="h-5 w-auto" loading="lazy" />
                <div className="text-[12px] text-muted-foreground mt-1.5">Veloce e sicuro con il tuo conto</div>
              </div>
              {loadingMethod === "paypal" && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground pt-1">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" /> Pagamento sicuro
            </span>
            <span className="inline-flex items-center gap-1">
              <RefreshCcw className="h-3 w-3" /> Soddisfatti o rimborsati
            </span>
            <span>Nessun abbonamento</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutReview;
