import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const quintaCasa: GlossarioEntry = {
  slug: "quinta-casa",
  tipo: "case",
  title: "La quinta casa nel tema natale",
  metaTitle: "Quinta casa nel tema natale: significato | Codice Interiore",
  metaDescription:
    "La quinta casa nel tema natale: l'ambito dell'espressione creativa, del gioco, dei figli, del piacere. Lettura psicologica oltre il cliché 'casa dell'amore'.",
  heading: "La quinta casa nel tema natale",
  shortDefinition:
    "La quinta casa, nel tema natale, descrive l'ambito dell'espressione creativa: dove una persona si gioca, cosa produce per piacere proprio, come investe in figli, opere e ambiti di amore non utilitario.",
  publishedAt: "2026-05-05",
  readingMinutes: 4,
  wordCount: 740,
  keywords: [
    "quinta casa tema natale",
    "creatività astrologia",
    "case astrologiche",
    "figli astrologia",
  ],
  coverImage: {
    src: "/illustrations/glossario/case/quinta-casa.webp",
    srcSmall: "/illustrations/glossario/case/quinta-casa@small.webp",
    alt: "Incisione della quinta casa astrologica in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta come ambito
      </h2>
      <p>
        La quinta casa descrive l'ambito dell'espressione creativa.
        Quello che una persona produce per piacere proprio, dove si
        gioca, cosa fa solo perché le piace farlo. Include la
        creatività in senso artistico, la genitorialità intesa come
        produzione di qualcosa che continua dopo di sé, le storie
        amorose intese come espressione di sé, e in generale tutti gli
        ambiti in cui c'è investimento personale senza finalità
        utilitaria immediata.
      </p>
      <p>
        Nel tema natale lo stile della quinta casa dipende dal segno
        zodiacale sul quale cade. Una quinta in <Link to="/glossario/segni/leone" className="text-primary hover:underline">Leone</Link> produce
        un'espressione esuberante, scenica, ben visibile. Una quinta in
        Vergine produce un'espressione meticolosa, artigianale, attenta
        al dettaglio. Una quinta in Sagittario produce un'espressione
        narrativa, mossa, attraversata da entusiasmo.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una premessa: non è solo "la casa dell'amore"
      </h2>
      <p>
        Capita di leggere la quinta come "la casa dell'amore" o "la
        casa dei figli", e questa riduzione semplifica troppo. Quello
        che la quinta casa descrive è un piano specifico: dove una
        persona si esprime senza dover essere produttiva. L'amore
        rientra qui se è amore espressivo (storie passionali,
        innamoramento creativo, gusto di sedurre), non se è amore
        responsabile e duraturo (quello è più piano della <Link to="/glossario/case/settima-casa" className="text-primary hover:underline">settima casa</Link>).
        I figli rientrano qui se sono pensati come "estensione creativa
        di sé", non come responsabilità domestica (quella è quarta
        casa).
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si manifesta con pianeti in quinta casa
      </h2>
      <p>
        <strong>
          <Link to="/glossario/pianeti/sole" className="text-primary hover:underline">Sole</Link> in quinta casa
        </strong>
        : l'identità si esprime in modo creativo e visibile. La persona
        ha bisogno di un palco, anche piccolo, in cui mostrare quello
        che è. Cresce in ambiti artistici, espressivi, o legati ai
        bambini.
      </p>
      <p>
        <strong>Venere in quinta casa</strong>: amore espressivo, gusto
        per la seduzione, vita romantica spesso ricca di episodi
        memorabili. La creatività è centrale nelle scelte di vita.
      </p>
      <p>
        <strong>Marte in quinta casa</strong>: l'energia attiva si
        esprime attraverso competizione ludica, sport, attività
        creative dinamiche. Vita amorosa intensa e passionale,
        soprattutto in gioventù.
      </p>
      <p>
        <strong>Saturno in quinta casa</strong>: difficoltà nel
        lasciarsi andare al gioco. Spesso ritardo o tema impegnativo
        legato ai figli. La creatività esiste ma si esprime in modo
        serio, controllato, con consapevolezza del costo.
      </p>
      <p>
        <strong>Nettuno in quinta casa</strong>: creatività onirica,
        capacità di accedere all'immaginazione profonda. Romanticismo
        idealizzato. Rapporto con i figli sfumato, a volte simbiotico.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sul "gioco"
      </h2>
      <p>
        Il gioco, nel piano della quinta casa, non è infantilismo. È
        una funzione adulta importante: fare qualcosa senza che ci sia
        un esito misurabile, lasciarsi attraversare da quello che si
        sta facendo, produrre per espressione e non per scopo. Una
        persona che ha lavorato bene la propria quinta casa sa
        riconoscere quando le serve un'ora di gioco e non si sente in
        colpa a prenderla. Una persona che vive male questa casa
        riempie il proprio tempo solo di compiti utili e poi si chiede
        perché manca di vitalità.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere la tua quinta casa dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "segni", slug: "leone" },
    { kind: "glossario", tipo: "pianeti", slug: "sole" },
    { kind: "glossario", tipo: "case", slug: "undicesima-casa" },
    { kind: "guide", slug: "tema-natale-psicologico" },
  ],
};

export default quintaCasa;
