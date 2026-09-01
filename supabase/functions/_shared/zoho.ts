// Per-market Zoho Mail API helper for the support autoresponder.
//
// Mirrors the secret-indirection convention in markets.ts: the `it` market uses
// the unsuffixed env names, `es` uses the `__ES` suffix, and a MISSING secret
// for any market is an explicit throw — never a silent fallback to another
// market's mailbox. All endpoints are built on the market's data-center base URL
// (mail.zoho.com vs mail.zoho.eu) so a `.com`/`.eu` difference between markets is
// config, never code.
//
// One-time setup per market (Phase 0, out of band): create a Zoho self-client,
// grant the scopes ZohoMail.messages.READ + ZohoMail.messages.CREATE +
// ZohoMail.accounts.READ, mint a refresh token, and capture accountId + the
// support folderId. Store them as the secrets below.

import type { MarketId } from "./markets.ts";

export interface ZohoMarketConfig {
  market: MarketId;
  dc: string; // "com" | "eu" | ...
  dcBase: string; // https://mail.zoho.<dc>
  accountsBase: string; // https://accounts.zoho.<dc>
  accountId: string;
  folderId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

// Suffisso dei secret Zoho per mercato. NON e' meccanicamente "__" + id: piu'
// mercati condividono una sola casella. Oggi es, us e nl scrivono e leggono
// tutti da info@cartainterior.com, quindi puntano agli stessi secret __ES —
// prima era un fallback implicito (market !== "it" ? "__ES"), che nascondeva la
// condivisione e avrebbe silenziosamente agganciato anche il quinto mercato.
// Per dare a nl una casella propria: creare i 6 secret ZOHO_*__NL, poi mettere
// nl: "__NL" qui e aggiungere "nl" all'array MARKETS di support-poll.
const ZOHO_ENV_SUFFIX: Record<MarketId, string> = {
  it: "",
  es: "__ES",
  us: "__ES",
  nl: "__ES",
};

function envName(base: string, market: MarketId): string {
  return `${base}${ZOHO_ENV_SUFFIX[market] ?? ""}`;
}

function requireZohoEnv(base: string, market: MarketId): string {
  const name = envName(base, market);
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing Zoho secret ${name} for market "${market}"`);
  }
  return value;
}

export function getZohoConfig(market: MarketId): ZohoMarketConfig {
  const dc = (Deno.env.get(envName("ZOHO_DC", market)) || "com").toLowerCase();
  return {
    market,
    dc,
    dcBase: `https://mail.zoho.${dc}`,
    accountsBase: `https://accounts.zoho.${dc}`,
    accountId: requireZohoEnv("ZOHO_ACCOUNT_ID", market),
    folderId: requireZohoEnv("ZOHO_FOLDER_ID", market),
    clientId: requireZohoEnv("ZOHO_CLIENT_ID", market),
    clientSecret: requireZohoEnv("ZOHO_CLIENT_SECRET", market),
    refreshToken: requireZohoEnv("ZOHO_REFRESH_TOKEN", market),
  };
}

// ── Access token (refresh-token grant) ───────────────────────────────────────
// Cached per market for the lifetime of a warm function instance. Zoho access
// tokens last ~1h; we refresh a minute early.
type CachedToken = { token: string; expiresAt: number };
const tokenCache = new Map<MarketId, CachedToken>();

export async function zohoAccessToken(cfg: ZohoMarketConfig): Promise<string> {
  const cached = tokenCache.get(cfg.market);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }
  const params = new URLSearchParams({
    refresh_token: cfg.refreshToken,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: "refresh_token",
  });
  const res = await fetch(`${cfg.accountsBase}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const text = await res.text();
  let json: { access_token?: string; expires_in?: number; error?: string };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`zoho_token_parse_error (${cfg.market}): ${text.slice(0, 200)}`);
  }
  if (!res.ok || !json.access_token) {
    throw new Error(
      `zoho_token_error (${cfg.market}): ${json.error || res.status} ${text.slice(0, 200)}`,
    );
  }
  const expiresInMs = (json.expires_in ?? 3600) * 1000;
  tokenCache.set(cfg.market, {
    token: json.access_token,
    expiresAt: Date.now() + expiresInMs,
  });
  return json.access_token;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Zoho-oauthtoken ${token}` };
}

// ── List messages in the support folder (metadata only) ──────────────────────
export interface ZohoMessageMeta {
  messageId: string;
  fromAddress: string; // may be "Name <email>" or a bare address
  subject: string;
  receivedTime: number | null; // epoch ms
  hasAttachment: boolean;
  threadId: string | null;
}

