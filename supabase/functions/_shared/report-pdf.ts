// Shared PDF generation for the customer "Scarica PDF" button and the
// admin "Scarica PDF" button. Keeping them in one place guarantees the
// two paths produce the exact same PDF (including the natal chart on
// page 1) and apply the same character sanitization.

import { PDFDocument, PDFArray, PDFName, PDFString, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
// @ts-ignore npm specifier
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";
import { decodeLogoPng } from "./logo.ts";
import { playfairItalic, playfairSemiBold, sourceSansRegular } from "./fonts.ts";
import { getMarket, type MarketId } from "./markets.ts";
import { type PromptLang, orderDateParts } from "./prompts/lang.ts";
import { REPORT_SECTION_TITLES, REPORT_PDF_STRINGS } from "./pdf-i18n.ts";

// Bump this version whenever the PDF layout, fonts, or chart rendering
// changes. Cached PDFs from older versions are invalidated automatically
// so old/broken files (e.g. missing chart, missing characters) do not
// keep getting served. v13: layout multi-mercato (lingua nei contenuti, brand
// e dominio dal market). La lingua è anche nel path di cache.
// v16: la chart nel PDF è rasterizzata localmente dall'SVG (resvg) invece di
// chiedere un PNG al provider, che andava in 504 sullo styling completo →
// PDF senza chart. Vedi rasterizeChartSvg.
// Nome di ripiego nel titolo del PDF quando la sessione non ha un nome.
const FALLBACK_READER_NAME: Record<PromptLang, string> = {
  it: "Lettura personale",
  es: "Lectura personal",
  en: "Personal reading",
  nl: "Persoonlijke duiding",
};

export const PDF_VERSION = "v16-i18n";
export const PDF_VERSION_TAG = `CI-PDF/${PDF_VERSION}`;

const ASTROLOGY_API_KEY = Deno.env.get("ASTROLOGY_API_KEY") || "";
const ASTROLOGY_CHART_URL = "https://api.freeastroapi.com/api/v1/natal/chart/";

// Chart styling matches the warm editorial palette of the brand.
export const PDF_CHART_CONFIG = {
  stroke_opacity: 1,
  font_size_fraction: 0.5,
  ring_thickness_fraction: 0.13,
  sign_ring_thickness_fraction: 0.14,
  house_ring_thickness_fraction: 0.06,
  center_disk_fraction: 0.58,
  planet_symbol_scale: 0.58,
  sign_symbol_scale: 0.62,
  house_number_scale: 0.35,
  custom_planet_color: "#8D4A35",
  custom_sign_color: "#6F5448",
  custom_house_color: "#8D4A35",
  custom_sign_bg_color: null,
  custom_house_bg_color: null,
  sign_symbol_stroke_width: 1.6,
  sign_line_width: 0.9,
  sign_line_color: "#B9A797",
  house_line_width: 0.65,
  house_line_color: "#CDBEAD",
  sign_ring_inner_width: 0.9,
  sign_ring_inner_color: "#B9A797",
  sign_ring_outer_width: 1.1,
  sign_ring_outer_color: "#8D4A35",
  house_ring_inner_width: 0.8,
  house_ring_inner_color: "#CDBEAD",
  house_ring_outer_width: 0.8,
  house_ring_outer_color: "#B9A797",
  asc_line_width: 1.8,
  asc_line_color: "#8D4A35",
  dsc_line_width: 1.8,
  dsc_line_color: "#8D4A35",
  mc_line_width: 1.8,
  mc_line_color: "#8D4A35",
  ic_line_width: 1.8,
  ic_line_color: "#8D4A35",
  sign_tick_width: 0.45,
  sign_tick_color: "#B9A797",
  aspect_conjunction_width: 1.6,
  aspect_conjunction_color: "#8D4A35",
  aspect_opposition_width: 1.4,
  aspect_opposition_color: "#9A6A54",
  aspect_trine_width: 1.2,
  aspect_trine_color: "#7B5C4D",
  aspect_square_width: 1.3,
  aspect_square_color: "#6F5448",
  aspect_sextile_width: 1,
  aspect_sextile_color: "#A77E68",
  aspect_quincunx_width: 0.9,
  aspect_quincunx_color: "#8F7A6A",
  houses_inside_planets: true,
};

export const PDF_CHART_DISPLAY_SETTINGS = {
  sun: true,
  moon: true,
  mercury: true,
  venus: true,
  mars: true,
  jupiter: true,
  saturn: true,
  uranus: true,
  neptune: true,
  pluto: true,
  north_node: true,
  asc: true,
  chiron: false,
  lilith: false,
};

export interface BirthInputs {
  user_name?: string | null;
  birth_date?: any;
  birth_time?: any;
  birth_place?: string | null;
  birth_lat?: number | null;
  birth_lng?: number | null;
  birth_timezone?: number | null;
}

function getTzString(value: unknown) {
  return typeof value === "string" && value.trim().includes("/") ? value.trim() : "AUTO";
}

// Try to fetch a PNG rendering of the natal chart. Returns the bytes on
// success, or null on any failure (network, missing data, missing key).
// The caller is expected to also provide a saved PNG fallback.
export async function fetchNatalChartPng(birth: BirthInputs): Promise<Uint8Array | null> {
  if (!ASTROLOGY_API_KEY) {
    console.warn("[chart] ASTROLOGY_API_KEY missing — cannot fetch chart");
    return null;
  }
  if (!birth.birth_place || !birth.birth_date || !birth.birth_time) {
    console.warn("[chart] Missing birth inputs", {
      has_place: Boolean(birth.birth_place),
      has_date: Boolean(birth.birth_date),
      has_time: Boolean(birth.birth_time),
    });
    return null;
  }

  try {
    const bd = birth.birth_date || {};
    const bt = birth.birth_time || {};
    const payload: Record<string, unknown> = {
      name: birth.user_name || "User",
      year: Number(bd.year),
      month: Number(bd.month),
      day: Number(bd.day),
      hour: Number(bt.hour),
      minute: Number(bt.minute),
      city: birth.birth_place,
      tz_str: getTzString(birth.birth_timezone),
      house_system: "placidus",
      theme_type: "light",
      format: "png",
      chart_config: PDF_CHART_CONFIG,
      display_settings: PDF_CHART_DISPLAY_SETTINGS,
      custom_theme: { background: "transparent" },
    };
    if (birth.birth_lat != null && birth.birth_lng != null) {
      payload.lat = birth.birth_lat;
      payload.lng = birth.birth_lng;
    }

    const response = await fetch(ASTROLOGY_CHART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ASTROLOGY_API_KEY },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`[chart] Chart API returned ${response.status}`);
      return null;
    }

    const ct = response.headers.get("content-type") || "";
    if (ct.includes("image/png")) {
      return new Uint8Array(await response.arrayBuffer());
    }

    // Some deployments return JSON with base64 payload.
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      const b64: string | undefined =
        parsed?.png ||
        parsed?.image ||
        parsed?.data?.png ||
        parsed?.data?.image ||
        (typeof parsed?.data === "string" ? parsed.data : undefined);
      if (typeof b64 === "string" && b64.length > 0) {
        const clean = b64.replace(/^data:image\/png;base64,/, "");
        const bin = atob(clean);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
      }
    } catch (_) {
      /* not JSON */
    }

    console.warn("[chart] Chart API returned unexpected shape");
    return null;
  } catch (err) {
    console.warn("[chart] fetchNatalChartPng failed:", err);
    return null;
  }
}

