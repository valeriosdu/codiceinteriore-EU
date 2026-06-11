import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const quinconce: GlossarioEntry = {
  slug: "quinconce",
  tipo: "aspetti",
  title: "Il quinconce nel tema natale",
  metaTitle: "Quinconce astrologico: significato | Codice Interiore",
  metaDescription:
    "Il quinconce nel tema natale: aspetto a 150° tra due pianeti senza terreno comune. Descrive attrito sottile e aggiustamento continuo. Lettura psicologica.",
  heading: "Il quinconce",
  shortDefinition:
    "Il quinconce è un aspetto minore che si forma quando due pianeti del tema natale si trovano a 150° fra loro. I segni coinvolti non condividono né elemento né modo: descrivono un'incompatibilità di base che chiede aggiustamento continuo, senza mai produrre una soluzione definitiva.",
  publishedAt: "2026-05-10",
  readingMinutes: 3,
  wordCount: 620,
  keywords: [
    "quinconce astrologia",
    "quinconce tema natale",
    "aspetti minori",
    "aspetti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/aspetti/quinconce.webp",
    srcSmall: "/illustrations/glossario/aspetti/quinconce@small.webp",
    alt: "Diagramma astronomico del quinconce in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Il quinconce si forma quando due pianeti del tema natale si
        trovano a 150° fra loro. È un aspetto particolare: i due segni
        coinvolti non condividono né elemento né modo zodiacale. Non
        hanno terreno comune. Il risultato è un'incompatibilità
        strutturale che non si risolve come una <Link to="/glossario/aspetti/quadratura" className="text-primary hover:underline">quadratura</Link>
        (che produce attrito chiaro), ma resta in sospensione: una
        tensione sottile e continua, che chiede aggiustamento per
        tutta la vita.
      </p>
      <p>
        Una persona con un quinconce significativo nella carta si trova
        spesso a "non riuscire a far stare insieme" due aspetti di sé.
        Per esempio un quinconce <Link to="/glossario/pianeti/sole" className="text-primary hover:underline">Sole</Link>-Luna produce una
        sensazione cronica di disallineamento fra chi si vuole essere e
        di cosa si ha bisogno, senza che il conflitto produca
        un'esplosione visibile.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si legge
      </h2>
      <p>
        Il quinconce viene spesso letto come "aspetto di
        aggiustamento": la persona non risolve il conflitto, lo
        gestisce. Ogni volta che la situazione si ripresenta, si trova
        un nuovo compromesso, mai definitivo. Per questo le persone
        con quinconci importanti sviluppano nel tempo capacità di
        adattamento sottile, abitudine a navigare paradossi che altri
        eviterebbero.
      </p>
      <p>
        Il quinconce è anche associato spesso a temi di salute, perché
        la mancanza di comunicazione fra due funzioni del corpo o della
        psiche tende a manifestarsi come sintomo somatico cronico.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere i tuoi quinconci dentro la geografia completa della
        tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "aspetti", slug: "semisestile" },
    { kind: "glossario", tipo: "aspetti", slug: "quadratura" },
    { kind: "guide", slug: "tema-natale-blocco-emotivo" },
  ],
};

export default quinconce;
