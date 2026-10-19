import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import SEO from '@/components/SEO';
import SynastryWheels from '@/components/coppia/SynastryWheels';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useSynastry } from '@/context/SynastryContext';
import { ROUTES } from '@/lib/routes';
import {
  ChapterHeading,
  ClassicaStyles,
  Colophon,
  FONT_BODY,
  FONT_DISPLAY,
  INK,
  OpeningFlourish,
  PaperGrain,
  PlateCaption,
  RULE,
  RULE_SOFT,
} from '@/components/classica';

const EASE_EDITORIAL: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

const LandingStyles = () => (
  <style>{`
    @keyframes ci-syn-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes ci-syn-spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
    .ci-syn-a { animation: ci-syn-spin 240s linear infinite; transform-origin: 50% 50%; will-change: transform; }
    .ci-syn-b { animation: ci-syn-spin-rev 320s linear infinite; transform-origin: 50% 50%; will-change: transform; }
    @media (prefers-reduced-motion: reduce) {
      .ci-syn-a, .ci-syn-b { animation: none; }
    }
  `}</style>
);

// Il contenitore ha gia' il suo rapporto d'aspetto (1.62:1 = due ruote che si
// sovrappongono per il 23%), quindi le ruote ci entrano senza spostare il testo.
const SynastryPlate = ({ className = '' }: { className?: string }) => (
  <div className={`relative ${className}`} style={{ aspectRatio: '1.62 / 1' }} aria-hidden="true">
    <SynastryWheels />
  </div>
);

