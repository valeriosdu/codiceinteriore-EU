
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useSynastry,
  markSynastryFunnelStage,
  clearSynastryStorage,
  toCompleteBirthDate,
} from '@/context/SynastryContext';
import { useMetaConversions } from '@/hooks/useMetaConversions';
import Header from '@/components/Header';
import { ArchetypeBadge } from '@/components/coppia/ArchetypeBadge';
import { ScoreOverallRing } from '@/components/coppia/ScoreOverallRing';
import { CoppiaOfferCard } from '@/components/coppia/CoppiaOfferCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import CheckoutReview, { type PurchaseType } from '@/components/CheckoutReview';
import { useI18n } from '@/i18n/I18nProvider';
import type { Messages } from '@/i18n';
import { ROUTES } from '@/lib/routes';



function clampScore(v: any): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function compressScore(raw: number): number {
  return Math.round(30 + (raw / 100) * 67);
}

function mapScoresIt(raw: any) {
  if (!raw) return null;
  return {
    sintonia_emotiva: clampScore(raw.intimacy ?? raw.emotional ?? raw.romance ?? 0),
    attrazione: clampScore(raw.romance ?? 0),
    comunicazione: clampScore(raw.communication ?? 0),
    stabilita: clampScore(raw.stability ?? 0),
    crescita: clampScore(raw.growth ?? 0),
    tensione: clampScore(raw.tension ?? 0),
  };
}

function computeDisplayOverall(scoreOverall: number | null): number {
  const raw = scoreOverall ?? 50;
  return compressScore(Math.max(0, Math.min(100, Math.round(raw))));
}

type ScoreTier = 'high' | 'medium' | 'low';

