import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const semiquadratura: GlossarioEntry = {
  slug: "semiquadratura",
  tipo: "aspetti",
  title: "La semiquadratura nel tema natale",
  metaTitle: "Semiquadratura astrologica: significato | Codice Interiore",
  metaDescription:
    "La semiquadratura nel tema natale: aspetto a 45° tra due pianeti. Descrive frizione lieve ma persistente. Lettura psicologica.",
  heading: "La semiquadratura",
  shortDefinition:
    "La semiquadratura è un aspetto minore che si forma quando due pianeti del tema natale si trovano a 45° fra loro. Descrive una frizione lieve ma persistente, simile a una quadratura in versione ridotta.",
  publishedAt: "2026-05-10",
  readingMinutes: 3,
  wordCount: 540,
  keywords: [
    "semiquadratura astrologia",
    "semiquadratura tema natale",
    "aspetti minori",
    "aspetti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/aspetti/semiquadratura.webp",
    srcSmall: "/illustrations/glossario/aspetti/semiquadratura@small.webp",
    alt: "Diagramma astronomico della semiquadratura in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        La semiquadratura si forma quando due pianeti del tema natale
        si trovano a 45° fra loro. È un aspetto minore di natura
        simile alla <Link to="/glossario/aspetti/quadratura" className="text-primary hover:underline">quadratura</Link> ma di intensità ridotta:
        produce attrito, ma di superficie. Si manifesta spesso come
        irritazione cronica, fastidio costante, frizione che non
        diventa mai conflitto aperto.
      </p>
      <p>
        Le semiquadrature non producono crisi visibili. Producono
        situazioni in cui qualcosa "non torna" senza che la persona
        sappia bene perché. Per esempio una semiquadratura fra Sole e
        Marte può manifestarsi come una sensazione di impazienza
        cronica con sé stessi, senza un trigger preciso. Diventa
        visibile solo se la persona impara a notare il pattern.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si legge
      </h2>
      <p>
        La semiquadratura viene spesso ignorata nelle letture brevi
        perché il suo effetto è sottile. In una lettura approfondita
        merita attenzione quando coinvolge pianeti personali o quando
        si ripete in più punti della carta (per esempio Sole-Marte e
        Venere-Saturno entrambi a 45°).
      </p>
      <p>
        È utile riconoscerla quando si lavora su irritazioni che non si
        riescono a localizzare: spesso il riferimento non è un evento
        esterno, è una frizione strutturale fra due funzioni della
        propria carta che hanno bisogno di un aggiustamento minimo.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere le tue semiquadrature dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "aspetti", slug: "quadratura" },
    { kind: "glossario", tipo: "aspetti", slug: "quinconce" },
    { kind: "guide", slug: "tema-natale-blocco-emotivo" },
  ],
};

export default semiquadratura;
