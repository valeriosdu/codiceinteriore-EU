import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  decodeStoredChartPng,
  fetchNatalChartPng,
  generateReportPdf,
  isCurrentPdfVersion,
  PDF_VERSION,
  rasterizeChartSvg,
  ReportContent,
} from "../_shared/report-pdf.ts";
import { brandSlug, getMarket } from "../_shared/markets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function safeFilename(userName: string | null, market: string | null) {
  const base = (userName || "report")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "report";
  return `${brandSlug(getMarket(market))}-${base}.pdf`;
}

function pdfDownloadResponse(pdfBytes: Uint8Array, filename: string) {
  return new Response(pdfBytes, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-PDF-Version": PDF_VERSION,
    },
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.warn("[generate-report-pdf] Auth failed", authError?.message);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = user.id;
    const url = new URL(req.url);
    const requestedQuizSessionId = url.searchParams.get("quizSessionId");
    const force = url.searchParams.get("force") === "1";
    // mode=url returns a JSON body with a signed HTTPS URL pointing to the PDF.
    // This is the preferred path for browsers because it avoids fragile
    // blob: URL handling on iOS Safari and in-app browsers.
    const responseMode = url.searchParams.get("mode") === "url" ? "url" : "binary";
    console.log("[generate-report-pdf] start", { userId, requestedQuizSessionId, force, responseMode });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, quiz_session_id")
      .eq("user_id", userId)
      .single();

    if (profileError) console.warn("[generate-report-pdf] profile lookup failed", profileError.message);
    if (!profile?.id) {
      return jsonResponse({ error: "No report found" }, 404);
    }

    let quizSessionId = requestedQuizSessionId || profile.quiz_session_id;

    if (requestedQuizSessionId) {
      const { data: ownedReport } = await supabaseAdmin
        .from("user_reports")
        .select("id")
        .eq("profile_id", profile.id)
        .eq("quiz_session_id", requestedQuizSessionId)
        .maybeSingle();

      if (!ownedReport) {
        console.warn("[generate-report-pdf] report not owned by user", { userId, requestedQuizSessionId });
        return jsonResponse({ error: "Report not found" }, 404);
      }
    }

    if (!quizSessionId) {
      const { data: activeReport } = await supabaseAdmin
        .from("user_reports")
        .select("quiz_session_id")
        .eq("profile_id", profile.id)
        .eq("is_active", true)
        .maybeSingle();
      quizSessionId = activeReport?.quiz_session_id || null;
    }

    // Last-resort fallback: take the most recent owned report if nothing else
    // is set. Avoids 404s when the profile.quiz_session_id is stale.
    if (!quizSessionId) {
      const { data: anyReport } = await supabaseAdmin
        .from("user_reports")
        .select("quiz_session_id, created_at")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      quizSessionId = anyReport?.quiz_session_id || null;
    }

    if (!quizSessionId) {
      return jsonResponse({ error: "No report found" }, 404);
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("quiz_sessions")
      .select("full_report, user_name, birth_place, birth_date, birth_time, birth_lat, birth_lng, birth_timezone, natal_chart_svg, natal_chart_png, funnel_slug, language, market")
      .eq("id", quizSessionId)
      .single();

    // La lingua entra nel path di cache così IT ed ES non si sovrascrivono.
    const pdfLang = (session as any)?.language === "es" ? "es" : "it";
    const storagePath = `${userId}/${quizSessionId}/report-${PDF_VERSION}-${pdfLang}.pdf`;
    const legacyPath = `${userId}/${quizSessionId}/report.pdf`;

    if (sessionError) console.warn("[generate-report-pdf] session lookup failed", sessionError.message);
    if (!session?.full_report) {
      return jsonResponse({ error: "Report not generated yet" }, 404);
    }

    const filename = safeFilename(session.user_name, (session as any).market);

    // Try to serve the cached PDF: do a direct download instead of listing
    // the folder (more reliable, fewer storage round-trips, doesn't rely on
    // listing limits).
    if (!force) {
      const { data: existingPdf } = await supabaseAdmin.storage
        .from("report-pdfs")
        .download(storagePath);

      if (existingPdf) {
        const bytes = new Uint8Array(await existingPdf.arrayBuffer());
        if (isCurrentPdfVersion(bytes)) {
          console.log("[generate-report-pdf] cache hit", { userId, quizSessionId, responseMode });
          if (responseMode === "url") {
            const { data: signed, error: signErr } = await supabaseAdmin.storage
              .from("report-pdfs")
              .createSignedUrl(storagePath, 3600, { download: filename });
            if (signErr) throw signErr;
            return jsonResponse({
              url: signed.signedUrl,
              filename,
              version: PDF_VERSION,
              userName: session.user_name,
              cached: true,
            });
          }
          return pdfDownloadResponse(bytes, filename);
        }
        console.warn("[generate-report-pdf] cached PDF version mismatch — regenerating");
      }
    }

    // Chart: rasterize the stored styled SVG locally (deterministic, matches
    // the website). Fall back to the provider's live PNG, then any stored PNG.
    let chartPng: Uint8Array | null = await rasterizeChartSvg((session as any).natal_chart_svg);
    let chartSource: "svg" | "live" | "stored" | "none" = chartPng ? "svg" : "none";
    if (!chartPng) {
      chartPng = await fetchNatalChartPng({
        user_name: session.user_name,
        birth_date: session.birth_date,
        birth_time: (session as any).birth_time,
        birth_place: session.birth_place,
        birth_lat: (session as any).birth_lat,
        birth_lng: (session as any).birth_lng,
        birth_timezone: (session as any).birth_timezone,
      });
      if (chartPng) chartSource = "live";
    }
    if (!chartPng) {
      const stored = decodeStoredChartPng((session as any).natal_chart_png);
      if (stored) {
        chartPng = stored;
        chartSource = "stored";
      }
    }

    console.log("[generate-report-pdf] generating", { userId, quizSessionId, chartSource });
    const pdfBytes = await generateReportPdf({
      reportContent: session.full_report as ReportContent,
      userName: session.user_name,
      birthPlace: session.birth_place,
      birthDate: session.birth_date,
      chartPng,
      funnelSlug: ((session as any).funnel_slug as string) || "classica",
      lang: pdfLang,
      market: (session as any).market === "es" ? "es" : "it",
    });

    const { error: uploadError } = await supabaseAdmin.storage
      .from("report-pdfs")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw uploadError;

    supabaseAdmin.storage.from("report-pdfs").remove([legacyPath]).catch(() => {});

    console.log("[generate-report-pdf] generated", { userId, quizSessionId, chartSource, size: pdfBytes.length, responseMode });

    if (responseMode === "url") {
      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from("report-pdfs")
        .createSignedUrl(storagePath, 3600, { download: filename });
      if (signErr) throw signErr;
      return jsonResponse({
        url: signed.signedUrl,
        filename,
        version: PDF_VERSION,
        userName: session.user_name,
        cached: false,
      });
    }

    return pdfDownloadResponse(pdfBytes, filename);
  } catch (err) {
    console.error("[generate-report-pdf] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return jsonResponse({ error: "Internal server error", detail: message.slice(0, 200) }, 500);
  }
});
