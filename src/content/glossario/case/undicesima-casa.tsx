import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const undicesimaCasa: GlossarioEntry = {
  slug: "undicesima-casa",
  tipo: "case",
  title: "L'undicesima casa nel tema natale",
  metaTitle: "Undicesima casa nel tema natale: significato | Codice Interiore",
  metaDescription:
    "L'undicesima casa nel tema natale: l'ambito delle amicizie, dei gruppi, dei progetti collettivi. Lettura psicologica oltre il cliché 'casa dei desideri'.",
  heading: "L'undicesima casa nel tema natale",
  shortDefinition:
    "L'undicesima casa, nel tema natale, descrive l'ambito delle amicizie e dei progetti collettivi: dove una persona si lega a un gruppo, partecipa a una causa, costruisce reti orizzontali di pari.",
  publishedAt: "2026-05-06",
  readingMinutes: 4,
  wordCount: 730,
  keywords: [
    "undicesima casa tema natale",
    "amicizie astrologia",
    "case astrologiche",
    "gruppi astrologia",
  ],
  coverImage: {
    src: "/illustrations/glossario/case/undicesima-casa.webp",
    srcSmall: "/illustrations/glossario/case/undicesima-casa@small.webp",
    alt: "Incisione dell'undicesima casa astrologica in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta come ambito
      </h2>
      <p>
        L'undicesima casa descrive l'ambito delle amicizie e dei
        progetti collettivi. Dove una persona partecipa a un gruppo, si
        riconosce in una rete orizzontale di pari, contribuisce a una
        causa comune. Non è la coppia (settima), non è la famiglia
        d'origine (quarta): è la zona dei legami scelti, delle reti
        sociali volontarie, delle visioni di futuro condivise. È anche
        la casa "degli ideali", intesi come progetti che vanno oltre il
        proprio interesse immediato.
      </p>
      <p>
        Nel tema natale lo stile dell'undicesima dipende dal segno
        zodiacale sul quale cade. Una undicesima in <Link to="/glossario/segni/acquario" className="text-primary hover:underline">Acquario</Link>
        produce reti larghe e orientate a idee. Una undicesima in
        Cancro produce reti piccole, calde, simili a una famiglia
        scelta. Una undicesima in Capricorno produce reti professionali
        formali, alleanze utilitarie.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una premessa: amicizia non è dipendenza
      </h2>
      <p>
        Capita di leggere l'undicesima come "la casa dei desideri" o
        "delle speranze" in modo vago. Quello che descrive davvero è
        più concreto: quali legami orizzontali una persona riesce a
        costruire, e quali progetti collettivi le stanno a cuore. Una
        persona può avere relazioni intime intense e poche amicizie, o
        relazioni intime povere e amicizie ricche. Sono due piani
        diversi, e l'undicesima descrive specificamente il secondo.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si manifesta con pianeti in undicesima casa
      </h2>
      <p>
        <strong>
          <Link to="/glossario/pianeti/urano" className="text-primary hover:underline">Urano</Link> in undicesima casa
        </strong>
        : è la posizione "a casa". Reti larghe, anticonvenzionali,
        spesso legate a idee e progetti di cambiamento collettivo. La
        persona si trova a proprio agio in gruppi non tradizionali.
      </p>
      <p>
        <strong>Sole in undicesima casa</strong>: l'identità si forma
        in mezzo agli altri. La persona cresce attraverso il gruppo,
        non in solitudine, e fatica nei lavori molto isolati.
      </p>
      <p>
        <strong>Venere in undicesima casa</strong>: le amicizie
        contano quanto le relazioni amorose, e spesso i partner
        nascono da contesti amicali. Vita sociale ampia e fluida.
      </p>
      <p>
        <strong>Saturno in undicesima casa</strong>: amicizie poche e
        durature. Si è selettivi nel legarsi a un gruppo, e una volta
        dentro si è affidabili nel lungo periodo. Possibili
        responsabilità formali in associazioni o reti.
      </p>
      <p>
        <strong>Marte in undicesima casa</strong>: energia attiva nei
        progetti collettivi, capacità di guidare gruppi, anche
        attraverso conflitto. A volte tensione fra le proprie esigenze
        e quelle del gruppo.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sull'asse quinta-undicesima
      </h2>
      <p>
        L'undicesima è opposta alla <Link to="/glossario/case/quinta-casa" className="text-primary hover:underline">quinta casa</Link>. L'asse descrive il
        rapporto fra espressione personale (quinta) e partecipazione
        collettiva (undicesima). Persone che lavorano molto sulla
        quinta senza l'undicesima rischiano di produrre molto senza
        nessuno con cui condividere; persone che lavorano solo
        sull'undicesima senza la quinta rischiano di sciogliersi nel
        gruppo senza esprimere la propria voce singola. Il dialogo fra
        i due piani è uno dei lavori centrali della maturità sociale.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere la tua undicesima casa dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "segni", slug: "acquario" },
    { kind: "glossario", tipo: "pianeti", slug: "urano" },
    { kind: "glossario", tipo: "case", slug: "quinta-casa" },
    { kind: "guide", slug: "tema-natale-psicologico" },
  ],
};

export default undicesimaCasa;
