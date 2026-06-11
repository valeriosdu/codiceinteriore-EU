import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const trigono: GlossarioEntry = {
  slug: "trigono",
  tipo: "aspetti",
  title: "Il trigono nel tema natale",
  metaTitle: "Trigono astrologico: significato | Codice Interiore",
  metaDescription:
    "Il trigono nel tema natale: aspetto a 120° tra due pianeti dello stesso elemento. Descrive scorrevolezza, talento naturale, dialogo facile. Lettura psicologica.",
  heading: "Il trigono",
  shortDefinition:
    "Il trigono è l'aspetto che si forma quando due pianeti del tema natale si trovano a 120° fra loro, di solito in segni dello stesso elemento. Descrive un dialogo facile fra due funzioni: quello che fa l'una sostiene quello che fa l'altra senza attrito.",
  publishedAt: "2026-05-08",
  readingMinutes: 4,
  wordCount: 690,
  keywords: [
    "trigono astrologia",
    "trigono tema natale",
    "aspetti planetari",
    "aspetti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/aspetti/trigono.webp",
    srcSmall: "/illustrations/glossario/aspetti/trigono@small.webp",
    alt: "Diagramma astronomico del trigono in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Il trigono si forma quando due pianeti del tema natale si
        trovano a 120° fra loro. Quasi sempre i due pianeti cadono in
        segni dello stesso elemento (fuoco, terra, aria, acqua),
        condividendo quindi una grammatica comune. È l'aspetto più
        "fluido": le due funzioni dialogano senza attrito, quello che
        fa l'una sostiene naturalmente quello che fa l'altra.
      </p>
      <p>
        Un trigono <Link to="/glossario/pianeti/sole" className="text-primary hover:underline">Sole</Link>-<Link to="/glossario/pianeti/luna" className="text-primary hover:underline">Luna</Link>, per esempio,
        produce di solito una persona in cui identità consapevole e
        bisogno emotivo sono allineati: quello che cerca di diventare
        non entra in contrasto con quello che le serve per stare bene.
        Un trigono <Link to="/glossario/pianeti/mercurio" className="text-primary hover:underline">Mercurio</Link>-<Link to="/glossario/pianeti/giove" className="text-primary hover:underline">Giove</Link> produce
        comunicazione fluida, capacità di tradurre l'ampio nel
        quotidiano e viceversa.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si legge
      </h2>
      <p>
        Per leggere un trigono, si guardano i due pianeti coinvolti e
        l'elemento condiviso. L'elemento dà il tono del dialogo: un
        trigono di terra produce talenti pratici e fluidità nel
        materiale; un trigono d'acqua produce sensibilità emotiva
        sostenuta e capacità di empatia; un trigono di fuoco produce
        energia espressiva continua; un trigono d'aria produce dialogo
        intellettuale costante.
      </p>
      <p>
        I trigoni hanno una caratteristica controversa: possono produrre
        talenti che la persona stessa non riconosce come tali, perché
        funzionano senza fatica. Una persona con un trigono importante
        spesso non vede quello che le viene facile come "merito",
        perché non ha sudato per averlo. Da qui un'altra possibile
        difficoltà: la sottostima dei propri talenti naturali, che
        può portare a non investire dove invece sarebbe naturale crescere.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sul "talento gratis"
      </h2>
      <p>
        Il trigono viene spesso descritto come aspetto "fortunato".
        È una descrizione parziale. Il trigono descrive una
        scorrevolezza, ma scorrevolezza non significa risultato
        automatico. Senza attrito, una funzione può anche atrofizzarsi
        per mancanza di stimolo. Le persone che valorizzano davvero i
        propri trigoni sono di solito quelle che hanno anche
        opposizioni e quadrature: la tensione altrove dà spinta, il
        trigono dà direzione. Una carta con molti trigoni e nessuna
        tensione produce spesso un'esistenza piacevole ma poco mossa.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere i tuoi trigoni dentro la geografia completa della
        tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "aspetti", slug: "sestile" },
    { kind: "glossario", tipo: "aspetti", slug: "quadratura" },
    { kind: "guide", slug: "come-leggere-tema-natale" },
  ],
};

export default trigono;
