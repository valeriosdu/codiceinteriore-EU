import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import { Ornament } from '@/components/coppia/Ornament';
import { useI18n } from '@/i18n/I18nProvider';

export default function CoppiaLanding() {
  const { m, market } = useI18n();
  const cl = m.coppia.landing;
  useEffect(() => {
    document.title = m.coppia.titles.landing(market.siteName);
  }, [m, market.siteName]);

  return (
    <div className="min-h-screen bg-background paper-grain">
      <Header />
      <main
        className="relative max-w-3xl mx-auto px-5 md:px-8 pt-10 md:pt-14 pb-24"
        style={{ touchAction: 'manipulation' }}
      >
        <section className="text-center pt-4 md:pt-6 mb-10 md:mb-14">
          <h1
            className="font-editorial text-foreground leading-[1] mb-5"
            style={{
              fontWeight: 500,
              fontSize: 'clamp(2.5rem, 7vw, 4rem)',
              textWrap: 'balance',
            }}
          >
            {cl.heroLine1}
            <br />
            <span className="text-primary">{cl.heroLine2}</span>
          </h1>
          <p className="text-foreground/80 max-w-xl mx-auto text-lg md:text-xl leading-relaxed mb-8">
            {cl.heroSubtitle}
          </p>
          <Link
            to="/coppia/quiz"
            className="inline-flex items-center justify-center gap-3 group h-14 px-10 bg-primary text-primary-foreground font-editorial font-bold hover:bg-primary/90 transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{
              fontSize: '1.25rem',
              letterSpacing: '0.02em',
              borderRadius: '2px',
              boxShadow:
                '0 1px 0 rgba(141,74,53,0.4), 0 12px 24px -10px rgba(141,74,53,0.35)',
            }}
          >
            {cl.cta}
            <span
              className="inline-block text-base transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
          <p
            className="mt-4 text-xs uppercase text-muted-foreground leading-tight text-center"
            style={{ letterSpacing: '0.18em' }}
          >
            {cl.socialProofLine1}
            <br />
            {cl.socialProofLine2}
          </p>
        </section>

        <Ornament variant="rhombus" />

        <section className="my-10 md:my-14">
          <div className="text-center mb-8">
            <p
              className="text-sm uppercase text-muted-foreground mb-3"
              style={{ letterSpacing: '0.32em' }}
            >
              {cl.discoverKicker}
            </p>
            <h2
              className="font-editorial italic text-foreground leading-[1.05]"
              style={{
                fontWeight: 400,
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                textWrap: 'balance',
              }}
            >
              {cl.discoverTitleLine1}
              <br />
              {cl.discoverTitleLine2}
            </h2>
          </div>

          <div className="grid md:grid-cols-3">
            {cl.discoverItems
              .map((item, i) => ({ num: ['I', 'II', 'III'][i], ...item }))
              .map((item, i) => (
              <div
                key={item.num}
                className={`px-5 md:px-6 py-6 md:py-8 border-b border-primary/15 ${i < 2 ? 'md:border-r' : ''}`}
              >
                <span
                  className="font-editorial italic text-primary/50 leading-none block mb-2"
                  style={{ fontWeight: 500, fontSize: '2.5rem' }}
                >
                  {item.num}
                </span>
                <h3
                  className="font-editorial italic text-foreground text-[22px] leading-tight mb-2"
                  style={{ fontWeight: 500 }}
                >
                  {item.title}
                </h3>
                <p className="text-foreground/80 text-[17px] leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="my-10 md:my-14 max-w-lg mx-auto">
          <p
            className="text-sm uppercase text-muted-foreground text-center mb-6"
            style={{ letterSpacing: '0.32em' }}
          >
            {cl.howKicker}
          </p>
          <div className="space-y-5">
            {cl.howSteps.map((text, i) => ({ step: String(i + 1), text })).map((s) => (
              <div key={s.step} className="flex gap-5 items-start">
                <span
                  className="font-editorial italic text-primary/50 leading-none shrink-0"
                  style={{ fontWeight: 500, fontSize: '2rem' }}
                >
                  {s.step}.
                </span>
                <p className="text-foreground/80 text-[17px] leading-relaxed pt-1">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center mt-12">
          <Ornament variant="circle" />
          <Link
            to="/coppia/quiz"
            className="inline-flex items-center justify-center gap-3 group h-14 px-10 bg-primary text-primary-foreground font-editorial font-bold hover:bg-primary/90 transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{
              fontSize: '1.25rem',
              letterSpacing: '0.02em',
              borderRadius: '2px',
              boxShadow:
                '0 1px 0 rgba(141,74,53,0.4), 0 12px 24px -10px rgba(141,74,53,0.35)',
            }}
          >
            {cl.cta}
            <span
              className="inline-block text-base transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
