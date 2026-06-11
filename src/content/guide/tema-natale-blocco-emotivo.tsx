import { Link } from "react-router-dom";
import type { GuideEntry } from "../types";

const temaNataleBloccoEmotivo: GuideEntry = {
  slug: "tema-natale-blocco-emotivo",
  title: "Tema natale e blocco emotivo: cosa dice la carta",
  metaTitle: "Tema natale e blocco emotivo: leggere lo stallo | Codice Interiore",
  metaDescription:
    "Quando sai cosa vuoi ma non parti: il tema natale può descrivere la struttura interna del blocco. Lettura psicologica della carta natale.",
  heading: "Tema natale e blocco emotivo: cosa dice la carta",
  publishedAt: "2026-05-08",
  readingMinutes: 6,
  wordCount: 1280,
  keywords: [
    "tema natale blocco",
    "blocco emotivo astrologia",
    "perché non riesco a iniziare",
    "stallo astrologia",
    "astrologia psicologica",
  ],
  coverImage: {
    src: "/illustrations/guide/tema-natale-blocco-emotivo.webp",
    srcSmall: "/illustrations/guide/tema-natale-blocco-emotivo@small.webp",
    alt: "Tema natale e blocco emotivo, illustrazione editoriale vintage",
    width: 1600,
    height: 900,
  },
  intro: (
    <p>
      Capita di sapere razionalmente cosa si dovrebbe fare, e di non
      riuscire a partire. Capita anche di partire e poi fermarsi
      sempre allo stesso punto. Questi blocchi non sono mancanza di
      volontà: sono spesso strutture interne che il tema natale può
      aiutare a riconoscere. Non per sciogliere il blocco con un
      colpo magico, ma per capirne la geometria.
    </p>
  ),
  body: (
    <>
      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Quattro zone della carta dove si annidano i blocchi
      </h2>
      <p>
        Quando una persona vive un blocco emotivo prolungato, di
        solito ci sono quattro punti della carta natale da guardare:
        Saturno, Plutone, l'asse dei Nodi, e gli aspetti tesi che
        coinvolgono i pianeti personali.
      </p>

      <h3 className="font-display text-xl font-semibold mt-6 mb-2">
        <Link to="/glossario/pianeti/saturno" className="text-primary hover:underline">Saturno</Link>
      </h3>
      <p>
        Saturno descrive dove una persona ha imparato a contenersi.
        Quando un blocco è di tipo "non riesco a permettermi", quasi
        sempre Saturno è coinvolto. La posizione di Saturno per casa
        indica l'ambito in cui questo contenimento si manifesta più
        visibilmente. Gli aspetti che Saturno fa con i pianeti
        personali (Sole, Luna, Mercurio, Venere, Marte) indicano
        quali funzioni vengono frenate.
      </p>

      <h3 className="font-display text-xl font-semibold mt-6 mb-2">
        <Link to="/glossario/pianeti/plutone" className="text-primary hover:underline">Plutone</Link>
      </h3>
      <p>
        Plutone descrive le zone in cui agiscono motivazioni
        inconsce. Quando una persona "sabota" qualcosa senza capire
        perché, spesso Plutone in aspetto a un pianeta personale è
        coinvolto. Plutone-Sole produce sabotaggio dell'identità,
        Plutone-Luna produce ferite affettive che si ripetono,
        Plutone-Marte produce conflittualità non riconosciuta come
        tale, Plutone-Venere produce dinamiche di potere nelle
        relazioni.
      </p>

      <h3 className="font-display text-xl font-semibold mt-6 mb-2">
        <Link to="/glossario/punti/nodi-lunari" className="text-primary hover:underline">L'asse dei Nodi</Link>
      </h3>
      <p>
        Il Nodo Sud descrive un'area di comfort già conosciuta, in cui
        la persona rientra automaticamente quando è sotto pressione.
        Spesso il blocco è proprio nel Nodo Sud: si torna in una zona
        che si conosce bene, anche quando quella zona non è quella
        in cui si vorrebbe stare. Il Nodo Nord descrive invece la
        direzione di crescita: quello che sembra "non proprio" e che
        è il punto in cui la persona è chiamata a sviluppare nuove
        capacità.
      </p>

      <h3 className="font-display text-xl font-semibold mt-6 mb-2">
        Aspetti tesi sui pianeti personali
      </h3>
      <p>
        Una <Link to="/glossario/aspetti/quadratura" className="text-primary hover:underline">quadratura</Link> Marte-Saturno produce difficoltà cronica
        nell'azione: si parte, si rallenta, ci si ferma, si parte di
        nuovo. Una quadratura Sole-Saturno produce un senso costante
        di "non essere abbastanza". Una quadratura Luna-Plutone porta
        intensità emotiva che spesso ferma le partenze più
        leggere.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        I tre tipi di blocco più comuni
      </h2>
      <h3 className="font-display text-xl font-semibold mt-6 mb-2">
        1. Il blocco da contenimento (Saturno)
      </h3>
      <p>
        La persona sa cosa vuole, ha gli strumenti, ma non si
        autorizza. Sotto questo blocco c'è di solito una storia
        precoce di contenimento (un genitore severo, un ambiente
        che chiedeva maturità prematura, una performance dimostrata
        a costi alti). La persona sta proteggendo qualcosa che è
        stata abituata a non poter dare.
      </p>

      <h3 className="font-display text-xl font-semibold mt-6 mb-2">
        2. Il blocco da identificazione inconscia (Plutone)
      </h3>
      <p>
        La persona sta proteggendo, senza saperlo, una motivazione
        che non vuole nominare. Per esempio: vorrebbe lasciare un
        lavoro, ma non lo fa perché inconsciamente è legata
        all'idea di rappresentare la propria famiglia (genitori
        operai, lei impiegata, lasciare significa "perdere" il
        riscatto). Il blocco non si sblocca finché la motivazione
        non viene nominata.
      </p>

      <h3 className="font-display text-xl font-semibold mt-6 mb-2">
        3. Il blocco da disallineamento Sole-Luna (Sole/Luna)
      </h3>
      <p>
        La persona vorrebbe fare X (Sole) ma ha bisogno di Y (Luna),
        e i due non sono compatibili nelle condizioni attuali. Per
        esempio: vorrebbe lavorare in pubblico ma ha bisogno di
        molto silenzio per stare bene. Il blocco non è patologico,
        è informativo: dice che la situazione attuale non offre
        spazio sia al Sole sia alla Luna.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Cosa il tema natale non fa
      </h2>
      <p>
        Va detto chiaramente: il tema natale non scioglie i blocchi.
        Non è una pratica clinica, e non sostituisce psicoterapia
        quando la situazione lo richiede. Quello che fa è descrivere
        la geometria del blocco: dove si annida, da quali pattern
        viene, su quali pianeti opera. È un'informazione
        diagnostica, non un trattamento.
      </p>
      <p>
        Per chi è già in un percorso terapeutico, la lettura del
        tema natale può funzionare come complemento utile: dà un
        linguaggio sintetico a cose che il lavoro analitico ha
        scoperto in forma sparsa. Per chi non è in terapia, può
        funzionare come introduzione consapevole al proprio
        funzionamento, e a volte come spinta a cercare un
        professionista quando il blocco lo richiede davvero.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere il tuo tema natale con focus su blocco e
        attivazione puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "guide", slug: "cos-e-il-tema-natale" },
    { kind: "guide", slug: "tema-natale-psicologico" },
    { kind: "glossario", tipo: "pianeti", slug: "saturno" },
    { kind: "glossario", tipo: "pianeti", slug: "plutone" },
    { kind: "glossario", tipo: "punti", slug: "chirone" },
  ],
};

export default temaNataleBloccoEmotivo;
