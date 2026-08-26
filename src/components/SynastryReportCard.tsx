import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ArchetypeBadge } from "@/components/coppia/ArchetypeBadge";
import { ScoreOverallRing } from "@/components/coppia/ScoreOverallRing";
import { ScoreRadar } from "@/components/coppia/ScoreRadar";
import { SynastryReportSection } from "@/components/coppia/SynastryReportSection";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Download, Heart, Loader2, Lock, Sparkles } from "lucide-react";

function compressScore(raw: number): number {
  return Math.round(30 + (raw / 100) * 67);
}
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { SynastrySessionSummary } from "@/hooks/useSynastryReport";
import { useI18n } from "@/i18n/I18nProvider";
import { ROUTES } from "@/lib/routes";

// Ordine e chiavi delle sezioni (contratto col backend); i titoli vivono nel
// catalogo i18n (m.synastryCard.sections).
const SECTION_KEYS = [
  "ritratto_coppia",
  "attrazione_chimica",
  "comunicazione",
  "mondo_emotivo",
  "sfide",
  "pattern_karmico",
  "direzione",
] as const;

function mapScoresIt(raw: Record<string, number> | null) {
  if (!raw) return {};
  return {
    sintonia_emotiva: raw.intimacy ?? raw.emotional ?? raw.romance ?? 0,
    attrazione: raw.romance ?? 0,
    comunicazione: raw.communication ?? 0,
    stabilita: raw.stability ?? 0,
    crescita: raw.growth ?? 0,
    tensione: raw.tension ?? 0,
  };
}

function SynastrySessionCard({ session }: { session: SynastrySessionSummary }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { m } = useI18n();
  const sc = m.synastryCard;

  const isComplete = session.full_report && Object.keys(session.full_report).length > 0;
  const scoresIt = mapScoresIt(session.scores);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      if (!authSession) return;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-synastry-report-pdf?synastrySessionId=${encodeURIComponent(session.id)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authSession.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        },
      );
      if (!resp.ok) throw new Error(sc.pdf.unavailable);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sinastria-${session.person_a_name || "A"}-${session.person_b_name || "B"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Synastry PDF error:", e);
      toast.error(sc.pdf.error);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-2xl border border-border/60 bg-surface overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-accent/5 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-medium text-foreground">{sc.card.title}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {session.person_a_name || sc.card.personA} & {session.person_b_name || sc.card.personB}
              </p>
              {session.archetype && (
                <div className="mt-2">
                  <ArchetypeBadge archetypeId={session.archetype} variant="inline" />
                </div>
              )}
            </div>
            {session.score_overall != null && (
              <div className="shrink-0">
                <ScoreOverallRing score={compressScore(Math.max(0, Math.min(100, Math.round(session.score_overall))))} size={64} label="" />
              </div>
            )}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-6 pb-6 pt-2 border-t border-border/40">
            {!isComplete ? (
              <p className="text-sm text-muted-foreground py-4">
                {sc.card.inPreparation}
              </p>
            ) : (
              <div className="space-y-8 mt-4">
                {Object.keys(scoresIt).length > 0 && (
                  <div className="flex justify-center">
                    <ScoreRadar scores={scoresIt} size={280} />
                  </div>
                )}

                {session.bi_wheel_svg && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-3 text-center">
                      {sc.card.coupleChart}
                    </h3>
                    <div
                      className="flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                      dangerouslySetInnerHTML={{ __html: session.bi_wheel_svg }}
                    />
                  </div>
                )}

                {(session.full_report as any)?.apertura && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-3">{sc.card.yourMap}</h3>
                    <dl className="space-y-3">
                      {([
                        [sc.card.mapLabels.cosa_siete, (session.full_report as any).apertura.cosa_siete],
                        [sc.card.mapLabels.dove_brillate, (session.full_report as any).apertura.dove_brillate],
                        [sc.card.mapLabels.dove_inciampate, (session.full_report as any).apertura.dove_inciampate],
                        [sc.card.mapLabels.dove_andate, (session.full_report as any).apertura.dove_andate],
                      ] as const).map(([label, value]) => value && (
                        <div key={label}>
                          <dt className="text-xs font-medium text-primary tracking-wide uppercase">{label}</dt>
                          <dd className="mt-0.5 text-sm text-foreground leading-relaxed">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {SECTION_KEYS.map((key, i) => {
                  const body = session.full_report?.[key];
                  if (!body) return null;
                  return <SynastryReportSection key={key} section={i + 1} title={sc.sections[key]} body={body} />;
                })}

                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPdf}
                    disabled={pdfLoading}
                    className="gap-2"
                  >
                    {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {pdfLoading ? sc.pdf.preparing : sc.pdf.download}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface SynastryReportCardProps {
  sessions: SynastrySessionSummary[];
}

export default function SynastryReportCard({ sessions }: SynastryReportCardProps) {
  const navigate = useNavigate();
  const { m, market } = useI18n();
  const sc = m.synastryCard;

  if (sessions.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        aria-label={sc.upsell.aria}
        className="rounded-2xl border border-border/70 bg-surface px-6 py-8 sm:px-8 sm:py-10 shadow-sm"
      >
        <div className="flex items-center gap-2 text-primary text-xs lg:text-sm uppercase tracking-[0.18em] font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          {sc.upsell.kicker}
        </div>

        <h3 className="mt-3 font-display text-2xl sm:text-[26px] font-semibold text-foreground leading-snug">
          {sc.upsell.title}
        </h3>

        <p className="mt-3 text-[15px] lg:text-base text-muted-foreground leading-relaxed max-w-prose">
          {sc.upsell.body}
        </p>

        <div className="mt-5 rounded-xl border border-border/70 bg-background/45 px-4 py-4">
          <p className="text-xs lg:text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">{sc.upsell.includesTitle}</p>
          <ul className="mt-3 space-y-2 text-[15px] lg:text-base text-foreground/85 leading-relaxed">
            {sc.upsell.includes.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7">
          <div className="flex items-baseline justify-center gap-2 mb-3">
            <span className="text-muted-foreground line-through text-sm lg:text-base">{m.common.priceLabel(market.prices.synastry)}</span>
            <span className="text-primary font-semibold text-xl lg:text-2xl">{m.common.priceLabel(market.prices.synastryLaunch)}</span>
          </div>
          <Button variant="premium" size="lg" onClick={() => navigate(ROUTES.couple)} className="w-full lg:text-base lg:h-12">
            {sc.upsell.cta}
          </Button>
          <p className="mt-2 text-xs lg:text-sm text-muted-foreground text-center">
            {sc.upsell.note}
          </p>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs lg:text-sm text-muted-foreground">
          <Lock className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
          {sc.upsell.secureNote}
        </p>
      </motion.section>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((s) => (
        <SynastrySessionCard key={s.id} session={s} />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] via-surface to-surface px-6 py-7 sm:px-8 sm:py-8 shadow-sm"
      >
        <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.18em] font-medium">
          <Heart className="h-3.5 w-3.5" />
          {sc.another.kicker}
        </div>
        <h3 className="mt-3 font-display text-xl sm:text-2xl font-semibold text-foreground leading-snug">
          {sc.another.title}
        </h3>
        <p className="mt-2 text-[15px] lg:text-base text-muted-foreground leading-relaxed max-w-prose">
          {sc.another.body}
        </p>
        <Button
          variant="premium"
          size="lg"
          onClick={() => navigate(ROUTES.couple)}
          className="mt-5 gap-2 w-full sm:w-auto"
        >
          <Heart className="h-4 w-4" />
          {sc.another.cta}
        </Button>
      </motion.div>
    </div>
  );
}
