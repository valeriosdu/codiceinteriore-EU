import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getFunnelStage, getStoredSessionId } from "@/context/QuizContext";
import { useAuthReady } from "@/hooks/useAuthReady";
import { trackEvent } from "@/lib/analytics";
import {
  DEFAULT_FAQS,
  faqJsonLd,
  productJsonLd,
} from "@/lib/seo-jsonld";
import { useI18n } from "@/i18n/I18nProvider";
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
  PlateCaption,
  RULE,
} from "@/components/classica";

const Index = () => {
  const navigate = useNavigate();
  const { isReady, user } = useAuthReady();
  const { m } = useI18n();
  const l = m.landing;
  const [checking, setChecking] = useState(true);
  // Homepage = landing di discovery generica: passa ?discover=1 così il quiz
  // antepone la domanda di intent (l'angolo non è implicito come nelle landing
  // angle-targeted). L'angolo relazioni vive su /lp/classica.
  const startQuiz = () => navigate("/quiz?discover=1");

  useEffect(() => {
    trackEvent("landing_viewed", {}, { once: true });
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const checkReturningUser = async () => {
      try {
        // 1. Check authenticated user → redirect only to the correct report state
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, quiz_session_id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profile?.id) {
            const { data: activeReport } = await (supabase as any)
              .from("user_reports")
              .select("quiz_session_id, stripe_session_id, quiz_sessions(full_report, processing_status)")
              .eq("profile_id", profile.id)
              .eq("is_active", true)
              .maybeSingle();

            const activeSession = activeReport?.quiz_sessions;
            if (activeSession?.full_report) {
              navigate("/report", { replace: true });
              return;
            }

            const hasPaidReport = typeof activeReport?.stripe_session_id === "string" && (/^cs_(test|live)_/.test(activeReport.stripe_session_id) || activeReport.stripe_session_id.startsWith("pp_"));
            if (
              ["report_processing", "chart_processing", "insights_processing"].includes(activeSession?.processing_status || "") ||
              (hasPaidReport && ["insights_ready", "failed"].includes(activeSession?.processing_status || ""))
            ) {
              navigate("/report-processing", { replace: true });
              return;
            }
          }

          if (profile?.quiz_session_id) {
            const { data: qs } = await supabase
              .from("quiz_sessions")
              .select("full_report, processing_status")
              .eq("id", profile.quiz_session_id)
              .maybeSingle();

            if (qs?.full_report) {
              navigate("/report", { replace: true });
              return;
            }

            if (["report_processing", "chart_processing", "insights_processing", "insights_ready"].includes(qs?.processing_status || "")) {
              navigate("/report-processing", { replace: true });
              return;
            }
          }
        }

        // 2. Check anonymous user with localStorage state
        const stage = getFunnelStage();
        const storedSessionId = getStoredSessionId();

        if (storedSessionId && (stage === "teaser" || stage === "offer")) {
          navigate("/teaser", { replace: true });
          return;
        }
      } catch (e) {
        console.error("Redirect check failed:", e);
      } finally {
        setChecking(false);
      }
    };

    checkReturningUser();
  }, [isReady, navigate, user]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <SEO
        title={l.seo.title}
        description={l.seo.description}
        path="/"
        jsonLd={[productJsonLd(), faqJsonLd(DEFAULT_FAQS)]}
      />
      <ClassicaStyles />

      <PaperGrain />

      <div className="relative z-10">
        <Header />

        <main style={{ fontFamily: FONT_BODY }}>
          {/* Page-opening flourish */}
          <OpeningFlourish />

          {/* HERO ─── chart wheel cropped at right edge, slowly rotating */}
          <section className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute select-none
                         top-1/2 -translate-y-1/2
                         right-0 translate-x-[28%] sm:translate-x-[24%] md:translate-x-[18%] lg:translate-x-[14%]
                         w-[78vw] sm:w-[62vw] md:w-[52vw] lg:w-[44vw] max-w-[680px]"
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
                  className="text-[42px] sm:text-[54px] md:text-[64px] lg:text-[70px] font-normal text-foreground leading-[1.05] tracking-[-0.012em]"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  {l.hero.titlePre}{" "}
                  <em className="font-medium" style={{ color: INK }}>
                    {l.hero.titleEm}
                  </em>
                  ,
                  <br className="hidden sm:block" />
                  <span className="font-normal">{l.hero.titlePost}</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.75 }}
                  className="ci-dropcap mt-9 text-[19px] md:text-[20px] leading-[1.7] text-foreground/80 max-w-[28rem]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  {l.hero.subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.65 }}
                  className="mt-10 flex flex-col items-start gap-3"
                >
                  <Button variant="premium" size="hero" className="h-16 px-12 text-lg" onClick={startQuiz}>
                    {l.hero.cta}
                    <ArrowRight className="ml-1.5 h-5 w-5" />
                  </Button>
                  <p
                    className="text-[17px] md:text-[19px] tracking-wide text-muted-foreground"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {l.hero.microcopy}
                  </p>
                  <p
                    className="text-[16px] md:text-[18px] italic opacity-70 mt-1"
                    style={{ fontFamily: FONT_DISPLAY, color: INK }}
                  >
                    {l.hero.socialProof}
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* COSA PUOI SCOPRIRE ─── editorial enumeration */}
          <section className="container max-w-3xl mx-auto px-6 py-20 md:py-28 relative">
            <ChapterHeading numeral="I." title={l.discover.heading} />

            <ol className="space-y-7 max-w-xl mx-auto" style={{ fontFamily: FONT_BODY }}>
              {l.discover.items.map((text, i) => {
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

          {/* QUOTE ─── plate caption styling */}
          <section className="container max-w-3xl mx-auto px-6 py-16 md:py-24 relative">
            <motion.figure
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.2 }}
              className="text-center max-w-2xl mx-auto"
            >
              <div className="mb-9">
                <PlateCaption label={l.quote.plate} />
              </div>

              <blockquote
                className="text-[24px] md:text-[30px] lg:text-[32px] leading-[1.4] italic font-normal tracking-[-0.005em] text-foreground/90"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                <span className="opacity-40 mr-0.5" style={{ color: INK }}>
                  &ldquo;
                </span>
                {l.quote.text}
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

          {/* COME FUNZIONA ─── three-step engraved figure */}
          <section className="container max-w-4xl mx-auto px-6 py-20 md:py-28 relative">
            <ChapterHeading numeral="II." title={l.howItWorks.heading} />

            <div className="grid gap-12 md:gap-10 md:grid-cols-3 max-w-3xl mx-auto">
              {l.howItWorks.steps
                .map((title, i) => ({ numeral: ["I.", "II.", "III."][i], title }))
                .map((item, i) => (
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

          {/* FINAL CTA ─── colophon */}
          <section className="container max-w-3xl mx-auto px-6 pt-12 pb-24 md:pt-16 md:pb-32 text-center">
            <Colophon />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.95 }}
              className="text-[20px] md:text-[22px] italic leading-[1.6] text-foreground/85 max-w-md mx-auto"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              {l.finalCta.body}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.95, delay: 0.12 }}
              className="mt-10"
            >
              <Button variant="premium" size="hero" onClick={startQuiz}>
                {l.finalCta.cta}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
