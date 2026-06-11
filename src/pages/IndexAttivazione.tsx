import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { DEFAULT_FAQS, faqJsonLd, productJsonLd } from "@/lib/seo-jsonld";

const INK = "#1a2744";
const RULE = "rgba(26,39,68,0.32)";
const RULE_SOFT = "rgba(26,39,68,0.18)";

const FONT_BODY = "'EB Garamond', 'Cormorant Garamond', Georgia, serif";
const FONT_DISPLAY = "'Cormorant Garamond', 'EB Garamond', Georgia, serif";

// Vedi nota gemella in IndexClassica.tsx: l'id `classica-fonts` è condiviso
// così se l'utente naviga da una landing all'altra non duplichiamo il link.
if (typeof document !== "undefined" && !document.getElementById("classica-fonts")) {
  const link = document.createElement("link");
  link.id = "classica-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap";
  document.head.appendChild(link);
}

const PaperGrain = () => (
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

const ChartWheel = ({ className = "" }: { className?: string }) => {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 400" className={className} style={{ color: INK }}>
      <defs>
        <radialGradient id="wheel-vignette-att" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.04" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="195" fill="url(#wheel-vignette-att)" />

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

const ChapterHeading = ({ numeral, title }: { numeral: string; title: string }) => (
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

const PlateCaption = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center gap-4">
    <span className="h-px w-16 md:w-20" style={{ background: RULE }} />
    <span className="text-[10px] tracking-[0.5em] uppercase opacity-65" style={{ color: INK, fontFamily: FONT_BODY }}>
      {label}
    </span>
    <span className="h-px w-16 md:w-20" style={{ background: RULE }} />
  </div>
);

const IndexAttivazione = () => {
  const navigate = useNavigate();
  // Angle-targeted Meta landing. ?funnel=attivazione fa sì che Quiz.tsx mostri
  // le 2 domande angle-specific (sintomo + narrazione) invece delle classica
  // (attachment + focus). Skeleton (date/time/place/name) resta invariato.
  // Teaser e report restano classica finché non wireremo il registry lato
  // edge function.
  const startQuiz = () => navigate("/quiz?funnel=attivazione");

  useEffect(() => {
    trackEvent("landing_attivazione_viewed", {}, { once: true });
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <SEO
        title="Tema Natale per chi si sente fermo — Codice Interiore"
        description="Sai cosa vuoi ma non parti? Una lettura del tema natale per capire cosa ti accende e cosa ti blocca. In italiano, circa 10 pagine. Inizia gratis."
        path="/lp/attivazione"
        jsonLd={[
          productJsonLd({
            name: "Lettura del Tema Natale — Attivazione",
            description:
              "Lettura del tema natale orientata al blocco e al movimento: cosa ti accende, cosa ti blocca, condizioni di attivazione. Scritta in italiano.",
            url: "https://www.codiceinteriore.it/lp/attivazione",
          }),
          faqJsonLd(DEFAULT_FAQS),
        ]}
      />
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

      <PaperGrain />

      <div className="relative z-10">
        <Header />

        <main style={{ fontFamily: FONT_BODY }}>
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

          {/* HERO */}
          {/* Trattamento "tavola d'atlante": la wheel sborda intenzionalmente dal
              margine destro. Su mobile il centro è al margine destro del viewport
              (metà esatta cropped) — su desktop ~25-30% off-screen. La placca
              "Tav. I" in basso a destra + il margine di rilegatura mobile
              segnalano che il cropping è una scelta editoriale, non un errore. */}
          <section className="relative overflow-hidden">
            {/* DESKTOP: wheel grande croppata sulla destra (mobile la nasconde:
                la wheel sotto al testo affollava troppo lo schermo piccolo). */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute select-none
                         hidden md:block
                         top-1/2 -translate-y-1/2
                         right-[-18%] lg:right-[-12%] xl:right-[-6%]
                         w-[66vw] lg:w-[56vw] xl:w-[48vw] max-w-[840px]"
              style={{ opacity: 0.2 }}
            >
              <div className="ci-wheel-rotate">
                <ChartWheel className="w-full h-auto" />
              </div>
            </div>

            {/* Plate caption — conferma che la wheel è una tavola editoriale.
                Solo desktop: senza wheel su mobile, la caption non avrebbe
                referente. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute select-none z-[2]
                         hidden md:block
                         bottom-10 right-10"
            >
              <div className="flex items-center gap-4">
                <span
                  className="block h-px w-10"
                  style={{ background: RULE_SOFT }}
                />
                <span
                  className="text-[10px] tracking-[0.5em] uppercase whitespace-nowrap"
                  style={{
                    color: INK,
                    fontFamily: FONT_BODY,
                    opacity: 0.6,
                  }}
                >
                  Tav. I · Carta del cielo
                </span>
                <span
                  className="block h-px w-10"
                  style={{ background: RULE_SOFT }}
                />
              </div>
            </div>

            <div className="container max-w-5xl mx-auto px-6 pt-14 pb-24 md:pt-20 md:pb-32 relative">
              <div className="max-w-[34rem]">
                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                  className="text-[38px] sm:text-[48px] md:text-[56px] lg:text-[62px] font-normal text-foreground leading-[1.05] tracking-[-0.012em]"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  Il tuo{" "}
                  <em className="font-medium" style={{ color: INK }}>
                    Tema Natale
                  </em>{" "}
                  spiegato in modo chiaro
                  <br className="hidden sm:block" />
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.75 }}
                  className="ci-dropcap mt-9 text-[19px] md:text-[20px] leading-[1.7] text-foreground/80 max-w-[30rem]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  Scopri cosa ti accende, cosa ti blocca, perché certe cose non partono nonostante tu sappia cosa fare.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.65 }}
                  className="mt-10 flex flex-col items-start gap-3"
                >
                  <Button variant="premium" size="hero" className="h-16 px-12 text-lg" onClick={startQuiz}>
                    Inizia il quiz
                    <ArrowRight className="ml-1.5 h-5 w-5" />
                  </Button>
                  <p
                    className="text-[17px] md:text-[19px] tracking-wide text-muted-foreground"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    Quiz di 2 minuti · Nessuna conoscenza necessaria
                  </p>

                  <div className="mt-7 w-full max-w-[26rem]">
                    <div className="flex items-center justify-center gap-3 mb-2.5">
                      <span className="h-px flex-1" style={{ background: RULE_SOFT }} />
                      <svg width="7" height="7" viewBox="0 0 9 9" aria-hidden="true" style={{ color: INK }}>
                        <path
                          d="M4.5 0 L5.05 3.95 L9 4.5 L5.05 5.05 L4.5 9 L3.95 5.05 L0 4.5 L3.95 3.95 Z"
                          fill="currentColor"
                          opacity="0.55"
                        />
                      </svg>
                      <span className="h-px flex-1" style={{ background: RULE_SOFT }} />
                    </div>
                    <p
                      className="text-center text-[12px] md:text-[13px] tracking-[0.32em] uppercase font-medium opacity-75 leading-[1.7]"
                      style={{ fontFamily: FONT_BODY, color: INK }}
                    >
                      Oltre 10.000 persone
                      <br />
                      hanno ricevuto la loro lettura
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-2.5">
                      <span className="h-px flex-1" style={{ background: RULE_SOFT }} />
                      <svg width="7" height="7" viewBox="0 0 9 9" aria-hidden="true" style={{ color: INK }}>
                        <path
                          d="M4.5 0 L5.05 3.95 L9 4.5 L5.05 5.05 L4.5 9 L3.95 5.05 L0 4.5 L3.95 3.95 Z"
                          fill="currentColor"
                          opacity="0.55"
                        />
                      </svg>
                      <span className="h-px flex-1" style={{ background: RULE_SOFT }} />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* COSA PUOI SCOPRIRE */}
          <section className="container max-w-3xl mx-auto px-6 py-20 md:py-28 relative">
            <ChapterHeading numeral="I." title="Cosa puoi scoprire" />

            <ol className="space-y-7 max-w-xl mx-auto" style={{ fontFamily: FONT_BODY }}>
              {[
                "Perché certe cose non si attivano, anche quando sai cosa fare",
                "Cosa ti accende davvero, oltre quello che credi",
                "Lo schema che si ripete senza che tu lo veda",
                "Il tuo ritmo profondo, diverso da quello che ti chiedono",
              ].map((text, i) => {
                const numerals = ["i.", "ii.", "iii.", "iv."];
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.75, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
                    className="flex items-baseline gap-5 text-[19px] md:text-[20px] leading-[1.55]"
                  >
                    <span
                      className="italic font-medium shrink-0 w-10 text-right"
                      style={{ color: INK, fontFamily: FONT_DISPLAY, fontSize: "1.1em" }}
                    >
                      {numerals[i]}
                    </span>
                    <span className="text-foreground/85">{text}</span>
                  </motion.li>
                );
              })}
            </ol>
          </section>

          {/* QUOTE */}
          <section className="container max-w-3xl mx-auto px-6 py-16 md:py-24 relative">
            <motion.figure
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.2 }}
              className="text-center max-w-2xl mx-auto"
            >
              <div className="mb-9">
                <PlateCaption label="Tav. II" />
              </div>

              <blockquote
                className="text-[24px] md:text-[30px] lg:text-[32px] leading-[1.4] italic font-normal tracking-[-0.005em] text-foreground/90"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                <span className="opacity-40 mr-0.5" style={{ color: INK }}>
                  &ldquo;
                </span>
                Quello che ti accende e quello che ti blocca era già lì il giorno in cui sei nato
                <span className="opacity-40 ml-0.5" style={{ color: INK }}>
                  &rdquo;
                </span>
              </blockquote>

              <div className="flex items-center justify-center gap-4 mt-10">
                <span className="h-px w-24 md:w-32" style={{ background: RULE }} />
                <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true" style={{ color: INK }}>
                  <circle cx="3" cy="3" r="1.4" fill="currentColor" opacity="0.6" />
                </svg>
                <span className="h-px w-24 md:w-32" style={{ background: RULE }} />
              </div>
            </motion.figure>
          </section>

          {/* COME FUNZIONA */}
          <section className="container max-w-4xl mx-auto px-6 py-20 md:py-28 relative">
            <ChapterHeading numeral="II." title="Come funziona" />

            <div className="grid gap-12 md:gap-10 md:grid-cols-3 max-w-3xl mx-auto">
              {[
                { numeral: "I.", title: "Inserisci i tuoi dati di nascita" },
                { numeral: "II.", title: "Rispondi a poche domande brevi" },
                { numeral: "III.", title: "Ricevi la tua lettura iniziale gratuitamente" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.85, delay: i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                  className="text-center md:text-left space-y-4"
                >
                  <span
                    className="block text-[34px] italic font-normal leading-none"
                    style={{
                      fontFamily: FONT_DISPLAY,
                      color: INK,
                    }}
                  >
                    {item.numeral}
                  </span>
                  <span className="block h-px w-12 mx-auto md:mx-0" style={{ background: RULE }} />
                  <p
                    className="text-[18px] md:text-[19px] leading-[1.55] text-foreground/85 font-normal"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {item.title}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="container max-w-3xl mx-auto px-6 pt-12 pb-24 md:pt-16 md:pb-32 text-center">
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

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.95 }}
              className="text-[20px] md:text-[22px] italic leading-[1.6] text-foreground/85 max-w-md mx-auto"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Inizia dalla tua lettura iniziale. Capirai meglio cosa ti accende e cosa ti blocca.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.95, delay: 0.12 }}
              className="mt-10"
            >
              <Button variant="premium" size="hero" className="h-16 px-12 text-lg" onClick={startQuiz}>
                Inizia il quiz
                <ArrowRight className="ml-1.5 h-5 w-5" />
              </Button>
            </motion.div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default IndexAttivazione;
