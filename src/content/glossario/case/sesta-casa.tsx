import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const sestaCasa: GlossarioEntry = {
  slug: "sesta-casa",
  tipo: "case",
  title: "La sesta casa nel tema natale",
  metaTitle: "Sesta casa nel tema natale: significato | Codice Interiore",
  metaDescription:
    "La sesta casa nel tema natale: l'ambito del lavoro quotidiano, della salute, delle routine. Lettura psicologica della casa del servizio e della manutenzione di sé.",
  heading: "La sesta casa nel tema natale",
  shortDefinition:
    "La sesta casa, nel tema natale, descrive l'ambito del lavoro quotidiano, della salute del corpo, delle routine. È la casa della manutenzione di sé e del servizio reso giorno per giorno.",
  publishedAt: "2026-05-07",
  readingMinutes: 4,
  wordCount: 720,
  keywords: [
    "sesta casa tema natale",
    "salute astrologia",
    "lavoro astrologia",
    "case astrologiche",
  ],
  coverImage: {
    src: "/illustrations/glossario/case/sesta-casa.webp",
    srcSmall: "/illustrations/glossario/case/sesta-casa@small.webp",
    alt: "Incisione della sesta casa astrologica in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta come ambito
      </h2>
      <p>
        La sesta casa descrive l'ambito del lavoro quotidiano e della
        manutenzione di sé. Non è la carriera in senso pubblico (quella
        è decima), è il lavoro fatto giorno per giorno: routine,
        compiti specifici, gestione del corpo, abitudini di salute,
        relazioni con colleghi diretti e subordinati. È la casa del
        "fare le cose come si deve", della disciplina ordinaria che
        tiene insieme la vita pratica.
      </p>
      <p>
        Nel tema natale lo stile della sesta dipende dal segno
        zodiacale sul quale cade. Una sesta in <Link to="/glossario/segni/vergine" className="text-primary hover:underline">Vergine</Link> produce
        un'attenzione meticolosa alla routine e al benessere fisico.
        Una sesta in Sagittario produce difficoltà con la routine
        ripetitiva, attrazione per lavori a contatto con culture e
        viaggi. Una sesta in Pesci porta lavori legati alla cura,
        all'ascolto, all'arte applicata.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una premessa: salute non è solo "non essere malati"
      </h2>
      <p>
        Capita di leggere la sesta come "la casa della malattia". È una
        semplificazione antica e poco utile. La sesta descrive il
        rapporto tra una persona e il proprio corpo nel tempo lungo,
        non se si ammalerà di X. Una sesta ben tenuta significa
        riconoscere quando il corpo chiede riposo, costruire abitudini
        che lo sostengono, sapere quando rivolgersi a uno specialista.
        Una sesta vissuta male significa ignorare i segnali finché non
        diventano grossi. Non c'è una predizione di malattia in questa
        casa, c'è un'informazione sullo stile con cui una persona si
        prende cura di sé.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si manifesta con pianeti in sesta casa
      </h2>
      <p>
        <strong>
          <Link to="/glossario/pianeti/mercurio" className="text-primary hover:underline">Mercurio</Link> in sesta casa
        </strong>
        : lavoro mentale dettagliato, scrittura, analisi quotidiana,
        professioni dove serve precisione. Spesso preoccupazione per la
        salute, tendenza a informarsi molto su come funziona il corpo.
      </p>
      <p>
        <strong>Sole in sesta casa</strong>: l'identità si esprime nel
        lavoro quotidiano e nel servizio. Le persone con questa
        posizione si riconoscono in quello che fanno ogni giorno, e
        fanno fatica nei lavori puramente rappresentativi.
      </p>
      <p>
        <strong>Marte in sesta casa</strong>: capacità di sforzo
        prolungato sul lavoro, ma anche frustrazione frequente con
        colleghi, gerarchie, ritmi imposti. Tensione muscolare a volte.
      </p>
      <p>
        <strong>Saturno in sesta casa</strong>: lavoro lungo e
        impegnato, possibile rapporto severo con la propria salute.
        Disciplina alta, a volte rigidità nelle abitudini.
      </p>
      <p>
        <strong>Nettuno in sesta casa</strong>: confine sottile fra
        lavoro quotidiano e dimensione interiore. Possibili lavori di
        cura, oppure rapporto sfumato con il proprio corpo (poco
        ancoraggio fisico, difficoltà a riconoscere i segnali).
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sull'asse sesta-dodicesima
      </h2>
      <p>
        La sesta è opposta alla <Link to="/glossario/case/dodicesima-casa" className="text-primary hover:underline">dodicesima casa</Link>. L'asse descrive il
        rapporto fra dimensione concreta-pratica (sesta) e dimensione
        interiore-immaginativa (dodicesima). Persone che lavorano solo
        sulla sesta senza la dodicesima si esauriscono nell'utilità;
        persone che lavorano solo sulla dodicesima senza la sesta
        rischiano di non concretizzare. L'equilibrio è uno dei lavori
        della maturità professionale.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere la tua sesta casa dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "segni", slug: "vergine" },
    { kind: "glossario", tipo: "pianeti", slug: "mercurio" },
    { kind: "glossario", tipo: "case", slug: "dodicesima-casa" },
    { kind: "guide", slug: "tema-natale-psicologico" },
  ],
};

export default sestaCasa;
