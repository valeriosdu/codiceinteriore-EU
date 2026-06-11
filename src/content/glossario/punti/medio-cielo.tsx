import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const medioCielo: GlossarioEntry = {
  slug: "medio-cielo",
  tipo: "punti",
  title: "Il Medio Cielo nel tema natale",
  metaTitle: "Medio Cielo (MC) nel tema natale: significato | Codice Interiore",
  metaDescription:
    "Il Medio Cielo (MC) nel tema natale: il punto culminante della carta, descrive ruolo pubblico, carriera, riconoscimento sociale.",
  heading: "Il Medio Cielo nel tema natale",
  shortDefinition:
    "Il Medio Cielo, indicato spesso con la sigla MC, è il punto più alto della carta natale: dove il Sole si trovava a mezzogiorno rispetto al luogo di nascita. Descrive il ruolo pubblico, la carriera, il modo in cui una persona viene riconosciuta nello spazio sociale.",
  publishedAt: "2026-05-07",
  readingMinutes: 3,
  wordCount: 590,
  keywords: [
    "medio cielo tema natale",
    "mc astrologia",
    "carriera astrologia",
    "punti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/punti/medio-cielo.webp",
    srcSmall: "/illustrations/glossario/punti/medio-cielo@small.webp",
    alt: "Incisione del Medio Cielo in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Il Medio Cielo (MC) è il punto culminante della carta natale.
        Astronomicamente è il luogo del cielo in cui il Sole si trovava
        a mezzogiorno nel luogo di nascita. Marca l'inizio della
        <Link to="/glossario/case/decima-casa" className="text-primary hover:underline"> decima casa</Link> e
        descrive il ruolo pubblico di una persona: la carriera che sceglie,
        come viene riconosciuta socialmente, quale "indirizzo
        professionale" la rappresenta nel mondo.
      </p>
      <p>
        Il segno sul MC dà la qualità di questo ruolo. Un MC in
        Capricorno produce una carriera strutturata, di lunga durata.
        Un MC in Pesci porta vocazioni legate alla cura, all'arte,
        all'immaginario. Un MC in Acquario produce ruoli pubblici legati
        a innovazione, comunità, idee.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Differenza dal Sole
      </h2>
      <p>
        Il MC non è il proprio Sole. Il <Link to="/glossario/pianeti/sole" className="text-primary hover:underline">Sole</Link> descrive
        l'identità consapevole, chi si cerca di diventare. Il MC descrive
        come questa identità si traduce nel ruolo sociale. Possono
        coincidere (quando una persona "diventa il proprio lavoro") ma
        spesso no. Capita di avere un Sole introverso e un MC molto
        pubblico, o viceversa.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere il tuo Medio Cielo dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "case", slug: "decima-casa" },
    { kind: "glossario", tipo: "punti", slug: "fondo-cielo" },
    { kind: "guide", slug: "tema-natale-blocco-emotivo" },
  ],
};

export default medioCielo;
