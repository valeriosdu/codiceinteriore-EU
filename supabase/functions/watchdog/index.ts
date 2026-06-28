// Watchdog — lean, stateless business-failure alerting.
//
// Runs on a 30-min pg_cron tick. Each run calls the SECURITY DEFINER RPC
// `watchdog_collect()` (raw counts + samples for 6 checks), applies the
// thresholds below, and — if anything is SYSTEMICALLY broken (a surge, not a
// single instance) — emails the owner ONCE via the Brevo API directly,
// bypassing the pgmq/process-email-queue path (which is itself monitored, so a
// jam there must not swallow this alarm).
//
// Liveness is an external dead-man's-switch: at the end of a clean run we ping
// WATCHDOG_HEARTBEAT_URL (e.g. healthchecks.io). If the watchdog/cron dies the
// pings stop and the external service alerts the owner — zero healthy-state
// email noise here.
//
// Stateless on purpose: no dedup table. During an ongoing outage you get one
// email per 30-min run (acceptable nagging). The count>=3 floors keep healthy
// ticks silent. Auth: verify_jwt=true gateway + service_role JWT claim (or
// x-admin-secret) — same pattern as recover-pending-reports.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";
// Internal ops alert — recipient + sender are tunable via secrets; defaults are
// the IT brand's verified Brevo sender, which is fine for an owner-only email.
const ALERT_EMAIL = Deno.env.get("WATCHDOG_ALERT_EMAIL") || "info@codiceinteriore.it";
const ALERT_FROM = Deno.env.get("WATCHDOG_ALERT_FROM") ||
  "Codice Interiore Watchdog <info@codiceinteriore.it>";
const HEARTBEAT_URL = Deno.env.get("WATCHDOG_HEARTBEAT_URL") || "";

// ---- Thresholds (tune from the dryRun output / logs) -----------------------
const FLOOR = 3; // a single stuck instance never pages; a cluster does
const LLM_OUTAGE_MIN_ATTEMPTS = 3; // attempts with zero successes = down
const LLM_DEGRADED_MIN_ATTEMPTS = 5; // enough volume to trust a ratio
const LLM_MIN_SUCCESS_RATE = 0.5;
const RECOVERY_MAX_AGE_MIN = 30; // recover-pending-reports runs every 3 min

const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