function getDomainTier(score: number, isInverse = false): ScoreTier {
  if (isInverse) {
    if (score >= 70) return 'high';
    if (score >= 45) return 'medium';
    return 'low';
  }
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

type FramingCopy = Messages['coppia']['teaser']['framing']['high'];

function getOverallFraming(score: number, framing: Messages['coppia']['teaser']['framing']): FramingCopy {
  if (score >= 65) return framing.high;
  if (score >= 40) return framing.medium;
  return framing.low;
}

type ScoreKey = keyof NonNullable<ReturnType<typeof mapScoresIt>>;

// Domini in ordine di visualizzazione; label e hint vivono nel catalogo.
const SCORE_DOMAIN_KEYS: Array<{ key: ScoreKey; isInverse?: boolean }> = [
  { key: 'sintonia_emotiva' },
  { key: 'attrazione' },
  { key: 'comunicazione' },
  { key: 'stabilita' },
  { key: 'crescita' },
  { key: 'tensione', isInverse: true },
];

const DEV_PREVIEW_DATA = import.meta.env.DEV ? {
  sessionId: 'preview-mock',
  archetype: 'opposites_attract' as const,
  archetypeLabel: 'Opposti che si attraggono',
  scoreOverall: 62,
  scores: {
    intimacy: 71, romance: 58, communication: 45,
    stability: 67, growth: 74, tension: 53,
  },
  teaserHighlight: {
    title: 'Dove il fuoco incontra la terra',
    body: 'La vostra carta racconta una storia di polarità che si cercano. Venere in Scorpione di Giulia parla a Marte in Toro di Marco con un linguaggio antico: quello del desiderio che non si accontenta della superficie. È una chimica che non si spiega con le parole, ma si riconosce nei silenzi. La Luna di lui, in Cancro, trova nella Venere di lei una casa che non sapeva di cercare. Non è armonia facile: è attrazione che chiede coraggio.',
  },
  personA: { name: 'Giulia', birthDate: { day: 14, month: 3, year: 1992 }, birthPlace: 'Roma', birthTime: { hour: 10, minute: 30 }, timeKnown: true },
  personB: { name: 'Marco', birthDate: { day: 7, month: 11, year: 1989 }, birthPlace: 'Milano', birthTime: { hour: 22, minute: 15 }, timeKnown: true },
  pricingTier: 'launch' as const,
} : null;

export default function CoppiaTeaser() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: ctxData, resetForNewPurchase } = useSynastry();
  const { m, market } = useI18n();
  const ct = m.coppia.teaser;
  const [reviewOpen, setReviewOpen] = useState(false);
  const { trackViewContent, trackAddToCart, trackInitiateCheckout } = useMetaConversions();

  const isDevPreview = import.meta.env.DEV && searchParams.get('preview') === 'true';
  const data = isDevPreview
    ? { ...ctxData, ...DEV_PREVIEW_DATA! }
    : ctxData;

  useEffect(() => {
    document.title = m.coppia.titles.teaser(market.siteName);
    if (!isDevPreview && !data.sessionId || !isDevPreview && !data.archetype) {
      navigate(ROUTES.coupleQuiz, { replace: true });
    }
  }, [data.sessionId, data.archetype, navigate, isDevPreview]);

  useEffect(() => {
    if (!data.sessionId) return;
    trackViewContent({
      firstName: data.personA.name || undefined,
      sessionId: data.sessionId,
      purchaseType: 'synastry_launch',
      birthDate: toCompleteBirthDate(data.personA.birthDate),
    });
  }, [data.sessionId, data.personA.name, data.personA.birthDate, trackViewContent]);

  // AddToCart dopo 10s sul teaser: segnala interesse reale, non un rimbalzo
  // (stessa convenzione del funnel natale).
  useEffect(() => {
    if (!data.sessionId) return;
    const timer = setTimeout(() => {
      trackAddToCart({
        firstName: data.personA.name || undefined,
        sessionId: data.sessionId,
        purchaseType: 'synastry_launch',
        birthDate: toCompleteBirthDate(data.personA.birthDate),
      });
    }, 10_000);
    return () => clearTimeout(timer);
  }, [data.sessionId, data.personA.name, data.personA.birthDate, trackAddToCart]);

  if (!isDevPreview && (!data.sessionId || !data.archetype)) return null;

  const scoresIt = mapScoresIt(data.scores);
  const displayOverall = computeDisplayOverall(data.scoreOverall);
  const framing = getOverallFraming(displayOverall, ct.framing);

  const reviewPurchaseType: PurchaseType = 'synastry_launch';

  const handleOpenCheckout = () => {
    markSynastryFunnelStage('offer');
    trackInitiateCheckout({
      firstName: data.personA.name || undefined,
      sessionId: data.sessionId || undefined,
      purchaseType: reviewPurchaseType,
      birthDate: toCompleteBirthDate(data.personA.birthDate),
    });
    setReviewOpen(true);
  };

  const handleEditData = () => {
    clearSynastryStorage();
    resetForNewPurchase();
    navigate(ROUTES.coupleQuiz);
  };

  return (
    <div className="min-h-screen bg-background paper-grain">
      <Header />
      <main className="relative max-w-4xl mx-auto px-5 md:px-8 pt-6 md:pt-10 pb-24" style={{ touchAction: 'manipulation' }}>
        {/* ── HERO: asimmetria editoriale ──
            Sinistra (testo, 60% peso visivo): names enormi italici.
            Destra (40%): score ring + archetipo. */}
        <section className="grid md:grid-cols-[1.4fr_1fr] gap-10 md:gap-14 items-center mb-12">
          <div>
            <p
              className="text-sm uppercase text-muted-foreground mb-4 text-center md:text-left"
              style={{ letterSpacing: '0.42em' }}
            >
              {ct.kicker}
            </p>
            <h1
              className="font-editorial italic text-foreground leading-[0.92] mb-4 text-center md:text-left text-pretty whitespace-nowrap"
              style={{
                fontWeight: 400,
                fontSize: 'clamp(2.25rem, 6vw, 5.25rem)',
              }}
            >
              {data.personA.name || ct.personA}
              <span className="inline-block px-2 md:px-3 text-primary/70 not-italic font-normal">
                &amp;
              </span>
              {data.personB.name || ct.personB}
            </h1>
            {(data.personA.birthDate?.day || data.personB.birthDate?.day) && (
              <div className="flex flex-col gap-1 mb-5 text-center md:text-left">
                {[data.personA, data.personB].map((p, i) => {
                  if (!p.birthDate?.day) return null;
                  const d = `${p.birthDate.day}/${p.birthDate.month}/${p.birthDate.year}`;
                  const t = p.birthTime?.hour != null ? ` · ${String(p.birthTime.hour).padStart(2, '0')}:${String(p.birthTime.minute ?? 0).padStart(2, '0')}` : '';
                  const place = p.birthPlace ? ` · ${p.birthPlace}` : '';
                  return (
                    <p key={i} className="text-[15px] text-muted-foreground">
                      <span className="font-medium text-foreground/70">{p.name}</span>{' '}
                      {d}{t}{place}
                    </p>
                  );
                })}
                <button
                  type="button"
                  onClick={handleEditData}
                  className="py-1 text-[15px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                >
                  {ct.wrongData}
                </button>
              </div>
            )}
            <p className="text-foreground/80 max-w-md leading-relaxed text-lg md:text-xl text-center md:text-left mx-auto md:mx-0">
              {displayOverall >= 75
                ? ct.overallHigh
                : displayOverall >= 55
                  ? ct.overallMedium
                  : ct.overallLow}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 md:items-end">
            {data.scores != null && (
              <>
                <ScoreOverallRing
                  score={displayOverall}
                  size={160}
                  label=""
                />
                <ArchetypeBadge archetypeId={data.archetype} variant="hero" />
              </>
            )}
          </div>
        </section>

        {/* ── CTA PRIMARIA ── */}
        <section className="mb-14 md:mb-20 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => document.getElementById('offerta')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center justify-center gap-3 h-14 px-9 bg-primary text-primary-foreground font-editorial font-bold transition-colors duration-300 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              style={{
                fontSize: '1.25rem',
                letterSpacing: '0.02em',
                borderRadius: '2px',
                boxShadow: '0 1px 0 rgba(141,74,53,0.4), 0 12px 24px -10px rgba(141,74,53,0.35)',
              }}
            >
              {ct.primaryCta}
              <span aria-hidden className="text-base transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
            <p className="text-[15px] text-foreground/80 inline-flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              {ct.securePayment}
            </p>
          </div>
        </section>

        {/* ── SCORES ── */}
        {scoresIt && (
          <section className="my-10 md:my-14">
            <div className="grid grid-cols-2 md:grid-cols-3">
              {SCORE_DOMAIN_KEYS.map((d) => {
                const v = scoresIt[d.key];
                const pct = Math.max(2, v);
                const domainCopy = ct.domains[d.key];
                return (
                  <div
                    key={d.key}
                    className="relative px-3 md:px-5 py-3 md:py-4 border-b border-primary/15 border-r border-r-primary/15 [&:nth-child(2n)]:border-r-0 md:[&:nth-child(2n)]:border-r md:[&:nth-child(2n)]:border-r-primary/15 md:[&:nth-child(3n)]:border-r-0"
                  >
                    <p
                      className="text-sm uppercase text-muted-foreground mb-1"
                      style={{ letterSpacing: '0.32em' }}
                    >
                      {domainCopy.label}
                    </p>
                    <div className="mb-1">
                      <span
                        className="font-editorial text-primary leading-[0.85]"
                        style={{ fontWeight: 500, fontSize: 'clamp(2.25rem, 5vw, 3rem)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {v}
                      </span>
                    </div>
                    <div className="h-px w-full bg-primary/15 mb-1.5 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%`, height: '2px', marginTop: '-0.5px' }}
                      />
                    </div>
                    <p className="text-foreground/70 text-[15px] leading-tight">
                      {domainCopy[getDomainTier(v, d.isInverse)]}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── NARRATIVE EXCERPT ── */}
        {data.teaserHighlight && (
          <section className="my-14 md:my-20 max-w-2xl mx-auto">
            <h2
              className="font-editorial italic text-foreground text-center leading-[1.05] mb-7"
              style={{ fontWeight: 400, fontSize: 'clamp(2rem, 5vw, 3rem)' }}
            >
              {data.teaserHighlight.title}
            </h2>
            <p
              className="text-foreground leading-[1.65] editorial-dropcap"
              style={{ fontSize: '18px' }}
            >
              {data.teaserHighlight.body}
            </p>
            <p className="text-foreground/60 text-right mt-6 text-[15px]">
              {ct.excerptCaption}
            </p>
          </section>
        )}

        {/* ── OFFER ── */}
        <section id="offerta" className="my-12 scroll-mt-8">
          <CoppiaOfferCard
            onSelect={handleOpenCheckout}
            priceLabel={m.common.priceLabel(market.prices.synastryLaunch)}
            strikeThroughPrice={m.common.priceLabel(market.prices.synastry)}
            ctaLabel={ct.primaryCta}
            subtitleLine2={framing.offerSubtitle}
            bullets={[
              ...(framing.extraBullet ? [framing.extraBullet] : []),
              ...ct.offerBullets,
            ]}
          />
        </section>

        {/* ── FAQ ── */}
        <section className="my-14 md:my-20 max-w-2xl mx-auto">
          <h3
            className="font-editorial text-foreground text-center leading-[1.05] mb-8"
            style={{ fontWeight: 500, fontSize: 'clamp(1.5rem, 3.5vw, 2rem)' }}
          >
            {ct.faqTitle}
          </h3>
          <Accordion type="single" collapsible className="space-y-3">
            {ct.faqItems.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-primary/15 rounded-lg px-5"
              >
                <AccordionTrigger className="text-left text-base font-medium text-foreground/90 py-4 hover:no-underline gap-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] text-foreground/80 leading-[1.7] pb-5 pr-8">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

      </main>

      <CheckoutReview
        open={reviewOpen}
        purchaseType={reviewPurchaseType}
        sessionId={data.sessionId || ''}
        synastrySessionId={data.sessionId || ''}
        firstName={data.personA.name || undefined}
        birthDate={toCompleteBirthDate(data.personA.birthDate)}
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
}
