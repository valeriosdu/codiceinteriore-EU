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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Index = () => {
  const navigate = useNavigate();
  const { isReady, user } = useAuthReady();
  const { m } = useI18n();
  const l = m.landing;
  const [checking, setChecking] = useState(true);
  const startQuiz = () => navigate("/quiz");

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
    <div className="min-h-screen bg-background">
      <SEO
        title={l.seo.title}
        description={l.seo.description}
        path="/"
        jsonLd={[productJsonLd(), faqJsonLd(DEFAULT_FAQS)]}
      />
      <Header />

      {/* Hero */}
      <section className="container py-16 md:py-24 max-w-2xl mx-auto text-center space-y-8">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl md:text-5xl font-semibold text-foreground leading-tight text-balance"
        >
          {l.hero.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto"
        >
          {l.hero.subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-3"
        >
          <Button variant="premium" size="hero" onClick={startQuiz}>
            {l.hero.cta}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">{l.hero.microcopy}</p>
        </motion.div>
      </section>

      {/* Problem recognition */}
      <section className="container max-w-2xl mx-auto py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-surface rounded-2xl p-8 md:p-10 space-y-5"
        >
          <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-primary uppercase tracking-wider">
            {l.problems.kicker}
          </motion.p>
          {l.problems.items.map((text, i) => (
            <motion.div key={i} variants={fadeUp} custom={i + 1} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p className="text-foreground/85 leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* What you'll get */}
      <section className="container max-w-2xl mx-auto py-12 text-center space-y-4">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-2xl md:text-3xl font-semibold text-foreground"
        >
          {l.discover.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-muted-foreground leading-relaxed max-w-lg mx-auto"
        >
          {l.discover.body}
        </motion.p>
      </section>

      {/* How it works */}
      <section className="container max-w-2xl mx-auto py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-2xl md:text-3xl font-semibold text-foreground text-center mb-10"
        >
          {l.howItWorks.title}
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-3">
          {l.howItWorks.steps.map((title, i) => ({ step: String(i + 1), title })).map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center space-y-3 p-6"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-display font-semibold text-sm">
                {item.step}
              </span>
              <p className="text-foreground font-medium">{item.title}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container max-w-2xl mx-auto py-16 text-center space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          {l.finalCta.body}
        </p>
        <Button variant="premium" size="hero" onClick={startQuiz}>
          {l.finalCta.cta}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
