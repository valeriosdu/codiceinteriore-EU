// Contesto browser catturato alla creazione del checkout e persistito su
// checkout_sessions.provider_metadata.browser_context.
//
// Perché: il Purchase che parte dai webhook (stripe/paypal) è l'unico che vede
// TUTTI gli acquisti — quello client-side su /success parte solo se il compratore
// torna sul sito. Ma il webhook non ha né i cookie Meta né l'IP del compratore,
// quindi arrivava a Meta senza click id: nei dati del pixel IT il Purchase aveva
// fbc al 5.7% e fbp all'8.7%. Qui li mettiamo da parte finché servono.

export interface BrowserContext {
  fbc?: string;
  fbp?: string;
  ip?: string;
  ua?: string;
}

/**
 * `fbc`/`fbp` arrivano dal body (li legge il client dai cookie Meta), IP e
 * user-agent dagli header della richiesta — che qui, a differenza di un webhook,
 * sono davvero quelli del browser del compratore.
 */
export function captureBrowserContext(
  req: Request,
  body: { fbc?: unknown; fbp?: unknown },
): BrowserContext | undefined {
  const ctx: BrowserContext = {};

  if (typeof body?.fbc === "string" && body.fbc) ctx.fbc = body.fbc.slice(0, 255);
  if (typeof body?.fbp === "string" && body.fbp) ctx.fbp = body.fbp.slice(0, 255);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip");
  if (ip) ctx.ip = ip;

  const ua = req.headers.get("user-agent");
  if (ua) ctx.ua = ua.slice(0, 512);

  return Object.keys(ctx).length > 0 ? ctx : undefined;
}
