import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const urano: GlossarioEntry = {
  slug: "urano",
  tipo: "pianeti",
  title: "Urano nel tema natale",
  metaTitle: "Urano nel tema natale: significato psicologico | Codice Interiore",
  metaDescription:
    "Urano nel tema natale: la funzione della rottura, dell'individuazione, della differenziazione dal pattern collettivo. Lettura psicologica.",
  heading: "Urano nel tema natale",
  shortDefinition:
    "Urano, nel tema natale, descrive dove una persona è chiamata a differenziarsi dal pattern collettivo che ha ricevuto, e a trovare una propria forma anche al costo di rompere con quello che le viene dato per scontato.",
  publishedAt: "2026-05-04",
  readingMinutes: 4,
  wordCount: 810,
  keywords: [
    "urano tema natale",
    "urano astrologia",
    "urano significato",
    "individuazione",
    "astrologia psicologica",
  ],
  coverImage: {
    src: "/illustrations/glossario/pianeti/urano.webp",
    srcSmall: "/illustrations/glossario/pianeti/urano@small.webp",
    alt: "Incisione astronomica di Urano in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Urano è la funzione del tema natale che si occupa di
        differenziazione. Descrive dove una persona è chiamata a uscire
        dal pattern collettivo che ha ereditato (famiglia, ambiente, ruolo
        sociale che le è stato assegnato) per trovare una propria forma.
        Non è "cambiamento" generico, e non è "ribellione" per principio.
        È più precisamente il punto in cui la propria individualità preme
        per emergere anche al costo di rompere con quello che fino a
        quel momento sembrava naturale.
      </p>
      <p>
        Urano appartiene ai pianeti transpersonali, cioè i pianeti che si
        muovono molto lentamente nel cielo. Resta in un segno per circa
        sette anni, quindi tutte le persone nate in quello stesso periodo
        condividono la stessa posizione di Urano per segno. Per questo,
        in una lettura psicologica della carta natale, il segno di Urano
        descrive un tema generazionale, non un tratto individuale. Quello
        che individualizza Urano è la casa in cui cade, e gli aspetti che
        forma con i pianeti personali (Sole, Luna, Mercurio, Venere,
        Marte).
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Rapporto con Saturno
      </h2>
      <p>
        Urano e <Link to="/glossario/pianeti/saturno" className="text-primary hover:underline">Saturno</Link> formano
        una coppia funzionale importante. Saturno costruisce struttura,
        Urano la rompe quando la struttura ha smesso di servire. Non
        sono opposti: una persona ha bisogno di entrambi. Saturno senza
        Urano produce strutture rigide che soffocano la persona; Urano
        senza Saturno produce rotture continue che non costruiscono
        niente. Una buona lettura del tema natale guarda come questi due
        pianeti si parlano: dove una persona è capace di costruire
        qualcosa di robusto e dove invece deve avere il coraggio di
        smontarlo e ripartire.
      </p>
      <p>
        Quando Urano forma un aspetto significativo con i pianeti
        personali, l'individuazione diventa un tema centrale della vita.
        Urano in aspetto al Sole, per esempio, rende difficile aderire
        senza riserve a un ruolo conformista; chi lo ha tende a sentirsi
        "diverso" anche quando non sa esattamente perché. Urano in aspetto
        alla Luna porta un bisogno di indipendenza emotiva che si manifesta
        presto nella vita, e una certa fatica a stare nei legami che
        chiedono fusione completa.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come appare nelle dinamiche
      </h2>
      <p>
        Urano nella casa descrive l'ambito di vita in cui questa spinta a
        differenziarsi si manifesta in modo più evidente. Urano in prima
        casa rende l'individualità una parte esplicita
        dell'auto-presentazione: spesso le persone con questa posizione
        vengono percepite come "fuori formato" anche prima di parlare.
        Urano in quarta lavora dentro il tema delle radici e della
        famiglia: la persona deve uscire da un copione domestico
        ricevuto, spesso attraverso una rottura non lineare. Urano in
        settima porta un rapporto particolare con le relazioni intime:
        difficoltà a stare in unioni tradizionali, attrazione per partner
        che hanno qualcosa di anticonvenzionale, oppure forme di legame
        che si discostano dal modello sociale prevalente.
      </p>
      <p>
        Urano in decima casa rende l'ambito pubblico e professionale
        zona di differenziazione: il proprio lavoro non assomiglia al
        lavoro dei colleghi, il percorso non è lineare, le scelte di
        carriera sono spesso considerate strane da chi guarda da fuori.
        Urano in dodicesima rende la spinta all'individuazione più
        sotterranea: la persona la vive intimamente, fatica a esprimerla,
        e a volte la riconosce solo dopo molti anni.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sul "cambiamento improvviso"
      </h2>
      <p>
        Nelle letture astrologiche popolari Urano viene spesso descritto
        come "il pianeta del cambiamento improvviso", e ogni transito di
        Urano viene letto come una previsione di scossone in arrivo.
        Questa lettura è parziale. Quello che Urano produce non è
        cambiamento generico: è una richiesta di coerenza con la propria
        individualità. Quando una persona ha vissuto a lungo dentro un
        copione che non le appartiene davvero, un passaggio significativo
        di Urano può tradursi in una rottura visibile. Ma se quella
        coerenza è stata costruita per tempo, lo stesso passaggio si
        traduce in passi più graduali e ordinati. Non è il pianeta a
        decidere, è il livello di adesione che una persona ha mantenuto
        col proprio copione di partenza.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere come il tuo Urano si combina con il resto della tua
        carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>. In pochi minuti generiamo
        la lettura iniziale sulla tua data, ora e luogo di nascita.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "pianeti", slug: "saturno" },
    { kind: "glossario", tipo: "pianeti", slug: "mercurio" },
    { kind: "glossario", tipo: "segni", slug: "acquario" },
    { kind: "glossario", tipo: "case", slug: "undicesima-casa" },
    { kind: "guide", slug: "tema-natale-psicologico" },
  ],
};

export default urano;