// Decode a stored PNG (base64 string or data URL) into bytes.
export function decodeStoredChartPng(value: unknown): Uint8Array | null {
  if (!value || typeof value !== "string") return null;
  try {
    const clean = value.replace(/^data:image\/png;base64,/, "").trim();
    if (!clean) return null;
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch (err) {
    console.warn("[chart] decodeStoredChartPng failed:", err);
    return null;
  }
}

// resvg-wasm is loaded lazily via dynamic import and initialized once per
// isolate. It is fully isolated: any failure (import, wasm init, render) is
// swallowed so PDF generation never breaks because of it — the caller falls
// back to the live provider PNG. We rasterize the styled SVG we already store
// because the provider's PNG renderer times out (504) on our full styling.
// deno-lint-ignore no-explicit-any
let resvgModule: Promise<any> | null = null;
// deno-lint-ignore no-explicit-any
function loadResvg(): Promise<any> {
  if (!resvgModule) {
    resvgModule = (async () => {
      const mod = await import("https://esm.sh/@resvg/resvg-wasm@2.6.2");
      await mod.initWasm(
        fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm"),
      ).catch((err: unknown) => {
        // A second isolate-level init throws "Already initialized" — benign.
        if (!String(err).includes("Already initialized")) throw err;
      });
      return mod;
    })().catch((err) => {
      resvgModule = null; // allow a retry on the next call
      throw err;
    });
  }
  return resvgModule;
}

// Rasterize the stored natal-chart SVG into PNG bytes. Returns null on any
// failure so the caller can fall back to the live provider PNG.
export async function rasterizeChartSvg(
  svg: string | null | undefined,
): Promise<Uint8Array | null> {
  if (!svg || typeof svg !== "string" || !svg.includes("<svg")) return null;
  try {
    const mod = await loadResvg();
    const fontBuf = await sourceSansRegular().catch(() => null);
    const resvg = new mod.Resvg(svg, {
      // SVG is 700px; render at 1000px for a crisp chart on the cover page
      // (embedded at ~380pt). Background is left transparent so the wheel
      // blends with the page exactly like the website.
      fitTo: { mode: "width", value: 1000 },
      font: {
        loadSystemFonts: false,
        defaultFontFamily: "Source Sans 3",
        sansSerifFamily: "Source Sans 3",
        fontBuffers: fontBuf ? [fontBuf] : [],
      },
    });
    const png = resvg.render().asPng();
    return png instanceof Uint8Array ? png : new Uint8Array(png);
  } catch (err) {
    console.warn("[chart] rasterizeChartSvg failed:", err);
    return null;
  }
}

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 70;
const MARGIN_RIGHT = 70;
const MARGIN_TOP = 70;
const MARGIN_BOTTOM = 70;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const FOOTER_BASELINE = 36;
const FOOTER_RULE_Y = 56;

export interface ReportContent {
  // Classica fields (current)
  identity?: string;
  emotions?: string;
  relationships?: string;
  work?: string;
  patterns_blocks?: string;
  advice?: string;
  poem?: string;
  // Legacy classica fields (reports generated before the patterns+blocks merge).
  // Kept here so the compat fallback in PDF and frontend rendering keeps working.
  patterns?: string;
  blocks?: string;
  // Attivazione fields
  emotions_relationships?: string;
  blocks_patterns?: string;
  work_direction?: string;
  // Allow any additional keys for forward compatibility with future angles.
  [key: string]: string | undefined;
}

// Strip characters the standard pdf-lib WinAnsi fonts cannot encode
// (anything outside Latin-1 plus a small set of common typographic
// substitutions) so the PDF can always be generated, no matter what
// characters appear in the user's name, place, or report content.
export function sanitizePdfText(value: unknown): string {
  return (
    String(value ?? "")
      .normalize("NFKC")
      // Some LLM outputs land in storage with the newline still escaped
      // (literal backslash + "n" / "r" / "t") instead of a real control
      // character. Convert those back to real whitespace so paragraph
      // splitting in the PDF generator works as expected, instead of
      // showing the user a literal "\n\n" in the rendered text.
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")
      .replace(/\\t/g, "    ")
      .replace(/[\u201C\u201D\u201E]/g, '"')
      .replace(/[\u2018\u2019\u201A]/g, "'")
      .replace(/[\u2013\u2014\u2212]/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/[\u2022\u25CF]/g, "-")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "")
  );
}

