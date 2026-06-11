import { Link } from "react-router-dom";
import type { GuideEntry } from "../types";

const comeLeggereTemaNatale: GuideEntry = {
  slug: "come-leggere-tema-natale",
  title: "Come leggere un tema natale",
  metaTitle: "Come leggere un tema natale: guida passo passo | Codice Interiore",
  metaDescription:
    "Guida pratica alla lettura di un tema natale: da dove partire, quali elementi guardare prima, come passare dal calcolo all'interpretazione coerente.",
  heading: "Come leggere un tema natale",
  publishedAt: "2026-04-27",
  readingMinutes: 7,
  wordCount: 1450,
  keywords: [
    "come leggere tema natale",
    "interpretazione tema natale",
    "carta natale",
    "astrologia psicologica",
  ],
  coverImage: {
    src: "/illustrations/guide/come-leggere-tema-natale.webp",
    srcSmall: "/illustrations/guide/come-leggere-tema-natale@small.webp",
    alt: "Guida alla lettura del tema natale, illustrazione editoriale vintage",
    width: 1600,
    height: 900,
  },
  intro: (
    <p>
      Leggere un tema natale non significa interpretare ogni dettaglio
      uno per uno. Significa imparare a vedere la carta come un
      sistema, in cui pochi elementi importanti pesano più di tanti
      dettagli minori. Questa guida descrive l'ordine in cui conviene
      guardare le cose, dalle più centrali alle più periferiche.
    </p>
  ),
  body: (
    <>
      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Primo livello: Sole, Luna, Ascendente
      </h2>
      <p>
        Una prima lettura del tema natale parte sempre da tre punti:
        <Link to="/glossario/pianeti/sole" className="text-primary hover:underline"> Sole</Link>, <Link to="/glossario/pianeti/luna" className="text-primary hover:underline">Luna</Link>, <Link to="/glossario/punti/ascendente" className="text-primary hover:underline">Ascendente</Link>. Questi tre
        elementi descrivono rispettivamente l'identità consapevole, il
        bisogno emotivo di base, e il modo di presentarsi nel mondo.
        Sono il triangolo che dà la struttura iniziale a tutto il
        resto.
      </p>
      <p>
        Per ognuno bisogna guardare due cose: il segno in cui si
        trova (lo stile) e la casa in cui cade (l'ambito di vita).
        Sole in Cancro descrive un'identità che si costruisce
        attraverso cura e memoria affettiva; Sole in Cancro in
        decima casa colloca questa identità nello spazio pubblico
        (la persona spesso fa professioni di cura). Sole in Cancro in
        dodicesima casa colloca la stessa identità nello spazio
        privato (cura come pratica intima, spesso poco visibile).
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Secondo livello: Mercurio, Venere, Marte
      </h2>
      <p>
        Una volta inquadrato il triangolo di base, si aggiungono i tre
        pianeti personali della vita quotidiana: <Link to="/glossario/pianeti/mercurio" className="text-primary hover:underline">Mercurio</Link> (come pensi
        e comunichi), <Link to="/glossario/pianeti/venere" className="text-primary hover:underline">Venere</Link> (cosa attrae e come ti leghi), <Link to="/glossario/pianeti/marte" className="text-primary hover:underline">Marte</Link> (come spingi
        e reagisci). Questi tre, insieme a Sole-Luna-Ascendente,
        descrivono il "ritratto operativo" della persona: identità,
        bisogno emotivo, soglia di ingresso, stile cognitivo, stile
        relazionale, stile di azione.
      </p>
      <p>
        Mercurio è quasi sempre vicino al Sole (per convenzione
        astronomica non si allontana mai più di 28°), quindi spesso
        nello stesso segno o nei due adiacenti. Venere e Marte
        possono cadere ovunque. Per ognuno: segno + casa.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Terzo livello: gli aspetti
      </h2>
      <p>
        Una volta che si conoscono le posizioni dei sei pianeti
        personali, si guardano gli <Link to="/glossario/aspetti/congiunzione" className="text-primary hover:underline">aspetti</Link> fra loro: angoli
        specifici che descrivono come le funzioni dialogano. I più
        importanti sono congiunzione (0°), opposizione (180°), trigono
        (120°), quadratura (90°), sestile (60°).
      </p>
      <p>
        Gli aspetti raccontano la dinamica interna della carta. Una
        carta con molte <Link to="/glossario/aspetti/quadratura" className="text-primary hover:underline">quadrature</Link> descrive una persona spinta da
        tensioni interne, e di solito molto attiva nel costruire.
        Una carta con molti <Link to="/glossario/aspetti/trigono" className="text-primary hover:underline">trigoni</Link> descrive una persona più
        scorrevole, ma a volte meno mossa a cambiare. Una carta con
        equilibrio fra le due tipologie produce di solito profili
        più completi.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Quarto livello: pianeti sociali e transpersonali
      </h2>
      <p>
        Solo dopo aver inquadrato i sei pianeti personali si guardano
        Giove, Saturno, Urano, Nettuno, Plutone. Questi sono lenti
        (specialmente i tre transpersonali, che si muovono di un
        segno ogni 7-20 anni), quindi il loro segno è in gran parte
        generazionale. Quello che individualizza i loro effetti è la
        casa in cui cadono e gli aspetti che fanno con i pianeti
        personali.
      </p>
      <p>
        Per esempio: tutti i nati 1983-1995 hanno Plutone in
        Scorpione (tema generazionale: trasformazione, intensità,
        ridefinizione del tabù). Ma chi ha Plutone in Scorpione
        congiunto al proprio Sole vive questo tema come parte
        esplicita dell'identità personale, mentre chi ha Plutone in
        Scorpione senza aspetti significativi ai pianeti personali lo
        vive in modo più sottile, sullo sfondo.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Errori comuni nella lettura
      </h2>
      <p>
        Quando una persona prova a leggere il proprio tema natale da
        sola, di solito incappa in alcuni errori ricorrenti:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Frammentazione</strong>: leggere ogni pianeta in
          segno separatamente, senza sintetizzare. Risultato: venti
          paragrafi disconnessi che non si parlano fra loro.
        </li>
        <li>
          <strong>Sovrappeso al segno solare</strong>: dare al Sole
          un'importanza schiacciante, ignorando che Luna e Ascendente
          contano almeno altrettanto.
        </li>
        <li>
          <strong>Cercare conferme</strong>: cercare nella carta
          conferma di quello che si pensa già di sé, ignorando le
          informazioni che non rientrano in quella narrazione.
        </li>
        <li>
          <strong>Drammatizzare gli aspetti tesi</strong>: leggere
          quadrature e opposizioni come maledizioni, invece che come
          aree di lavoro.
        </li>
      </ul>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Quando conviene farsi leggere il tema da qualcuno
      </h2>
      <p>
        Si può imparare molto da soli, ma una buona lettura
        professionale ha un valore specifico: porta uno sguardo
        esterno che vede pattern che la persona stessa è abituata a
        non vedere. È particolarmente utile la prima volta, per
        avere un'introduzione coerente. Le letture successive (anni
        dopo, in fasi diverse della vita) hanno valore diverso:
        servono a leggere transiti e progressioni, cioè come la carta
        di nascita risuona con il momento presente.
      </p>
      <p>
        Per provare una lettura iniziale del tuo tema natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>: a partire dai tuoi dati di nascita generiamo
        una sintesi descrittiva della tua carta.
      </p>
    </>
  ),
  related: [
    { kind: "guide", slug: "cos-e-il-tema-natale" },
    { kind: "guide", slug: "tema-natale-vs-oroscopo" },
    { kind: "glossario", tipo: "pianeti", slug: "sole" },
    { kind: "glossario", tipo: "pianeti", slug: "luna" },
    { kind: "glossario", tipo: "punti", slug: "ascendente" },
  ],
};

export default comeLeggereTemaNatale;
