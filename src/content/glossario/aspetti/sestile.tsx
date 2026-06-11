import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const sestile: GlossarioEntry = {
  slug: "sestile",
  tipo: "aspetti",
  title: "Il sestile nel tema natale",
  metaTitle: "Sestile astrologico: significato | Codice Interiore",
  metaDescription:
    "Il sestile nel tema natale: aspetto a 60° tra due pianeti, descrive cooperazione attiva fra funzioni di elementi compatibili. Lettura psicologica.",
  heading: "Il sestile",
  shortDefinition:
    "Il sestile è l'aspetto che si forma quando due pianeti del tema natale si trovano a 60° fra loro, di solito in segni di elementi compatibili (fuoco-aria o terra-acqua). Descrive una cooperazione attiva: le due funzioni si potenziano a vicenda, ma con un piccolo sforzo iniziale.",
  publishedAt: "2026-05-09",
  readingMinutes: 3,
  wordCount: 600,
  keywords: [
    "sestile astrologia",
    "sestile tema natale",
    "aspetti planetari",
    "aspetti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/aspetti/sestile.webp",
    srcSmall: "/illustrations/glossario/aspetti/sestile@small.webp",
    alt: "Diagramma astronomico del sestile in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Il sestile si forma quando due pianeti del tema natale si
        trovano a 60° fra loro. Cadono in segni di elementi compatibili
        (fuoco con aria, terra con acqua), che pur essendo diversi si
        sostengono naturalmente. È un aspetto cooperativo, simile al <Link to="/glossario/aspetti/trigono" className="text-primary hover:underline">trigono</Link>
        ma con una caratteristica importante: il sestile richiede un
        piccolo gesto attivo per esprimersi.
      </p>
      <p>
        Mentre il trigono opera anche senza che la persona se ne
        accorga, il sestile diventa visibile solo quando la persona
        decide di esercitarlo. Per questo il sestile è considerato
        spesso più educativo del trigono: produce talenti che la
        persona si guadagna mettendoli in pratica, non talenti
        ereditati.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si legge
      </h2>
      <p>
        Un sestile <Link to="/glossario/pianeti/mercurio" className="text-primary hover:underline">Mercurio</Link>-<Link to="/glossario/pianeti/venere" className="text-primary hover:underline">Venere</Link>, per
        esempio, sostiene la capacità di esprimere in parole il proprio
        gusto, di scrivere in modo gradevole, di costruire relazioni
        attraverso conversazione armoniosa. Ma queste capacità non
        emergono se la persona non le esercita: deve scrivere, deve
        parlare con cura, deve mettersi in conversazione. Senza
        esercizio, restano dormienti.
      </p>
      <p>
        Per questo, in una lettura psicologica del tema natale, i
        sestili vanno letti come "occasioni che richiedono iniziativa".
        Sono pronti, ma non automatici.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere i tuoi sestili dentro la geografia completa della
        tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "aspetti", slug: "trigono" },
    { kind: "glossario", tipo: "aspetti", slug: "semisestile" },
    { kind: "guide", slug: "come-leggere-tema-natale" },
  ],
};

export default sestile;