type PdfSection = { key: string; title: string };

const SECTIONS_CLASSICA: PdfSection[] = [
  { key: "identity", title: "Identità profonda" },
  { key: "emotions", title: "Dinamiche emotive" },
  { key: "relationships", title: "Relazioni e amore" },
  { key: "work", title: "Lavoro e direzione" },
  { key: "patterns_blocks", title: "Schemi e blocchi ricorrenti" },
  { key: "advice", title: "Consigli pratici" },
  { key: "poem", title: "Poesia trasformativa" },
];

const SECTIONS_ATTIVAZIONE: PdfSection[] = [
  { key: "identity", title: "Identità profonda" },
  { key: "emotions_relationships", title: "Dinamiche emotive e relazionali" },
  { key: "blocks_patterns", title: "Blocchi e schemi ricorrenti" },
  { key: "work_direction", title: "Lavoro e direzione" },
  { key: "advice", title: "Consigli pratici" },
  { key: "poem", title: "Poesia trasformativa" },
];

const SECTIONS_BY_FUNNEL: Record<string, PdfSection[]> = {
  classica: SECTIONS_CLASSICA,
  attivazione: SECTIONS_ATTIVAZIONE,
};

// Ordine/chiavi sezioni per funnel (i titoli vengono dalla lingua, vedi
// REPORT_SECTION_TITLES). Le costanti italiane sopra restano come default it.
const SECTION_KEYS_BY_FUNNEL: Record<string, string[]> = {
  classica: SECTIONS_CLASSICA.map((s) => s.key),
  attivazione: SECTIONS_ATTIVAZIONE.map((s) => s.key),
};

