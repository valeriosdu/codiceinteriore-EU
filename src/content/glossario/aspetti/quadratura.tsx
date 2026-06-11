import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const quadratura: GlossarioEntry = {
  slug: "quadratura",
  tipo: "aspetti",
  title: "La quadratura nel tema natale",
  metaTitle: "Quadratura astrologica: significato | Codice Interiore",
  metaDescription:
    "La quadratura nel tema natale: aspetto a 90° tra due pianeti, descrive attrito strutturale e spinta a costruire. Lettura psicologica oltre il cliché dell'aspetto 'difficile'.",
  heading: "La quadratura",
  shortDefinition:
    "La quadratura è l'aspetto che si forma quando due pianeti del tema natale si trovano a 90° fra loro. Descrive un attrito strutturale tra due funzioni: lavorano in conflitto, ma proprio per questo costringono a costruire qualcosa che senza attrito non sarebbe nato.",
  publishedAt: "2026-05-09",
  readingMinutes: 4,
  wordCount: 720,
  keywords: [
    "quadratura astrologia",
    "quadratura tema natale",
    "aspetti planetari",
    "aspetti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/aspetti/quadratura.webp",
    srcSmall: "/illustrations/glossario/aspetti/quadratura@small.webp",
    alt: "Diagramma astronomico della quadratura in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        La quadratura si forma quando due pianeti del tema natale si
        trovano a 90° fra loro. Cadono di solito in segni dello stesso
        modo zodiacale (cardinali, fissi o mobili) ma di elementi
        diversi, quindi condividono una "qualità del moto" senza
        condividere la natura. Il risultato è un attrito strutturale:
        le due funzioni lavorano in conflitto, e questo conflitto è
        spesso il motore di crescita della persona.
      </p>
      <p>
        Una quadratura <Link to="/glossario/pianeti/sole" className="text-primary hover:underline">Sole</Link>-<Link to="/glossario/pianeti/saturno" className="text-primary hover:underline">Saturno</Link>, per
        esempio, produce una tensione fra identità che vuole esprimersi
        e disciplina che chiede tempo. La persona si sente spesso
        sotto pressione interna, ma da quella pressione costruisce, nel
        tempo, una solidità che altri non hanno. Una quadratura
        <Link to="/glossario/pianeti/venere" className="text-primary hover:underline"> Venere</Link>-<Link to="/glossario/pianeti/marte" className="text-primary hover:underline">Marte</Link> produce
        difficoltà nel coordinare attrazione e spinta nelle relazioni:
        si vuole qualcuno ma si lotta con lui, o si lotta per qualcuno
        che poi non si riesce a tenere.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si legge
      </h2>
      <p>
        Per leggere una quadratura, si guardano i due pianeti, i segni
        coinvolti, e le case che attraversa. Le quadrature che
        coinvolgono Sole o Luna sono particolarmente vissute, perché
        toccano direttamente identità o sicurezza emotiva. Le
        quadrature che coinvolgono pianeti lenti tra loro (Saturno con
        i transpersonali) sono spesso generazionali, ma diventano
        personali quando si combinano con un pianeta veloce.
      </p>
      <p>
        Una caratteristica delle quadrature è la "ciclicità del
        problema": un tema legato a una quadratura non si risolve una
        volta sola, ritorna a fasi diverse della vita per essere
        affrontato in modo più adeguato ogni volta. È il motore della
        crescita per stratificazione, non per illuminazione singola.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sull'aspetto "difficile"
      </h2>
      <p>
        La quadratura viene descritta tradizionalmente come "aspetto
        difficile" o "aspetto karmico". Queste etichette tendono a
        produrre ansia preventiva e non aiutano la lettura. Nel tema
        natale psicologico la quadratura è semplicemente un'area di
        attrito che chiede lavoro. Le persone che hanno costruito vite
        significative hanno quasi sempre più quadrature nella loro
        carta: senza attrito mancano spinta e materiale di trasformazione.
        Il problema non sono le quadrature in sé, è non riconoscerle
        come zone di costruzione e trattarle come maledizioni.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere le tue quadrature dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "aspetti", slug: "opposizione" },
    { kind: "glossario", tipo: "aspetti", slug: "semiquadratura" },
    { kind: "guide", slug: "tema-natale-blocco-emotivo" },
  ],
};

export default quadratura;
