import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const discendente: GlossarioEntry = {
  slug: "discendente",
  tipo: "punti",
  title: "Il Discendente nel tema natale",
  metaTitle: "Discendente nel tema natale: significato | Codice Interiore",
  metaDescription:
    "Il Discendente nel tema natale: il punto opposto all'Ascendente, descrive il tipo di altro che si attrae. Lettura psicologica della casa delle relazioni.",
  heading: "Il Discendente nel tema natale",
  shortDefinition:
    "Il Discendente è il punto opposto all'Ascendente, dove l'eclittica intercetta l'orizzonte ovest. Marca l'inizio della settima casa e descrive il tipo di altro che una persona riconosce come complementare a sé.",
  publishedAt: "2026-05-06",
  readingMinutes: 3,
  wordCount: 620,
  keywords: [
    "discendente tema natale",
    "discendente astrologia",
    "settima casa",
    "punti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/punti/discendente.webp",
    srcSmall: "/illustrations/glossario/punti/discendente@small.webp",
    alt: "Incisione del Discendente in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Il Discendente è esattamente opposto all'<Link to="/glossario/punti/ascendente" className="text-primary hover:underline">Ascendente</Link>: cade
        a 180° di distanza, sull'orizzonte ovest. Marca l'inizio della
        <Link to="/glossario/case/settima-casa" className="text-primary hover:underline"> settima casa</Link> e descrive
        il tipo di altro che una persona riconosce come complementare:
        chi viene scelto come partner, chi viene riconosciuto come
        interlocutore significativo, in che tipo di relazione paritaria
        ci si sente "completati".
      </p>
      <p>
        Una caratteristica importante del Discendente è la proiezione.
        Spesso una persona riconosce nel proprio Discendente qualità
        che sta cercando di sviluppare ma che ancora non vive come
        proprie. Vede questa qualità nell'altro, viene attratta, e nel
        tempo (a volte attraverso il conflitto) impara a riconoscere
        che quella qualità le appartiene anche.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si legge
      </h2>
      <p>
        Il segno sul Discendente descrive il "tipo" cercato nelle
        relazioni intime. Un Discendente in Bilancia attrae partner
        gentili, mediatori, di gusto raffinato. Un Discendente in
        Capricorno attrae partner più seri, più strutturati, spesso
        con responsabilità importanti. Un Discendente in Pesci attrae
        partner sensibili, artistici, a volte sfuggenti.
      </p>
      <p>
        Asse Ascendente-Discendente è uno degli assi fondamentali della
        carta: descrive come una persona si presenta da sola
        (Ascendente) e come cerca completamento attraverso l'altro
        (Discendente). I due poli sono in dialogo costante.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere il tuo Discendente dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "case", slug: "settima-casa" },
    { kind: "glossario", tipo: "punti", slug: "ascendente" },
    { kind: "guide", slug: "tema-natale-relazioni" },
  ],
};

export default discendente;
