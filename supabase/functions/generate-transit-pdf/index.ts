import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  generateTransitPdf,
  isCurrentTransitPdfVersion,
  TRANSIT_PDF_VERSION,
  type InterpretedTransits,
} from "../_shared/transit-pdf.ts";
import { brandSlug, docNoun, getMarket } from "../_shared/markets.ts";
import { resolvePromptLang } from "../_shared/prompts/lang.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function safeFilename(userName: string | null, market: string | null, lang: string | null) {
  const base = (userName || "transiti")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "transiti";
  return `${brandSlug(getMarket(market))}-${docNoun(lang, "transits")}-${base}.pdf`;
}

function pdfDownloadResponse(pdfBytes: Uint8Array, filename: string) {
  return new Response(pdfBytes, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-PDF-Version": TRANSIT_PDF_VERSION,
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
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.warn("[generate-transit-pdf] Auth failed", authError?.message);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = user.id;
    const url = new URL(req.url);
    const requestedQuizSessionId = url.searchParams.get("quizSessionId");
    const force = url.searchParams.get("force") === "1";
    const responseMode = url.searchParams.get("mode") === "url" ? "url" : "binary";
    console.log("[generate-transit-pdf] start", { userId, requestedQuizSessionId, force, responseMode });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, quiz_session_id")
      .eq("user_id", userId)
      .single();

    if (profileError) console.warn("[generate-transit-pdf] profile lookup failed", profileError.message);
    if (!profile?.id) return jsonResponse({ error: "Profile not found" }, 404);

    let quizSessionId = requestedQuizSessionId || profile.quiz_session_id;

    // If a specific quizSessionId was requested, validate it belongs to the
    // user (same defensive check as generate-report-pdf).
    if (requestedQuizSessionId) {
      const { data: ownedReport } = await supabaseAdmin
        .from("user_reports")
        .select("id")
        .eq("profile_id", profile.id)
        .eq("quiz_session_id", requestedQuizSessionId)
        .maybeSingle();
      if (!ownedReport) {
        console.warn("[generate-transit-pdf] report not owned by user", { userId, requestedQuizSessionId });
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

    if (!quizSessionId) return jsonResponse({ error: "No report found" }, 404);

    // Verify entitlement is active.
    const { data: entitlement } = await supabaseAdmin
      .from("user_entitlements")
      .select("id, ends_at, status")
      .eq("profile_id", profile.id)
      .eq("quiz_session_id", quizSessionId)
      .eq("entitlement_type", "monthly_transits")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .maybeSingle();

    const hasAccess = Boolean(
      entitlement?.id && (!entitlement.ends_at || new Date(entitlement.ends_at).getTime() >= Date.now()),
    );
    if (!hasAccess) {
      return jsonResponse({ error: "No active transit entitlement" }, 403);
    }

    // Pull most recent transit cycle for this entitlement.
    const { data: cycle } = await supabaseAdmin
      .from("transit_cycles")
      .select("id, period_start, period_end, status, interpretation_status, interpreted_transits")
      .eq("entitlement_id", entitlement!.id)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cycle) return jsonResponse({ error: "Transit cycle not found" }, 404);
    if (!cycle.interpreted_transits || cycle.interpretation_status !== "completed") {
      return jsonResponse({ error: "Transit interpretation not ready" }, 404);
    }

    const { data: session } = await supabaseAdmin
      .from("quiz_sessions")
      .select("user_name, birth_place, birth_date, birth_time, language, market")
      .eq("id", quizSessionId)
      .single();

    const pdfLang = resolvePromptLang((session as any)?.language);
    const pdfMarket = getMarket((session as any)?.market).id;
    const filename = safeFilename(session?.user_name || null, (session as any)?.market, (session as any)?.language);
    const storagePath = `${userId}/${quizSessionId}/transit-${cycle.id}-${TRANSIT_PDF_VERSION}-${pdfLang}.pdf`;

    if (!force) {
      const { data: existingPdf } = await supabaseAdmin.storage
        .from("report-pdfs")
        .download(storagePath);
      if (existingPdf) {
        const bytes = new Uint8Array(await existingPdf.arrayBuffer());
        if (isCurrentTransitPdfVersion(bytes)) {
          console.log("[generate-transit-pdf] cache hit", { userId, cycleId: cycle.id, responseMode });
          if (responseMode === "url") {
            const { data: signed, error: signErr } = await supabaseAdmin.storage
              .from("report-pdfs")
              .createSignedUrl(storagePath, 3600, { download: filename });
            if (signErr) throw signErr;
            return jsonResponse({
              url: signed.signedUrl,
              filename,
              version: TRANSIT_PDF_VERSION,
              userName: session?.user_name || null,
              cached: true,
            });
          }
          return pdfDownloadResponse(bytes, filename);
        }
        console.warn("[generate-transit-pdf] cached PDF version mismatch — regenerating");
      }
    }

    console.log("[generate-transit-pdf] generating", { userId, cycleId: cycle.id });
    const pdfBytes = await generateTransitPdf({
      interpreted: cycle.interpreted_transits as InterpretedTransits,
      userName: session?.user_name || null,
      birthPlace: session?.birth_place || null,
      birthDate: (session as any)?.birth_date || null,
      birthTime: (session as any)?.birth_time || null,
      periodStart: cycle.period_start || null,
      periodEnd: cycle.period_end || null,
      lang: pdfLang,
      market: pdfMarket,
    });

    const { error: uploadError } = await supabaseAdmin.storage
      .from("report-pdfs")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw uploadError;

    console.log("[generate-transit-pdf] generated", { userId, cycleId: cycle.id, size: pdfBytes.length });

    if (responseMode === "url") {
      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from("report-pdfs")
        .createSignedUrl(storagePath, 3600, { download: filename });
      if (signErr) throw signErr;
      return jsonResponse({
        url: signed.signedUrl,
        filename,
        version: TRANSIT_PDF_VERSION,
        userName: session?.user_name || null,
        cached: false,
      });
    }

    return pdfDownloadResponse(pdfBytes, filename);
  } catch (err) {
    console.error("[generate-transit-pdf] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return jsonResponse({ error: "Internal server error", detail: message.slice(0, 200) }, 500);
  }
});
