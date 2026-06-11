import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const chirone: GlossarioEntry = {
  slug: "chirone",
  tipo: "punti",
  title: "Chirone nel tema natale",
  metaTitle: "Chirone nel tema natale: significato | Codice Interiore",
  metaDescription:
    "Chirone nel tema natale: il guaritore ferito, punto di vulnerabilità strutturale e capacità di cura verso gli altri. Lettura psicologica.",
  heading: "Chirone nel tema natale",
  shortDefinition:
    "Chirone è un piccolo corpo celeste tra Saturno e Urano, scoperto nel 1977. Nel tema natale psicologico descrive la 'ferita strutturale' di una persona: una vulnerabilità che non guarisce del tutto, ma da cui nasce la capacità di curare altri sullo stesso piano.",
  publishedAt: "2026-05-09",
  readingMinutes: 4,
  wordCount: 740,
  keywords: [
    "chirone tema natale",
    "chirone astrologia",
    "guaritore ferito",
    "punti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/punti/chirone.webp",
    srcSmall: "/illustrations/glossario/punti/chirone@small.webp",
    alt: "Incisione di Chirone in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Chirone è un piccolo corpo celeste, tecnicamente un centauro
        (categoria astronomica), scoperto nel 1977 fra le orbite di
        <Link to="/glossario/pianeti/saturno" className="text-primary hover:underline"> Saturno</Link> e <Link to="/glossario/pianeti/urano" className="text-primary hover:underline">Urano</Link>. Nel tema natale psicologico
        è uno dei pochi "nuovi" elementi entrati stabilmente
        nell'interpretazione contemporanea. Prende il nome dal
        centauro della mitologia greca: maestro di guarigione, ferito
        accidentalmente da una freccia avvelenata e incapace di
        guarire sé stesso, pur potendo guarire chiunque altro.
      </p>
      <p>
        Simbolicamente Chirone descrive il "guaritore ferito":
        un'area della carta in cui una persona porta una
        vulnerabilità strutturale, che non si risolve mai del tutto,
        e che proprio per questo le dà accesso a una sensibilità
        particolare verso le ferite degli altri sullo stesso piano.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si legge
      </h2>
      <p>
        Chirone si legge per segno e per casa. Il segno descrive la
        qualità della ferita: un Chirone in Ariete riguarda la
        propria capacità di iniziare e di affermarsi (spesso una
        storia di affermazione di sé che è stata difficile). Un
        Chirone in Cancro riguarda le radici e la sicurezza emotiva
        precoce. Un Chirone in Pesci riguarda il rapporto con la
        propria permeabilità.
      </p>
      <p>
        La casa descrive l'ambito di vita in cui questa ferita si
        manifesta più visibilmente. Chirone in <Link to="/glossario/case/settima-casa" className="text-primary hover:underline">settima casa</Link>
        riguarda le relazioni intime: spesso una storia di ferite
        relazionali precoci che si ripete in adulto. Chirone in <Link to="/glossario/case/decima-casa" className="text-primary hover:underline">decima casa</Link>
        riguarda il ruolo pubblico: difficoltà strutturali a trovare il
        proprio posto nello spazio sociale.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        La funzione di cura
      </h2>
      <p>
        La caratteristica più importante di Chirone è il doppio
        movimento: la stessa zona in cui la persona è ferita è anche la
        zona in cui può aiutare altri. Una persona con Chirone in
        Cancro che ha lavorato sulla propria ferita di sicurezza
        emotiva diventa spesso, da adulta, una figura particolarmente
        capace di tenere altri quando attraversano crisi affettive.
        Non perché ha guarito la propria ferita, ma perché ha imparato
        a conviverci e a riconoscerla negli altri.
      </p>
      <p>
        Per questo Chirone non è un punto da "risolvere": è un punto
        da abitare con consapevolezza. La lettura del proprio Chirone
        nel tema natale è uno dei passaggi più utili per chi fa lavori
        di cura (terapeuti, insegnanti, infermieri, scrittori
        testimoniali): aiuta a capire da quale vulnerabilità nasce la
        capacità di vedere altri.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sul "ritorno di Chirone"
      </h2>
      <p>
        Chirone ha un'orbita irregolare di circa 50 anni, quindi il
        suo ritorno (quando torna alla posizione di nascita) avviene
        intorno ai 50 anni. È un passaggio importante che descrive
        spesso il momento in cui una persona fa pace con la propria
        ferita strutturale: non perché si è guarita, ma perché ha
        capito che la ferita è parte della sua forma adulta, non un
        errore da correggere.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere il tuo Chirone dentro la geografia completa della
        tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "pianeti", slug: "saturno" },
    { kind: "glossario", tipo: "pianeti", slug: "urano" },
    { kind: "glossario", tipo: "punti", slug: "lilith" },
    { kind: "guide", slug: "tema-natale-psicologico" },
  ],
};

export default chirone;
