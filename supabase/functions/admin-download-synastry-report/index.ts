// Admin helper: scarica il PDF della sinastria per una synastry_session
// senza dover essere il proprietario. Auth via x-admin-secret.
// Caching su storage (bucket report-pdfs) per evitare CPU Time exceeded.

// @ts-ignore deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  generateSynastryPdf,
  SYNASTRY_PDF_VERSION,
  SynastryReportContent,
} from "../_shared/synastry-pdf.ts";
import { brandSlug, docNoun, getMarket } from "../_shared/markets.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};
declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") ?? "";

function safeSlug(s: string | null | undefined): string {
  return (s || "persona")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "persona";
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminHeader = req.headers.get("x-admin-secret") ?? "";
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();

    const isAdmin = Boolean(ADMIN_SECRET && adminHeader === ADMIN_SECRET);
    const isServiceRole = Boolean(SERVICE_ROLE && token === SERVICE_ROLE);

    if (!isAdmin && !isServiceRole) {
      return json({ error: "Unauthorized" }, 401);
    }

    const url = new URL(req.url);
    const synastrySessionId =
      url.searchParams.get("synastrySessionId") ??
      (await req.clone().json().catch(() => ({})))?.synastrySessionId;
    const force = url.searchParams.get("force") === "1";
    const version = url.searchParams.get("version") ?? "";

    if (!synastrySessionId) {
      return json({ error: "synastrySessionId required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (version === "previous") {
      const prevPath = `admin/synastry-${synastrySessionId}-previous.pdf`;
      const { data: exists } = await supabase.storage.from("report-pdfs").download(prevPath);
      if (!exists) return json({ error: "No previous version available" }, 404);
      const { data: signed, error: signErr } = await supabase.storage
        .from("report-pdfs")
        .createSignedUrl(prevPath, 3600, { download: `codice-interiore-coppia-${synastrySessionId}-previous.pdf` });
      if (signErr || !signed) return json({ error: "Failed to sign URL" }, 500);
      return json({ url: signed.signedUrl, version: "previous", cached: true });
    }

    const { data: session, error } = await supabase
      .from("synastry_sessions")
      .select("id, person_a_name, person_b_name, person_a_birth_date, person_a_birth_time, person_a_birth_place, person_b_birth_date, person_b_birth_time, person_b_birth_place, archetype_label, score_overall, scores, full_report, language, market")
      .eq("id", synastrySessionId)
      .maybeSingle();

    if (error || !session) {
      return json({ error: "Session not found" }, 404);
    }

    if (!session.full_report) {
      return json({ error: "Report not ready yet" }, 404);
    }

    const synLang = (session as { language?: string }).language === "es" ? "es" : "it";
    const synMarket = (session as { market?: string }).market === "es" ? "es" : "it";
    const filename = `${brandSlug(getMarket((session as { market?: string }).market))}-${docNoun((session as { language?: string }).language, "couple")}-${safeSlug(session.person_a_name)}-${safeSlug(session.person_b_name)}.pdf`;
    const storagePath = `admin/synastry-${session.id}-${SYNASTRY_PDF_VERSION}-${synLang}.pdf`;

    // Cache hit
    if (!force) {
      const { data: existing } = await supabase.storage
        .from("report-pdfs")
        .download(storagePath);
      if (existing) {
        const { data: signed, error: signErr } = await supabase.storage
          .from("report-pdfs")
          .createSignedUrl(storagePath, 3600, { download: filename });
        if (!signErr && signed) {
          return json({ url: signed.signedUrl, filename, version: SYNASTRY_PDF_VERSION, cached: true });
        }
      }
    }

    const bytes = await generateSynastryPdf({
      reportContent: session.full_report as SynastryReportContent,
      personAName: session.person_a_name,
      personBName: session.person_b_name,
      personABirthDate: session.person_a_birth_date,
      personABirthTime: session.person_a_birth_time,
      personABirthPlace: session.person_a_birth_place,
      personBBirthDate: session.person_b_birth_date,
      personBBirthTime: session.person_b_birth_time,
      personBBirthPlace: session.person_b_birth_place,
      archetypeLabel: session.archetype_label,
      scoreOverall: session.score_overall,
      scores: session.scores,
      lang: synLang,
      market: synMarket,
    });

    const { error: uploadErr } = await supabase.storage
      .from("report-pdfs")
      .upload(storagePath, bytes, { contentType: "application/pdf", upsert: true });
    if (uploadErr) {
      console.error("[admin-download-synastry-report] upload error", uploadErr);
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from("report-pdfs")
      .createSignedUrl(storagePath, 3600, { download: filename });
    if (signErr || !signed) {
      // Fallback: return PDF bytes directly
      return new Response(bytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
          "X-PDF-Version": SYNASTRY_PDF_VERSION,
        },
      });
    }

    return json({ url: signed.signedUrl, filename, version: SYNASTRY_PDF_VERSION, cached: false });
  } catch (err) {
    console.error("[admin-download-synastry-report] error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown" }, 500);
  }
});
