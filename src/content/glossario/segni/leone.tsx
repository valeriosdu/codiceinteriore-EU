import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const leone: GlossarioEntry = {
  slug: "leone",
  tipo: "segni",
  title: "Il segno del Leone nel tema natale",
  metaTitle: "Leone nel tema natale: significato psicologico | Codice Interiore",
  metaDescription:
    "Il Leone nel tema natale: lo stile del riconoscimento, dell'espressione consapevole, del bisogno di essere visti. Lettura psicologica oltre il cliché 'regalità'.",
  heading: "Il segno del Leone nel tema natale",
  shortDefinition:
    "Il Leone, nel tema natale, descrive lo stile del riconoscimento: la modalità con cui un pianeta in Leone si espone, si fa vedere e cerca uno spazio in cui essere riconosciuto per quello che è.",
  publishedAt: "2026-05-01",
  readingMinutes: 4,
  wordCount: 800,
  keywords: [
    "leone tema natale",
    "leone astrologia",
    "leone significato",
    "segno leone",
    "astrologia psicologica",
  ],
  coverImage: {
    src: "/illustrations/glossario/segni/leone.webp",
    srcSmall: "/illustrations/glossario/segni/leone@small.webp",
    alt: "Incisione del segno del Leone in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta come stile
      </h2>
      <p>
        Leone è il segno che descrive lo stile del riconoscimento: il
        modo con cui una funzione della carta cerca di essere vista
        nella sua specificità, non confusa con altri, riconosciuta per
        quello che è. Non è "regalità", e non è "carisma magnetico" da
        coach: è più precisamente la grammatica dell'auto-espressione.
        Mostrarsi senza apologia, occupare un posto al centro quando
        serve, fare in modo che quello che si è non venga assorbito
        nell'anonimato del gruppo.
      </p>
      <p>
        Nel tema natale lo stile del Leone è caldo, frontale e
        esibitivo nel senso non peggiorativo del termine. Una funzione
        in Leone fatica nei contesti dove deve diluirsi, dove non viene
        notata, dove deve fare un passo indietro per troppo tempo. Ha
        bisogno di un palco, anche piccolo, in cui può essere
        riconosciuta come quella specifica entità.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una premessa: il bisogno di riconoscimento non è narcisismo
      </h2>
      <p>
        Il Leone è uno dei segni più caricaturati. Viene descritto
        spesso come egocentrico, vanitoso, dipendente dagli sguardi
        degli altri. Questa lettura non è del tutto sbagliata, ma è
        moralista: tratta il bisogno di riconoscimento come se fosse di
        per sé un difetto. Nel tema natale psicologico il
        riconoscimento è un piano legittimo della vita psichica.
        Winnicott e in generale la psicologia dello sviluppo
        riconoscono che essere visti per quello che si è è una
        condizione di base per la formazione del sé. Il Leone descrive
        proprio questa funzione: dove una persona ha bisogno di esposizione per
        sentire che esiste davvero.
      </p>
      <p>
        Una funzione in Leone che viene cronicamente non riconosciuta
        produce conseguenze pesanti: depressione del sé, fatica a
        sapere chi si è, ricerca compulsiva di approvazione attraverso
        canali a basso valore (social, validazione esterna ottenuta
        per gesti che non corrispondono). Il problema non è il bisogno,
        è la qualità dei canali attraverso cui si cerca di soddisfarlo.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si manifesta nelle funzioni principali
      </h2>
      <p>
        <strong>
          <Link to="/glossario/pianeti/sole" className="text-primary hover:underline">Sole</Link> in Leone
        </strong>
        : è la posizione "a casa" del pianeta dell'identità. L'identità
        si forma attraverso esposizione consapevole e attraverso ambiti
        in cui ci si può mettere in scena con i propri tratti distintivi.
        Funziona bene nei ruoli espressivi e creativi, fatica nei
        contesti in cui deve restare in fila.
      </p>
      <p>
        <strong>Luna in Leone</strong>: la sicurezza emotiva richiede
        un certo grado di calore e di esposizione affettuosa.
        Funziona male in famiglie o relazioni in cui l'affetto viene
        dato in modo trattenuto, freddo o irregolare. La persona tende
        a esprimere sentimenti in modo plateale, e prende sul serio
        quando non viene corrisposta con altrettanto calore.
      </p>
      <p>
        <strong>Mercurio in Leone</strong>: il pensiero ha una qualità
        oratoria. Si argomenta per posizioni nette, si comunica con
        sicurezza espressiva, si fa fatica a tornare indietro su una
        propria affermazione anche quando si è capito che è imprecisa.
      </p>
      <p>
        <strong>Venere in Leone</strong>: l'attrazione si attiva per
        persone che hanno qualità espressive forti, presenza scenica,
        capacità di esprimere affetto in modo visibile. La discrezione
        eccessiva nel partner viene letta come freddezza.
      </p>
      <p>
        <strong>Marte in Leone</strong>: la spinta attiva si esercita in
        modo dignitoso e teatrale. Si combatte con stile, non per
        astuzia. La perdita della faccia è una motivazione più forte
        del danno materiale.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sulla "regalità"
      </h2>
      <p>
        Etichettare il Leone come "il segno regale" è un modo per
        renderlo simpatico ma fa perdere la parte utile della lettura.
        La regalità è una metafora che produce due reazioni
        problematiche: chi ha pianeti in Leone si sente caricato di
        un'identità "speciale" che non sa come performare, e chi non
        ce li ha si sente fuori dal gioco. Quello che il Leone descrive
        davvero è qualcosa di molto più ordinario e umano: il bisogno
        di essere riconosciuti come distintamente sé stessi. Questo
        bisogno tutti lo hanno, ma in modi e con intensità diverse a
        seconda di dove e come il segno è coinvolto nella loro carta.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere come il Leone colora i pianeti della tua carta puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>: in pochi minuti generiamo la lettura iniziale sulla tua data, ora e luogo di nascita.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "pianeti", slug: "sole" },
    { kind: "glossario", tipo: "case", slug: "quinta-casa" },
    { kind: "glossario", tipo: "segni", slug: "acquario" },
    { kind: "guide", slug: "tema-natale-psicologico" },
  ],
};

export default leone;