export async function zohoListFolderMessages(
  cfg: ZohoMarketConfig,
  token: string,
  opts?: { limit?: number },
): Promise<ZohoMessageMeta[]> {
  const limit = Math.min(Math.max(opts?.limit ?? 25, 1), 200);
  const url =
    `${cfg.dcBase}/api/accounts/${cfg.accountId}/messages/view` +
    `?folderId=${encodeURIComponent(cfg.folderId)}&limit=${limit}&sortBy=date&sortorder=false`;
  const res = await fetch(url, { headers: authHeaders(token) });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`zoho_list_error (${cfg.market}): ${res.status} ${text.slice(0, 200)}`);
  }
  let json: { data?: unknown };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`zoho_list_parse_error (${cfg.market}): ${text.slice(0, 200)}`);
  }
  const rows = Array.isArray(json.data) ? (json.data as Record<string, unknown>[]) : [];
  return rows.map((r) => {
    const received = r.receivedTime ?? r.sentDateInGMT ?? null;
    const receivedNum = received != null ? Number(received) : NaN;
    return {
      messageId: String(r.messageId ?? ""),
      fromAddress: String(r.fromAddress ?? r.sender ?? ""),
      subject: String(r.subject ?? ""),
      receivedTime: Number.isFinite(receivedNum) ? receivedNum : null,
      hasAttachment: String(r.hasAttachment ?? "0") === "1" || r.hasAttachment === true,
      threadId: r.threadId != null ? String(r.threadId) : null,
    };
  }).filter((m) => m.messageId);
}

// ── Fetch full message content ───────────────────────────────────────────────
export async function zohoGetMessageContent(
  cfg: ZohoMarketConfig,
  token: string,
  messageId: string,
): Promise<{ html: string }> {
  const url =
    `${cfg.dcBase}/api/accounts/${cfg.accountId}/folders/${encodeURIComponent(cfg.folderId)}` +
    `/messages/${encodeURIComponent(messageId)}/content`;
  const res = await fetch(url, { headers: authHeaders(token) });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`zoho_content_error (${cfg.market}): ${res.status} ${text.slice(0, 200)}`);
  }
  let json: { data?: { content?: string } };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`zoho_content_parse_error (${cfg.market}): ${text.slice(0, 200)}`);
  }
  return { html: json.data?.content ?? "" };
}

// ── Send a reply ─────────────────────────────────────────────────────────────
// NOTE (Phase 0 verification): the fields below are the reliably-correct part of
// Zoho's "send email" endpoint (POST /messages). The exact reply/threading
// semantics (how Zoho links the sent mail to the original conversation) must be
// confirmed against the live API before enabling send in Phase 2 — sending is
// gated off in Phase 1. We pass the original messageId so threading can be wired
// once the live behaviour is confirmed; adjust the payload here, nowhere else.
// Upload an attachment to Zoho, returning the reference to include in a send.
// NOTE (Phase 0 verification): confirm the multipart field/response shape against
// the live API on the first real attachment send.
export interface ZohoAttachmentRef {
  storeName: string;
  attachmentPath: string;
  attachmentName: string;
}

export async function zohoUploadAttachment(
  cfg: ZohoMarketConfig,
  token: string,
  file: { fileName: string; bytes: Uint8Array; contentType?: string },
): Promise<ZohoAttachmentRef> {
  const url =
    `${cfg.dcBase}/api/accounts/${cfg.accountId}/messages/attachments` +
    `?uploadType=multipart&fileName=${encodeURIComponent(file.fileName)}`;
  const form = new FormData();
  form.append(
    "attach",
    new Blob([file.bytes], { type: file.contentType || "application/octet-stream" }),
    file.fileName,
  );
  const res = await fetch(url, { method: "POST", headers: authHeaders(token), body: form });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`zoho_attach_upload_error (${cfg.market}): ${res.status} ${text.slice(0, 200)}`);
  }
  let json: { data?: unknown };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`zoho_attach_parse_error (${cfg.market}): ${text.slice(0, 200)}`);
  }
  const d = (Array.isArray(json.data) ? json.data[0] : json.data) as Record<string, unknown> | undefined;
  if (!d?.storeName || !d?.attachmentPath) {
    throw new Error(`zoho_attach_unexpected (${cfg.market}): ${text.slice(0, 200)}`);
  }
  return {
    storeName: String(d.storeName),
    attachmentPath: String(d.attachmentPath),
    attachmentName: String(d.attachmentName ?? file.fileName),
  };
}

export interface ZohoReplyParams {
  originalMessageId: string;
  fromAddress: string;
  toAddress: string;
  subject: string;
  contentPlain: string;
  attachments?: ZohoAttachmentRef[];
}

export async function zohoSendReply(
  cfg: ZohoMarketConfig,
  token: string,
  params: ZohoReplyParams,
): Promise<{ sentMessageId: string | null }> {
  const url = `${cfg.dcBase}/api/accounts/${cfg.accountId}/messages`;
  const body: Record<string, unknown> = {
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    subject: params.subject,
    content: params.contentPlain.replace(/\n/g, "<br>"),
    mailFormat: "html",
    askReceipt: "no",
    // Reference to the inbound message for threading. Confirm field support in
    // Phase 0; harmless if ignored by Zoho.
    inReplyTo: params.originalMessageId,
  };
  if (params.attachments && params.attachments.length > 0) {
    body.attachments = params.attachments.map((a) => ({
      storeName: a.storeName,
      attachmentPath: a.attachmentPath,
      attachmentName: a.attachmentName,
    }));
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`zoho_send_error (${cfg.market}): ${res.status} ${text.slice(0, 300)}`);
  }
  let json: { data?: { messageId?: string } };
  try {
    json = JSON.parse(text);
  } catch {
    json = {};
  }
  return { sentMessageId: json.data?.messageId ? String(json.data.messageId) : null };
}
