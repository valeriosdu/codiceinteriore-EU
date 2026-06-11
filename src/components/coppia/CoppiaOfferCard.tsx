// Offer in stile "scheda libro" editoriale italiano.
// Niente card box bouncy: una composizione tipografica con la pagina come 14
// grande italico al margine, prezzo in stile colophon, CTA confident ma sobrio.

interface CoppiaOfferCardProps {
  priceLabel?: string;
  /** Prezzo barrato (listino se sconto attivo) */
  strikeThroughPrice?: string;
  /** Etichetta "Offerta di lancio" sopra il blocco */
  badge?: string;
  bullets?: string[];
  onSelect: () => void;
  loading?: boolean;
  ctaLabel?: string;
  /** Seconda riga dell'h3 ("sulla vostra relazione" di default) */
  subtitleLine2?: string;
}

const DEFAULT_BULLETS = [
  'Otto sezioni: ritratto, chimica, comunicazione, mondo emotivo, sfide, stabilità, pattern karmico, direzione',
  'PDF da scaricare, accesso permanente',
  'Circa 10 pagine in italiano chiaro',
];

export function CoppiaOfferCard({
  priceLabel = '19,00 €',
  strikeThroughPrice,
  badge,
  bullets = DEFAULT_BULLETS,
  onSelect,
  loading,
  ctaLabel = 'Ottieni la sinastria completa',
  subtitleLine2 = 'sulla vostra relazione',
}: CoppiaOfferCardProps) {
  return (
    <article className="relative border-t border-b border-primary/30 py-10 md:py-14">
      {/* "14" gigante a sfondo, sul lato sinistro, come numero del capitolo */}
      <span
        aria-hidden
        className="absolute top-4 left-0 md:-left-2 font-editorial italic select-none pointer-events-none"
        style={{
          fontSize: 'clamp(7rem, 18vw, 11rem)',
          color: 'rgba(141,74,53,0.07)',
          lineHeight: 1,
          fontWeight: 500,
        }}
      >
        XIV
      </span>

      {badge && (
        <div className="relative mb-6 inline-flex items-center gap-3 text-[11px] uppercase text-primary"
          style={{ letterSpacing: '0.42em' }}>
          <span aria-hidden className="inline-block h-px w-8 bg-primary/60" />
          {badge}
          <span aria-hidden className="inline-block h-px w-8 bg-primary/60" />
        </div>
      )}

      <div className="relative grid md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-start">
        <div>
          <p
            className="text-[11px] uppercase text-muted-foreground mb-3"
            style={{ letterSpacing: '0.42em' }}
          >
            La lettura completa
          </p>
          <h3 className="font-editorial text-foreground leading-[1]"
            style={{ fontWeight: 500, fontSize: 'clamp(2.25rem, 5.5vw, 3.5rem)' }}
          >
            Una lettura astrologica completa
            <br />
            <span className="text-primary">{subtitleLine2}</span>
          </h3>

          <ul className="mt-7 space-y-2.5">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[17px] leading-snug text-foreground/90"
              >
                <span
                  aria-hidden
                  className="mt-2 inline-block h-1 w-3 bg-primary/70 shrink-0"
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Colophon: prezzo + CTA, allineato a destra in stile scheda libro */}
        <div className="md:text-right">
          <div className="flex md:flex-col md:items-end items-baseline gap-3 md:gap-1 mb-5">
            {strikeThroughPrice && (
              <span className="font-editorial text-muted-foreground line-through"
                style={{ fontSize: '1.25rem' }}
              >
                {strikeThroughPrice}
              </span>
            )}
            <span className="font-editorial text-primary"
              style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 500, lineHeight: 1 }}
            >
              {priceLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onSelect}
            disabled={loading}
            className="group inline-flex items-center justify-center gap-3 h-14 px-9 bg-primary text-primary-foreground font-editorial font-bold transition-colors duration-300 hover:bg-primary/90 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{
              fontSize: '1.25rem',
              letterSpacing: '0.02em',
              borderRadius: '2px',
              boxShadow: '0 1px 0 rgba(141,74,53,0.4), 0 12px 24px -10px rgba(141,74,53,0.35)',
            }}
          >
            {loading ? (
              'Apertura checkout…'
            ) : (
              <>
                {ctaLabel}
                <span
                  aria-hidden
                  className="text-base transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </>
            )}
          </button>
          <p
            className="mt-4 text-xs text-muted-foreground md:text-right max-w-[18rem] md:ml-auto"
            style={{ letterSpacing: '0.04em' }}
          >
            Pagamento sicuro e protetto. Riceverai un'email per accedere alla lettura.
          </p>
        </div>
      </div>
    </article>
  );
}

export default CoppiaOfferCard;