// Decode (not verify) JWT claims — verify_jwt=true validates the signature at
// the gateway before this runs, so reading the role claim is safe.
function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replaceAll("-", "+").replaceAll("_", "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Parse a `Name <email@domain>` From header into Brevo's sender shape.
function parseFromAddress(from: string): { name?: string; email: string } {
  const m = from.match(/^(.*)<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || undefined, email: m[2].trim() };
  return { email: from.trim() };
}

type Fired = { key: string; severity: "critical" | "warning"; summary: string; samples: unknown[] };

function evaluate(r: Record<string, any>): Fired[] {
  const fired: Fired[] = [];

  const llm = r.llm ?? { attempts: 0, successes: 0 };
  const attempts = Number(llm.attempts) || 0;
  const successes = Number(llm.successes) || 0;
  const failures = attempts - successes;
  const rate = attempts > 0 ? successes / attempts : 1;
  if (
    (attempts >= LLM_OUTAGE_MIN_ATTEMPTS && successes === 0) ||
    (attempts >= LLM_DEGRADED_MIN_ATTEMPTS && rate < LLM_MIN_SUCCESS_RATE)
  ) {
    fired.push({
      key: "llm_broken",
      severity: "critical",
      summary: `LLM ${successes === 0 ? "DOWN" : "degraded"}: ${failures}/${attempts} attempts failed in the last 60 min (success rate ${(rate * 100).toFixed(0)}%).`,
      samples: [],
    });
  }

  const simpleFloors: Array<[string, string]> = [
    ["paid_no_report", "paid checkouts with no report (unclaimed >15 min)"],
    ["reports_failing", "report generations in failed state (last 60 min)"],
    ["email_silent_drop", "finished reports whose customer was never emailed"],
    ["transits_stuck", "transit subscription cycles wedged"],
  ];
  for (const [key, label] of simpleFloors) {
    const node = r[key] ?? { count: 0, samples: [] };
    const count = Number(node.count) || 0;
    if (count >= FLOOR) {
      fired.push({ key, severity: "critical", summary: `${count} ${label}.`, samples: node.samples ?? [] });
    }
  }

  const rec = r.recovery ?? {};
  const ageMin = rec.last_run == null ? null : Number(rec.age_min);
  if (rec.last_run == null || (ageMin != null && ageMin > RECOVERY_MAX_AGE_MIN)) {
    fired.push({
      key: "recovery_dead",
      severity: "critical",
      summary: rec.last_run == null
        ? "recover-pending-reports has not run in the last 2 hours — the recovery cron may be dead."
        : `recover-pending-reports last ran ${ageMin} min ago (expected every 3 min) — the recovery cron may be stalled.`,
      samples: [],
    });
  }

  return fired;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

function buildEmailHtml(fired: Fired[], report: Record<string, any>): string {
  const rows = fired.map((f) => {
    const samples = (f.samples && f.samples.length)
      ? `<pre style="margin:6px 0 0;padding:8px;background:#f6f6f6;border-radius:6px;font-size:12px;overflow:auto">${
        escapeHtml(JSON.stringify(f.samples, null, 2))
      }</pre>`
      : "";
    return `<li style="margin:0 0 14px"><strong>${escapeHtml(f.key)}</strong> — ${escapeHtml(f.summary)}${samples}</li>`;
  }).join("");
  return `<div style="font-family:system-ui,Arial,sans-serif;font-size:14px;color:#111">
    <h2 style="margin:0 0 4px">⚠️ Watchdog: ${fired.length} issue(s) detected</h2>
    <p style="margin:0 0 12px;color:#555">Generated at ${escapeHtml(String(report.generated_at ?? ""))} (UTC).</p>
    <ul style="padding-left:18px;margin:0">${rows}</ul>
    <p style="margin:16px 0 0;color:#888;font-size:12px">Each check only fires on a surge (≥${FLOOR}) or a systemic flag — single stuck instances are handled by the recovery crons and don't page. Repeats every 30 min until resolved.</p>
  </div>`;
}

async function sendAlert(fired: Fired[], report: Record<string, any>): Promise<{ sent: boolean; error?: string }> {
  if (!BREVO_API_KEY) return { sent: false, error: "BREVO_API_KEY not set" };
  const subject = `⚠️ [Watchdog] ${fired.length} issue(s): ${fired.map((f) => f.key).join(", ")}`;
  const res = await fetch(BREVO_SEND_URL, {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: parseFromAddress(ALERT_FROM),
      to: [{ email: ALERT_EMAIL }],
      subject,
      htmlContent: buildEmailHtml(fired, report),
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { sent: false, error: `Brevo ${res.status}: ${text.slice(0, 300)}` };
  }
  return { sent: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: x-admin-secret, or a service_role JWT (the gateway already verified
  // the signature via verify_jwt=true). Don't compare against the env service
  // key — under signing keys it's a short sb_secret_* while cron uses a JWT.
  const adminSecret = (req.headers.get("x-admin-secret") || "").trim();
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
  const claims = parseJwtClaims(token);
  const authorized = (!!ADMIN_SECRET && adminSecret === ADMIN_SECRET) || claims?.role === "service_role";
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let dryRun = false;
  try {
    const body = await req.json().catch(() => ({}));
    dryRun = body?.dryRun === true;
  } catch (_) { /* no body */ }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: report, error } = await supabase.rpc("watchdog_collect");
  if (error) {
    console.error("[watchdog] collect failed:", error.message);
    return new Response(JSON.stringify({ error: "collect_failed", detail: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const fired = evaluate(report as Record<string, any>);
  let alert: { sent: boolean; error?: string } = { sent: false };
  if (fired.length > 0 && !dryRun) {
    alert = await sendAlert(fired, report as Record<string, any>);
    if (!alert.sent) console.error("[watchdog] alert send failed:", alert.error);
    else console.log(`[watchdog] alerted: ${fired.map((f) => f.key).join(", ")}`);
  }

  // Dead-man's-switch: ping ONLY on a real (non-dryRun) run that got this far.
  let pinged = false;
  if (!dryRun && HEARTBEAT_URL) {
    try {
      await fetch(HEARTBEAT_URL, { method: "POST" });
      pinged = true;
    } catch (e) {
      console.warn("[watchdog] heartbeat ping failed:", e instanceof Error ? e.message : String(e));
    }
  }

  return new Response(
    JSON.stringify({ ok: true, dryRun, firedCount: fired.length, fired, alert, pinged, report }, null, 2),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
