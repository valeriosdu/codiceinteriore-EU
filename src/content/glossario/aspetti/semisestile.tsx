import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const semisestile: GlossarioEntry = {
  slug: "semisestile",
  tipo: "aspetti",
  title: "Il semisestile nel tema natale",
  metaTitle: "Semisestile astrologico: significato | Codice Interiore",
  metaDescription:
    "Il semisestile nel tema natale: aspetto a 30° tra due pianeti, descrive cooperazione lieve tra segni consecutivi. Lettura psicologica.",
  heading: "Il semisestile",
  shortDefinition:
    "Il semisestile è un aspetto minore che si forma quando due pianeti del tema natale si trovano a 30° fra loro, in segni consecutivi. Descrive una cooperazione lieve, una funzione che fa da ponte tra una zona della carta e quella immediatamente adiacente.",
  publishedAt: "2026-05-09",
  readingMinutes: 3,
  wordCount: 530,
  keywords: [
    "semisestile astrologia",
    "semisestile tema natale",
    "aspetti minori",
    "aspetti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/aspetti/semisestile.webp",
    srcSmall: "/illustrations/glossario/aspetti/semisestile@small.webp",
    alt: "Diagramma astronomico del semisestile in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Il semisestile si forma quando due pianeti del tema natale si
        trovano a 30° fra loro, occupando segni consecutivi (per
        esempio uno in Ariete e uno in Toro). È un aspetto minore: il
        suo effetto è più lieve e meno strutturale rispetto a <Link to="/glossario/aspetti/sestile" className="text-primary hover:underline">sestile</Link>,
        <Link to="/glossario/aspetti/trigono" className="text-primary hover:underline"> trigono</Link> o <Link to="/glossario/aspetti/quadratura" className="text-primary hover:underline">quadratura</Link>, ma
        descrive comunque un'informazione reale: una funzione fa da
        ponte verso quella del segno seguente.
      </p>
      <p>
        I segni consecutivi hanno qualità diverse (un elemento diverso,
        un modo diverso), ma sono adiacenti nello zodiaco. Un
        semisestile chiede una traduzione: come passare dal linguaggio
        di uno al linguaggio dell'altro senza forzature. Per esempio
        un semisestile fra un pianeta in Pesci e uno in Ariete chiede
        di portare la sensibilità immaginativa fino al gesto diretto, e
        viceversa.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si legge
      </h2>
      <p>
        Il semisestile lavora di solito sullo sfondo. Non produce
        eventi visibili, non genera grandi conflitti, non spinge a
        crescere come una <Link to="/glossario/aspetti/quadratura" className="text-primary hover:underline">quadratura</Link>. Descrive piuttosto una
        ricucitura: una persona impara a tenere insieme due
        atteggiamenti che, lasciati a sé, lavorerebbero su lunghezze
        d'onda diverse.
      </p>
      <p>
        Per questo nelle letture brevi del tema natale si tende a
        ignorarlo. In una lettura approfondita invece può essere utile
        riconoscerlo, soprattutto quando coinvolge pianeti personali.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere i tuoi semisestili dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "aspetti", slug: "quinconce" },
    { kind: "glossario", tipo: "aspetti", slug: "sestile" },
    { kind: "guide", slug: "come-leggere-tema-natale" },
  ],
};

export default semisestile;
