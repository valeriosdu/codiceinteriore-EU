// PDF generation for the synastry report (coppia).
// v2: layout allineato al report natale (background crema, logo, intro+indice,
// sezioni numerate con regola decorativa, footer, pagina di chiusura con CTA).

import {
  PDFDocument,
  PDFArray,
  PDFName,
  PDFString,
  StandardFonts,
  rgb,
} from "https://esm.sh/pdf-lib@1.17.1";
// @ts-ignore npm specifier
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";
import { sanitizePdfText } from "./report-pdf.ts";
import { decodeLogoPng } from "./logo.ts";
import { playfairItalic, playfairSemiBold } from "./fonts.ts";
import { getMarket, type MarketId } from "./markets.ts";
import { type PromptLang } from "./prompts/lang.ts";
import { SYNASTRY_PDF_STRINGS } from "./pdf-i18n.ts";
import { getArchetypeLabel } from "./synastry-archetypes.ts";

export const SYNASTRY_PDF_VERSION = "synastry-v12-i18n";
export const SYNASTRY_PDF_VERSION_TAG = `CI-SYNASTRY-PDF/${SYNASTRY_PDF_VERSION}`;

export interface SynastryApertura {
  cosa_siete?: string;
  dove_brillate?: string;
  dove_inciampate?: string;
  dove_andate?: string;
}

export interface SynastryReportContent {
  apertura?: SynastryApertura;
  ritratto_coppia?: string;
  attrazione_chimica?: string;
  comunicazione?: string;
  mondo_emotivo?: string;
  sfide?: string;
  stabilita_longevita?: string;
  pattern_karmico?: string;
  direzione?: string;
  poesia_chiusura?: string;
}

// Ordine sezioni (le chiavi sono il contratto col backend); i titoli arrivano
// dalla lingua, vedi SYNASTRY_PDF_STRINGS.sectionTitles.
const SECTION_KEYS: (keyof SynastryReportContent)[] = [
  "ritratto_coppia", "attrazione_chimica", "comunicazione", "mondo_emotivo",
  "sfide", "pattern_karmico", "direzione", "poesia_chiusura",
];

export interface SynastryPdfInput {
  reportContent: SynastryReportContent;
  personAName: string | null;
  personBName: string | null;
  personABirthDate?: any;
  personABirthTime?: any;
  personABirthPlace?: string | null;
  personBBirthDate?: any;
  personBBirthTime?: any;
  personBBirthPlace?: string | null;
  // Archetipo: passare l'ID (es. "soulmates") così il label viene risolto
  // per lingua dentro il builder, come fa il frontend. `archetypeLabel` resta
  // come fallback per righe storiche senza ID.
  archetypeId?: string | null;
  archetypeLabel?: string | null;
  scoreOverall: number | null;
  scores: Record<string, number> | null;
  biWheelPng?: Uint8Array | null;
  lang?: PromptLang;
  market?: MarketId;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 70;
const MARGIN_RIGHT = 70;
const MARGIN_TOP = 70;
const MARGIN_BOTTOM = 70;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const FOOTER_BASELINE = 36;
const FOOTER_RULE_Y = 56;

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

function paragraphsOf(text: string): string[] {
  return sanitizePdfText(text)
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);
}

function compressScore(raw: number): number {
  return Math.round(30 + (raw / 100) * 67);
}