export default function CoppiaLanding() {
  const navigate = useNavigate();
  const { m, market } = useI18n();
  const { resetForNewPurchase } = useSynastry();
  const cl = m.coppia.landing;

  // Entrare nel funnel dalla landing significa "voglio una sinastria nuova",
  // quindi si riparte da zero. Senza questo azzeramento il funnelStage salvato
  // resta 'teaser' e CoppiaProcessing rimbalza subito alla coppia precedente:
  // chi inseriva un'altra coppia rivedeva quella vecchia e, se pagava, pagava
  // una seconda volta lo stesso report (successo davvero il 2026-09-01).
  // Stessa cosa che fa gia' handleEditData nel teaser.
  const startQuiz = () => {
    resetForNewPurchase();
    navigate(ROUTES.coupleQuiz);
  };

  // Barra CTA fissa su mobile: compare quando il bottone dell'hero esce dallo
  // schermo e sparisce quando si arriva alla chiusa, cosi' non copre mai un CTA
  // gia' visibile ne' il footer. Anche il suo bottone passa da startQuiz: un
  // <Link> al quiz salterebbe l'azzeramento della sessione qui sopra.
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const finalCtaRef = useRef<HTMLDivElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const hero = heroCtaRef.current;
    const final = finalCtaRef.current;
    if (!hero || !final || typeof IntersectionObserver === 'undefined') return;

    const state = { heroVisible: true, beforeFinal: true };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === hero) {
            // Ancora sotto la piega (telefoni bassi, orizzontale) conta come visibile.
            state.heroVisible = entry.isIntersecting || entry.boundingClientRect.top > 0;
          } else if (entry.target === final) {
            // `top > 0` = la chiusa e' ancora sotto la piega; se e' sopra siamo
            // gia' nel footer e la barra resta nascosta.
            state.beforeFinal = !entry.isIntersecting && entry.boundingClientRect.top > 0;
          }
        }
        setShowStickyCta(!state.heroVisible && state.beforeFinal);
      },
      { threshold: 0 },
    );

    observer.observe(hero);
    observer.observe(final);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <SEO
        title={m.coppia.titles.landing(market.siteName)}
        description={cl.seoDescription}
        path={ROUTES.couple}
      />
      <ClassicaStyles />
      <LandingStyles />
      <PaperGrain />

      <div className="relative z-10">
        <Header />

        <main style={{ fontFamily: FONT_BODY }}>
          <OpeningFlourish />

          {/* HERO. Desktop: la bi-ruota sborda dal margine destro. Mobile: un
              emblema compatto sopra il titolo, perche' e' il segno che racconta
              il prodotto e da mobile arriva quasi tutto il traffico. */}
          <section className="relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute select-none
                         hidden md:block
                         top-1/2 -translate-y-1/2
                         right-[-30%] lg:right-[-20%] xl:right-[-11%]
                         w-[92vw] lg:w-[78vw] xl:w-[66vw] max-w-[1080px]"
              style={{ opacity: 0.16 }}
            >
              <SynastryPlate />
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-10 right-10 z-[2] hidden select-none md:block"
              style={{ opacity: 0.75 }}
            >
              <PlateCaption label={cl.plateCaption} />
            </div>

            <div className="container max-w-5xl mx-auto px-6 pt-8 pb-24 md:pt-20 md:pb-32 relative">
              <div className="max-w-[34rem]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 0.72, scale: 1 }}
                  transition={{ duration: 1.1, ease: EASE_EDITORIAL }}
                  className="mb-7 w-[188px] md:hidden"
                >
                  <SynastryPlate />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                  className="text-[38px] sm:text-[48px] md:text-[56px] lg:text-[62px] font-normal text-foreground leading-[1.05] tracking-[-0.012em]"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  {cl.heroLine1}
                  <br className="hidden sm:block" />
                  <em className="font-medium" style={{ color: INK }}>
                    {cl.heroLine2}
                  </em>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.75 }}
                  className="ci-dropcap mt-9 text-[19px] md:text-[20px] leading-[1.7] text-foreground/80 max-w-[30rem]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  {cl.heroSubtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.65 }}
                  className="mt-10 flex flex-col items-start gap-3"
                >
                  <div ref={heroCtaRef}>
                    <Button variant="premium" size="hero" className="h-16 px-12 text-lg" onClick={startQuiz}>
                      {cl.cta}
                      <ArrowRight className="ml-1.5 h-5 w-5" />
                    </Button>
                  </div>
                  <p
                    className="text-[16px] md:text-[18px] tracking-wide text-muted-foreground"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {cl.ctaNote}
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
                      {cl.socialProofLine1}
                      <br />
                      {cl.socialProofLine2}
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

          {/* COSA SCOPRIRETE */}
          <section className="container max-w-4xl mx-auto px-6 py-20 md:py-28 relative">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
              className="text-center mb-14 md:mb-16"
            >
              <span
                className="block text-[12px] md:text-[13px] tracking-[0.4em] uppercase font-medium mb-4 opacity-70"
                style={{ color: INK, fontFamily: FONT_BODY }}
              >
                {cl.discoverKicker}
              </span>
              <h2
                className="italic text-[32px] md:text-[42px] font-normal leading-[1.15]"
                style={{ color: INK, fontFamily: FONT_DISPLAY }}
              >
                {cl.discoverTitleLine1}
                <br />
                {cl.discoverTitleLine2}
              </h2>
            </motion.div>

            <div className="grid gap-12 md:gap-10 md:grid-cols-3 max-w-3xl mx-auto">
              {cl.discoverItems
                .map((item, i) => ({ numeral: ['I.', 'II.', 'III.'][i], ...item }))
                .map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.85, delay: i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                    className="text-center md:text-left space-y-4"
                  >
                    <span
                      className="block text-[34px] italic font-normal leading-none"
                      style={{ fontFamily: FONT_DISPLAY, color: INK }}
                    >
                      {item.numeral}
                    </span>
                    <span className="block h-px w-12 mx-auto md:mx-0" style={{ background: RULE }} />
                    <h3
                      className="text-[18px] md:text-[19px] font-medium leading-[1.3] text-foreground"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="text-[16px] md:text-[17px] leading-[1.55] text-foreground/80 font-normal"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      {item.body}
                    </p>
                  </motion.div>
                ))}
            </div>
          </section>

          {/* TAVOLA II · citazione */}
          <section className="container max-w-3xl mx-auto px-6 py-12 md:py-24 relative">
            <motion.figure
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 1.2 }}
              className="mx-auto max-w-2xl text-center"
            >
              <div className="mb-8 md:mb-9">
                <PlateCaption label={cl.quotePlateCaption} />
              </div>

              <blockquote
                className="text-[23px] md:text-[30px] lg:text-[32px] font-normal italic leading-[1.4] tracking-[-0.005em] text-foreground/90 text-balance"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                <span className="mr-0.5 opacity-40" style={{ color: INK }}>
                  &ldquo;
                </span>
                {cl.quote}
                <span className="ml-0.5 opacity-40" style={{ color: INK }}>
                  &rdquo;
                </span>
              </blockquote>

              <div className="mt-9 md:mt-10 flex items-center justify-center gap-4" aria-hidden="true">
                <span className="h-px w-20 md:w-32" style={{ background: RULE }} />
                <svg width="6" height="6" viewBox="0 0 6 6" style={{ color: INK }}>
                  <circle cx="3" cy="3" r="1.4" fill="currentColor" opacity="0.6" />
                </svg>
                <span className="h-px w-20 md:w-32" style={{ background: RULE }} />
              </div>
            </motion.figure>
          </section>

          {/* COME FUNZIONA */}
          <section className="container max-w-4xl mx-auto px-6 py-20 md:py-28 relative">
            <ChapterHeading numeral="II." title={cl.howKicker} />

            <div className="grid gap-12 md:gap-10 md:grid-cols-3 max-w-3xl mx-auto">
              {cl.howSteps
                .map((text, i) => ({ numeral: ['I.', 'II.', 'III.'][i], text }))
                .map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.85, delay: i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                    className="text-center md:text-left space-y-4"
                  >
                    <span
                      className="block text-[34px] italic font-normal leading-none"
                      style={{ fontFamily: FONT_DISPLAY, color: INK }}
                    >
                      {item.numeral}
                    </span>
                    <span className="block h-px w-12 mx-auto md:mx-0" style={{ background: RULE }} />
                    <p
                      className="text-[18px] md:text-[19px] leading-[1.55] text-foreground/85 font-normal"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      {item.text}
                    </p>
                  </motion.div>
                ))}
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="container max-w-3xl mx-auto px-6 pt-12 pb-24 md:pt-16 md:pb-32 text-center">
            <Colophon />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.95 }}
              className="mx-auto max-w-md text-[20px] md:text-[22px] italic leading-[1.6] text-foreground/85 text-balance"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              {cl.closingLine}
            </motion.p>

            <motion.div
              ref={finalCtaRef}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.95, delay: 0.12 }}
              className="mt-9 md:mt-10 flex flex-col items-center gap-3"
            >
              <Button variant="premium" size="hero" className="h-16 px-12 text-lg" onClick={startQuiz}>
                {cl.cta}
                <ArrowRight className="ml-1.5 h-5 w-5" />
              </Button>
              <p
                className="text-[16px] md:text-[18px] tracking-wide text-muted-foreground"
                style={{ fontFamily: FONT_BODY }}
              >
                {cl.ctaNote}
              </p>
            </motion.div>
          </section>
        </main>

        <Footer />
      </div>

      {/* Barra CTA mobile: solo sotto md, fuori dal flusso, con la safe area dei
          telefoni con notch. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-5 pt-3 backdrop-blur-sm md:hidden ${
          showStickyCta ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{
          borderColor: RULE_SOFT,
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          // `visibility` toglie il bottone dall'ordine di tabulazione quando la
          // barra e' fuori schermo; ritardata in uscita per non tagliare il fade.
          visibility: showStickyCta ? 'visible' : 'hidden',
          transition: showStickyCta
            ? 'opacity 300ms ease, transform 300ms ease, visibility 0s'
            : 'opacity 300ms ease, transform 300ms ease, visibility 0s 300ms',
        }}
      >
        <Button variant="premium" size="hero" className="h-[54px] w-full text-lg" onClick={startQuiz}>
          {cl.cta}
          <ArrowRight className="ml-1.5 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
