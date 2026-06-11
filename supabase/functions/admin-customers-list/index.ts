// Lista paginata dei clienti aggregati per email per la nuova area /admin/clienti.
// 1 riga in risposta = 1 email_key (lower(email) canonical), aggrega profilo +
// tutti i checkout (anche orfani) + tutti i quiz_sessions associati + flag
// (orfano, errore, subscriber, ecc.) + ultima attività + lifetime spend.
//
// Il rollup vero vive nella RPC public.admin_customers_search; questa edge
// function è solo il wrapper HTTP con auth via ADMIN_SECRET.
//
// Gated da ADMIN_SECRET (header x-admin-secret), come le altre admin-*.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "";

type Filter = "all" | "orphan" | "error" | "subscriber" | "no_report" | "has_transits" | "has_synastry" | "has_guide";
type Sort = "last_activity" | "lifetime_spend";

interface RequestBody {
  q?: string;
  filter?: Filter;
  sort?: Sort;
  page?: number;
  page_size?: number;
  hide_empty?: boolean;
}

const ALLOWED_FILTERS: Filter[] = ["all", "orphan", "error", "subscriber", "no_report", "has_transits", "has_synastry", "has_guide"];
const ALLOWED_SORTS: Sort[] = ["last_activity", "lifetime_spend"];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret") || "";
    if (!ADMIN_SECRET || adminSecret !== ADMIN_SECRET) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    // Accetta sia POST con body JSON, sia GET con querystring (utile per debug curl).
    let raw: RequestBody = {};
    if (req.method === "POST") {
      try {
        raw = (await req.json()) as RequestBody;
      } catch {
        raw = {};
      }
    } else {
      const u = new URL(req.url);
      raw = {
        q: u.searchParams.get("q") ?? undefined,
        filter: (u.searchParams.get("filter") as Filter) ?? undefined,
        sort: (u.searchParams.get("sort") as Sort) ?? undefined,
        page: u.searchParams.get("page")
          ? Number(u.searchParams.get("page"))
          : undefined,
        page_size: u.searchParams.get("page_size")
          ? Number(u.searchParams.get("page_size"))
          : undefined,
        hide_empty: u.searchParams.get("hide_empty") === "true",
      };
    }

    const q = typeof raw.q === "string" ? raw.q.trim() : "";
    const filter: Filter = ALLOWED_FILTERS.includes(raw.filter as Filter)
      ? (raw.filter as Filter)
      : "all";
    const sort: Sort = ALLOWED_SORTS.includes(raw.sort as Sort)
      ? (raw.sort as Sort)
      : "last_activity";
    const page = Number.isFinite(raw.page) && (raw.page as number) > 0
      ? Math.floor(raw.page as number)
      : 1;
    const pageSize =
      Number.isFinite(raw.page_size) && (raw.page_size as number) > 0
        ? Math.min(Math.floor(raw.page_size as number), 200)
        : 50;
    const hideEmpty = raw.hide_empty === true;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await admin.rpc("admin_customers_search", {
      p_q: q || null,
      p_filter: filter,
      p_sort: sort,
      p_page: page,
      p_page_size: pageSize,
      p_hide_empty: hideEmpty,
    });

    if (error) {
      console.error("[admin-customers-list] rpc error:", error);
      return jsonResponse({ error: error.message }, 500);
    }

    // La RPC ritorna già un jsonb { total, page, page_size, customers[] }.
    return jsonResponse(data ?? { total: 0, page, page_size: pageSize, customers: [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-customers-list] error:", msg);
    return jsonResponse({ error: msg }, 500);
  }
});
