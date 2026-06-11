// Admin: paginated list of astrology guide questions with filters.
// Gated by ADMIN_SECRET (header x-admin-secret).
// Body params (all optional):
//   - status: 'pending' | 'processing' | 'completed' | 'failed'
//   - email: substring match against profile email (case-insensitive)
//   - limit: max rows to return (default 100, capped at 500)
//   - offset: rows to skip (default 0)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { ASTROLOGY_GUIDE_PURCHASE_TYPE } from "../_shared/astrology-products.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

const ALLOWED_STATUSES = new Set(["pending", "processing", "ready", "completed", "failed"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    if (!ADMIN_SECRET || adminSecret !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const status =
      typeof body?.status === "string" && ALLOWED_STATUSES.has(body.status)
        ? body.status
        : null;
    const emailQuery =
      typeof body?.email === "string" && body.email.trim().length > 0
        ? body.email.trim().toLowerCase()
        : null;
    const limit = Math.min(500, Math.max(1, Number(body?.limit) || 100));
    const offset = Math.max(0, Number(body?.offset) || 0);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // If email filter set, resolve matching profile_ids first.
    let profileIdsFilter: string[] | null = null;
    if (emailQuery) {
      const { data: matchingProfiles, error: profileLookupErr } = await admin
        .from("profiles")
        .select("id")
        .ilike("email", `%${emailQuery}%`)
        .limit(500);
      if (profileLookupErr) throw profileLookupErr;
      profileIdsFilter = (matchingProfiles || []).map((p: { id: string }) => p.id);
      if (profileIdsFilter.length === 0) {
        return new Response(
          JSON.stringify({ items: [], total: 0, aggregate: emptyAggregate() }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    let query = admin
      .from("astrology_guide_questions")
      .select(
        "id, profile_id, quiz_session_id, section_id, question, answer, status, scheduled_for, processed_at, email_sent_at, is_free, retry_count, error, created_at, updated_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (profileIdsFilter) query = query.in("profile_id", profileIdsFilter);

    const { data: rows, error, count } = await query;
    if (error) throw error;

    type Row = {
      id: string;
      profile_id: string;
      quiz_session_id: string;
      section_id: string | null;
      question: string;
      answer: string | null;
      status: string;
      scheduled_for: string;
      processed_at: string | null;
      email_sent_at: string | null;
      is_free: boolean;
      retry_count: number;
      error: string | null;
      created_at: string;
      updated_at: string;
    };
    const typedRows = (rows || []) as Row[];

    // Enrich with profile email + session user_name in two batched queries.
    const profileIds = Array.from(new Set(typedRows.map((r) => r.profile_id))).filter(Boolean);
    const sessionIds = Array.from(new Set(typedRows.map((r) => r.quiz_session_id))).filter(Boolean);

    const [profilesRes, sessionsRes] = await Promise.all([
      profileIds.length
        ? admin.from("profiles").select("id, email").in("id", profileIds)
        : Promise.resolve({ data: [], error: null }),
      sessionIds.length
        ? admin.from("quiz_sessions").select("id, user_name").in("id", sessionIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const emailById = new Map<string, string | null>();
    for (const p of (profilesRes.data || []) as { id: string; email: string | null }[]) {
      emailById.set(p.id, p.email);
    }
    const userNameById = new Map<string, string | null>();
    for (const s of (sessionsRes.data || []) as { id: string; user_name: string | null }[]) {
      userNameById.set(s.id, s.user_name);
    }

    const items = typedRows.map((r) => ({
      ...r,
      email: emailById.get(r.profile_id) || null,
      user_name: userNameById.get(r.quiz_session_id) || null,
    }));

    // Aggregates over the FILTERED scope (so user can see counts for current view).
    const aggregateScope = await buildAggregate(admin, profileIdsFilter);

    return new Response(
      JSON.stringify({ items, total: count || 0, aggregate: aggregateScope }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : err && typeof err === "object"
          ? JSON.stringify(err)
          : String(err);
    console.error("[admin-astrology-questions-list] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

const emptyAggregate = () => ({
  total: 0,
  by_status: { pending: 0, processing: 0, ready: 0, completed: 0, failed: 0 },
  is_free: 0,
  is_paid: 0,
  packs_purchased: 0,
});

async function buildAggregate(
  admin: ReturnType<typeof createClient>,
  profileIdsFilter: string[] | null,
) {
  // Cheap aggregate: one query per status + free/paid counts.
  // NOTE: .in() is a filter, so it must be chained AFTER .select(). Calling it
  // on the bare .from() builder throws "q.in is not a function" — which broke
  // every email-filtered search (profileIdsFilter set) while the unfiltered
  // path silently worked. Hence the profile scope is applied here, post-select.
  const questionCount = (status?: string, freeOnly?: boolean) => {
    let q = admin
      .from("astrology_guide_questions")
      .select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    if (freeOnly) q = q.eq("is_free", true);
    if (profileIdsFilter) q = q.in("profile_id", profileIdsFilter);
    return q;
  };

  // Skip per-status counting if we're already filtering by status (the
  // total reflects only that status). We still report all five for the UI.
  // packsQuery counts paid checkout_sessions for the astrology guide pack —
  // scoped to profileIdsFilter if the admin is searching by email, else
  // global. It's a different table than the questions table, so a separate
  // query (not via questionCount).
  let packsQuery = admin
    .from("checkout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("purchase_type", ASTROLOGY_GUIDE_PURCHASE_TYPE)
    .eq("payment_status", "paid");
  if (profileIdsFilter) {
    packsQuery = packsQuery.in("claimed_profile_id", profileIdsFilter);
  }

  const [
    allCount,
    pendingCount,
    processingCount,
    readyCount,
    completedCount,
    failedCount,
    freeCount,
    packsCount,
  ] = await Promise.all([
    questionCount(),
    questionCount("pending"),
    questionCount("processing"),
    questionCount("ready"),
    questionCount("completed"),
    questionCount("failed"),
    questionCount(undefined, true),
    packsQuery,
  ]);

  const total = allCount.count || 0;
  const free = freeCount.count || 0;
  return {
    total,
    by_status: {
      pending: pendingCount.count || 0,
      processing: processingCount.count || 0,
      ready: readyCount.count || 0,
      completed: completedCount.count || 0,
      failed: failedCount.count || 0,
    },
    is_free: free,
    is_paid: Math.max(0, total - free),
    packs_purchased: packsCount.count || 0,
  };
}
