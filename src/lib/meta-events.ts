// Gemello lato browser di buildEventId in
// supabase/functions/_shared/fire-meta-purchase.ts.
//
// Perché duplicato invece che importato: Deno e Vite non condividono un
// modulo a runtime — stessa ragione per cui SECTIONS e SECTION_FALLBACKS
// vivono sia in src/pages/Report.tsx sia in _shared/report-pdf.ts. Qui però la
// duplicazione è coperta: src/test/meta-tracking.test.ts verifica che il
// formato del server sia ancora quello costruito qui.
//
// File separato da useMetaConversions.ts perché quello importa il client
// Supabase, e un test che lo carichi si porterebbe dietro mezza app.

/**
 * L'event_id del Purchase, o null se non è ricostruibile identico a quello del
 * server.
 *
 * Il Purchase viene sparato due volte per lo stesso ordine: dal webhook
 * (sempre) e dal browser su /success (solo se il compratore ci torna). Meta ne
 * tiene uno solo quando event_name ed event_id coincidono. Se coincidessero
 * per caso e non per costruzione, un ordine varrebbe due conversioni: da qui
 * il null invece di un id inventato.
 */
export function buildPurchaseEventId(
  quizSessionId?: string | null,
  purchaseType?: string | null,
): string | null {
  if (!quizSessionId || !purchaseType) return null;
  return `purchase:${quizSessionId}:${purchaseType}`;
}

/**
 * Gli acquisti di coppia. Per gli ordini Stripe di coppia non esiste un
 * Purchase server-side (stripe-reconcile spara solo base e premium): il
 * browser è l'unica fonte, quindi per loro non si può rinunciare all'evento
 * quando manca un id ricostruibile.
 */
export function isCouplePurchaseType(purchaseType?: string | null): boolean {
  return purchaseType === "synastry" || purchaseType === "synastry_launch";
}

export type BrowserPurchasePlan =
  | { fire: false }
  | { fire: true; eventId: string | undefined };

/**
 * Cosa deve fare il browser per un Purchase.
 *
 * - id ricostruibile: si spara con quell'id, identico a quello del server.
 * - id non ricostruibile, ordine naturale (base, premium): non si spara. Il
 *   webhook lo copre e un id inventato lo conterebbe due volte.
 * - id non ricostruibile, ordine di coppia: si spara comunque, con l'id che
 *   deriva useMetaConversions come prima (eventId undefined). Su Stripe la coppia non ha
 *   gemello server-side, e perdere l'evento vorrebbe dire non farlo vedere
 *   a Meta per niente.
 */
export function planBrowserPurchase(
  quizSessionId?: string | null,
  purchaseType?: string | null,
): BrowserPurchasePlan {
  const eventId = buildPurchaseEventId(quizSessionId, purchaseType);
  if (eventId) return { fire: true, eventId };
  if (isCouplePurchaseType(purchaseType)) return { fire: true, eventId: undefined };
  return { fire: false };
}
