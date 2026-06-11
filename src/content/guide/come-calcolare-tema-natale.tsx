import { Link } from "react-router-dom";
import type { GuideEntry } from "../types";

const comeCalcolareTemaNatale: GuideEntry = {
  slug: "come-calcolare-tema-natale",
  title: "Come si calcola un tema natale",
  metaTitle: "Come calcolare il tema natale: dati e procedure | Codice Interiore",
  metaDescription:
    "Come si calcola un tema natale: quali dati servono, come trovare l'ora di nascita esatta, perché il luogo conta. Guida pratica.",
  heading: "Come si calcola un tema natale",
  publishedAt: "2026-05-09",
  readingMinutes: 5,
  wordCount: 1080,
  keywords: [
    "come calcolare tema natale",
    "calcolo tema natale",
    "ora di nascita",
    "carta natale",
    "astrologia psicologica",
  ],
  coverImage: {
    src: "/illustrations/guide/come-calcolare-tema-natale.webp",
    srcSmall: "/illustrations/guide/come-calcolare-tema-natale@small.webp",
    alt: "Come si calcola un tema natale, illustrazione editoriale vintage",
    width: 1600,
    height: 900,
  },
  intro: (
    <p>
      Il calcolo di un tema natale è una procedura tecnica che oggi i
      software fanno in pochi secondi, ma che richiede dati precisi.
      Senza i dati giusti, la lettura perde gran parte della propria
      accuratezza. Questa guida spiega quali dati servono, perché ognuno
      conta, e come fare quando uno dei dati è incerto.
    </p>
  ),
  body: (
    <>
      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        I tre dati indispensabili
      </h2>
      <p>
        Per calcolare un tema natale servono tre informazioni: data,
        ora e luogo di nascita. Ognuna ha un peso diverso sul
        risultato.
      </p>

      <h3 className="font-display text-xl font-semibold mt-6 mb-2">
        Data di nascita
      </h3>
      <p>
        La data colloca i pianeti nei segni dello zodiaco. È il dato
        meno problematico: tutti la conoscono con precisione. La data
        determina la posizione di Sole, Luna (con qualche
        approssimazione, perché la Luna si sposta di un grado ogni
        due ore circa), Mercurio, Venere, Marte, Giove, Saturno,
        Urano, Nettuno, Plutone.
      </p>

      <h3 className="font-display text-xl font-semibold mt-6 mb-2">
        Ora di nascita
      </h3>
      <p>
        L'ora di nascita è il dato più importante e spesso il più
        incerto. Fissa l'<Link to="/glossario/punti/ascendente" className="text-primary hover:underline">Ascendente</Link>, il <Link to="/glossario/punti/medio-cielo" className="text-primary hover:underline">Medio Cielo</Link>, il <Link to="/glossario/punti/fondo-cielo" className="text-primary hover:underline">Fondo Cielo</Link>,
        e divide la mappa in dodici case. Cambiare l'ora di anche due
        ore può spostare l'Ascendente di un intero segno. Senza ora
        precisa, la lettura della carta resta valida per pianeti e
        segni, ma perde tutta la struttura delle case e dei punti
        angolari.
      </p>
      <p>
        Quando si parla di "ora di nascita" si intende l'ora locale
        del luogo in cui sei nato/a, registrata al momento del parto.
        È quella che compare sull'atto di nascita rilasciato dal
        comune di nascita.
      </p>

      <h3 className="font-display text-xl font-semibold mt-6 mb-2">
        Luogo di nascita
      </h3>
      <p>
        Il luogo serve perché le case astrologiche si calcolano in
        base alla latitudine. Lo stesso istante di nascita, in due
        città diverse, produce una distribuzione delle case lievemente
        diversa. Per il calcolo serve il nome del comune di nascita
        (la città vera, non la provincia o la regione).
      </p>
      <p>
        Per chi è nato in una grande città, qualunque punto della
        città va bene. Per chi è nato in piccoli paesi, il nome esatto
        del comune basta. Solo per latitudini estreme (per esempio
        oltre il circolo polare) la precisione di luogo richiesta è
        maggiore.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Come trovare l'ora di nascita
      </h2>
      <p>
        Se non ricordi l'ora esatta, ci sono diverse strade:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Atto di nascita</strong>: rilasciato dal comune di
          nascita. È la fonte ufficiale. Si può richiedere
          gratuitamente, anche online in molti comuni italiani.
        </li>
        <li>
          <strong>Tessera sanitaria di battesimo</strong>: a volte
          riporta l'ora.
        </li>
        <li>
          <strong>Ospedale di nascita</strong>: gli archivi
          ostetrici conservano l'ora del parto. Si richiede al
          servizio archivio storico dell'ospedale.
        </li>
        <li>
          <strong>Domanda ai genitori</strong>: se ancora possibile,
          l'ora ricordata da un genitore è valida con un margine di
          ±15-20 minuti. Meglio comunque verificare con un documento.
        </li>
      </ul>
      <p>
        Se l'ora resta completamente sconosciuta, alcune persone
        ricorrono alla "rettificazione" (cercare di dedurre l'ora dai
        dati biografici). È una pratica imprecisa che produce
        un'ipotesi, non una certezza. Meglio fare una lettura senza
        Ascendente (chiara su quello che manca) che una lettura su
        un Ascendente "indovinato".
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Cosa il calcolo produce
      </h2>
      <p>
        Una volta inseriti i tre dati, il software calcola:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>posizione esatta dei 10 pianeti per segno e gradi</li>
        <li>posizione di Lilith, Chirone, Nodi Lunari</li>
        <li>Ascendente, Medio Cielo, e gli altri vertici delle case</li>
        <li>limiti delle 12 case (esistono diversi sistemi di case: Placido, Koch, Whole Sign, ecc., con risultati lievemente diversi)</li>
        <li>aspetti angolari fra i pianeti, con i loro orbita</li>
      </ul>
      <p>
        Il risultato è una "carta del cielo" rappresentata
        graficamente come un cerchio diviso in dodici settori. La
        lettura inizia da qui: il calcolo è solo il primo passo,
        l'interpretazione è quello che ne fa una lettura davvero
        utile.
      </p>

      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">
        Una nota sul fuso orario
      </h2>
      <p>
        Per chi è nato in Italia, l'ora va inserita come ora legale
        o solare in vigore al momento della nascita. I software
        moderni gestiscono automaticamente la conversione in UTC. Se
        ti capita di vedere risultati strani con un'Ascendente
        completamente diverso da quello che ti aspettavi, controlla
        prima di tutto il fuso: a volte un errore di un'ora produce
        carte molto diverse.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per calcolare il tuo tema natale e ricevere una lettura
        psicologica iniziale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>: ti chiediamo data,
        ora e luogo, e produciamo la lettura.
      </p>
    </>
  ),
  related: [
    { kind: "guide", slug: "cos-e-il-tema-natale" },
    { kind: "guide", slug: "come-leggere-tema-natale" },
    { kind: "guide", slug: "tema-natale-gratis-online" },
    { kind: "glossario", tipo: "punti", slug: "ascendente" },
  ],
};

export default comeCalcolareTemaNatale;