function formatBirthDetail(
  birthDate: any,
  birthTime: any,
  birthPlace: string | null | undefined,
  timePrefix: string,
): string {
  const parts: string[] = [];
  if (birthPlace) parts.push(sanitizePdfText(birthPlace));
  if (birthDate && typeof birthDate === "object") {
    const { day, month, year } = birthDate;
    if (day && month && year) parts.push(`${day}/${month}/${year}`);
  }
  if (birthTime && typeof birthTime === "object") {
    const { hour, minute } = birthTime;
    if (hour != null && minute != null)
      parts.push(
        `${timePrefix}${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      );
  }
  return parts.join("  ·  ");
}

export async function generateSynastryPdf(input: SynastryPdfInput): Promise<Uint8Array> {
  const lang: PromptLang = input.lang ?? "it";
  const market = getMarket(input.market);
  const S = SYNASTRY_PDF_STRINGS[lang];
  const brandUpper = market.siteName.toUpperCase();
  const domain = new URL(market.siteUrl).hostname.replace(/^www\./, "");
  const SECTIONS = SECTION_KEYS.map((key) => ({ key, title: S.sectionTitles[key] ?? key }));
  const archetypeLabel = input.archetypeId
    ? getArchetypeLabel(input.archetypeId, lang)
    : (input.archetypeLabel ?? null);

  const doc = await PDFDocument.create();
  doc.setTitle(
    sanitizePdfText(`${S.metaTitle} - ${input.personAName ?? ""} & ${input.personBName ?? ""}`),
  );
  doc.setSubject(S.metaSubject);
  doc.setProducer(SYNASTRY_PDF_VERSION_TAG);
  doc.setCreator(SYNASTRY_PDF_VERSION_TAG);
  doc.setKeywords([SYNASTRY_PDF_VERSION_TAG]);

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

  function drawCenteredText(
    page: any,
    text: string,
    yPos: number,
    size: number,
    font: any,
    color: any,
  ) {
    const safeText = sanitizePdfText(text);
    const textWidth = font.widthOfTextAtSize(safeText, size);
    page.drawText(safeText, { x: PAGE_WIDTH / 2 - textWidth / 2, y: yPos, size, font, color });
  }

  function drawFooter(page: any) {
    const pageNumber = `${doc.getPageCount()}`;
    page.drawRectangle({
      x: PAGE_WIDTH / 2 - 24,
      y: FOOTER_RULE_Y,
      width: 48,
      height: 0.3,
      color: paleLine,
    });
    const footerText = sanitizePdfText(
      `${brandUpper}  ·  p. ${pageNumber}  ·  ${domain}`,
    );
    drawCenteredText(page, footerText, FOOTER_BASELINE, 7.5, timesRoman, mutedText);
  }

  function addLinkAnnotation(
    page: any,
    x: number,
    y: number,
    w: number,
    h: number,
    url: string,
  ) {
    const linkAnnotRef = doc.context.register(
      doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [x, y, x + w, y + h],
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
      }),
    );
    const existing = page.node.get(PDFName.of("Annots"));
    if (existing instanceof PDFArray) {
      existing.push(linkAnnotRef);
    } else {
      page.node.set(PDFName.of("Annots"), doc.context.obj([linkAnnotRef]));
    }
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
    console.warn("[synastry-pdf] logo embed failed:", e);
    drawCenteredText(coverPage, brandUpper, PAGE_HEIGHT - 82, 10, timesRoman, terracotta);
  }

  drawCenteredText(
    coverPage,
    S.coverTitle,
    PAGE_HEIGHT - 160,
    30,
    timesRomanBoldItalic,
    darkText,
  );
  coverPage.drawRectangle({
    x: PAGE_WIDTH / 2 - 30,
    y: PAGE_HEIGHT - 178,
    width: 60,
    height: 0.5,
    color: terracotta,
  });

  // Names compact line
  const namesLine = sanitizePdfText(
    `${input.personAName || S.personA}  &  ${input.personBName || S.personB}`,
  );
  drawCenteredText(coverPage, namesLine, PAGE_HEIGHT - 206, 15, timesRomanItalic, darkText);

  // Bi-wheel chart (center of cover, like natal report)
  const chartBoxTop = PAGE_HEIGHT - 228;
  const chartBoxBottom = 200;
  let detailsY = chartBoxBottom - 18;

  if (input.biWheelPng) {
    try {
      const img = await doc.embedPng(input.biWheelPng);
      const ratio = img.width / img.height;
      const maxW = Math.min(TEXT_WIDTH, 400);
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
      detailsY = chartY - 24;
    } catch (e) {
      console.warn("[synastry-pdf] bi-wheel embed failed:", e);
    }
  }

  // Birth details compact (below chart or below names if no chart)
  const personADetail = formatBirthDetail(
    input.personABirthDate,
    input.personABirthTime,
    input.personABirthPlace,
    S.timePrefix,
  );
  const personBDetail = formatBirthDetail(
    input.personBBirthDate,
    input.personBBirthTime,
    input.personBBirthPlace,
    S.timePrefix,
  );
  if (personADetail) {
    drawCenteredText(
      coverPage,
      sanitizePdfText(`${input.personAName || "A"}: ${personADetail}`),
      detailsY,
      8.5,
      timesRoman,
      mutedText,
    );
    detailsY -= 14;
  }
  if (personBDetail) {
    drawCenteredText(
      coverPage,
      sanitizePdfText(`${input.personBName || "B"}: ${personBDetail}`),
      detailsY,
      8.5,
      timesRoman,
      mutedText,
    );
    detailsY -= 14;
  }

  coverPage.drawRectangle({
    x: PAGE_WIDTH / 2 - 24,
    y: FOOTER_RULE_Y,
    width: 48,
    height: 0.3,
    color: paleLine,
  });
  drawCenteredText(coverPage, domain, FOOTER_BASELINE, 8, timesRoman, mutedText);

  // Indice riflette solo le sezioni effettivamente presenti nel report.
  const renderSections = SECTIONS.filter((s) => {
    const val = input.reportContent[s.key];
    return typeof val === "string" && val.trim().length > 0;
  });
  // Retrocompat: vecchi report con stabilita_longevita (rimossa in v6)
  if (
    input.reportContent.stabilita_longevita &&
    typeof input.reportContent.stabilita_longevita === "string" &&
    input.reportContent.stabilita_longevita.trim()
  ) {
    const insertIdx = renderSections.findIndex((s) => s.key === "pattern_karmico");
    if (insertIdx >= 0) {
      renderSections.splice(insertIdx, 0, { key: "stabilita_longevita" as any, title: S.stabilitaTitle });
    }
  }

  // ============ INTRO + INDEX PAGE ============
  const introPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawBackground(introPage);

  introPage.drawRectangle({
    x: MARGIN_LEFT,
    y: PAGE_HEIGHT - 110,
    width: 48,
    height: 0.6,
    color: terracotta,
  });
  introPage.drawText(sanitizePdfText(S.introTitle), {
    x: MARGIN_LEFT,
    y: PAGE_HEIGHT - 142,
    size: 20,
    font: timesRomanBold,
    color: darkText,
  });

  const introText = S.introText;

  let introY = PAGE_HEIGHT - 180;
  const introLines = wrapText(introText, timesRoman, 12, TEXT_WIDTH);
  for (const line of introLines) {
    introPage.drawText(line, {
      x: MARGIN_LEFT,
      y: introY,
      size: 12,
      font: timesRoman,
      color: darkText,
    });
    introY -= 19;
  }

  introY -= 32;
  introPage.drawRectangle({
    x: PAGE_WIDTH / 2 - 28,
    y: introY,
    width: 56,
    height: 0.5,
    color: lineColor,
  });
  introY -= 38;

  introPage.drawText(sanitizePdfText(S.indexTitle), {
    x: MARGIN_LEFT,
    y: introY,
    size: 20,
    font: timesRomanBold,
    color: darkText,
  });
  introY -= 30;

  renderSections.forEach((section, index) => {
    const number = String(index + 1).padStart(2, "0");
    introPage.drawText(number, {
      x: MARGIN_LEFT,
      y: introY,
      size: 9.5,
      font: bodyFontBold,
      color: terracotta,
    });
    introPage.drawText(sanitizePdfText(section.title), {
      x: MARGIN_LEFT + 38,
      y: introY - 1,
      size: 13,
      font: timesRoman,
      color: darkText,
    });
    introPage.drawRectangle({
      x: MARGIN_LEFT,
      y: introY - 12,
      width: TEXT_WIDTH,
      height: 0.3,
      color: paleLine,
    });
    introY -= 26;
  });

  drawFooter(introPage);

  // ============ SCORES PAGE ============
  if (input.scores || input.scoreOverall != null) {
    const SCORE_BARS: { rawKey: string; label: string }[] = [
      { rawKey: "intimacy", label: S.scoreLabels.intimacy },
      { rawKey: "romance", label: S.scoreLabels.romance },
      { rawKey: "communication", label: S.scoreLabels.communication },
      { rawKey: "stability", label: S.scoreLabels.stability },
      { rawKey: "growth", label: S.scoreLabels.growth },
      { rawKey: "tension", label: S.scoreLabels.tension },
    ];

    const scoresPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawBackground(scoresPage);

    scoresPage.drawRectangle({
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 110,
      width: 48,
      height: 0.6,
      color: terracotta,
    });
    scoresPage.drawText(sanitizePdfText(S.scoresTitle), {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 142,
      size: 20,
      font: timesRomanBold,
      color: darkText,
    });

    let nextY = PAGE_HEIGHT - 200;

    // Overall score centerpiece
    if (input.scoreOverall != null) {
      const scoreVal = compressScore(
        Math.max(0, Math.min(100, Math.round(input.scoreOverall))),
      );
      const circleY = PAGE_HEIGHT - 240;
      const circleR = 44;

      scoresPage.drawEllipse({
        x: PAGE_WIDTH / 2,
        y: circleY,
        xScale: circleR + 7,
        yScale: circleR + 7,
        borderColor: paleLine,
        borderWidth: 0.5,
        color: cream,
      });

      scoresPage.drawEllipse({
        x: PAGE_WIDTH / 2,
        y: circleY,
        xScale: circleR,
        yScale: circleR,
        borderColor: terracotta,
        borderWidth: 1.8,
        color: cream,
      });

      const scoreStr = String(scoreVal);
      const scoreSize = 38;
      const scoreW = timesRomanBold.widthOfTextAtSize(scoreStr, scoreSize);
      scoresPage.drawText(scoreStr, {
        x: PAGE_WIDTH / 2 - scoreW / 2,
        y: circleY - 4,
        size: scoreSize,
        font: timesRomanBold,
        color: terracotta,
      });
      drawCenteredText(scoresPage, "/ 100", circleY - 26, 9.5, timesRoman, mutedText);

      drawCenteredText(
        scoresPage,
        sanitizePdfText(S.overallLabel),
        circleY - circleR - 22,
        11,
        timesRomanItalic,
        darkText,
      );

      let belowBlock = circleY - circleR - 22;
      if (archetypeLabel) {
        drawCenteredText(
          scoresPage,
          sanitizePdfText(S.archetypeKicker),
          circleY - circleR - 42,
          8,
          timesRoman,
          mutedText,
        );
        drawCenteredText(
          scoresPage,
          sanitizePdfText(archetypeLabel),
          circleY - circleR - 60,
          14,
          timesRomanItalic,
          terracotta,
        );
        belowBlock = circleY - circleR - 60;
      }

      const dividerY = belowBlock - 26;
      scoresPage.drawRectangle({
        x: PAGE_WIDTH / 2 - 28,
        y: dividerY,
        width: 56,
        height: 0.5,
        color: lineColor,
      });
      nextY = dividerY - 30;
    }

    if (input.scores) {
      scoresPage.drawText(sanitizePdfText(S.domainsTitle), {
        x: MARGIN_LEFT,
        y: nextY,
        size: 13,
        font: timesRomanBold,
        color: darkText,
      });
      nextY -= 28;

      const LABEL_COL_W = 140;
      const BAR_LEFT = MARGIN_LEFT + LABEL_COL_W + 10;
      const VALUE_W = 32;
      const BAR_MAX_W = TEXT_WIDTH - LABEL_COL_W - 10 - VALUE_W;
      const BAR_H = 14;
      const ROW_GAP = 30;
      let barY = nextY;

      for (const { rawKey, label } of SCORE_BARS) {
        const raw = Number((input.scores as any)[rawKey] ?? 0);
        const value = Math.max(0, Math.min(100, Math.round(raw)));

        scoresPage.drawText(sanitizePdfText(label), {
          x: MARGIN_LEFT,
          y: barY + 3,
          size: 11.5,
          font: timesRoman,
          color: darkText,
        });

        scoresPage.drawRectangle({
          x: BAR_LEFT,
          y: barY,
          width: BAR_MAX_W,
          height: BAR_H,
          color: paleLine,
        });

        const barW = Math.max(2, (value / 100) * BAR_MAX_W);
        scoresPage.drawRectangle({
          x: BAR_LEFT,
          y: barY,
          width: barW,
          height: BAR_H,
          color: terracotta,
        });

        scoresPage.drawText(String(value), {
          x: BAR_LEFT + BAR_MAX_W + 8,
          y: barY + 3,
          size: 10,
          font: timesRoman,
          color: mutedText,
        });

        barY -= ROW_GAP;
      }

      scoresPage.drawText(sanitizePdfText(S.scaleLabel), {
        x: MARGIN_LEFT,
        y: barY - 8,
        size: 9,
        font: timesRomanItalic,
        color: mutedText,
      });
    }

    drawFooter(scoresPage);
  }

  // ============ CONTENT PAGES ============
  const BODY_SIZE = 11.8;
  const BODY_LINE_HEIGHT = 18;
  const BODY_PARA_GAP = 11;
  const POEM_SIZE = 13;
  const POEM_LINE_HEIGHT = 22;
  const POEM_STANZA_GAP = 11;

  let currentPage: any = null;
  let y = PAGE_HEIGHT - MARGIN_TOP;

  function addContentPage() {
    currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawBackground(currentPage);
    y = PAGE_HEIGHT - MARGIN_TOP;
  }

  function pageBreak() {
    drawFooter(currentPage);
    addContentPage();
  }

  function linesThatFit(lineHeight: number = BODY_LINE_HEIGHT): number {
    return Math.max(0, Math.floor((y - MARGIN_BOTTOM) / lineHeight));
  }

  function drawParagraph(text: string) {
    const cleanText = text.replace(/\n/g, " ").trim();
    if (!cleanText) return;
    const lines = wrapText(cleanText, timesRoman, BODY_SIZE, TEXT_WIDTH);
    if (!lines.length) return;

    if (lines.length <= 2 && linesThatFit() < lines.length) {
      pageBreak();
    } else if (lines.length >= 3 && linesThatFit() < 2) {
      pageBreak();
    }

    for (let i = 0; i < lines.length; i++) {
      const remaining = lines.length - i;
      const fits = linesThatFit();

      if (fits < 1) {
        pageBreak();
      } else if (remaining === 2 && fits < 2 && lines.length >= 3) {
        pageBreak();
      }

      currentPage.drawText(lines[i], {
        x: MARGIN_LEFT,
        y,
        size: BODY_SIZE,
        font: timesRoman,
        color: darkText,
      });
      y -= BODY_LINE_HEIGHT;
    }
    y -= BODY_PARA_GAP;
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

  // ============ APERTURA PAGE (new reports only) ============
  const apertura = input.reportContent.apertura;
  if (apertura && (apertura.cosa_siete || apertura.dove_brillate || apertura.dove_inciampate || apertura.dove_andate)) {
    const aperturaPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawBackground(aperturaPage);

    aperturaPage.drawRectangle({
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 110,
      width: 48,
      height: 0.6,
      color: terracotta,
    });
    aperturaPage.drawText(sanitizePdfText(S.aperturaTitle), {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 142,
      size: 20,
      font: timesRomanBold,
      color: darkText,
    });

    const aperturaItems: { label: string; value: string }[] = [
      { label: S.aperturaLabels.cosa_siete, value: apertura.cosa_siete ?? "" },
      { label: S.aperturaLabels.dove_brillate, value: apertura.dove_brillate ?? "" },
      { label: S.aperturaLabels.dove_inciampate, value: apertura.dove_inciampate ?? "" },
      { label: S.aperturaLabels.dove_andate, value: apertura.dove_andate ?? "" },
    ].filter((item) => item.value.trim().length > 0);

    let aperturaY = PAGE_HEIGHT - 200;
    for (const item of aperturaItems) {
      aperturaPage.drawText(sanitizePdfText(item.label), {
        x: MARGIN_LEFT,
        y: aperturaY,
        size: 10,
        font: timesRomanItalic,
        color: terracotta,
      });
      aperturaY -= 20;

      const valueLines = wrapText(item.value, timesRoman, 13, TEXT_WIDTH);
      for (const line of valueLines) {
        aperturaPage.drawText(line, {
          x: MARGIN_LEFT,
          y: aperturaY,
          size: 13,
          font: timesRoman,
          color: darkText,
        });
        aperturaY -= 20;
      }
      aperturaY -= 24;
    }

    drawFooter(aperturaPage);
  }

  for (let sectionIndex = 0; sectionIndex < renderSections.length; sectionIndex++) {
    const section = renderSections[sectionIndex];
    const content = input.reportContent[section.key] as string | undefined;
    if (!content || typeof content !== "string" || !content.trim()) continue;

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

    currentPage.drawText(sanitizePdfText(section.title), {
      x: MARGIN_LEFT,
      y,
      size: 23,
      font: timesRomanBold,
      color: darkText,
    });
    y -= 14;

    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y,
      width: 48,
      height: 0.55,
      color: terracotta,
    });
    y -= 30;

    if (section.key === "poesia_chiusura") {
      const stanzas = sanitizePdfText(content).split(/\n/);
      for (const stanza of stanzas) {
        if (!stanza.trim()) {
          y -= POEM_STANZA_GAP;
          continue;
        }
        drawPoemLines(stanza.trim());
      }
    } else {
      const paragraphs = paragraphsOf(content);
      for (const para of paragraphs) {
        drawParagraph(para);
      }
    }
  }

  if (currentPage) drawFooter(currentPage);

  // ============ CLOSING PAGE ============
  const closingPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawBackground(closingPage);

  closingPage.drawRectangle({
    x: MARGIN_LEFT,
    y: PAGE_HEIGHT - 118,
    width: 60,
    height: 0.6,
    color: terracotta,
  });
  closingPage.drawText(sanitizePdfText(S.closingTitle), {
    x: MARGIN_LEFT,
    y: PAGE_HEIGHT - 158,
    size: 24,
    font: timesRomanBold,
    color: darkText,
  });

  const closingParagraphs = S.closingParagraphs;

  let closingY = PAGE_HEIGHT - 200;
  for (const para of closingParagraphs) {
    const lines = wrapText(para, timesRoman, 12, TEXT_WIDTH);
    for (const line of lines) {
      closingPage.drawText(line, {
        x: MARGIN_LEFT,
        y: closingY,
        size: 12,
        font: timesRoman,
        color: darkText,
      });
      closingY -= 19;
    }
    closingY -= 11;
  }

  const btnW = 300;
  const btnH = 44;
  const btnX = (PAGE_WIDTH - btnW) / 2;
  const btnY = Math.max(closingY - 60, FOOTER_RULE_Y + 80);
  const radius = 10;

  const rrPath = `M ${radius} 0 L ${btnW - radius} 0 Q ${btnW} 0 ${btnW} ${radius} L ${btnW} ${btnH - radius} Q ${btnW} ${btnH} ${btnW - radius} ${btnH} L ${radius} ${btnH} Q 0 ${btnH} 0 ${btnH - radius} L 0 ${radius} Q 0 0 ${radius} 0 Z`;
  closingPage.drawSvgPath(rrPath, {
    x: btnX,
    y: btnY + btnH,
    color: terracotta,
    borderColor: terracotta,
    borderWidth: 0,
  });

  const ctaLabel = sanitizePdfText(S.closingCtaLabel);
  const ctaLabelSize = 12.5;
  const ctaLabelWidth = bodyFontBold.widthOfTextAtSize(ctaLabel, ctaLabelSize);
  closingPage.drawText(ctaLabel, {
    x: btnX + (btnW - ctaLabelWidth) / 2,
    y: btnY + btnH / 2 - ctaLabelSize / 2 - 0.5,
    size: ctaLabelSize,
    font: bodyFontBold,
    color: rgb(1, 1, 1),
  });
  addLinkAnnotation(
    closingPage,
    btnX,
    btnY,
    btnW,
    btnH,
    `${market.siteUrl}/report#transits-upsell`,
  );

  drawCenteredText(
    closingPage,
    `${domain}/report`,
    btnY - 22,
    9,
    timesRomanItalic,
    mutedText,
  );

  drawFooter(closingPage);

  return await doc.save();
}
