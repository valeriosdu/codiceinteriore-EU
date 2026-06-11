import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const sagittario: GlossarioEntry = {
  slug: "sagittario",
  tipo: "segni",
  title: "Il segno del Sagittario nel tema natale",
  metaTitle: "Sagittario nel tema natale: significato psicologico | Codice Interiore",
  metaDescription:
    "Il Sagittario nel tema natale: lo stile dell'orizzonte, della ricerca di senso, del passo oltre. Lettura psicologica oltre il cliché del 'segno avventuroso'.",
  heading: "Il segno del Sagittario nel tema natale",
  shortDefinition:
    "Il Sagittario, nel tema natale, descrive lo stile dell'orizzonte: la modalità con cui un pianeta in Sagittario cerca quello che sta oltre il dato attuale, costruisce cornici di significato, si muove verso il senso.",
  publishedAt: "2026-05-02",
  readingMinutes: 4,
  wordCount: 810,
  keywords: [
    "sagittario tema natale",
    "sagittario astrologia",
    "sagittario significato",
    "segno sagittario",
    "astrologia psicologica",
  ],
  coverImage: {
    src: "/illustrations/glossario/segni/sagittario.webp",
    srcSmall: "/illustrations/glossario/segni/sagittario@small.webp",
    alt: "Incisione del segno del Sagittario in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta come stile
      </h2>
      <p>
        Sagittario è il segno che descrive lo stile dell'orizzonte. La
        modalità con cui una funzione della carta cerca quello che sta
        oltre il dato attuale: oltre il proprio contesto, oltre la
        propria educazione, oltre il primo livello di un argomento. Non
        è "voglia di libertà" generica, e non è "spirito avventuroso"
        nel senso turistico: è più precisamente la grammatica del passo
        in più. La tendenza a fare una domanda dopo l'altra, a non
        accontentarsi della prima risposta, a costruire una cornice di
        senso che includa più di quello che si vede al momento.
      </p>
      <p>
        Nel tema natale lo stile del Sagittario è espansivo, ottimista
        di base, allergico ai contesti troppo ristretti. Una funzione
        in Sagittario fa fatica nei sistemi chiusi, nelle conversazioni
        molto tecniche e poco contestualizzate, nelle relazioni che
        chiedono prevedibilità totale. Funziona bene dove può
        attraversare territori (geografici, intellettuali, esperienziali)
        e dove può ridare un significato più ampio a quello che fa.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una premessa: l'ottimismo non è leggerezza
      </h2>
      <p>
        Il Sagittario viene descritto frequentemente come "il segno
        dell'ottimismo", e questa lettura produce una distorsione. La
        parola ottimismo, nel linguaggio comune, indica una disposizione
        leggera, una tendenza a vedere le cose meglio di come sono.
        Nello stile del Sagittario c'è qualcosa di diverso: una
        tendenza a credere che ci sia un orizzonte oltre la difficoltà
        attuale, e che valga la pena di muoversi in quella direzione
        anche senza garanzie. È un ottimismo strutturale, non un
        ottimismo emotivo.
      </p>
      <p>
        Per questo, una funzione in Sagittario può anche essere
        consapevole di un problema, vederlo nella sua durezza, e
        comunque procedere. Quello che la muove non è negazione, è
        fiducia nella direzione. Quando però questa fiducia viene
        spinta oltre il dato, lo stile si rovescia in sopravvalutazione,
        promessa eccessiva, fuga dal compito specifico in nome di un
        progetto più grande.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si manifesta nelle funzioni principali
      </h2>
      <p>
        <strong>Sole in Sagittario</strong>: l'identità si costruisce
        attraverso esperienze ampie, viaggi, studio, contatto con
        contesti diversi dal proprio. Le persone con questa posizione
        si sentono spesso "in transito" anche quando vivono in un
        posto solo, e cercano significato nel lungo termine più che
        riconoscimento di breve.
      </p>
      <p>
        <strong>Luna in Sagittario</strong>: la sicurezza emotiva
        richiede spazio, libertà di movimento, cornici interpretative
        che danno senso a quello che si vive. Stare in relazioni
        provinciali, contrattualizzate, dove ogni gesto deve essere
        giustificato, soffoca. Il calore arriva attraverso condivisione
        di una visione, non solo attraverso vicinanza fisica.
      </p>
      <p>
        <strong>Mercurio in Sagittario</strong>: il pensiero è
        sintetico, panoramico, poco interessato al dettaglio. Si tende
        a tirare conclusioni rapide su contesti ampi e si trascurano le
        sfumature locali. Funziona molto bene nella divulgazione, meno
        bene dove serve precisione filologica.
      </p>
      <p>
        <strong>Venere in Sagittario</strong>: l'attrazione si attiva
        per persone che hanno orizzonti aperti, cultura, esperienze di
        vita. Le relazioni domestiche e ripetitive perdono presto
        carica, mentre quelle che includono uno scambio di mondi
        diversi durano nel tempo.
      </p>
      <p>
        <strong>Marte in Sagittario</strong>: la spinta attiva ha
        ampio respiro ma poca precisione tattica. Si parte
        entusiasticamente, si fanno passi grandi, si abbandonano fasi
        intermedie. La rabbia esce in modo esplicito e poco strategico,
        di solito accompagnata da un'argomentazione di principio.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sull'"avventuroso"
      </h2>
      <p>
        Etichettare il Sagittario come "il segno avventuroso" è un
        modo per ridurlo a una qualità turistica, e perde la parte
        utile. Il Sagittario non descrive necessariamente persone che
        viaggiano fisicamente di più: descrive una funzione che cerca
        di estendere il proprio orizzonte interpretativo. Una persona
        con Sagittario forte può stare seduta in una biblioteca per
        anni e attraversare comunque mondi, mentre un'altra può
        viaggiare ovunque senza mai uscire dal proprio già-saputo.
        L'avventura, nel piano del Sagittario, è più cognitiva e
        valoriale che geografica.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere come il Sagittario colora i pianeti della tua carta
        puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>: in pochi minuti generiamo la lettura
        iniziale sulla tua data, ora e luogo di nascita.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "pianeti", slug: "giove" },
    { kind: "glossario", tipo: "case", slug: "nona-casa" },
    { kind: "glossario", tipo: "segni", slug: "gemelli" },
    { kind: "guide", slug: "come-leggere-tema-natale" },
  ],
};

export default sagittario;
