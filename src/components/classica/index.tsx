import { useEffect } from "react";
import { motion } from "framer-motion";

// Shared "classica" editorial design system: paper-grain texture, engraved
// chart wheel, Cormorant/EB Garamond serif type, chapter headings, plate
// captions and colophon. Used by the homepage (Index) and /lp/classica
// (IndexClassica). Kept in one place so the two pages don't drift.

export const INK = "#1a2744";
export const RULE = "rgba(26,39,68,0.32)";
export const RULE_SOFT = "rgba(26,39,68,0.18)";

export const FONT_BODY = "'EB Garamond', 'Cormorant Garamond', Georgia, serif";
export const FONT_DISPLAY = "'Cormorant Garamond', 'EB Garamond', Georgia, serif";

// Carica Cormorant + EB Garamond solo quando una pagina classica monta. NON è
// un side-effect a livello di modulo: Index è importato eager, quindi caricarli
// all'import sprecherebbe ~150 KB sul first paint di pagine che non li usano
// (/quiz, /report…). L'id condiviso evita il doppio <link> fra le due landing.
export function ensureClassicaFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById("classica-fonts")) return;
  const link = document.createElement("link");
  link.id = "classica-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap";
  document.head.appendChild(link);
}

// Keyframes for the rotating wheel + the hero drop-cap rule. Rendering this
// also triggers the font load (via the effect) so a page only needs to drop in
// <ClassicaStyles /> to get the whole treatment.
export const ClassicaStyles = () => {
  useEffect(() => {
    ensureClassicaFonts();
  }, []);
  return (
    <style>{`
      @keyframes ci-wheel-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .ci-wheel-rotate { animation: ci-wheel-rotate 240s linear infinite; transform-origin: 50% 50%; will-change: transform; }
      @media (prefers-reduced-motion: reduce) { .ci-wheel-rotate { animation: none; } }
      .ci-dropcap::first-letter {
        float: left;
        font-family: ${FONT_DISPLAY};
        font-style: normal;
        font-weight: 500;
        font-size: 3.4em;
        line-height: 0.82;
        padding: 0.08em 0.12em 0 0;
        color: ${INK};
      }
    `}</style>
  );
};

// Two-layer paper texture: fine fractal grain + slow horizontal striations
// for paper-fiber feel. Both at low opacity, multiplied over the warm beige.
export const PaperGrain = () => (
  <>
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.06] mix-blend-multiply"
    >
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0.20  0 0 0 0 0.10  0 0 0 0 0.05  0 0 0 0.7 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
    </svg>
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.035] mix-blend-multiply"
    >
      <filter id="paper-fiber">
        <feTurbulence type="turbulence" baseFrequency="0.011 0.55" numOctaves="2" />
        <feColorMatrix values="0 0 0 0 0.15  0 0 0 0 0.08  0 0 0 0 0.04  0 0 0 0.55 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-fiber)" />
    </svg>
  </>
);

