import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { ROUTES } from '@/lib/routes';
import {
  ChapterHeading,
  ChartWheel,
  ClassicaStyles,
  Colophon,
  FONT_BODY,
  FONT_DISPLAY,
  INK,
  OpeningFlourish,
  PaperGrain,
  RULE,
  RULE_SOFT,
} from '@/components/classica';

export default function CoppiaLanding() {
  const navigate = useNavigate();
  const { m, market } = useI18n();
  const cl = m.coppia.landing;
  const startQuiz = () => navigate(ROUTES.coupleQuiz);

  useEffect(() => {
    document.title = m.coppia.titles.landing(market.siteName);
  }, [m, market.siteName]);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <ClassicaStyles />
      <PaperGrain />

      <div className="relative z-10">
        <Header />

        <main style={{ fontFamily: FONT_BODY }}>
          <OpeningFlourish />

          {/* HERO */}
          <section className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute select-none
                         hidden md:block
                         top-1/2 -translate-y-1/2
                         right-[-18%] lg:right-[-12%] xl:right-[-6%]
                         w-[66vw] lg:w-[56vw] xl:w-[48vw] max-w-[840px]"
              style={{ opacity: 0.16 }}
            >
              <div className="ci-wheel-rotate">
                <ChartWheel className="w-full h-auto" />
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
                  <Button variant="premium" size="hero" className="h-16 px-12 text-lg" onClick={startQuiz}>
                    {cl.cta}
                    <ArrowRight className="ml-1.5 h-5 w-5" />
                  </Button>

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

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.95, delay: 0.12 }}
            >
              <Button variant="premium" size="hero" className="h-16 px-12 text-lg" onClick={startQuiz}>
                {cl.cta}
                <ArrowRight className="ml-1.5 h-5 w-5" />
              </Button>
            </motion.div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
