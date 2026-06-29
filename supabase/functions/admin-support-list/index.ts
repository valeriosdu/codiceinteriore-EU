// Admin: list support tickets for /admin/support, with status/category counts.
// Auth: x-admin-secret. Returns full ticket rows (the page expands inline, like
// AdminAstrologyGuide) plus an aggregate for the stat cards.
//
// Body: { status?, category?, email?, limit?, offset? }
//   - the page sends category='support' for the main queue, or status='ignored'
//     for the "spam/automated" view.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

const COLS =
  "id, created_at, updated_at, market, from_email, from_name, subject, body_plain, " +
  "attachment_count, received_at, category, triage_reason, resolved_email, resolved_profile_id, " +
  "candidate_matches, draft_body, reply_language, data_summary, ai_note, ai_confidence, " +
  "flag_for_human, model_used, sent_body, answered_at, status, retry_count, error, " +
  "manually_linked, force_support, zoho_thread_id, zoho_message_id";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    if (!ADMIN_SECRET || adminSecret !== ADMIN_SECRET) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const status = typeof body.status === "string" ? body.status : null;
    const category = typeof body.category === "string" ? body.category : null;
    const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
    // Sanitize for safe use inside the PostgREST or() filter syntax.
    const email = emailRaw.replace(/[^a-zA-Z0-9@._%+\- ]/g, "").slice(0, 200);
    const limit = Math.min(Math.max(Number(body.limit) || 100, 1), 200);
    const offset = Math.max(Number(body.offset) || 0, 0);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let q = admin.from("support_tickets").select(COLS, { count: "exact" });
    if (status) q = q.eq("status", status);
    if (category) q = q.eq("category", category);
    // In a raw PostgREST or() string the wildcard is `*` (mapped to SQL `%`).
    if (email) q = q.or(`from_email.ilike.*${email}*,resolved_email.ilike.*${email}*`);
    q = q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await q;
    if (error) {
      console.error("[admin-support-list] query error:", error);
      return jsonResponse({ error: error.message }, 500);
    }

    // Aggregate for the stat cards (over ALL tickets, ignoring the filters).
    const headCount = (build: (qq: ReturnType<typeof admin.from>) => unknown) =>
      build(admin.from("support_tickets").select("id", { count: "exact", head: true })) as unknown as Promise<{
        count: number | null;
      }>;

    const [total, drafted, answered, ignored, received, drafting, failed, flagged] = await Promise.all([
      headCount((b) => b),
      headCount((b) => (b as any).eq("status", "drafted")),
      headCount((b) => (b as any).eq("status", "answered")),
      headCount((b) => (b as any).eq("status", "ignored")),
      headCount((b) => (b as any).eq("status", "received")),
      headCount((b) => (b as any).eq("status", "drafting")),
      headCount((b) => (b as any).eq("status", "draft_failed")),
      headCount((b) => (b as any).eq("status", "drafted").eq("flag_for_human", true)),
    ]);

    return jsonResponse({
      items: data || [],
      total: count ?? 0,
      aggregate: {
        total: total.count ?? 0,
        by_status: {
          received: received.count ?? 0,
          drafting: drafting.count ?? 0,
          drafted: drafted.count ?? 0,
          draft_failed: failed.count ?? 0,
          answered: answered.count ?? 0,
          ignored: ignored.count ?? 0,
        },
        flagged: flagged.count ?? 0,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-support-list] error:", msg);
    return jsonResponse({ error: msg }, 500);
  }
});