// Glifi zodiacali disegnati a mano in stile incisione editoriale, in viewBox
// 14x14 centrato (origin 0,0, range -7..7). Sostituiscono i caratteri Unicode
// (♈♉…) che vengono renderizzati "quadrati" da EB Garamond come testo.
const ZODIAC_GLYPHS: React.ReactNode[] = [
  // 0 Ariete — due corna che si aprono e si arricciano verso l'alto
  <path d="M -6 5 Q -7 -4 -2 -5 Q 0 -5 0 -2 M 0 -2 Q 0 -5 2 -5 Q 7 -4 6 5" />,
  // 1 Toro — testa (cerchio) con corna a falce sopra
  <g>
    <circle cx="0" cy="2" r="3.2" />
    <path d="M -2.7 -0.8 Q -6 -5 0 -4.5 Q 6 -5 2.7 -0.8" />
  </g>,
  // 2 Gemelli — due pilastri con serif (II romano)
  <path d="M -3.5 -5 V 5 M 3.5 -5 V 5 M -5.5 -5 H -1.5 M 1.5 -5 H 5.5 M -5.5 5 H -1.5 M 1.5 5 H 5.5" />,
  // 3 Cancro — paisley 69 con due punti pieni
  <g>
    <circle cx="-3" cy="-1.5" r="1.2" fill="currentColor" stroke="none" />
    <path d="M -1.8 -0.7 Q 4 -0.7 4 3" />
    <circle cx="3" cy="1.5" r="1.2" fill="currentColor" stroke="none" />
    <path d="M 1.8 0.7 Q -4 0.7 -4 -3" />
  </g>,
  // 4 Leone — testa + coda fluente
  <g>
    <circle cx="-2" cy="-2" r="2.2" />
    <path d="M 0.2 -1.8 Q 5 -3 5 3 Q 5 6 2 6 Q -1 6 -1 3" />
  </g>,
  // 5 Vergine — M con coda ad anello (la "M" della Madonna)
  <path d="M -6 5 V -3 Q -6 -5 -4 -5 Q -2 -5 -2 -3 V 5 M -2 -3 Q -2 -5 0 -5 Q 2 -5 2 -3 V 5 M 2 -3 Q 2 -5 4 -5 Q 6 -5 6 -3 V 4 Q 6 6 4 6 Q 2 6 2 4" />,
  // 6 Bilancia — base orizzontale + arco sopra (piatti della bilancia)
  <path d="M -6 4 H 6 M -4 4 V 1 M -4 1 Q -4 -3 0 -3 Q 4 -3 4 1 M 4 1 V 4" />,
  // 7 Scorpione — M con coda a punta di freccia
  <path d="M -6 5 V -3 Q -6 -5 -4 -5 Q -2 -5 -2 -3 V 5 M -2 -3 Q -2 -5 0 -5 Q 2 -5 2 -3 V 5 M 2 -3 Q 2 -5 4 -5 Q 6 -5 6 -3 V 4 L 7.5 4 M 7.5 4 L 6 2.5 M 7.5 4 L 6 5.5" />,
  // 8 Sagittario — freccia diagonale con tacca trasversale
  <path d="M -6 6 L 6 -6 M 6 -6 L 3 -5 M 6 -6 L 5 -3 M -3 1 L 1 -3" />,
  // 9 Capricorno — V acuto (corno) + coda ad anello (pesce)
  <path d="M -5 -5 L -1 4 L 2 -3 Q 2 5 5 5 Q 7 5 7 3 Q 7 0 4 0" />,
  // 10 Acquario — due onde a zigzag parallele
  <path d="M -6 -2 L -4 -1 L -2 -3 L 0 -1 L 2 -3 L 4 -1 L 6 -3 M -6 2 L -4 3 L -2 1 L 0 3 L 2 1 L 4 3 L 6 1" />,
  // 11 Pesci — due archi a parentesi con sbarra centrale
  <path d="M -5 -5 Q -2 0 -5 5 M 5 -5 Q 2 0 5 5 M -3 0 H 3" />,
];

