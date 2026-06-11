import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const luna: GlossarioEntry = {
  slug: "luna",
  tipo: "pianeti",
  title: "La Luna nel tema natale",
  metaTitle: "La Luna nel tema natale: significato psicologico | Codice Interiore",
  metaDescription:
    "La Luna nel tema natale: cosa rappresenta nella struttura emotiva di una persona, come si manifesta nelle dinamiche affettive e quotidiane.",
  heading: "La Luna nel tema natale",
  shortDefinition:
    "La Luna, nel linguaggio del tema natale, descrive il modo in cui una persona elabora le emozioni, cerca sicurezza e si lascia toccare da quello che le accade.",
  publishedAt: "2026-04-28",
  readingMinutes: 4,
  wordCount: 720,
  keywords: ["luna tema natale", "luna astrologia", "luna significato", "astrologia psicologica"],
  coverImage: {
    src: "/illustrations/glossario/pianeti/luna.webp",
    srcSmall: "/illustrations/glossario/pianeti/luna@small.webp",
    alt: "Incisione astronomica della Luna in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        La Luna è la parte più ricettiva di una carta natale. Mentre il Sole
        racconta la direzione consapevole di una persona, cioè la sua
        identità attiva, dove dirige attenzione e volontà, la Luna lavora a
        un livello diverso. Assorbe il clima emotivo, registra cosa è
        familiare e cosa è estraneo, decide in tempi molto rapidi se una
        situazione è sicura.
      </p>
      <p>
        Per questo, nelle letture del tema natale, la Luna viene letta come
        la zona in cui qualcuno si sente "a casa": quel mix di abitudini,
        ritmi e bisogni che non vengono scelti razionalmente ma che, se
        vengono ignorati, lasciano un'irritazione costante. La posizione
        della Luna per segno e casa precisa di quale tipo di sicurezza una
        persona ha davvero bisogno: sicurezza emotiva, di routine, di
        confine, di contesto, di legame.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come appare nelle dinamiche
      </h2>
      <p>
        Una Luna in segno d'acqua, per esempio, tende a registrare
        l'atmosfera di una stanza prima ancora che venga detta una parola.
        Chi la possiede spesso si descrive come "spugna" e impara presto a
        riconoscere i propri stati d'animo come informazione, non come
        disturbo. Una Luna in segno di terra, al contrario, si rassicura
        attraverso la concretezza quotidiana (cosa si mangia, dove si
        dorme, che programma c'è domani) e fatica nei contesti dove tutto
        resta vago "per stare aperti a quello che succede".
      </p>
      <p>
        Nelle relazioni, la Luna descrive cosa serve perché una persona si
        rilassi davvero. Alcuni hanno bisogno di tono di voce calmo prima
        di tutto, altri di programmi chiari, altri di un linguaggio fisico
        molto presente, altri di lunghi spazi di solitudine intervallati a
        momenti di intimità intensa. Sono cose che raramente vengono dette
        esplicitamente, ma che, quando mancano, fanno crescere un fondo di
        insofferenza non sempre riconducibile all'altro.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Differenza con Sole e Ascendente
      </h2>
      <p>
        Confondere Luna e Sole è uno degli errori più frequenti quando si
        legge un tema natale da soli. Il Sole è "chi vuoi diventare", la
        Luna è "cosa ti basta per stare bene oggi". Spesso non coincidono.
        Una persona può avere un Sole molto pubblico e dirigersi verso
        ruoli di responsabilità, e una Luna che invece chiede silenzio,
        pochi interlocutori, ritmi protetti. Quando i due piani non vengono
        riconosciuti come distinti, la persona si stanca senza capire
        perché.
      </p>
      <p>
        L'Ascendente, a sua volta, è il modo in cui ci si presenta agli
        altri, la "porta d'ingresso". Luna, Sole e Ascendente, presi
        insieme, sono i tre punti su cui si costruisce ogni lettura
        iniziale del tema natale. Il valore di una lettura non sta in
        nessuno dei tre presi da soli, ma nel modo in cui si parlano.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sul "carattere lunare"
      </h2>
      <p>
        Capita di leggere descrizioni della Luna nei tarocchi e in certa
        astrologia popolare come "lato oscuro" o "inconscio". Nel tema
        natale psicologico questo linguaggio non aggiunge niente. La Luna
        non è oscura, è semplicemente <em>preverbale</em>. Risponde prima
        che la mente abbia formulato un giudizio. Non è bene né male, è una
        struttura. Riconoscerla significa smettere di trattare le proprie
        reazioni emotive come "esagerazioni" e iniziare a leggerle come
        informazioni precise sul tipo di ambiente di cui si ha bisogno.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere come la tua Luna si combina con il resto della tua
        carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>. In pochi minuti generiamo la
        lettura iniziale sulla tua data, ora e luogo di nascita.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "pianeti", slug: "sole" },
    { kind: "glossario", tipo: "pianeti", slug: "venere" },
    { kind: "glossario", tipo: "segni", slug: "cancro" },
    { kind: "glossario", tipo: "case", slug: "quarta-casa" },
    { kind: "guide", slug: "tema-natale-relazioni" },
  ],
};

export default luna;
