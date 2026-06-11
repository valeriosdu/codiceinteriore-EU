import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const giove: GlossarioEntry = {
  slug: "giove",
  tipo: "pianeti",
  title: "Giove nel tema natale",
  metaTitle: "Giove nel tema natale: significato psicologico | Codice Interiore",
  metaDescription:
    "Giove nel tema natale: come una persona cerca senso, espande, costruisce cornici interpretative. Lettura psicologica oltre il cliché della fortuna.",
  heading: "Giove nel tema natale",
  shortDefinition:
    "Giove, nel tema natale, descrive il modo in cui una persona cerca senso, espande il proprio orizzonte, costruisce una cornice di significato per quello che le accade.",
  publishedAt: "2026-04-30",
  readingMinutes: 4,
  wordCount: 780,
  keywords: [
    "giove tema natale",
    "giove astrologia",
    "giove significato",
    "astrologia psicologica",
  ],
  coverImage: {
    src: "/illustrations/glossario/pianeti/giove.webp",
    srcSmall: "/illustrations/glossario/pianeti/giove@small.webp",
    alt: "Incisione astronomica di Giove in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Giove è la funzione del tema natale che si occupa della cornice
        interpretativa. Come una persona dà senso a quello che le
        succede, quale linguaggio simbolico, filosofico o religioso le
        risulta naturale, in che modo costruisce la propria visione del
        mondo nel tempo. Non è "fortuna" e non è "abbondanza", anche se
        l'astrologia popolare lo etichetta così. È più precisamente la
        capacità di estendere il proprio orizzonte oltre quello che si
        può misurare nel breve termine.
      </p>
      <p>
        Per questo, in una lettura psicologica della carta natale, Giove
        descrive la direzione in cui una persona tende ad aprirsi, a
        prendere fiducia, a credere che qualcosa abbia un significato.
        Cosa la fa muovere quando non ha ancora visto il risultato. La
        posizione per segno indica lo stile di questa apertura (più
        intellettuale, più morale, più sensuale, più visionaria). La casa
        indica l'ambito di vita in cui questa fiducia si manifesta
        spontaneamente, quello in cui una persona "non si chiede troppo se
        può" e procede.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Rapporto con Saturno
      </h2>
      <p>
        Giove e Saturno formano l'asse strutturale della carta natale.
        Giove apre, Saturno contiene. Giove dice "si può fare di più,
        c'è spazio", Saturno dice "questo è il limite, qui si paga il
        costo". I due pianeti non sono opposti morali (uno positivo,
        l'altro negativo), sono due funzioni complementari di una stessa
        operazione: una persona ha bisogno di entrambi per crescere
        davvero. Solo Giove produce espansione senza misura, e quasi
        sempre porta a una correzione brusca. Solo Saturno produce
        compressione senza orizzonte, e quasi sempre porta a stallo.
      </p>
      <p>
        Per questo, in una buona lettura del tema natale, Giove e Saturno
        si leggono insieme, e con particolare attenzione alla loro
        relazione angolare (congiunzione, opposizione, trigono,
        quadratura). Sapere come queste due funzioni si parlano dentro la
        propria carta dà una chiave su come una persona gestisce il
        rapporto tra ottimismo e cautela, tra spinta a fare di più e
        riconoscimento del proprio limite reale.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come appare nelle dinamiche
      </h2>
      <p>
        Un Giove in segno di fuoco costruisce il proprio senso attraverso
        prove dirette: chi ce la fa concretamente, chi vince, chi
        attraversa. La cornice di significato è "la vita è una cosa che
        si vive in pieno". Giove in segno di terra trova senso attraverso
        la concretezza dei risultati e della maestria. Giove in segno
        d'aria estende l'orizzonte attraverso le idee, la conversazione,
        i contatti con altri sistemi di pensiero. Giove in segno d'acqua
        produce un'apertura più empatica e meno argomentativa: si crede
        in qualcosa perché ci si sente toccati, non perché si dimostra.
      </p>
      <p>
        Nella casa, Giove indica dove una persona si dilata senza fatica.
        Giove in seconda casa rende facile attrarre risorse materiali
        (anche se non garantisce di trattenerle). Giove in nona casa
        amplifica l'attitudine al viaggio, allo studio, alla ricerca di
        cornici diverse dalla propria. Giove in quinta porta espressione
        creativa abbondante. Giove in dodicesima sviluppa una vita
        interiore ricca ma poco esibita.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sulla "fortuna di Giove"
      </h2>
      <p>
        Etichettare Giove come "il pianeta della fortuna" è il modo più
        veloce per fraintenderlo. Nelle letture popolari diventa una
        promessa di esito positivo, e quando l'esito non arriva la
        persona pensa che "il proprio Giove non funziona". Nel tema
        natale psicologico Giove non promette niente: descrive un modo
        di credere, di estendersi, di dare senso. Quel modo può produrre
        risultati positivi quando è in equilibrio con
        <Link to="/glossario/pianeti/saturno" className="text-primary hover:underline"> Saturno</Link>,
        e può produrre eccessi quando non lo è. La fortuna, come la
        intende l'astrologia popolare, è la versione semplificata di una
        meccanica più complessa che riguarda il modo in cui una persona
        dosa fiducia e cautela nel tempo.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere il tuo Giove dentro la geografia completa della tua
        carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>: in pochi minuti generiamo
        la lettura iniziale sulla tua data, ora e luogo di nascita.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "pianeti", slug: "saturno" },
    { kind: "glossario", tipo: "pianeti", slug: "sole" },
    { kind: "glossario", tipo: "segni", slug: "sagittario" },
    { kind: "glossario", tipo: "case", slug: "nona-casa" },
    { kind: "guide", slug: "come-leggere-tema-natale" },
  ],
};

export default giove;
