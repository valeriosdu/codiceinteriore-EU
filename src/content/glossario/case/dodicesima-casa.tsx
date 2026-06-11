import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const dodicesimaCasa: GlossarioEntry = {
  slug: "dodicesima-casa",
  tipo: "case",
  title: "La dodicesima casa nel tema natale",
  metaTitle: "Dodicesima casa nel tema natale: significato | Codice Interiore",
  metaDescription:
    "La dodicesima casa nel tema natale: l'ambito dell'invisibile, dell'inconscio, del ritiro. Lettura psicologica oltre il cliché 'casa karmica'.",
  heading: "La dodicesima casa nel tema natale",
  shortDefinition:
    "La dodicesima casa, nel tema natale, descrive l'ambito dell'invisibile, di quello che lavora sotto coscienza, dei luoghi di ritiro, della vita interiore non condivisa.",
  publishedAt: "2026-05-07",
  readingMinutes: 4,
  wordCount: 750,
  keywords: [
    "dodicesima casa tema natale",
    "case astrologiche",
    "dodicesima casa significato",
    "inconscio astrologia",
  ],
  coverImage: {
    src: "/illustrations/glossario/case/dodicesima-casa.webp",
    srcSmall: "/illustrations/glossario/case/dodicesima-casa@small.webp",
    alt: "Incisione della dodicesima casa astrologica in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta come ambito
      </h2>
      <p>
        La dodicesima casa descrive l'ambito di quello che lavora sotto
        coscienza. Vita interiore non condivisa, sogni, immaginazione,
        spiritualità, ritiro, ma anche zone meno luminose: ansie
        ereditate, pattern inconsci, autosabotaggio, contesti chiusi
        (ospedali, monasteri, prigioni, situazioni di confinamento).
        È la zona dell'invisibile rispetto al sociale ordinario.
      </p>
      <p>
        Nel tema natale lo stile della dodicesima dipende dal segno
        zodiacale sul quale cade. Una dodicesima in <Link to="/glossario/segni/pesci" className="text-primary hover:underline">Pesci</Link> produce un
        rapporto naturale con la dimensione interiore. Una dodicesima
        in Ariete produce conflitto con l'invisibile: la persona
        preferisce l'azione frontale e fatica con quello che non si
        può maneggiare direttamente. Una dodicesima in Scorpione porta
        un accesso intenso all'inconscio, capacità di lavoro interiore
        profondo.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una premessa: non è "la casa karmica"
      </h2>
      <p>
        Capita di leggere la dodicesima come "la casa del karma" o
        come zona di sfortuna obbligatoria. Queste letture sono
        sensazionalistiche. La dodicesima descrive una zona reale e
        importante: quella in cui una persona elabora quello che non
        viene detto in pubblico. Una dodicesima ben integrata produce
        capacità contemplativa, vita interiore ricca, abilità di
        ritirarsi quando serve. Una dodicesima non integrata produce
        ansie sotterranee, sensazione di "qualcosa che non quadra"
        senza saperlo nominare, fatica nei contesti molto luminosi.
        Non è destino: è uno stile di rapporto con il proprio fondo.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si manifesta con pianeti in dodicesima casa
      </h2>
      <p>
        <strong>
          <Link to="/glossario/pianeti/nettuno" className="text-primary hover:underline">Nettuno</Link> in dodicesima casa
        </strong>
        : è la posizione "a casa". Vita immaginativa ricca,
        spiritualità accessibile, attrazione per arti e cura. Confini
        sottili, possibile rapporto con dipendenze o con stati misti.
      </p>
      <p>
        <strong>Sole in dodicesima casa</strong>: l'identità si forma
        più in privato che in pubblico. Spesso lavori dietro le quinte,
        contemplativi, di ricerca. La persona si fa conoscere
        attraverso quello che produce, non attraverso esposizione
        diretta.
      </p>
      <p>
        <strong>Luna in dodicesima casa</strong>: sensibilità emotiva
        molto alta, registrazione dell'atmosfera ambientale fino al
        limite. Bisogno regolare di ritiro per smaltire l'eccesso di
        ricezione.
      </p>
      <p>
        <strong>Mercurio in dodicesima casa</strong>: pensiero
        introspettivo, capacità di lavorare con materiale inconscio.
        Spesso scrittori, terapeuti, ricercatori in zone sensibili.
      </p>
      <p>
        <strong>Saturno in dodicesima casa</strong>: peso interiore
        portato in privato. Spesso responsabilità verso temi nascosti
        (familiari malati, situazioni che si occultano). Possibili
        figure d'autorità "assenti" o invisibili.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sul "nemico nascosto"
      </h2>
      <p>
        La tradizione astrologica antica chiama la dodicesima "casa dei
        nemici nascosti", ed è un'etichetta paranoica che il tema
        natale psicologico non usa. Il vero "nemico nascosto" della
        dodicesima è di solito interno: pattern inconsci, paure non
        riconosciute, autosabotaggio. Riconoscere questi meccanismi non
        elimina il fatto che agiscono, ma riduce molto il loro potere
        di farlo all'oscuro. Una persona che ha lavorato bene sulla
        propria dodicesima usa la zona come spazio di ritiro
        produttivo, non come luogo di paura.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere la tua dodicesima casa dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "segni", slug: "pesci" },
    { kind: "glossario", tipo: "pianeti", slug: "nettuno" },
    { kind: "glossario", tipo: "case", slug: "sesta-casa" },
    { kind: "guide", slug: "tema-natale-psicologico" },
  ],
};

export default dodicesimaCasa;
