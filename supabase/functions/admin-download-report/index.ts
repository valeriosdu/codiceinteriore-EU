import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  decodeStoredChartPng,
  fetchNatalChartPng,
  generateReportPdf,
  isCurrentPdfVersion,
  PDF_VERSION,
  ReportContent,
} from "../_shared/report-pdf.ts";
import {
  generateTransitPdf,
  isCurrentTransitPdfVersion,
  TRANSIT_PDF_VERSION,
  type InterpretedTransits,
} from "../_shared/transit-pdf.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET")!;

function safeSlug(value: string | null, fallback: string) {
  return (
    (value || fallback)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || fallback
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret");
    const authHeader = req.headers.get("authorization");
    const isServiceRole = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
    const isAdminSecret = adminSecret && adminSecret === ADMIN_SECRET;

    if (!isServiceRole && !isAdminSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);

    // ===== TRANSIT DOWNLOAD mode =====
    if (url.searchParams.get("transit") === "1") {
      const sessionId = url.searchParams.get("session_id");
      const force = url.searchParams.get("force") === "1";
      const requestedCycleId = url.searchParams.get("cycle_id");

      if (!sessionId) {
        return new Response(JSON.stringify({ error: "Provide session_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find profile linked to this quiz session via user_reports.
      const { data: link } = await supabase
        .from("user_reports")
        .select("profile_id")
        .eq("quiz_session_id", sessionId)
        .limit(1)
        .maybeSingle();

      if (!link?.profile_id) {
        return new Response(JSON.stringify({ error: "No claimed report for this session" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let cycle:
        | {
            id: string;
            period_start: string | null;
            period_end: string | null;
            interpretation_status: string | null;
            interpreted_transits: unknown;
          }
        | null = null;

      if (requestedCycleId) {
        // Specific historical cycle requested by admin. Validate ownership:
        // the cycle's entitlement must belong to this session and profile.
        const { data: row } = await supabase
          .from("transit_cycles")
          .select("id, period_start, period_end, interpretation_status, interpreted_transits, entitlement_id")
          .eq("id", requestedCycleId)
          .maybeSingle();
        if (!row) {
          return new Response(JSON.stringify({ error: "Cycle not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: ent } = await supabase
          .from("user_entitlements")
          .select("profile_id, quiz_session_id")
          .eq("id", (row as any).entitlement_id)
          .maybeSingle();
        if (!ent || ent.profile_id !== link.profile_id || ent.quiz_session_id !== sessionId) {
          return new Response(JSON.stringify({ error: "Cycle does not belong to this session" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        cycle = {
          id: (row as any).id,
          period_start: (row as any).period_start,
          period_end: (row as any).period_end,
          interpretation_status: (row as any).interpretation_status,
          interpreted_transits: (row as any).interpreted_transits,
        };
      } else {
        // Default: skip the entitlement lookup entirely and pick the most
        // recent cycle by (profile, session) directly. Admin downloads should
        // never depend on entitlement state: a customer with a cancelled or
        // expired entitlement still has a generated cycle in DB that we want
        // to be able to inspect. The cycle's existence is the proof the
        // reading was paid for and produced.
        let { data: row } = await supabase
          .from("transit_cycles")
          .select("id, period_start, period_end, interpretation_status, interpreted_transits")
          .eq("profile_id", link.profile_id)
          .eq("quiz_session_id", sessionId)
          .order("period_start", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Fallback: same profile, any session. Handles the case where the
        // cycle was created against a different quiz_session of this same
        // profile (legacy data, manual recovery, post-rebuy migrations).
        if (!row) {
          const { data: fallback } = await supabase
            .from("transit_cycles")
            .select("id, period_start, period_end, interpretation_status, interpreted_transits")
            .eq("profile_id", link.profile_id)
            .order("period_start", { ascending: false })
            .limit(1)
            .maybeSingle();
          row = fallback;
        }

        if (!row) {
          return new Response(JSON.stringify({ error: "No transit cycle found for this profile" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        cycle = row as typeof cycle;
      }

      if (!cycle || !cycle.interpreted_transits || cycle.interpretation_status !== "completed") {
        return new Response(JSON.stringify({ error: "Transit interpretation not ready" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: session } = await supabase
        .from("quiz_sessions")
        .select("user_name, birth_place, birth_date, birth_time, language, market")
        .eq("id", sessionId)
        .single();

      const userName = session?.user_name || null;
      const tLang = (session as { language?: string })?.language === "es" ? "es" : "it";
      const tMarket = (session as { market?: string })?.market === "es" ? "es" : "it";
      const safeName = safeSlug(userName, "transiti");
      const filename = `${tMarket === "es" ? "carta-interior" : "codice-interiore"}-${tLang === "es" ? "transitos" : "transiti"}-${safeName}.pdf`;

      // Admin-scoped storage path so we don't collide with user-scoped path.
      const storagePath = `admin/transit-${sessionId}-${cycle.id}-${TRANSIT_PDF_VERSION}-${tLang}.pdf`;

      if (!force) {
        const { data: existingPdf } = await supabase.storage
          .from("report-pdfs")
          .download(storagePath);
        if (existingPdf) {
          const bytes = new Uint8Array(await existingPdf.arrayBuffer());
          if (isCurrentTransitPdfVersion(bytes)) {
            const { data: signed, error: signErr } = await supabase.storage
              .from("report-pdfs")
              .createSignedUrl(storagePath, 3600, { download: filename });
            if (signErr) throw signErr;
            console.log("[admin-download-report] transit cache hit", { sessionId, cycleId: cycle.id });
            return new Response(
              JSON.stringify({ url: signed.signedUrl, filename, version: TRANSIT_PDF_VERSION, kind: "transit" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
        }
      }

      console.log("[admin-download-report] generating transit", { sessionId, cycleId: cycle.id });
      const pdfBytes = await generateTransitPdf({
        interpreted: cycle.interpreted_transits as InterpretedTransits,
        userName,
        birthPlace: session?.birth_place || null,
        birthDate: (session as any)?.birth_date || null,
        birthTime: (session as any)?.birth_time || null,
        periodStart: cycle.period_start || null,
        periodEnd: cycle.period_end || null,
        lang: tLang,
        market: tMarket,
      });

      const { error: uploadErr } = await supabase.storage
        .from("report-pdfs")
        .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: signed, error: signErr } = await supabase.storage
        .from("report-pdfs")
        .createSignedUrl(storagePath, 3600, { download: filename });
      if (signErr) throw signErr;

      return new Response(
        JSON.stringify({ url: signed.signedUrl, filename, version: TRANSIT_PDF_VERSION, kind: "transit" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ===== NATAL DOWNLOAD mode =====
    let sessionId = url.searchParams.get("session_id");
    const force = url.searchParams.get("force") === "1";

    const userId = url.searchParams.get("user_id");
    if (!sessionId && userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("quiz_session_id")
        .eq("user_id", userId)
        .single();
      sessionId = profile?.quiz_session_id || null;
    }

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Provide session_id or user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: session, error: sessErr } = await supabase
      .from("quiz_sessions")
      .select("full_report, user_name, birth_place, birth_date, birth_time, birth_lat, birth_lng, birth_timezone, natal_chart_png, funnel_slug, language, market")
      .eq("id", sessionId)
      .single();

    if (sessErr || !session?.full_report) {
      return new Response(JSON.stringify({ error: "Report not found for this session" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfLang = (session as { language?: string }).language === "es" ? "es" : "it";
    const pdfMarket = (session as { market?: string }).market === "es" ? "es" : "it";
    const storagePath = `admin/${sessionId}-${PDF_VERSION}-${pdfLang}.pdf`;
    const legacyPath = `admin/${sessionId}.pdf`;

    const safeName = safeSlug(session.user_name, "report");
    const filename = `${pdfMarket === "es" ? "carta-interior" : "codice-interiore"}-${safeName}.pdf`;

    if (!force) {
      const { data: existingPdf } = await supabase.storage
        .from("report-pdfs")
        .download(storagePath);

      if (existingPdf) {
        const bytes = new Uint8Array(await existingPdf.arrayBuffer());
        if (isCurrentPdfVersion(bytes)) {
          const { data: signedUrl, error: signErr } = await supabase.storage
            .from("report-pdfs")
            .createSignedUrl(storagePath, 3600, { download: filename });
          if (signErr) throw signErr;
          console.log("[admin-download-report] cache hit", { sessionId });
          return new Response(JSON.stringify({ url: signedUrl.signedUrl, user_name: session.user_name, filename, version: PDF_VERSION, kind: "natal" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    let chartPng: Uint8Array | null = await fetchNatalChartPng({
      user_name: session.user_name,
      birth_date: session.birth_date,
      birth_time: (session as any).birth_time,
      birth_place: session.birth_place,
      birth_lat: (session as any).birth_lat,
      birth_lng: (session as any).birth_lng,
      birth_timezone: (session as any).birth_timezone,
    });

    let chartSource: "live" | "stored" | "none" = chartPng ? "live" : "none";
    if (!chartPng) {
      const stored = decodeStoredChartPng((session as any).natal_chart_png);
      if (stored) {
        chartPng = stored;
        chartSource = "stored";
      }
    }

    console.log("[admin-download-report] generating", { sessionId, chartSource });

    const pdfBytes = await generateReportPdf({
      reportContent: session.full_report as ReportContent,
      userName: session.user_name,
      birthPlace: session.birth_place,
      birthDate: session.birth_date,
      chartPng,
      // Without the funnel slug the renderer falls back to the "classica"
      // section map, so an "attivazione" report loses every section whose key
      // differs and the PDF collapses to just identity + advice + poem.
      funnelSlug: (session as { funnel_slug?: string | null }).funnel_slug || "classica",
      lang: pdfLang,
      market: pdfMarket,
    });

    const { error: uploadErr } = await supabase.storage
      .from("report-pdfs")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (uploadErr) throw uploadErr;

    supabase.storage.from("report-pdfs").remove([legacyPath]).catch(() => {});

    const { data: signedUrl, error: signErr } = await supabase.storage
      .from("report-pdfs")
      .createSignedUrl(storagePath, 3600, { download: filename });
    if (signErr) throw signErr;

    return new Response(JSON.stringify({ url: signedUrl.signedUrl, user_name: session.user_name, filename, version: PDF_VERSION, kind: "natal" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[admin-download-report] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: "Internal server error", detail: message.slice(0, 200) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
