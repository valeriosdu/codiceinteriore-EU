import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const terzaCasa: GlossarioEntry = {
  slug: "terza-casa",
  tipo: "case",
  title: "La terza casa nel tema natale",
  metaTitle: "Terza casa nel tema natale: significato | Codice Interiore",
  metaDescription:
    "La terza casa nel tema natale: l'ambito della comunicazione, dei legami fraterni, degli apprendimenti precoci. Lettura psicologica delle relazioni quotidiane.",
  heading: "La terza casa nel tema natale",
  shortDefinition:
    "La terza casa, nel tema natale, descrive l'ambito della comunicazione quotidiana, dei fratelli, degli apprendimenti veloci, dei piccoli spostamenti, del vicinato.",
  publishedAt: "2026-05-06",
  readingMinutes: 4,
  wordCount: 720,
  keywords: [
    "terza casa tema natale",
    "comunicazione astrologia",
    "case astrologiche",
    "fratelli astrologia",
  ],
  coverImage: {
    src: "/illustrations/glossario/case/terza-casa.webp",
    srcSmall: "/illustrations/glossario/case/terza-casa@small.webp",
    alt: "Incisione della terza casa astrologica in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta come ambito
      </h2>
      <p>
        La terza casa descrive l'ambito della comunicazione quotidiana,
        dei legami fraterni, degli apprendimenti veloci, dei piccoli
        spostamenti, del vicinato. È la zona delle relazioni "di
        prossimità", quelle che non hanno il peso della famiglia
        d'origine (quarta) né l'intimità della coppia (settima): i
        fratelli, i compagni di scuola di una volta, i colleghi
        ordinari, le persone con cui si conversa ogni giorno senza
        avere un rapporto strutturato.
      </p>
      <p>
        Nel tema natale lo stile della terza dipende dal segno
        zodiacale sul quale cade. Una terza in <Link to="/glossario/segni/gemelli" className="text-primary hover:underline">Gemelli</Link> produce una
        comunicazione abbondante, curiosa, multipla. Una terza in
        Scorpione produce una comunicazione selettiva e profonda: poche
        parole, molto pesate.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una premessa: gli apprendimenti precoci contano
      </h2>
      <p>
        La terza casa è anche la zona degli apprendimenti scolastici di
        base: la scuola elementare e media, dove si forma il rapporto
        di base con l'apprendimento, con la lettura, con la gestione
        dell'informazione. Avere una terza casa difficile (per esempio
        Saturno o pianeti tesi qui) spesso significa aver vissuto
        infanzia scolastica complessa. Non è una condanna: è
        un'informazione su dove la propria relazione con la conoscenza
        ha avuto un primo attrito.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si manifesta con pianeti in terza casa
      </h2>
      <p>
        <strong>
          <Link to="/glossario/pianeti/mercurio" className="text-primary hover:underline">Mercurio</Link> in terza casa
        </strong>
        : è la posizione "a casa". Comunicazione abbondante, scrittura,
        lettura, conversazione costante. Spesso lavori legati al
        linguaggio.
      </p>
      <p>
        <strong>Sole in terza casa</strong>: l'identità si esprime
        attraverso la parola. Le persone con questa posizione si
        riconoscono nel proprio modo di comunicare, e fanno fatica nei
        contesti silenziosi.
      </p>
      <p>
        <strong>Marte in terza casa</strong>: comunicazione diretta,
        argomentativa, capace di scontro verbale. A volte conflitti
        con fratelli o vicini.
      </p>
      <p>
        <strong>Saturno in terza casa</strong>: difficoltà nella
        comunicazione (a volte balbuzie, blocchi espressivi), studio
        impegnato, rapporto serio con la parola. Da adulti queste
        persone diventano spesso comunicatori molto solidi, ma dopo
        lavoro lungo.
      </p>
      <p>
        <strong>Giove in terza casa</strong>: comunicazione espansiva,
        viaggi brevi frequenti, apprendimento facile. Molti contatti
        nella vita quotidiana.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sull'asse terza-nona
      </h2>
      <p>
        La terza è opposta alla <Link to="/glossario/case/nona-casa" className="text-primary hover:underline">nona casa</Link>. L'asse descrive il rapporto
        fra "conoscenza locale" (terza, fatti quotidiani, prossimità) e
        "conoscenza ampia" (nona, filosofia, viaggio lungo, studio
        superiore). Il movimento naturale è dal piccolo al grande, e
        molte persone iniziano nella terza per arrivare alla nona nel
        tempo. Un'asse ben integrata produce una mente che sa stare sia
        nel dettaglio quotidiano sia nella visione larga.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere la tua terza casa dentro la geografia completa della
        tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "segni", slug: "gemelli" },
    { kind: "glossario", tipo: "pianeti", slug: "mercurio" },
    { kind: "glossario", tipo: "case", slug: "nona-casa" },
    { kind: "guide", slug: "come-leggere-tema-natale" },
  ],
};

export default terzaCasa;
