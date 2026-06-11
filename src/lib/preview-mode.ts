/**
 * Lovable Preview Mode helpers.
 *
 * Active ONLY when the app is being viewed inside the Lovable editor
 * preview (e.g. id-preview--<id>.lovable.app or *.lovable.dev).
 * Production hosts (codiceinteriore.it, www.codiceinteriore.it,
 * codiceinteriore.lovable.app) are explicitly excluded.
 *
 * When active, pages skip DB/auth-dependent flows and render demo data
 * so the user can navigate every screen from the Lovable preview.
 */

const PRODUCTION_HOSTS = new Set([
  "codiceinteriore.it",
  "www.codiceinteriore.it",
  "codiceinteriore.lovable.app",
]);

export const isLovablePreview = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();

  if (PRODUCTION_HOSTS.has(host)) return false;

  // Lovable editor preview hosts
  if (host.startsWith("id-preview--") && host.endsWith(".lovable.app")) return true;
  if (host.endsWith(".lovable.dev")) return true;
  if (host.endsWith(".sandbox.lovable.dev")) return true;

  // Local dev override: ?preview=1 in URL forces preview mode. The
  // import.meta.env.DEV gate is stripped at production build time, so this
  // branch is dead code in any shipped bundle.
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "1") return true;
  }

  return false;
};

export const DEMO_USER_NAME = "Anna";
export const DEMO_EMAIL = "demo@codiceinteriore.it";

export const DEMO_TEASER_INSIGHTS = [
  {
    title: "Il tuo modo di entrare in relazione",
    body: "Tendi a entrare nelle relazioni con un'intensità che nasce dal bisogno di sentirti vista e compresa a un livello profondo. Questo ti rende capace di legami autentici, ma anche vulnerabile a delusioni quando l'altro non riesce a stare al tuo stesso ritmo emotivo.",
  },
  {
    title: "Il tuo punto sensibile",
    body: "C'è una zona in cui la paura dell'abbandono si sovrappone al desiderio di autonomia. Quando qualcuno si avvicina troppo, qualcosa in te si ritrae, anche se una parte profonda desidera proprio quella vicinanza.",
  },
  {
    title: "Il tuo schema ricorrente",
    body: "Il pattern che si ripete è legato alla confusione tra intensità emotiva e vera connessione. Spesso scambi la turbolenza interna per amore, e la calma per mancanza di sentimento.",
  },
];

export const DEMO_FULL_REPORT: Record<string, string> = {
  identity:
    "La tua identità profonda si muove tra il bisogno di sentirti libera e il desiderio di costruire qualcosa di stabile. Sei una persona che percepisce il mondo con grande sensibilità, ma allo stesso tempo cerca strutture chiare per non perdersi nelle proprie emozioni.\n\nQuesto report è una versione dimostrativa, generata per la preview di Lovable. Il report reale è personalizzato sui tuoi dati di nascita.",
  emotions:
    "Le tue emozioni si muovono in onde profonde. Hai imparato presto a contenere ciò che senti per non disturbare gli altri, e questo ti porta a volte a sentirti distante anche da te stessa.\n\nIl primo passo è riconoscere che le tue emozioni non sono un disturbo, ma una bussola.",
  relationships:
    "In amore cerchi una connessione che vada oltre la superficie. Vuoi essere vista per chi sei davvero, non solo per ciò che mostri.\n\nQuesto a volte ti porta a investire molto in poche persone, e a soffrire quando non ricevi la stessa intensità in cambio.",
  work:
    "Sul lavoro hai bisogno di sentire un senso. Non ti basta fare bene: vuoi che ciò che fai significhi qualcosa.\n\nQuando trovi un contesto allineato ai tuoi valori, la tua produttività e la tua creatività si sbloccano in modo sorprendente.",
  patterns:
    "Tendi a ripetere uno schema in cui prima ti apri molto, poi ti ritiri. È un movimento di protezione che ha radici antiche.\n\nRiconoscerlo è già metà del lavoro: la prossima volta che senti l'impulso di chiuderti, fermati e chiediti cosa stai davvero proteggendo.",
  blocks:
    "Il tuo blocco principale è la convinzione, spesso inconscia, di dover meritare l'amore attraverso la performance. Questo ti porta a fare molto e a chiedere poco.\n\nLavorare su questo significa imparare a ricevere senza sentirti in debito.",
  advice:
    "1. Concediti spazi di silenzio ogni giorno, anche brevi.\n2. Quando senti tensione, chiediti: 'Cosa ho bisogno di dire che non sto dicendo?'.\n3. Coltiva una pratica creativa che non abbia obiettivi.\n4. Ricorda che riposare è produttivo.",
  poem:
    "C'è una stanza dentro di te\nche nessuno ha mai visto.\nNon perché sia chiusa a chiave,\nma perché tu stessa\nhai dimenticato la porta.\n\nOggi qualcuno bussa.\nSei tu.",
};