// Cross-funnel section aliases — mirror of SECTION_FALLBACKS in src/pages/Report.tsx
// (Deno can't import from the frontend bundle). classica and attivazione name
// some equivalent sections differently; resolve so a report saved under one
// funnel's keys renders under the other's section config. Nested array = join the
// non-empty parts. Fallbacks fire only when the direct key is empty.
const SECTION_FALLBACKS: Record<string, (string | string[])[]> = {
  work: ["work_direction"],
  work_direction: ["work"],
  patterns_blocks: ["blocks_patterns", ["patterns", "blocks"]],
  blocks_patterns: ["patterns_blocks", ["patterns", "blocks"]],
  emotions_relationships: [["emotions", "relationships"]],
  emotions: ["emotions_relationships"],
};

function pickSectionString(content: Record<string, unknown>, key: string): string {
  const v = content[key];
  return typeof v === "string" && v.trim() ? v : "";
}

function resolveSectionContent(content: Record<string, unknown>, sectionKey: string): string {
  const direct = pickSectionString(content, sectionKey);
  if (direct) return direct;
  for (const fallback of SECTION_FALLBACKS[sectionKey] ?? []) {
    if (Array.isArray(fallback)) {
      const parts = fallback.map((k) => pickSectionString(content, k)).filter(Boolean);
      if (parts.length > 0) return parts.join("\n\n");
    } else {
      const v = pickSectionString(content, fallback);
      if (v) return v;
    }
  }
  return "";
}