// Engraving-style wheel: triple outer ring, zodiac glyph band, 360 ticks
// (1°/5°/30° hierarchy), house spokes, decorative outer dots, compass-rose
// center. Rendered at low opacity behind the hero text; cropped at the right
// edge of the viewport.
export const ChartWheel = ({ className = "" }: { className?: string }) => {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 400" className={className} style={{ color: INK }}>
      <defs>
        <radialGradient id="wheel-vignette" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.04" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="195" fill="url(#wheel-vignette)" />

      <g fill="none" stroke="currentColor">
        <circle cx="200" cy="200" r="195" strokeWidth="0.4" strokeOpacity="0.45" />
        <circle cx="200" cy="200" r="186" strokeWidth="1.1" strokeOpacity="0.7" />
        <circle cx="200" cy="200" r="180" strokeWidth="0.4" strokeOpacity="0.5" />
        <circle cx="200" cy="200" r="158" strokeWidth="0.55" strokeOpacity="0.55" />
        <circle cx="200" cy="200" r="120" strokeWidth="0.4" strokeOpacity="0.4" />
        <circle cx="200" cy="200" r="80" strokeWidth="0.55" strokeOpacity="0.55" />
        <circle cx="200" cy="200" r="42" strokeWidth="0.4" strokeOpacity="0.4" />
        <circle cx="200" cy="200" r="36" strokeWidth="0.55" strokeOpacity="0.55" />

        {Array.from({ length: 360 }).map((_, i) => {
          const a = (i * Math.PI) / 180;
          const r1 = i % 30 === 0 ? 168 : i % 5 === 0 ? 174 : 178;
          const w = i % 30 === 0 ? 0.9 : i % 5 === 0 ? 0.45 : 0.22;
          const o = i % 30 === 0 ? 0.7 : i % 5 === 0 ? 0.5 : 0.32;
          const x1 = 200 + Math.cos(a) * r1;
          const y1 = 200 + Math.sin(a) * r1;
          const x2 = 200 + Math.cos(a) * 180;
          const y2 = 200 + Math.sin(a) * 180;
          return <line key={`t${i}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w} strokeOpacity={o} />;
        })}

        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = 200 + Math.cos(a) * 80;
          const y1 = 200 + Math.sin(a) * 80;
          const x2 = 200 + Math.cos(a) * 158;
          const y2 = 200 + Math.sin(a) * 158;
          return <line key={`s${i}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="0.55" strokeOpacity="0.5" />;
        })}

        {Array.from({ length: 8 }).map((_, i) => {
          const a = ((i * 45 + 22.5) * Math.PI) / 180;
          const x1 = 200 + Math.cos(a) * 36;
          const y1 = 200 + Math.sin(a) * 36;
          const x2 = 200 + Math.cos(a) * 80;
          const y2 = 200 + Math.sin(a) * 80;
          return <line key={`a${i}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="0.32" strokeOpacity="0.32" />;
        })}

        {Array.from({ length: 36 }).map((_, i) => {
          const a = ((i * 10 + 5) * Math.PI) / 180;
          const x = 200 + Math.cos(a) * 191;
          const y = 200 + Math.sin(a) * 191;
          return <circle key={`d${i}`} cx={x} cy={y} r="0.7" fill="currentColor" fillOpacity="0.45" stroke="none" />;
        })}
      </g>

      <g
        stroke="currentColor"
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeOpacity="0.7"
      >
        {ZODIAC_GLYPHS.map((glyph, i) => {
          const a = ((i * 30 + 15) * Math.PI) / 180;
          const x = 200 + Math.cos(a) * 139;
          const y = 200 + Math.sin(a) * 139;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              {glyph}
            </g>
          );
        })}
      </g>

      <g stroke="currentColor" fill="currentColor">
        <circle cx="200" cy="200" r="3.5" fillOpacity="0.7" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          const inner = i % 2 === 0 ? 8 : 5;
          const outer = i % 2 === 0 ? 22 : 14;
          const x1 = 200 + Math.cos(a) * inner;
          const y1 = 200 + Math.sin(a) * inner;
          const x2 = 200 + Math.cos(a) * outer;
          const y2 = 200 + Math.sin(a) * outer;
          return (
            <line
              key={`r${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeOpacity={i % 2 === 0 ? 0.6 : 0.4}
              strokeWidth={i % 2 === 0 ? 0.55 : 0.4}
              fill="none"
            />
          );
        })}
      </g>
    </svg>
  );
};

export const ChapterHeading = ({ numeral, title }: { numeral: string; title: string }) => (
  <motion.h2
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
    className="text-center mb-12 md:mb-16 font-normal"
  >
    <span
      className="block italic text-[44px] md:text-[54px] font-normal mb-4 leading-none"
      style={{ color: INK, fontFamily: FONT_DISPLAY }}
      aria-hidden="true"
    >
      {numeral}
    </span>
    <span
      className="text-[18px] md:text-[22px] tracking-[0.3em] uppercase font-medium"
      style={{ color: INK, fontFamily: FONT_BODY }}
    >
      {title}
    </span>
  </motion.h2>
);

export const PlateCaption = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center gap-4">
    <span className="h-px w-16 md:w-20" style={{ background: RULE }} />
    <span
      className="text-[10px] tracking-[0.5em] uppercase opacity-65"
      style={{ color: INK, fontFamily: FONT_BODY }}
    >
      {label}
    </span>
    <span className="h-px w-16 md:w-20" style={{ background: RULE }} />
  </div>
);

// Page-opening flourish: a small eight-point star between two rules.
export const OpeningFlourish = () => (
  <div className="container max-w-5xl mx-auto px-6 pt-3 md:pt-4">
    <div className="flex items-center justify-center gap-4">
      <span className="h-px w-14 md:w-20" style={{ background: RULE_SOFT }} />
      <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true" style={{ color: INK }}>
        <path
          d="M4.5 0 L5.05 3.95 L9 4.5 L5.05 5.05 L4.5 9 L3.95 5.05 L0 4.5 L3.95 3.95 Z"
          fill="currentColor"
          opacity="0.55"
        />
      </svg>
      <span className="h-px w-14 md:w-20" style={{ background: RULE_SOFT }} />
    </div>
  </div>
);

// Closing colophon ornament: a compass-star between two rules, above the final CTA.
export const Colophon = () => (
  <div className="flex items-center justify-center gap-4 mb-10">
    <span className="h-px flex-1 max-w-[110px]" style={{ background: RULE }} />
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ color: INK }}>
      <path
        d="M12 1 L13.4 10.6 L23 12 L13.4 13.4 L12 23 L10.6 13.4 L1 12 L10.6 10.6 Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M12 5 L12 19 M5 12 L19 12 M7.05 7.05 L16.95 16.95 M16.95 7.05 L7.05 16.95"
        stroke="currentColor"
        strokeWidth="0.45"
        opacity="0.4"
        fill="none"
      />
    </svg>
    <span className="h-px flex-1 max-w-[110px]" style={{ background: RULE }} />
  </div>
);
