import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const opposizione: GlossarioEntry = {
  slug: "opposizione",
  tipo: "aspetti",
  title: "L'opposizione nel tema natale",
  metaTitle: "Opposizione astrologica: significato | Codice Interiore",
  metaDescription:
    "L'opposizione nel tema natale: l'aspetto a 180° tra due pianeti, descrive tensione, polarità e ricerca di equilibrio. Lettura psicologica.",
  heading: "L'opposizione",
  shortDefinition:
    "L'opposizione è l'aspetto che si forma quando due pianeti del tema natale si trovano a 180° fra loro, su segni opposti. Descrive una tensione fra due funzioni che chiedono entrambe spazio, e che si manifestano spesso in modo proiettivo: una persona riconosce un polo come proprio e l'altro come dell'altro.",
  publishedAt: "2026-05-08",
  readingMinutes: 4,
  wordCount: 720,
  keywords: [
    "opposizione astrologia",
    "opposizione tema natale",
    "aspetti planetari",
    "aspetti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/aspetti/opposizione.webp",
    srcSmall: "/illustrations/glossario/aspetti/opposizione@small.webp",
    alt: "Diagramma astronomico dell'opposizione in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        L'opposizione si forma quando due pianeti del tema natale si
        trovano a 180° fra loro, su segni opposti. È un aspetto
        strutturale: chiede alla persona di tenere insieme due
        funzioni che hanno bisogni opposti. Non è "negativo" in senso
        morale: è semplicemente impegnativo. Ogni asse di opposizione
        è anche un asse di equilibrio: i due pianeti, una volta
        riconosciuti come complementari, possono lavorare insieme con
        più precisione di quanto farebbe ognuno da solo.
      </p>
      <p>
        Una caratteristica importante dell'opposizione è la proiezione.
        Per molti anni una persona può vivere uno dei due pianeti
        dell'opposizione come proprio e l'altro come "qualità degli
        altri". Tende ad attrarre nelle relazioni persone che incarnano
        il polo non riconosciuto, e poi a conflittualizzare con loro su
        quel piano. Riconoscere che il polo non riconosciuto è anche
        proprio è uno dei lavori principali di chi ha opposizioni
        importanti nella carta.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si legge
      </h2>
      <p>
        Per leggere un'opposizione, si guardano i due pianeti, i due
        segni opposti coinvolti, e l'asse di case che attraversano. Per
        esempio un'opposizione Sole-Luna (frequente in chi nasce
        all'alba o al tramonto) descrive una tensione strutturale fra
        identità consapevole e bisogno emotivo. Un'opposizione
        <Link to="/glossario/pianeti/marte" className="text-primary hover:underline"> Marte</Link>-<Link to="/glossario/pianeti/saturno" className="text-primary hover:underline">Saturno</Link> descrive
        una tensione fra spinta veloce e limite di realtà.
      </p>
      <p>
        Le opposizioni che cadono sull'asse 1ª-7ª casa hanno un peso
        particolare: portano il tema della tensione direttamente nelle
        relazioni intime. Quelle che cadono sull'asse 4ª-10ª lo
        portano sul rapporto privato-pubblico. Riconoscere su quale
        asse cade un'opposizione aiuta a capire dove si manifesta più
        visibilmente nella vita.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sulla "tensione necessaria"
      </h2>
      <p>
        L'opposizione viene spesso descritta come aspetto "difficile",
        ed è uno degli aspetti astrologici più temuti dagli appassionati
        principianti. Questa lettura è incompleta. La tensione di
        un'opposizione produce informazione, e una persona senza
        opposizioni significative tende a non sviluppare la sensibilità
        per gli equilibri. Le opposizioni costringono a non chiudere il
        proprio campo di lavoro su un solo polo, e da qui nasce la
        capacità di stare nel paradosso, di non semplificare
        prematuramente. Sono spesso fattori di maturità a lungo termine,
        non ostacoli da rimuovere.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere le tue opposizioni dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "aspetti", slug: "congiunzione" },
    { kind: "glossario", tipo: "aspetti", slug: "quadratura" },
    { kind: "guide", slug: "tema-natale-relazioni" },
  ],
};

export default opposizione;
