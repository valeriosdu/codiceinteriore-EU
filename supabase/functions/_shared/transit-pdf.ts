// Shared PDF generation for the "Scarica PDF transiti" button on the
// customer report page. Layout aligned to the natal report PDF so the two
// documents feel like one product (same cover style, same intro+index,
// same numbered sections, same footer, same widow/orphan control). On
// top of that, the transit PDF introduces a boxed-period layout for
// `periods[]` and a closing CTA that links into the Astrology Guide.

import { PDFArray, PDFDocument, PDFName, PDFString, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
// @ts-ignore npm specifier
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";
import { sanitizePdfText } from "./report-pdf.ts";
import { decodeLogoPng } from "./logo.ts";
import { playfairItalic, playfairSemiBold } from "./fonts.ts";
import { getMarket, type MarketId } from "./markets.ts";
import { type PromptLang } from "./prompts/lang.ts";
import { TRANSIT_PDF_STRINGS } from "./pdf-i18n.ts";

// Bump whenever the transit PDF layout/fonts change so cached files
// from older versions are invalidated automatically.
export const TRANSIT_PDF_VERSION = "v9-i18n";
export const TRANSIT_PDF_VERSION_TAG = `CI-TRANSIT-PDF/${TRANSIT_PDF_VERSION}`;

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 70;
const MARGIN_RIGHT = 70;
const MARGIN_TOP = 70;
const MARGIN_BOTTOM = 70;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const FOOTER_BASELINE = 36;
const FOOTER_RULE_Y = 56;

const BODY_SIZE = 11.8;
const BODY_LINE_HEIGHT = 18;
const BODY_PARA_GAP = 11;

// Per-period box layout. Each period is rendered as a self-contained
// bordered card so the four monthly periods read as separate beats
// rather than a wall of paragraphs.
const BOX_PAD_X = 14;
const BOX_PAD_Y = 14;
const BOX_BORDER_WIDTH = 0.5;
const BOX_LABEL_SIZE = 9.5;
const BOX_LABEL_GAP = 8;
const BOX_HEADLINE_SIZE = 13;
const BOX_HEADLINE_LINE_HEIGHT = 18;
const BOX_HEADLINE_GAP = 6;
const BOX_FOCUS_SIZE = 11.5;
const BOX_FOCUS_LINE_HEIGHT = 17;
const BOX_BETWEEN_GAP = 14;

// Gli URL puntano al dominio del mercato (vedi guideOpenUrl/feedbackUrl nel
// builder); in passato erano hardcoded su codiceinteriore.it.

export interface TransitPeriod {
  label?: string;
  date_range?: string;
  headline?: string;
  focus?: string;
}

export interface TransitWeeklyWindow {
  title?: string;
  body?: string;
}

export interface TransitKeyAspect {
  title?: string;
  body?: string;
}

export interface InterpretedTransits {
  summary?: {
    main_themes?: string[];
    overall_reading?: string;
  };
  periods?: TransitPeriod[];
  closing?: { title?: string; text?: string };
  intro?: string;
  mainThemes?: string[];
  weeklyWindows?: TransitWeeklyWindow[];
  keyAspects?: TransitKeyAspect[];
  practicalNotes?: string[];
}

export interface GenerateTransitPdfInput {
  interpreted: InterpretedTransits;
  userName: string | null;
  birthPlace: string | null;
  birthDate?: any | null;
  birthTime?: any | null;
  periodStart: string | null; // ISO date (YYYY-MM-DD)
  periodEnd: string | null;
  lang?: PromptLang;
  market?: MarketId;
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

function formatItDate(iso: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function formatBirthDate(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return formatItDate(value);
  if (typeof value === "object" && value.day && value.month && value.year) {
    const day = String(value.day).padStart(2, "0");
    const month = String(value.month).padStart(2, "0");
    return `${day}/${month}/${value.year}`;
  }
  return "";
}

function formatBirthTime(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 5);
  if (typeof value === "object" && value.hour != null && value.minute != null) {
    const hour = String(value.hour).padStart(2, "0");
    const minute = String(value.minute).padStart(2, "0");
    return `${hour}:${minute}`;
  }
  return "";
}

export async function generateTransitPdf(input: GenerateTransitPdfInput): Promise<Uint8Array> {
  const { interpreted, userName, birthPlace, birthDate, birthTime, periodStart, periodEnd } = input;
  const lang: PromptLang = input.lang ?? "it";
  const market = getMarket(input.market);
  const S = TRANSIT_PDF_STRINGS[lang];
  const brandUpper = market.siteName.toUpperCase();
  const domain = new URL(market.siteUrl).hostname.replace(/^www\./, "");
  const GUIDE_OPEN_URL = `${market.siteUrl}/report?openGuide=1&source=transit-pdf`;
  const FEEDBACK_URL = `${market.siteUrl}/report?source=transit-pdf-feedback#feedback`;

  const doc = await PDFDocument.create();
  doc.setTitle(sanitizePdfText(S.metaTitle(userName || "")));
  doc.setSubject(S.metaSubject);
  doc.setProducer(TRANSIT_PDF_VERSION_TAG);
  doc.setCreator(TRANSIT_PDF_VERSION_TAG);
  doc.setKeywords([TRANSIT_PDF_VERSION_TAG]);

  doc.registerFontkit(fontkit);
  const [pfSemiBold, pfItalic] = await Promise.all([
    playfairSemiBold(), playfairItalic(),
  ]);
  const timesRoman = await doc.embedFont(StandardFonts.Helvetica);
  const timesRomanBold = await doc.embedFont(pfSemiBold);
  const timesRomanItalic = await doc.embedFont(pfItalic);
  const timesRomanBoldItalic = timesRomanItalic;
  const bodyFontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Palette matched to report-pdf.ts so the two files share the same
  // warm editorial tone.
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
    if (!page) return;
    const pageNumber = `${doc.getPageCount()}`;
    page.drawRectangle({
      x: PAGE_WIDTH / 2 - 24,
      y: FOOTER_RULE_Y,
      width: 48,
      height: 0.3,
      color: paleLine,
    });
    const footerText = sanitizePdfText(`${brandUpper}  -  p. ${pageNumber}  -  ${domain}`);
    drawCenteredText(page, footerText, FOOTER_BASELINE, 7.5, timesRoman, mutedText);
  }

  // Clickable URI annotation, same pattern as report-pdf.ts. Kept inline
  // (rather than imported) so this file stays self-contained.
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

  // Running page state for the content section.
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

  function linesThatFit(lineHeight: number): number {
    return Math.max(0, Math.floor((y - MARGIN_BOTTOM) / lineHeight));
  }

  // Block-aware paragraph drawing, mirrored from report-pdf.ts. Prevents
  // single-line orphans starting a page and single-line widows ending one.
  function drawParagraph(text: string, font: any, size: number, lineHeight: number, paraGap: number, color = darkText) {
    const cleanText = text.replace(/\n/g, " ").trim();
    if (!cleanText) return;
    const lines = wrapText(cleanText, font, size, TEXT_WIDTH);
    if (!lines.length) return;

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
        pageBreak();
      }

      currentPage.drawText(lines[i], { x: MARGIN_LEFT, y, size, font, color });
      y -= lineHeight;
    }
    y -= paraGap;
  }

  function drawBullet(text: string) {
    const cleanText = sanitizePdfText(text).trim();
    if (!cleanText) return;
    const indent = 16;
    const lines = wrapText(cleanText, timesRoman, BODY_SIZE, TEXT_WIDTH - indent);
    if (linesThatFit(BODY_LINE_HEIGHT) < Math.min(2, lines.length)) {
      pageBreak();
    }
    for (let i = 0; i < lines.length; i++) {
      if (linesThatFit(BODY_LINE_HEIGHT) < 1) pageBreak();
      if (i === 0) {
        currentPage.drawText("-", {
          x: MARGIN_LEFT, y, size: BODY_SIZE, font: timesRomanBold, color: terracotta,
        });
      }
      currentPage.drawText(lines[i], {
        x: MARGIN_LEFT + indent, y, size: BODY_SIZE, font: timesRoman, color: darkText,
      });
      y -= BODY_LINE_HEIGHT;
    }
    y -= 6;
  }

  function drawSectionHeader(num: string, title: string) {
    if (currentPage) drawFooter(currentPage);
    addContentPage();

    currentPage.drawText(`SEZIONE ${num}`, {
      x: MARGIN_LEFT, y, size: 8.5, font: timesRoman, color: terracotta,
    });
    y -= 26;

    currentPage.drawText(sanitizePdfText(title), {
      x: MARGIN_LEFT, y, size: 23, font: timesRomanBold, color: darkText,
    });
    y -= 14;

    currentPage.drawRectangle({ x: MARGIN_LEFT, y, width: 48, height: 0.55, color: terracotta });
    y -= 30;
  }

  function drawPeriodBox(period: TransitPeriod, idx: number) {
    const labelRaw = period.label || `Settimana ${idx + 1}`;
    const label = `${labelRaw}${period.date_range ? `  -  ${period.date_range}` : ""}`;
    const headline = period.headline || "";
    const focus = period.focus || "";

    const innerWidth = TEXT_WIDTH - 2 * BOX_PAD_X;
    const headlineLines = headline
      ? wrapText(headline, timesRomanBoldItalic, BOX_HEADLINE_SIZE, innerWidth)
      : [];
    const focusLines = focus
      ? wrapText(focus, timesRoman, BOX_FOCUS_SIZE, innerWidth)
      : [];

    const totalBoxHeight =
      BOX_PAD_Y +
      BOX_LABEL_SIZE +
      BOX_LABEL_GAP +
      headlineLines.length * BOX_HEADLINE_LINE_HEIGHT +
      (headlineLines.length > 0 ? BOX_HEADLINE_GAP : 0) +
      focusLines.length * BOX_FOCUS_LINE_HEIGHT +
      BOX_PAD_Y;

    // A box never splits across pages: if it doesn't fit, push it onto a
    // fresh page even if some space remains here. If the box is taller
    // than a full content area (very unlikely with the current word
    // limits), it will simply be clipped at the page bottom — the
    // narrative validator caps focus to 60-90 words so this stays safe.
    if (y - totalBoxHeight < MARGIN_BOTTOM) {
      pageBreak();
    }

    const boxTop = y;
    const boxBottom = y - totalBoxHeight;
    const boxLeft = MARGIN_LEFT;
    const boxRight = MARGIN_LEFT + TEXT_WIDTH;

    // Border: four thin filled rectangles instead of an svg path.
    currentPage.drawRectangle({
      x: boxLeft, y: boxTop - BOX_BORDER_WIDTH, width: TEXT_WIDTH, height: BOX_BORDER_WIDTH, color: terracotta,
    });
    currentPage.drawRectangle({
      x: boxLeft, y: boxBottom, width: TEXT_WIDTH, height: BOX_BORDER_WIDTH, color: terracotta,
    });
    currentPage.drawRectangle({
      x: boxLeft, y: boxBottom, width: BOX_BORDER_WIDTH, height: totalBoxHeight, color: terracotta,
    });
    currentPage.drawRectangle({
      x: boxRight - BOX_BORDER_WIDTH, y: boxBottom, width: BOX_BORDER_WIDTH, height: totalBoxHeight, color: terracotta,
    });

    let cursorY = boxTop - BOX_PAD_Y - BOX_LABEL_SIZE;
    currentPage.drawText(sanitizePdfText(label), {
      x: boxLeft + BOX_PAD_X, y: cursorY, size: BOX_LABEL_SIZE, font: timesRomanBold, color: terracotta,
    });
    cursorY -= BOX_LABEL_GAP;

    for (const line of headlineLines) {
      cursorY -= BOX_HEADLINE_LINE_HEIGHT;
      currentPage.drawText(line, {
        x: boxLeft + BOX_PAD_X, y: cursorY, size: BOX_HEADLINE_SIZE, font: timesRomanBoldItalic, color: darkText,
      });
    }
    if (headlineLines.length > 0) cursorY -= BOX_HEADLINE_GAP;

    for (const line of focusLines) {
      cursorY -= BOX_FOCUS_LINE_HEIGHT;
      currentPage.drawText(line, {
        x: boxLeft + BOX_PAD_X, y: cursorY, size: BOX_FOCUS_SIZE, font: timesRoman, color: darkText,
      });
    }

    y = boxBottom - BOX_BETWEEN_GAP;
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
    console.warn("[transit-pdf] logo embed failed:", e);
    drawCenteredText(coverPage, brandUpper, PAGE_HEIGHT - 82, 10, timesRoman, terracotta);
  }

  drawCenteredText(coverPage, S.coverTitle, PAGE_HEIGHT - 200, 28, timesRomanBoldItalic, darkText);
  drawCenteredText(coverPage, S.coverSubtitle, PAGE_HEIGHT - 226, 13, timesRomanItalic, mutedText);
  coverPage.drawRectangle({
    x: PAGE_WIDTH / 2 - 30, y: PAGE_HEIGHT - 244, width: 60, height: 0.5, color: terracotta,
  });

  if (userName) {
    drawCenteredText(coverPage, sanitizePdfText(userName), PAGE_HEIGHT / 2 - 40, 18, timesRomanItalic, darkText);
  }

  const birthDetails = [
    birthPlace ? sanitizePdfText(birthPlace) : "",
    formatBirthDate(birthDate),
    formatBirthTime(birthTime),
  ].filter(Boolean).join(" - ");
  if (birthDetails) {
    drawCenteredText(coverPage, birthDetails, PAGE_HEIGHT / 2 - 62, 11, timesRoman, mutedText);
  }

  const rangeText = periodStart && periodEnd
    ? `${S.periodLabel} ${formatItDate(periodStart)} - ${formatItDate(periodEnd)}`
    : "";
  if (rangeText) {
    drawCenteredText(coverPage, rangeText, PAGE_HEIGHT / 2 - 92, 12, timesRomanItalic, mutedText);
  }

  coverPage.drawRectangle({
    x: PAGE_WIDTH / 2 - 24, y: FOOTER_RULE_Y, width: 48, height: 0.3, color: paleLine,
  });
  drawCenteredText(coverPage, domain, FOOTER_BASELINE, 8, timesRoman, mutedText);

  // ============ INTRO + INDEX PAGE ============
  const introPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawBackground(introPage);

  introPage.drawRectangle({ x: MARGIN_LEFT, y: PAGE_HEIGHT - 110, width: 48, height: 0.6, color: terracotta });
  introPage.drawText(sanitizePdfText(S.introTitle), {
    x: MARGIN_LEFT, y: PAGE_HEIGHT - 142, size: 20, font: timesRomanBold, color: darkText,
  });

  const introText = S.introText;
  let introY = PAGE_HEIGHT - 180;
  for (const line of wrapText(introText, timesRoman, 12, TEXT_WIDTH)) {
    introPage.drawText(line, { x: MARGIN_LEFT, y: introY, size: 12, font: timesRoman, color: darkText });
    introY -= 19;
  }

  introY -= 32;
  introPage.drawRectangle({
    x: PAGE_WIDTH / 2 - 28, y: introY, width: 56, height: 0.5, color: lineColor,
  });
  introY -= 38;

  introPage.drawText(sanitizePdfText(S.indexTitle), {
    x: MARGIN_LEFT, y: introY, size: 20, font: timesRomanBold, color: darkText,
  });
  introY -= 30;

  const indexEntries = [
    { num: "01", title: S.index.summary },
    { num: "02", title: S.index.reading },
    { num: "03", title: S.index.periods },
    { num: "04", title: S.index.dialogue },
  ];
  for (const entry of indexEntries) {
    introPage.drawText(entry.num, {
      x: MARGIN_LEFT, y: introY, size: 9.5, font: bodyFontBold, color: terracotta,
    });
    introPage.drawText(sanitizePdfText(entry.title), {
      x: MARGIN_LEFT + 38, y: introY - 1, size: 13, font: timesRoman, color: darkText,
    });
    introPage.drawRectangle({
      x: MARGIN_LEFT, y: introY - 12, width: TEXT_WIDTH, height: 0.3, color: paleLine,
    });
    introY -= 26;
  }

  // Hand control of the page cursor to the section drawer. The intro
  // page's footer is drawn by whichever path runs next:
  //   - drawSectionHeader() calls drawFooter() on the previous page
  //     before creating its own.
  //   - drawClosingPage() does the same when no other section runs.
  currentPage = introPage;

  // ============ CONTENT SECTIONS ============
  const hasSummary = !!interpreted.summary;
  const hasLegacy = !hasSummary && (
    !!interpreted.intro ||
    !!interpreted.mainThemes?.length ||
    !!interpreted.weeklyWindows?.length ||
    !!interpreted.keyAspects?.length ||
    !!interpreted.practicalNotes?.length
  );

  if (hasSummary) {
    if (interpreted.summary?.main_themes?.length) {
      drawSectionHeader("01", S.headers.mainThemes);
      for (const theme of interpreted.summary.main_themes) {
        drawBullet(theme);
      }
    }

    if (interpreted.summary?.overall_reading) {
      drawSectionHeader("02", S.headers.monthReading);
      const paragraphs = interpreted.summary.overall_reading.split("\n\n").filter((p: string) => p.trim());
      for (const para of paragraphs) {
        drawParagraph(para, timesRoman, BODY_SIZE, BODY_LINE_HEIGHT, BODY_PARA_GAP);
      }
    }

    if (interpreted.periods?.length) {
      drawSectionHeader("03", S.headers.monthPeriods);
      interpreted.periods.forEach((period, idx) => drawPeriodBox(period, idx));
    }

    drawClosingPage();
  } else if (hasLegacy) {
    if (interpreted.intro) {
      drawSectionHeader("01", S.headers.intro);
      const paragraphs = interpreted.intro.split("\n\n").filter((p: string) => p.trim());
      for (const para of paragraphs) {
        drawParagraph(para, timesRoman, BODY_SIZE, BODY_LINE_HEIGHT, BODY_PARA_GAP);
      }
    }
    if (interpreted.mainThemes?.length) {
      drawSectionHeader("02", S.headers.mainThemes);
      for (const t of interpreted.mainThemes) drawBullet(t);
    }
    if (interpreted.weeklyWindows?.length) {
      drawSectionHeader("03", S.headers.monthWindows);
      for (const w of interpreted.weeklyWindows) {
        if (w.title) {
          if (linesThatFit(BODY_LINE_HEIGHT) < 2) pageBreak();
          currentPage.drawText(sanitizePdfText(w.title), {
            x: MARGIN_LEFT, y, size: 12, font: bodyFontBold, color: darkText,
          });
          y -= 18;
        }
        if (w.body) drawParagraph(w.body, timesRoman, BODY_SIZE, BODY_LINE_HEIGHT, BODY_PARA_GAP);
      }
    }
    if (interpreted.keyAspects?.length) {
      drawSectionHeader("04", S.headers.keyAspects);
      for (const a of interpreted.keyAspects) {
        if (a.title) {
          if (linesThatFit(BODY_LINE_HEIGHT) < 2) pageBreak();
          currentPage.drawText(sanitizePdfText(a.title), {
            x: MARGIN_LEFT, y, size: 12, font: bodyFontBold, color: darkText,
          });
          y -= 18;
        }
        if (a.body) drawParagraph(a.body, timesRoman, BODY_SIZE, BODY_LINE_HEIGHT, BODY_PARA_GAP);
      }
    }
    if (interpreted.practicalNotes?.length) {
      drawSectionHeader("05", S.headers.practicalNotes);
      for (const n of interpreted.practicalNotes) drawBullet(n);
    }
    drawClosingPage();
  } else {
    drawSectionHeader("01", S.headers.monthReading);
    drawParagraph(
      S.emptyMonth,
      timesRomanItalic, 12, 18, BODY_PARA_GAP, mutedText,
    );
    if (currentPage) drawFooter(currentPage);
  }

  // The closing page is its own absolutely-positioned page (mirrors
  // addClosingPage() in report-pdf.ts). It draws its own footer.
  function drawClosingPage() {
    if (currentPage) drawFooter(currentPage);
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawBackground(page);
    currentPage = page;

    page.drawRectangle({ x: MARGIN_LEFT, y: PAGE_HEIGHT - 118, width: 60, height: 0.6, color: terracotta });
    page.drawText(sanitizePdfText(S.dialogueTitle), {
      x: MARGIN_LEFT, y: PAGE_HEIGHT - 158, size: 24, font: timesRomanBold, color: darkText,
    });

    type ClosingPara = { text: string; italic?: boolean; muted?: boolean };
    const paragraphs: ClosingPara[] = [];
    if (interpreted.closing?.text) {
      paragraphs.push({ text: interpreted.closing.text, italic: true, muted: true });
    }
    for (const text of S.dialogueParagraphs) {
      paragraphs.push({ text });
    }

    let bodyY = PAGE_HEIGHT - 200;
    for (const para of paragraphs) {
      const cleanPara = para.text.replace(/\n/g, " ").trim();
      if (!cleanPara) continue;
      const font = para.italic ? timesRomanItalic : timesRoman;
      const color = para.muted ? mutedText : darkText;
      const lines = wrapText(cleanPara, font, BODY_SIZE, TEXT_WIDTH);
      for (const line of lines) {
        page.drawText(line, { x: MARGIN_LEFT, y: bodyY, size: BODY_SIZE, font, color });
        bodyY -= BODY_LINE_HEIGHT;
      }
      bodyY -= BODY_PARA_GAP;
    }

    // CTA pill button — rounded rectangle via SVG path, label centered,
    // clickable link annotation over the same region.
    const btnW = 300;
    const btnH = 44;
    const btnX = (PAGE_WIDTH - btnW) / 2;
    const btnY = Math.max(bodyY - 60, FOOTER_RULE_Y + 80);
    const radius = 10;

    const rrPath = `M ${radius} 0 L ${btnW - radius} 0 Q ${btnW} 0 ${btnW} ${radius} L ${btnW} ${btnH - radius} Q ${btnW} ${btnH} ${btnW - radius} ${btnH} L ${radius} ${btnH} Q 0 ${btnH} 0 ${btnH - radius} L 0 ${radius} Q 0 0 ${radius} 0 Z`;
    page.drawSvgPath(rrPath, {
      x: btnX, y: btnY + btnH, color: terracotta, borderColor: terracotta, borderWidth: 0,
    });

    const labelText = sanitizePdfText(S.guideCta);
    const labelSize = 12.5;
    const labelWidth = bodyFontBold.widthOfTextAtSize(labelText, labelSize);
    page.drawText(labelText, {
      x: btnX + (btnW - labelWidth) / 2,
      y: btnY + btnH / 2 - labelSize / 2 - 0.5,
      size: labelSize,
      font: bodyFontBold,
      color: rgb(1, 1, 1),
    });

    addLinkAnnotation(page, btnX, btnY, btnW, btnH, GUIDE_OPEN_URL);

    // Feedback link
    const feedbackText = sanitizePdfText(S.feedbackCta);
    const feedbackSize = 10;
    const feedbackY = btnY - 56;
    const feedbackWidth = timesRomanItalic.widthOfTextAtSize(feedbackText, feedbackSize);
    const feedbackX = PAGE_WIDTH / 2 - feedbackWidth / 2;
    page.drawText(feedbackText, {
      x: feedbackX, y: feedbackY, size: feedbackSize, font: timesRomanItalic, color: terracotta,
    });
    page.drawRectangle({
      x: feedbackX, y: feedbackY - 2, width: feedbackWidth, height: 0.4, color: terracotta,
    });
    addLinkAnnotation(
      page,
      feedbackX,
      feedbackY - 4,
      feedbackWidth,
      feedbackSize + 6,
      FEEDBACK_URL,
    );

    drawFooter(page);
  }

  return await doc.save();
}

export function isCurrentTransitPdfVersion(bytes: Uint8Array): boolean {
  if (!bytes || bytes.length === 0) return false;
  try {
    const decoder = new TextDecoder("latin1");
    const head = decoder.decode(bytes.subarray(0, Math.min(bytes.length, 4096)));
    const tail = decoder.decode(bytes.subarray(Math.max(0, bytes.length - 4096)));
    return head.includes(TRANSIT_PDF_VERSION_TAG) || tail.includes(TRANSIT_PDF_VERSION_TAG);
  } catch {
    return false;
  }
}
