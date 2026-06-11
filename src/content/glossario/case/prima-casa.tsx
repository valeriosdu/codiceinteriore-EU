import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const primaCasa: GlossarioEntry = {
  slug: "prima-casa",
  tipo: "case",
  title: "La prima casa nel tema natale",
  metaTitle: "Prima casa nel tema natale: significato | Codice Interiore",
  metaDescription:
    "La prima casa nel tema natale: l'ambito dell'identità presentata, del primo contatto, del proprio corpo nello spazio. Lettura psicologica.",
  heading: "La prima casa nel tema natale",
  shortDefinition:
    "La prima casa, nel tema natale, descrive l'ambito dell'identità presentata: come una persona arriva nel mondo, come occupa lo spazio fisico, come viene letta nei primi minuti di contatto.",
  publishedAt: "2026-05-04",
  readingMinutes: 4,
  wordCount: 760,
  keywords: [
    "prima casa tema natale",
    "ascendente",
    "prima casa significato",
    "case astrologiche",
  ],
  coverImage: {
    src: "/illustrations/glossario/case/prima-casa.webp",
    srcSmall: "/illustrations/glossario/case/prima-casa@small.webp",
    alt: "Incisione della prima casa astrologica in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta come ambito
      </h2>
      <p>
        La prima casa descrive il modo in cui una persona arriva nel
        mondo. Come occupa lo spazio fisico, come viene letta nei primi
        minuti di contatto, come si presenta prima ancora di parlare.
        Inizia all'<Link to="/glossario/punti/ascendente" className="text-primary hover:underline">Ascendente</Link>, il punto che sorgeva all'orizzonte est nel
        momento esatto della nascita, e da lì conta le altre undici case.
        Non è "chi sei davvero", e non è "il tuo carattere": è più
        precisamente il portale d'ingresso. Quello che gli altri
        registrano per primo, e che spesso la persona stessa scopre
        soltanto guardandosi da fuori.
      </p>
      <p>
        Nel tema natale lo stile della prima casa dipende dal segno
        zodiacale sul quale cade l'Ascendente. Una prima casa
        in <Link to="/glossario/segni/ariete" className="text-primary hover:underline">Ariete</Link> produce un ingresso diretto, frontale, fisicamente
        presente. Una prima casa in Toro produce un ingresso più calmo,
        attaccato al corpo e alla qualità degli oggetti. Una prima casa
        in <Link to="/glossario/segni/gemelli" className="text-primary hover:underline">Gemelli</Link> produce un ingresso verbale, curioso, leggero. Lo
        stesso vale per gli altri segni.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una premessa: l'Ascendente non è una maschera
      </h2>
      <p>
        Capita di leggere descrizioni dell'Ascendente come "la maschera
        sociale", come se fosse qualcosa di posticcio sopra l'identità
        vera. Questa lettura non aiuta. L'Ascendente non è una
        maschera: è una soglia. Tutto quello che esce da una persona
        deve passare di lì per arrivare nel mondo, e questo lo
        condiziona. È il filtro attraverso cui Sole, Luna e tutti gli
        altri pianeti vengono comunicati. Non è meno reale del resto:
        è il punto di contatto.
      </p>
      <p>
        Per questo, in una lettura psicologica del tema natale, la prima
        casa va letta come "il proprio modo di iniziare relazioni e
        situazioni". Tutto quello che la persona avvia nella vita
        passa per la qualità di questo punto. Capire il proprio
        Ascendente significa capire perché certi contesti la
        accolgono facilmente e altri la fraintendono fin dall'inizio.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si manifesta con pianeti in prima casa
      </h2>
      <p>
        Quando un pianeta cade nella prima casa, la sua funzione diventa
        parte esplicita dell'auto-presentazione.
      </p>
      <p>
        <strong>Sole in prima casa</strong>: l'identità è il tema
        esplicito della vita. La persona si manifesta in modo molto
        riconoscibile, prende spazio senza grandi mediazioni.
      </p>
      <p>
        <strong>Luna in prima casa</strong>: le emozioni sono visibili
        nel volto, nel tono, nella postura. La persona viene letta come
        "trasparente affettivamente" anche quando non lo vorrebbe.
      </p>
      <p>
        <strong>Mercurio in prima casa</strong>: la prima impressione è
        di vivacità mentale e linguaggio rapido. Spesso queste persone
        parlano molto nei primi incontri.
      </p>
      <p>
        <strong>
          <Link to="/glossario/pianeti/marte" className="text-primary hover:underline">Marte</Link> in prima casa
        </strong>
        : l'energia attiva è parte visibile del modo di presentarsi.
        La persona arriva con un certo grado di presenza fisica anche
        prima di muoversi.
      </p>
      <p>
        <strong>Saturno in prima casa</strong>: la prima impressione è
        di serietà, contenimento, presenza più matura dell'età
        anagrafica. Da giovani queste persone sembrano più grandi del
        loro tempo, da adulte tendono a portare bene l'età.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sul "primo segno apparente"
      </h2>
      <p>
        Una confusione frequente è trattare il "segno della prima casa"
        (cioè l'Ascendente) come se fosse il proprio vero segno
        zodiacale. Non lo è. Il segno solare resta quello che descrive
        l'identità consapevole, ed è quello che la maggior parte delle
        persone identifica quando dice "sono Ariete, sono Toro". La
        prima casa descrive un'altra cosa: come una persona viene
        percepita per prima, prima ancora di poter mostrare il proprio
        Sole. Persone con lo stesso Sole ma Ascendenti diversi possono
        sembrare profondamente diverse al primo incontro, e questa
        differenza non è una contraddizione: è la geografia normale di
        una carta natale.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere la tua prima casa dentro la geografia completa della
        tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>. In pochi minuti generiamo la lettura iniziale sulla tua data, ora e luogo di nascita.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "segni", slug: "ariete" },
    { kind: "glossario", tipo: "pianeti", slug: "marte" },
    { kind: "glossario", tipo: "punti", slug: "ascendente" },
    { kind: "glossario", tipo: "case", slug: "settima-casa" },
    { kind: "guide", slug: "cos-e-il-tema-natale" },
  ],
};

export default primaCasa;
