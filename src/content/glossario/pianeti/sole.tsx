import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const sole: GlossarioEntry = {
  slug: "sole",
  tipo: "pianeti",
  title: "Il Sole nel tema natale",
  metaTitle: "Il Sole nel tema natale: significato psicologico | Codice Interiore",
  metaDescription:
    "Il Sole nel tema natale: cosa rappresenta nell'identità consapevole di una persona, come si distingue dal segno solare letto in modo superficiale.",
  heading: "Il Sole nel tema natale",
  shortDefinition:
    "Il Sole, nel linguaggio del tema natale, descrive la direzione consapevole di una persona: chi cerca di diventare, dove tende a dirigere attenzione, volontà, energia attiva.",
  publishedAt: "2026-04-28",
  readingMinutes: 4,
  wordCount: 770,
  keywords: [
    "sole tema natale",
    "sole astrologia",
    "sole significato",
    "segno solare",
    "astrologia psicologica",
  ],
  coverImage: {
    src: "/illustrations/glossario/pianeti/sole.webp",
    srcSmall: "/illustrations/glossario/pianeti/sole@small.webp",
    alt: "Incisione astronomica del Sole in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Il Sole è la parte attiva e consapevole di una carta natale. È la
        funzione che dirige attenzione e volontà, quella che racconta chi una
        persona sta cercando di diventare nel tempo. Non è un'essenza fissa,
        non è "chi sei davvero" in senso mistico. È più simile a un asse di
        sviluppo: la direzione in cui una persona costruisce attivamente la
        propria identità, attraverso scelte, ruoli, ambiti in cui si espone.
      </p>
      <p>
        Per questo, nelle letture del tema natale psicologico, il Sole
        descrive la traiettoria della costruzione di sé. La posizione per
        segno indica lo stile con cui questa costruzione avviene (più
        cauta, più espressiva, più rituale, più sperimentale). La casa in
        cui cade indica l'ambito principale in cui questa identità trova il
        proprio centro di gravità: relazioni intime, lavoro pubblico,
        famiglia, ambito intellettuale, comunità, dimensione privata.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Differenza con la Luna e con l'Ascendente
      </h2>
      <p>
        Una delle confusioni più ricorrenti, quando si guarda da soli al
        proprio tema natale, è trattare Sole e <Link to="/glossario/pianeti/luna" className="text-primary hover:underline">Luna</Link> come se
        dicessero la stessa cosa. In realtà parlano di piani diversi. La
        Luna lavora a un livello preverbale: cosa ti basta per stare bene
        oggi, di che tipo di sicurezza emotiva hai bisogno. Il Sole opera
        sul piano della scelta consapevole: dove vai, in che direzione
        cresci, cosa sei disposto a costruire con il tempo. Per molte
        persone Sole e Luna non coincidono. Il Sole può chiedere
        esposizione pubblica mentre la Luna pretende ritmo lento e protetto.
        Riconoscere i due piani come distinti è il primo passo per smettere
        di rimproverarsi di "non essere sempre coerenti".
      </p>
      <p>
        Dall'Ascendente, il Sole si distingue invece così: l'Ascendente è
        la porta d'ingresso, il modo in cui ci si presenta agli altri al
        primo contatto. Il Sole è quello che cerca di emergere nel tempo
        più lungo. Una persona può avere un Ascendente molto trattenuto e
        un Sole che spinge invece verso l'esposizione: nel tempo, è il
        secondo a dare la direzione, mentre il primo resta il filtro
        sociale di superficie.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come appare nelle dinamiche
      </h2>
      <p>
        Un Sole in segno di fuoco tende a costruirsi in modo visibile e
        attraverso prove pubbliche: ruoli espressivi, leadership, ambiti
        dove qualcuno ti vede mettere energia. Un Sole in segno d'acqua si
        costruisce attraverso le relazioni profonde: la propria identità
        prende forma man mano che si entra in legami che chiedono
        immersione emotiva. Un Sole in segno di terra cresce attraverso
        responsabilità concrete e risultati misurabili. Un Sole in segno
        d'aria si costruisce attraverso il pensiero, la conversazione,
        ambiti dove le idee circolano.
      </p>
      <p>
        La casa è altrettanto importante. Un Sole in prima casa è quasi
        sovrapposto all'Ascendente: la persona è molto "centrata su sé
        stessa" nel senso che la propria identità è il tema esplicito della
        vita. Un Sole in decima casa fa coincidere identità e ruolo
        pubblico, e a volte produce un senso di vuoto quando il ruolo viene
        meno. Un Sole in quarta casa costruisce identità attraverso radici,
        casa, famiglia di appartenenza. Un Sole in dodicesima cresce in
        modo meno frontale, spesso attraverso pratiche silenziose o lavori
        di cura, e fatica a stare in scena.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sul "tuo segno"
      </h2>
      <p>
        Quando si dice "io sono dell'Ariete" si intende, di solito, il Sole
        in Ariete. È un'informazione vera ma parziale. Il Sole è uno solo
        dei dieci pianeti che compongono una carta natale. Letture basate
        solo sul segno solare tendono a essere generiche perché ignorano
        Luna, Ascendente, e l'intera geografia delle case. Una lettura
        coerente del Sole arriva solo quando viene letta insieme al resto
        della carta: cosa cerca diventa pieno solo quando si capisce di
        cosa ha bisogno (Luna) e da quale soglia parte (Ascendente).
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere come il tuo Sole si combina con il resto della tua
        carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>. In pochi minuti generiamo
        la lettura iniziale sulla tua data, ora e luogo di nascita.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "pianeti", slug: "luna" },
    { kind: "glossario", tipo: "pianeti", slug: "marte" },
    { kind: "glossario", tipo: "segni", slug: "leone" },
    { kind: "glossario", tipo: "case", slug: "quinta-casa" },
    { kind: "guide", slug: "cos-e-il-tema-natale" },
  ],
};

export default sole;
