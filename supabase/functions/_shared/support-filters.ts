// Pure helpers for the support autoresponder. No Deno/runtime imports here on
// purpose: this module is imported both by the edge functions (Deno) and by the
// vitest suite (node) — keep it dependency-free and side-effect-free.

// ── Automated / non-customer sender detection ────────────────────────────────
// The poll-level denylist: mail from these senders is never a customer ticket
// (payment notifications, bounces, our own outbound), so it's marked
// 'ignored'/'automated' WITHOUT spending an LLM call. Keep this narrow — a real
// customer must never be silently dropped. Spam that isn't an automated sender
// is caught later by the AI triage step instead.

// Matched as a domain suffix: `d` or `*.d` (so "e.paypal.com" matches "paypal.com").
const AUTOMATED_DOMAIN_SUFFIXES = [
  "stripe.com",
  "paypal.com",
  "sendinblue.com",
  "brevo.com",
  "sendgrid.net",
  "amazonses.com",
  // our own brand domains — a customer is never @ one of these
  "codiceinteriore.it",
  "cartainterior.com",
];

// Brand label appearing anywhere in the domain (catches paypal.it, paypal.fr,
// notify.stripe.com, etc. across ccTLDs).
const AUTOMATED_DOMAIN_TOKENS = ["paypal", "stripe"];

// Matched as a substring of the local part (before the @).
const AUTOMATED_LOCAL_PARTS = [
  "no-reply",
  "noreply",
  "no_reply",
  "donotreply",
  "do-not-reply",
  "mailer-daemon",
  "mailerdaemon",
  "postmaster",
  "notification", // covers "notifications"
  "bounce", // covers "bounces"
  "auto-reply",
  "autoreply",
  "automated",
];

export type AutomatedVerdict = { automated: boolean; reason: string | null };

export function isAutomatedSender(fromEmail: string | null | undefined): AutomatedVerdict {
  const email = (fromEmail || "").trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (!email || at <= 0 || at === email.length - 1) {
    // No usable address — we can't reply to it, treat as automated/noise.
    return { automated: true, reason: "no_valid_sender" };
  }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  for (const suffix of AUTOMATED_DOMAIN_SUFFIXES) {
    if (domain === suffix || domain.endsWith("." + suffix)) {
      return { automated: true, reason: `domain:${suffix}` };
    }
  }
  const labels = domain.split(".");
  for (const token of AUTOMATED_DOMAIN_TOKENS) {
    // Match the brand as a whole dotted label: catches paypal.com, e.paypal.com,
    // paypal.it, notify.stripe.com — but not paypalish.com.
    if (labels.includes(token)) {
      return { automated: true, reason: `brand:${token}` };
    }
  }
  for (const part of AUTOMATED_LOCAL_PARTS) {
    if (local.includes(part)) {
      return { automated: true, reason: `local:${part}` };
    }
  }
  return { automated: false, reason: null };
}

// ── Email address extraction ─────────────────────────────────────────────────
// Used by the fallback identity matcher: when the sender email doesn't resolve
// to a customer, we scan the body for any other address the customer mentions
// ("I paid with john@gmail.com") and try to resolve those too.

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

export function extractEmails(text: string | null | undefined): string[] {
  if (!text) return [];
  const found = text.match(EMAIL_RE) || [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of found) {
    const e = raw.toLowerCase().replace(/[.,;:>)\]]+$/, "");
    if (!seen.has(e)) {
      seen.add(e);
      out.push(e);
    }
  }
  return out;
}

// ── "Display Name <email>" parsing ───────────────────────────────────────────
export function parseFromAddress(raw: string | null | undefined): {
  name: string | null;
  email: string;
} {
  const value = (raw || "").trim();
  if (!value) return { name: null, email: "" };
  const angle = value.match(/^(.*?)<([^>]+)>\s*$/);
  if (angle) {
    const name = angle[1].trim().replace(/^["']|["']$/g, "").trim();
    return { name: name || null, email: angle[2].trim().toLowerCase() };
  }
  return { name: null, email: value.toLowerCase() };
}

// ── HTML → plaintext ─────────────────────────────────────────────────────────
// Cheap, dependency-free stripper. Good enough to feed the model and to show in
// the admin panel; not a full HTML parser. The customer's mail is treated as
// untrusted data, so we only ever read it, never render it.

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&#x27;": "'",
  "&mdash;": "-",
  "&ndash;": "-",
};

export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return "";
  let s = html;
  // Drop non-content blocks entirely.
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<head[\s\S]*?<\/head>/gi, " ");
  // Turn block-level boundaries into newlines so paragraphs survive.
  s = s.replace(/<\s*br\s*\/?>/gi, "\n");
  s = s.replace(/<\/\s*(p|div|tr|li|h[1-6]|blockquote)\s*>/gi, "\n");
  // Strip remaining tags.
  s = s.replace(/<[^>]+>/g, "");
  // Decode the handful of entities we care about.
  for (const [ent, ch] of Object.entries(ENTITIES)) {
    s = s.split(ent).join(ch);
  }
  s = s.replace(/&#(\d+);/g, (_, code) => {
    const n = Number(code);
    return Number.isFinite(n) ? String.fromCharCode(n) : "";
  });
  // Collapse whitespace.
  s = s.replace(/[ \t ]+/g, " ");
  s = s.replace(/ *\n */g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
