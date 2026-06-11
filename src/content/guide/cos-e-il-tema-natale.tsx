import { Link } from "react-router-dom";
import type { GuideEntry } from "../types";

const cosETemaNatale: GuideEntry = {
  slug: "cos-e-il-tema-natale",
  title: "Cos'è il tema natale",
  metaTitle: "Cos'è il tema natale: guida in italiano | Codice Interiore",
  metaDescription:
    "Spiegazione chiara del tema natale: cos'è, come si costruisce, cosa descrive davvero. In italiano, con un taglio psicologico e non predittivo.",
  heading: "Cos'è il tema natale",
  publishedAt: "2026-04-26",
  readingMinutes: 7,
  wordCount: 1450,
  keywords: ["tema natale", "carta natale", "cos'è il tema natale", "astrologia psicologica"],
  coverImage: {
    src: "/illustrations/guide/cos-e-il-tema-natale.webp",
    srcSmall: "/illustrations/guide/cos-e-il-tema-natale@small.webp",
    alt: "Tema natale disegnato come tavola di trattato astrologico antico",
    width: 1600,
    height: 900,
  },
  intro: (
    <p>
      Il tema natale è una mappa simbolica del cielo del giorno in cui una
      persona è nata. Non è un oroscopo, non è una previsione. È un sistema
      di riferimento che descrive, con un linguaggio antico ma molto
      preciso, la struttura emotiva, relazionale e di motivazione di una
      persona, così come emerge dalla combinazione tra data, ora e luogo di
      nascita.
    </p>
  ),
  body: (
    <>
      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Una mappa, non un destino
      </h2>
      <p>
        L'idea che spesso scoraggia chi si avvicina all'astrologia per la
        prima volta è che "leggere la carta natale" significhi farsi predire
        il futuro. In realtà, nel modo in cui viene usata dall'astrologia
        psicologica contemporanea, la carta natale è esattamente l'opposto.
        Non descrive cosa succederà, descrive come una persona è
        costruita. È più simile a un test di personalità approfondito che a
        un oroscopo. E come un buon profilo psicologico, non ti dice cosa
        fare: ti descrive con precisione, e da quella precisione viene una
        possibilità di riconoscimento.
      </p>
      <p>
        Chi guarda la propria carta natale dopo aver fatto terapia o letto
        qualche libro di psicologia spesso ritrova, in un linguaggio
        simbolico diverso, dinamiche già conosciute: il modo in cui si lega
        agli altri, dove tende a bloccarsi, cosa lo muove davvero. Il
        valore non sta nella novità delle informazioni, ma nel fatto che
        vengono organizzate in un sistema coerente in cui le parti parlano
        tra loro.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Come si costruisce
      </h2>
      <p>
        Per disegnare un tema natale servono tre informazioni: la data,
        l'ora e il luogo di nascita. La data colloca i pianeti nei segni
        dello zodiaco, ed è la parte che la maggior parte delle persone
        conosce ("io sono dei Gemelli"). L'ora di nascita, invece, è quella
        che cambia di più la lettura: fissa l'Ascendente, divide la mappa
        in dodici case e determina dove i pianeti cadono al momento della
        nascita. Cambiare l'ora di anche due ore può spostare l'Ascendente
        di un intero segno, ed è il motivo per cui le letture basate solo
        sul segno solare risultano spesso generiche.
      </p>
      <p>
        Il luogo serve perché le case astrologiche si calcolano in base
        alla latitudine: lo stesso istante di nascita, in due città
        diverse, produce una distribuzione delle case lievemente diversa.
        È un dettaglio tecnico, ma è quello che fa sì che una carta natale
        sia davvero personale e non semplicemente una variazione su pattern
        comuni.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Quali sono gli elementi principali
      </h2>
      <p>
        Una lettura del tema natale lavora su tre livelli che, presi
        insieme, compongono il "ritratto" di una persona:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>I pianeti</strong> rappresentano le funzioni psichiche di
          base. Il Sole è la direzione consapevole, la <Link to="/glossario/pianeti/luna" className="text-primary hover:underline">Luna</Link> è il modo in
          cui ci si rassicura, Mercurio è come si pensa, Venere è cosa si
          considera attraente, Marte è dove si reagisce. Ce ne sono dieci
          in tutto.
        </li>
        <li>
          <strong>I segni</strong> indicano lo stile in cui ciascuna di
          queste funzioni si esprime. Una stessa funzione (per esempio
          Venere, che descrive il gusto e il modo di legarsi) in due segni
          diversi produce due "Veneri" molto diverse.
        </li>
        <li>
          <strong>Le case</strong> sono i settori della vita in cui ogni
          funzione tende a manifestarsi: lavoro, famiglia, relazioni
          intime, studio, identità pubblica. Sono dodici e si calcolano
          dall'ora e dal luogo di nascita.
        </li>
      </ul>
      <p>
        A questi si aggiungono gli aspetti, cioè le distanze angolari tra i
        pianeti, che descrivono come le diverse funzioni interagiscono tra
        loro. Sono la parte più sofisticata di una carta, e quella che
        distingue una lettura coerente da un elenco di significati
        separati.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Cosa una buona lettura del tema natale può fare (e cosa no)
      </h2>
      <p>
        Una lettura ben fatta riconosce con precisione la struttura
        interiore di una persona: come reagisce a certe situazioni, di che
        tipo di ambiente ha bisogno per attivarsi, dove tende a ripetere
        schemi relazionali, cosa la blocca davvero al di sotto delle
        ragioni razionali. È utile soprattutto a chi sente che le proprie
        reazioni non si lasciano spiegare facilmente, e che le descrizioni
        psicologiche generiche, per quanto interessanti, non gli "tornano"
        completamente.
      </p>
      <p>
        Una lettura del tema natale, però, non può dirti cosa fare. Non
        prevede eventi specifici, non garantisce risultati, non sblocca
        nulla per magia. È uno specchio: ti restituisce la struttura, ma
        cosa farne resta una decisione tua. È esattamente questo limite a
        renderla utile. Tutto quello che promette troppo, in questo campo,
        tende a non mantenere.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Da dove iniziare
      </h2>
      <p>
        Per leggere il proprio tema natale conviene partire da pochi
        elementi: Sole, Luna e Ascendente. Questi tre punti (quello che
        cerchi di diventare, quello di cui hai bisogno per stare bene, e
        il modo in cui ti presenti agli altri) danno già una lettura solida
        e riconoscibile. Aggiungere progressivamente Mercurio, Venere e
        Marte completa il quadro delle dinamiche quotidiane. I pianeti più
        lenti (Giove, Saturno, e i tre transpersonali) descrivono temi di
        lungo periodo e cicli generazionali, e si leggono dopo.
      </p>
      <p>
        Se vuoi vedere come questo si applica al tuo caso specifico, puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>. A
        partire dai tuoi dati di nascita generiamo una lettura iniziale del
        tuo tema natale, gratis e senza registrazione.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "pianeti", slug: "sole" },
    { kind: "glossario", tipo: "pianeti", slug: "luna" },
    { kind: "glossario", tipo: "pianeti", slug: "mercurio" },
    { kind: "glossario", tipo: "punti", slug: "ascendente" },
  ],
};

export default cosETemaNatale;
