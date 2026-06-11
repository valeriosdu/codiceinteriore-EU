import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const ottavaCasa: GlossarioEntry = {
  slug: "ottava-casa",
  tipo: "case",
  title: "L'ottava casa nel tema natale",
  metaTitle: "Ottava casa nel tema natale: significato | Codice Interiore",
  metaDescription:
    "L'ottava casa nel tema natale: l'ambito dell'intimità profonda, delle risorse condivise, della trasformazione. Lettura psicologica oltre il cliché 'casa della morte'.",
  heading: "L'ottava casa nel tema natale",
  shortDefinition:
    "L'ottava casa, nel tema natale, descrive l'ambito dell'intimità profonda e delle risorse condivise: dove una persona si gioca quello che non si gioca in pubblico, dove attraversa trasformazioni significative, dove entrano in scena tabù.",
  publishedAt: "2026-05-05",
  readingMinutes: 4,
  wordCount: 770,
  keywords: [
    "ottava casa tema natale",
    "ottava casa significato",
    "case astrologiche",
    "trasformazione astrologia",
  ],
  coverImage: {
    src: "/illustrations/glossario/case/ottava-casa.webp",
    srcSmall: "/illustrations/glossario/case/ottava-casa@small.webp",
    alt: "Incisione dell'ottava casa astrologica in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta come ambito
      </h2>
      <p>
        L'ottava casa descrive l'ambito dell'intimità profonda. Dove una
        persona si gioca quello che non si gioca in pubblico: la
        sessualità seria, il denaro condiviso, l'eredità (in senso
        materiale e psicologico), le trasformazioni radicali della
        vita. È una casa carica perché contiene esperienze che
        richiedono fiducia totale o producono cambiamenti
        irreversibili. La tradizione la chiama anche "casa della
        morte", ma in senso psicologico la morte qui è simbolica: la
        fine di una versione di sé, di una relazione, di un periodo.
      </p>
      <p>
        Nel tema natale lo stile dell'ottava casa dipende dal segno
        zodiacale sul quale cade. Una ottava in <Link to="/glossario/segni/scorpione" className="text-primary hover:underline">Scorpione</Link> produce
        un orientamento esplicito all'intimità totale e alla
        trasformazione cosciente. Una ottava in <Link to="/glossario/segni/bilancia" className="text-primary hover:underline">Bilancia</Link> produce
        un'intimità mediata, dove anche le esperienze più profonde
        passano attraverso la conversazione e l'estetica. Una ottava in
        Capricorno produce un rapporto serio e contenuto con il tabù.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una premessa: non è "la casa nera"
      </h2>
      <p>
        Capita di leggere l'ottava casa con un tono drammatico, come se
        fosse l'ambito "oscuro" della carta. Questa lettura è
        sensazionalistica. L'ottava descrive esperienze impegnative,
        sì, ma anche centrali nella vita adulta: una relazione di
        coppia profonda, un'eredità ricevuta, una crisi di mezza età
        attraversata e superata. Non è morbosa, è semplicemente la
        zona in cui le cose contano davvero e non si possono trattare
        in superficie.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si manifesta con pianeti in ottava casa
      </h2>
      <p>
        <strong>
          <Link to="/glossario/pianeti/plutone" className="text-primary hover:underline">Plutone</Link> in ottava casa
        </strong>
        : è la posizione "a casa". I temi della trasformazione profonda,
        del potere nelle relazioni intime, dell'incontro con il tabù
        sono il terreno di lavoro principale della vita.
      </p>
      <p>
        <strong>Sole in ottava casa</strong>: l'identità si forma
        attraverso esperienze trasformative significative. La persona
        cresce nelle profondità, non nella superficie, e attraversa nel
        tempo uno o più cicli di rifondazione.
      </p>
      <p>
        <strong>Venere in ottava casa</strong>: relazioni intense,
        spesso totalizzanti, capaci di andare in profondità. Si fatica
        nelle storie leggere. Il sesso e l'intimità affettiva sono
        molto legati.
      </p>
      <p>
        <strong>Saturno in ottava casa</strong>: peso e durata nei
        legami profondi. Spesso c'è un tema serio legato a eredità,
        responsabilità economiche condivise, o lavoro lungo per
        integrare un evento di perdita.
      </p>
      <p>
        <strong>Marte in ottava casa</strong>: energia attiva nei temi
        intimi. Conflitti possibili intorno a denaro condiviso,
        sessualità, gestione di crisi. Capacità di affrontare situazioni
        che altri evitano.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sull'asse seconda-ottava
      </h2>
      <p>
        L'ottava è opposta alla <Link to="/glossario/case/seconda-casa" className="text-primary hover:underline">seconda casa</Link>, e l'asse descrive il
        rapporto tra "quello che è mio" (seconda) e "quello che
        condivido davvero" (ottava). Passare dall'una all'altra è un
        movimento di vita adulta: dal proprio personale al
        condividere risorse, intimità, eredità con qualcuno. Quando
        l'asse non è in equilibrio, da una parte si fatica a
        condividere il proprio possesso, dall'altra si fatica a
        proteggere il proprio dopo aver condiviso troppo.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere la tua ottava casa dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "segni", slug: "scorpione" },
    { kind: "glossario", tipo: "pianeti", slug: "plutone" },
    { kind: "glossario", tipo: "case", slug: "seconda-casa" },
    { kind: "guide", slug: "tema-natale-blocco-emotivo" },
  ],
};

export default ottavaCasa;
