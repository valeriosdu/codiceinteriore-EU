import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const fondoCielo: GlossarioEntry = {
  slug: "fondo-cielo",
  tipo: "punti",
  title: "Il Fondo Cielo nel tema natale",
  metaTitle: "Fondo Cielo (IC) nel tema natale: significato | Codice Interiore",
  metaDescription:
    "Il Fondo Cielo (IC) nel tema natale: il punto più basso della carta, descrive radici, famiglia d'origine, vita privata.",
  heading: "Il Fondo Cielo nel tema natale",
  shortDefinition:
    "Il Fondo Cielo, indicato spesso con la sigla IC, è il punto più basso della carta natale: dove il Sole si trovava a mezzanotte rispetto al luogo di nascita. Descrive le radici, la famiglia d'origine, la vita privata.",
  publishedAt: "2026-05-07",
  readingMinutes: 3,
  wordCount: 540,
  keywords: [
    "fondo cielo tema natale",
    "ic astrologia",
    "radici astrologia",
    "punti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/punti/fondo-cielo.webp",
    srcSmall: "/illustrations/glossario/punti/fondo-cielo@small.webp",
    alt: "Incisione del Fondo Cielo in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Il Fondo Cielo (IC, da "Imum Coeli" in latino) è il punto più
        basso della carta natale. È esattamente opposto al
        <Link to="/glossario/punti/medio-cielo" className="text-primary hover:underline"> Medio Cielo</Link> e
        marca l'inizio della <Link to="/glossario/case/quarta-casa" className="text-primary hover:underline">quarta casa</Link>. Descrive le radici di
        una persona: famiglia d'origine, casa fisica e psicologica,
        ambito intimo a cui torna quando si ritira dal mondo.
      </p>
      <p>
        Il segno sull'IC dà la qualità di questa zona profonda. Un IC
        in Cancro produce un radicamento attaccato a memoria
        familiare. Un IC in Capricorno produce una casa d'origine
        formale, ordinata, spesso autoritaria. Un IC in Pesci porta
        un'atmosfera onirica o confusa nei temi familiari.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Asse MC-IC
      </h2>
      <p>
        L'asse MC-IC è uno dei due assi fondamentali della carta
        (l'altro è Ascendente-Discendente). Descrive il rapporto fra
        ruolo pubblico (alto) e vita privata (basso). Un buon
        equilibrio su questo asse produce una persona che riesce a
        stare nel mondo senza perdere base intima, e che ha intimità
        sufficiente per sostenere la propria esposizione pubblica.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere il tuo Fondo Cielo dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "case", slug: "quarta-casa" },
    { kind: "glossario", tipo: "punti", slug: "medio-cielo" },
    { kind: "guide", slug: "tema-natale-relazioni" },
  ],
};

export default fondoCielo;
