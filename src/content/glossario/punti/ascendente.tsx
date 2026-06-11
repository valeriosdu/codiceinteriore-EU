import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const ascendente: GlossarioEntry = {
  slug: "ascendente",
  tipo: "punti",
  title: "L'Ascendente nel tema natale",
  metaTitle: "Ascendente nel tema natale: significato | Codice Interiore",
  metaDescription:
    "L'Ascendente nel tema natale: il punto che sorgeva all'orizzonte est al momento della nascita. Lettura psicologica del proprio modo di presentarsi.",
  heading: "L'Ascendente nel tema natale",
  shortDefinition:
    "L'Ascendente è il punto che sorgeva all'orizzonte est nel momento esatto della nascita. Descrive il proprio modo di apparire nel mondo: la soglia attraverso cui passa tutto quello che esce dalla persona prima di arrivare agli altri.",
  publishedAt: "2026-05-06",
  readingMinutes: 4,
  wordCount: 700,
  keywords: [
    "ascendente tema natale",
    "ascendente astrologia",
    "ascendente significato",
    "punti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/punti/ascendente.webp",
    srcSmall: "/illustrations/glossario/punti/ascendente@small.webp",
    alt: "Incisione dell'Ascendente in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        L'Ascendente è il punto in cui l'eclittica intercetta l'orizzonte
        est nel momento esatto della nascita. Marca l'inizio della
        <Link to="/glossario/case/prima-casa" className="text-primary hover:underline"> prima casa</Link> e
        descrive il modo in cui una persona arriva nel mondo: come viene
        percepita per prima, come occupa lo spazio fisico, come gli altri
        la inquadrano prima ancora di parlarle.
      </p>
      <p>
        L'Ascendente cambia segno ogni due ore circa, quindi è la
        coordinata più sensibile all'ora di nascita esatta. Persone
        nate nello stesso giorno ma a ore diverse hanno Ascendenti
        molto diversi, e questa è una delle ragioni per cui due
        gemelli astrologici (stesso giorno, stesso luogo, ore diverse)
        possono sembrare profondamente diversi.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Differenza dal Sole
      </h2>
      <p>
        L'<Link to="/glossario/pianeti/sole" className="text-primary hover:underline">Ascendente non è il proprio Sole</Link>. Quando si dice "io
        sono Ariete" si sta parlando del segno solare, l'identità
        consapevole. L'Ascendente è una cosa diversa: descrive come ci
        si presenta, non chi si cerca di diventare. Una persona con Sole
        in Cancro e Ascendente in Leone "appare" molto più sicura e
        scenica di quanto si senta dentro: la porta è leonina, l'abitante
        è del Cancro.
      </p>
      <p>
        Per questo nelle prime impressioni l'Ascendente conta più del
        Sole. Solo dopo aver conosciuto qualcuno per tempo si comincia
        a vedere il suo Sole, perché bisogna superare la soglia
        dell'Ascendente per arrivare lì.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sull'importanza dell'ora di nascita
      </h2>
      <p>
        Senza un'ora di nascita esatta, l'Ascendente non si può
        calcolare. Un errore di anche un'ora può spostare l'Ascendente
        di mezzo segno o più, e questo cambia gran parte
        dell'interpretazione. Per una lettura accurata del tema natale,
        cercare di recuperare l'ora di nascita esatta (atto di nascita
        in comune, ospedale, registri) è un passo importante. Senza,
        la lettura resta valida per Sole, Luna, pianeti, ma perde
        Ascendente, Discendente, MC, IC e tutta la struttura delle
        case.
      </p>
      <p>
        Quando l'ora di nascita è completamente sconosciuta, è onesto
        farlo presente. Alcuni astrologi praticano la "rettificazione"
        (cercare di dedurre l'ora dai dati biografici), ma è una
        tecnica imprecisa e non andrebbe presentata come certezza.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere il tuo Ascendente dentro la geografia completa della
        tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "case", slug: "prima-casa" },
    { kind: "glossario", tipo: "punti", slug: "discendente" },
    { kind: "guide", slug: "cos-e-il-tema-natale" },
  ],
};

export default ascendente;