function sectionsForFunnel(slug: string | null | undefined, lang: PromptLang = "it"): PdfSection[] {
  const funnel = slug === "attivazione" ? "attivazione" : "classica";
  const keys = SECTION_KEYS_BY_FUNNEL[funnel];
  const titles = REPORT_SECTION_TITLES[lang][funnel];
  return keys.map((key) => ({ key, title: titles[key] ?? key }));
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = sanitizePdfText(text).split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export interface GeneratePdfInput {
  reportContent: ReportContent;
  userName: string | null;
  birthPlace: string | null;
  birthDate: any | null;
  chartPng: Uint8Array | null;
  // Marketing-angle slug. Drives section ordering and titles in the PDF
  // (TOC + section bodies). Defaults to classica for back-compat.
  funnelSlug?: string | null;
  // Lingua dei contenuti/etichette del PDF (default it).
  lang?: PromptLang;
  // Mercato: determina brand e dominio mostrati nel PDF (default it).
  market?: MarketId;
}

export async function generateReportPdf(input: GeneratePdfInput): Promise<Uint8Array> {
  const { reportContent, userName, birthPlace, birthDate, chartPng, funnelSlug } = input;
  const lang: PromptLang = input.lang ?? "it";
  const market = getMarket(input.market);
  const S = REPORT_PDF_STRINGS[lang];
  const brandUpper = market.siteName.toUpperCase();
  const domain = new URL(market.siteUrl).hostname.replace(/^www\./, "");
  const SECTIONS = sectionsForFunnel(funnelSlug, lang);

  const doc = await PDFDocument.create();
  // Tag the PDF so we can detect its version when deciding whether a
  // cached copy is still valid. Title shows in PDF readers, but keywords
  // are what we use programmatically.
  doc.setTitle(sanitizePdfText(S.metaTitle(userName || FALLBACK_READER_NAME[lang])));
  doc.setSubject(S.metaSubject);
  doc.setProducer(PDF_VERSION_TAG);
  doc.setCreator(PDF_VERSION_TAG);
  doc.setKeywords([PDF_VERSION_TAG]);

  doc.registerFontkit(fontkit);
  const [pfSemiBold, pfItalic] = await Promise.all([
    playfairSemiBold(), playfairItalic(),
  ]);
  const timesRoman = await doc.embedFont(StandardFonts.Helvetica);
  const timesRomanBold = await doc.embedFont(pfSemiBold);
  const timesRomanItalic = await doc.embedFont(pfItalic);
  const timesRomanBoldItalic = timesRomanItalic;
  const bodyFontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const terracotta = rgb(141 / 255, 74 / 255, 53 / 255);
  const darkText = rgb(47 / 255, 33 / 255, 27 / 255);
  const mutedText = rgb(112 / 255, 93 / 255, 82 / 255);
  const cream = rgb(248 / 255, 241 / 255, 231 / 255);
  const lineColor = rgb(216 / 255, 200 / 255, 183 / 255);
  const paleLine = rgb(230 / 255, 218 / 255, 204 / 255);

  function drawBackground(page: any) {
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: cream });
  }

  function drawCenteredText(page: any, text: string, yPos: number, size: number, font: any, color: any) {
    const safeText = sanitizePdfText(text);
    const textWidth = font.widthOfTextAtSize(safeText, size);
    page.drawText(safeText, { x: PAGE_WIDTH / 2 - textWidth / 2, y: yPos, size, font, color });
  }

  function drawFooter(page: any) {
    const pageNumber = `${doc.getPageCount()}`;
    // Subtle short rule, centered, instead of a full-width line.
    page.drawRectangle({
      x: PAGE_WIDTH / 2 - 24,
      y: FOOTER_RULE_Y,
      width: 48,
      height: 0.3,
      color: paleLine,
    });
    const footerText = sanitizePdfText(`${brandUpper}${S.footerSep}p. ${pageNumber}${S.footerSep}${domain}`);
    drawCenteredText(page, footerText, FOOTER_BASELINE, 7.5, timesRoman, mutedText);
  }

  // Attach a clickable URI annotation over a rectangular region of `page`.
  // pdf-lib doesn't expose a high-level helper for hyperlinks, so we
  // construct the Annot dict by hand and push it onto the page's Annots
  // array (creating it if it doesn't exist yet).
  function addLinkAnnotation(page: any, x: number, y: number, w: number, h: number, url: string) {
    const linkAnnotRef = doc.context.register(
      doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [x, y, x + w, y + h],
        Border: [0, 0, 0],
        A: {
          Type: "Action",
          S: "URI",
          URI: PDFString.of(url),
        },
      }),
    );
    const existing = page.node.get(PDFName.of("Annots"));
    if (existing instanceof PDFArray) {
      existing.push(linkAnnotRef);
    } else {
      page.node.set(PDFName.of("Annots"), doc.context.obj([linkAnnotRef]));
    }
  }

  function addClosingPage(title: string, paragraphs: string[], cta: { label: string; url: string; caption?: string }) {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawBackground(page);

    page.drawRectangle({ x: MARGIN_LEFT, y: PAGE_HEIGHT - 118, width: 60, height: 0.6, color: terracotta });
    page.drawText(sanitizePdfText(title), {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 158,
      size: 24,
      font: timesRomanBold,
      color: darkText,
    });

    const bodySize = 12;
    const bodyLineHeight = 19;
    const paraGap = 11;
    let bodyY = PAGE_HEIGHT - 200;

    for (const para of paragraphs) {
      const cleanPara = para.replace(/\n/g, " ").trim();
      if (!cleanPara) continue;
      const lines = wrapText(cleanPara, timesRoman, bodySize, TEXT_WIDTH);
      for (const line of lines) {
        page.drawText(line, {
          x: MARGIN_LEFT,
          y: bodyY,
          size: bodySize,
          font: timesRoman,
          color: darkText,
        });
        bodyY -= bodyLineHeight;
      }
      bodyY -= paraGap;
    }

    // CTA — terracotta pill-shaped button with white label and a
    // clickable link annotation over the same region. Rounded corners
    // are drawn via SVG path since pdf-lib's drawRectangle is square.
    const btnW = 300;
    const btnH = 44;
    const btnX = (PAGE_WIDTH - btnW) / 2;
    const btnY = Math.max(bodyY - 60, FOOTER_RULE_Y + 80);
    const radius = 10;

    const rrPath = `M ${radius} 0 L ${btnW - radius} 0 Q ${btnW} 0 ${btnW} ${radius} L ${btnW} ${btnH - radius} Q ${btnW} ${btnH} ${btnW - radius} ${btnH} L ${radius} ${btnH} Q 0 ${btnH} 0 ${btnH - radius} L 0 ${radius} Q 0 0 ${radius} 0 Z`;
    page.drawSvgPath(rrPath, {
      x: btnX,
      y: btnY + btnH,
      color: terracotta,
      borderColor: terracotta,
      borderWidth: 0,
    });

    const labelText = sanitizePdfText(cta.label);
    const labelSize = 12.5;
    const labelWidth = bodyFontBold.widthOfTextAtSize(labelText, labelSize);
    page.drawText(labelText, {
      x: btnX + (btnW - labelWidth) / 2,
      y: btnY + btnH / 2 - labelSize / 2 - 0.5,
      size: labelSize,
      font: bodyFontBold,
      color: rgb(1, 1, 1),
    });

    addLinkAnnotation(page, btnX, btnY, btnW, btnH, cta.url);

    if (cta.caption) {
      drawCenteredText(page, cta.caption, btnY - 22, 9, timesRomanItalic, mutedText);
    }

    const feedbackText = sanitizePdfText(S.feedbackCta);
    const feedbackSize = 10;
    const feedbackY = btnY - 56;
    const feedbackWidth = timesRomanItalic.widthOfTextAtSize(feedbackText, feedbackSize);
    const feedbackX = PAGE_WIDTH / 2 - feedbackWidth / 2;
    page.drawText(feedbackText, {
      x: feedbackX,
      y: feedbackY,
      size: feedbackSize,
      font: timesRomanItalic,
      color: terracotta,
    });
    page.drawRectangle({
      x: feedbackX,
      y: feedbackY - 2,
      width: feedbackWidth,
      height: 0.4,
      color: terracotta,
    });
    addLinkAnnotation(
      page,
      feedbackX,
      feedbackY - 4,
      feedbackWidth,
      feedbackSize + 6,
      `${market.siteUrl}/report?source=pdf#feedback`,
    );

    drawFooter(page);
  }

  // Combined introduction + index. Keeping them on one page makes both
  // sections feel intentional instead of half-empty.
  function addIntroIndexPage(introText: string) {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawBackground(page);

    // ---- Intro block
    page.drawRectangle({ x: MARGIN_LEFT, y: PAGE_HEIGHT - 110, width: 48, height: 0.6, color: terracotta });
    page.drawText(sanitizePdfText(S.introTitle), {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 142,
      size: 20,
      font: timesRomanBold,
      color: darkText,
    });

    let bodyY = PAGE_HEIGHT - 180;
    const introLines = wrapText(introText, timesRoman, 12, TEXT_WIDTH);
    for (const line of introLines) {
      page.drawText(line, { x: MARGIN_LEFT, y: bodyY, size: 12, font: timesRoman, color: darkText });
      bodyY -= 19;
    }

    // ---- Soft divider between intro and index
    bodyY -= 32;
    page.drawRectangle({
      x: PAGE_WIDTH / 2 - 28,
      y: bodyY,
      width: 56,
      height: 0.5,
      color: lineColor,
    });
    bodyY -= 38;

    // ---- Index block
    page.drawText(sanitizePdfText(S.indexTitle), {
      x: MARGIN_LEFT,
      y: bodyY,
      size: 20,
      font: timesRomanBold,
      color: darkText,
    });
    bodyY -= 30;

    SECTIONS.forEach((section, index) => {
      const number = String(index + 1).padStart(2, "0");
      page.drawText(number, {
        x: MARGIN_LEFT,
        y: bodyY,
        size: 9.5,
        font: bodyFontBold,
        color: terracotta,
      });
      page.drawText(sanitizePdfText(section.title), {
        x: MARGIN_LEFT + 38,
        y: bodyY - 1,
        size: 13,
        font: timesRoman,
        color: darkText,
      });
      page.drawRectangle({
        x: MARGIN_LEFT,
        y: bodyY - 12,
        width: TEXT_WIDTH,
        height: 0.3,
        color: paleLine,
      });
      bodyY -= 26;
    });

    drawFooter(page);
  }

  // ============ COVER PAGE ============
  const coverPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawBackground(coverPage);

  try {
    const logoImg = await doc.embedPng(decodeLogoPng(market.id));
    const logoWidth = 92;
    const logoHeight = logoWidth * (logoImg.height / logoImg.width);
    coverPage.drawImage(logoImg, {
      x: (PAGE_WIDTH - logoWidth) / 2,
      y: PAGE_HEIGHT - 72 - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  } catch (e) {
    console.warn("[pdf] logo embed failed:", e);
    drawCenteredText(coverPage, brandUpper, PAGE_HEIGHT - 82, 10, timesRoman, terracotta);
  }

  drawCenteredText(coverPage, S.coverTitle, PAGE_HEIGHT - 152, 30, timesRomanBoldItalic, darkText);
  drawCenteredText(coverPage, S.coverSubtitle, PAGE_HEIGHT - 178, 14, timesRomanItalic, mutedText);
  coverPage.drawRectangle({ x: PAGE_WIDTH / 2 - 30, y: PAGE_HEIGHT - 196, width: 60, height: 0.5, color: terracotta });

  const chartBoxTop = PAGE_HEIGHT - 218;
  const chartBoxBottom = 230;
  let detailsY = chartBoxBottom - 28;

  if (chartPng) {
    try {
      const img = await doc.embedPng(chartPng);
      const ratio = img.width / img.height;
      const maxW = Math.min(TEXT_WIDTH, 380);
      const maxH = chartBoxTop - chartBoxBottom;
      let drawW = maxW;
      let drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }
      const chartX = (PAGE_WIDTH - drawW) / 2;
      const chartY = chartBoxBottom + (maxH - drawH) / 2;
      coverPage.drawImage(img, { x: chartX, y: chartY, width: drawW, height: drawH });
      detailsY = chartY - 38;
    } catch (e) {
      console.warn("[pdf] chart embed failed:", e);
    }
  }

  if (userName) {
    drawCenteredText(coverPage, sanitizePdfText(userName), detailsY, 18, timesRomanItalic, darkText);
  }

  let birthInfo = "";
  if (birthPlace) birthInfo += sanitizePdfText(birthPlace);
  if (birthDate) {
    const bd = typeof birthDate === "object" ? birthDate : {};
    if (bd.day && bd.month && bd.year) {
      birthInfo +=
        (birthInfo ? " - " : "") +
        orderDateParts(lang, `${bd.day}`, `${bd.month}`, `${bd.year}`);
    }
  }
  if (birthInfo) {
    drawCenteredText(coverPage, birthInfo, detailsY - 24, 11, timesRoman, mutedText);
  }

  coverPage.drawRectangle({
    x: PAGE_WIDTH / 2 - 24,
    y: FOOTER_RULE_Y,
    width: 48,
    height: 0.3,
    color: paleLine,
  });
  drawCenteredText(coverPage, domain, FOOTER_BASELINE, 8, timesRoman, mutedText);

  addIntroIndexPage(S.coverDisclaimer);

  // ============ CONTENT PAGES ============
  let currentPage: any = null;
  let y = PAGE_HEIGHT - MARGIN_TOP;

  // Body type: tightened slightly vs. v6 so sections flow on fewer pages
  // without feeling cramped. Inter-paragraph gap is small but visible.
  const BODY_SIZE = 11.8;
  const BODY_LINE_HEIGHT = 18;
  const BODY_PARA_GAP = 11;
  const POEM_SIZE = 13;
  const POEM_LINE_HEIGHT = 22;
  const POEM_STANZA_GAP = 11;

  function addContentPage() {
    currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawBackground(currentPage);
    y = PAGE_HEIGHT - MARGIN_TOP;
  }

  function pageBreak() {
    drawFooter(currentPage);
    addContentPage();
  }

  function linesThatFit(lineHeight: number): number {
    return Math.max(0, Math.floor((y - MARGIN_BOTTOM) / lineHeight));
  }

  // Block-aware paragraph drawing with widow/orphan control:
  //   - Don't start a paragraph of ≥3 lines if fewer than 2 lines fit
  //     before the next page break (avoids orphan first line).
  //   - When breaking mid-paragraph, never leave a single line trailing
  //     on the next page (avoids widow).
  function drawParagraph(text: string, font: any, size: number, lineHeight: number, paraGap: number) {
    const cleanText = text.replace(/\n/g, " ").trim();
    if (!cleanText) return;
    const lines = wrapText(cleanText, font, size, TEXT_WIDTH);
    if (!lines.length) return;

    // Orphan guard: short paragraphs (≤2 lines) must not split at all.
    if (lines.length <= 2 && linesThatFit(lineHeight) < lines.length) {
      pageBreak();
    } else if (lines.length >= 3 && linesThatFit(lineHeight) < 2) {
      pageBreak();
    }

    for (let i = 0; i < lines.length; i++) {
      const remaining = lines.length - i;
      const fits = linesThatFit(lineHeight);

      if (fits < 1) {
        pageBreak();
      } else if (remaining === 2 && fits < 2 && lines.length >= 3) {
        // Widow guard: pull the penultimate line to next page so the
        // last two lines stay together.
        pageBreak();
      }

      currentPage.drawText(lines[i], {
        x: MARGIN_LEFT,
        y,
        size,
        font,
        color: darkText,
      });
      y -= lineHeight;
    }
    y -= paraGap;
  }

  function drawPoemLines(stanza: string) {
    const wrapped = wrapText(stanza, timesRomanItalic, POEM_SIZE, TEXT_WIDTH - 40);
    if (!wrapped.length) return;
    if (linesThatFit(POEM_LINE_HEIGHT) < Math.min(2, wrapped.length)) {
      pageBreak();
    }
    for (const wl of wrapped) {
      if (linesThatFit(POEM_LINE_HEIGHT) < 1) pageBreak();
      const wlWidth = timesRomanItalic.widthOfTextAtSize(wl, POEM_SIZE);
      currentPage.drawText(wl, {
        x: PAGE_WIDTH / 2 - wlWidth / 2,
        y,
        size: POEM_SIZE,
        font: timesRomanItalic,
        color: darkText,
      });
      y -= POEM_LINE_HEIGHT;
    }
  }

  for (let sectionIndex = 0; sectionIndex < SECTIONS.length; sectionIndex++) {
    const section = SECTIONS[sectionIndex];
    const text = sanitizePdfText(
      resolveSectionContent(reportContent as Record<string, unknown>, section.key),
    );
    if (!text) continue;

    if (currentPage) drawFooter(currentPage);
    addContentPage();

    const sectionNumber = String(sectionIndex + 1).padStart(2, "0");
    currentPage.drawText(`${S.sectionPrefix} ${sectionNumber}`, {
      x: MARGIN_LEFT,
      y,
      size: 8.5,
      font: timesRoman,
      color: terracotta,
    });
    y -= 26;

    currentPage.drawText(section.title, {
      x: MARGIN_LEFT,
      y,
      size: 23,
      font: timesRomanBold,
      color: darkText,
    });
    y -= 14;

    currentPage.drawRectangle({ x: MARGIN_LEFT, y, width: 48, height: 0.55, color: terracotta });
    y -= 30;

    const isPoem = section.key === "poem";

    if (isPoem) {
      const stanzas = text.split("\n");
      for (const stanza of stanzas) {
        if (!stanza.trim()) {
          y -= POEM_STANZA_GAP;
          continue;
        }
        drawPoemLines(stanza.trim());
      }
    } else {
      const paragraphs = text.split("\n\n").filter((p: string) => p.trim());
      for (const para of paragraphs) {
        drawParagraph(para, timesRoman, BODY_SIZE, BODY_LINE_HEIGHT, BODY_PARA_GAP);
      }
    }
  }

  if (currentPage) drawFooter(currentPage);

  addClosingPage(
    S.closingTitle,
    S.closingParagraphs,
    {
      label: S.closingCtaLabel,
      url: `${market.siteUrl}/report#transits-upsell`,
      caption: `${domain}${S.closingCaptionPath}`,
    },
  );

  return await doc.save();
}

// Inspect a cached PDF (raw bytes) and decide whether it was produced by
// the current PDF_VERSION. We look for the version tag inside the first
// few KB of the file (PDF metadata lives in the trailer, but pdf-lib
// also writes it near the top — checking both halves is safer and very
// cheap).
export function isCurrentPdfVersion(bytes: Uint8Array): boolean {
  if (!bytes || bytes.length === 0) return false;
  try {
    const decoder = new TextDecoder("latin1");
    const head = decoder.decode(bytes.subarray(0, Math.min(bytes.length, 4096)));
    const tail = decoder.decode(bytes.subarray(Math.max(0, bytes.length - 4096)));
    return head.includes(PDF_VERSION_TAG) || tail.includes(PDF_VERSION_TAG);
  } catch {
    return false;
  }
}
