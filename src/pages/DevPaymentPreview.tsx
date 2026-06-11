// Dev-only visual preview for the CheckoutReview payment dialog.
// Mounted at /dev/payment-preview and gated behind import.meta.env.DEV in
// App.tsx so it never ships to production.
//
// Renders the real dialog with the real theme so the payment-method buttons
// (card logos + PayPal logo) and copy can be eyeballed without going through
// the funnel + Supabase. The pay buttons still call the edge functions, so
// don't click them here — this page is for visual review only.

import { useState } from "react";
import CheckoutReview, { type PurchaseType } from "@/components/CheckoutReview";

const TYPES: { id: PurchaseType; label: string }[] = [
  { id: "base", label: "base (19€)" },
  { id: "premium", label: "premium (29€)" },
  { id: "synastry", label: "synastry (19€)" },
  { id: "synastry_launch", label: "synastry_launch (14,90€)" },
];

const DevPaymentPreview = () => {
  const [type, setType] = useState<PurchaseType>("premium");

  return (
    <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-primary">Dev preview</p>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Dialog di pagamento (CheckoutReview)
        </h1>
        <p className="text-sm text-muted-foreground">
          Anteprima visiva del dialog reale. Cambia prodotto qui sotto. I pulsanti di
          pagamento chiamano le edge function: non cliccarli, serve solo per vedere il design.
        </p>
      </header>

      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Prodotto
        </p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                type === t.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <CheckoutReview
        open
        purchaseType={type}
        sessionId="preview-session"
        firstName="Anna"
        birthDate={{ day: 12, month: 5, year: 1990 }}
        onClose={() => {}}
      />
    </div>
  );
};

export default DevPaymentPreview;
