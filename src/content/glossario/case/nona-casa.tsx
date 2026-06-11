import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const nonaCasa: GlossarioEntry = {
  slug: "nona-casa",
  tipo: "case",
  title: "La nona casa nel tema natale",
  metaTitle: "Nona casa nel tema natale: significato | Codice Interiore",
  metaDescription:
    "La nona casa nel tema natale: l'ambito della conoscenza superiore, dei viaggi lunghi, della filosofia, del senso. Lettura psicologica.",
  heading: "La nona casa nel tema natale",
  shortDefinition:
    "La nona casa, nel tema natale, descrive l'ambito della conoscenza ampia: studio superiore, filosofia, viaggi lunghi, cornici di senso, contatto con culture diverse dalla propria.",
  publishedAt: "2026-05-07",
  readingMinutes: 4,
  wordCount: 720,
  keywords: [
    "nona casa tema natale",
    "viaggi astrologia",
    "filosofia astrologia",
    "case astrologiche",
  ],
  coverImage: {
    src: "/illustrations/glossario/case/nona-casa.webp",
    srcSmall: "/illustrations/glossario/case/nona-casa@small.webp",
    alt: "Incisione della nona casa astrologica in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta come ambito
      </h2>
      <p>
        La nona casa descrive l'ambito della conoscenza ampia. Studio
        superiore, filosofia, religione, lingue straniere, viaggi
        lunghi, contatto con culture diverse dalla propria. È la zona
        in cui una persona cerca cornici di senso più grandi del
        quotidiano: cosa significa "vivere bene", in che mondo si
        muove, da quale orizzonte di valori si guarda quello che
        succede.
      </p>
      <p>
        Nel tema natale lo stile della nona dipende dal segno
        zodiacale sul quale cade. Una nona in <Link to="/glossario/segni/sagittario" className="text-primary hover:underline">Sagittario</Link> produce
        attrazione naturale per viaggi e filosofia. Una nona in
        Capricorno produce un approccio serio e strutturato allo
        studio. Una nona in Pesci produce attrazione per dimensioni
        spirituali, mistiche, artistiche.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una premessa: nona non è "fortuna in viaggio"
      </h2>
      <p>
        La nona viene a volte ridotta alla "casa dei viaggi" in modo
        turistico. È una semplificazione. Quello che la nona descrive
        è il rapporto fra una persona e l'ampio: come costruisce
        visione, come integra culture diverse dalla propria, come
        elabora il senso di quello che vive. Il viaggio fisico è la
        forma più visibile, ma anche lo studio universitario, la
        lettura sistematica di un autore, la conversione religiosa,
        l'apertura a una scuola di pensiero diversa dalla propria
        formazione rientrano qui.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si manifesta con pianeti in nona casa
      </h2>
      <p>
        <strong>
          <Link to="/glossario/pianeti/giove" className="text-primary hover:underline">Giove</Link> in nona casa
        </strong>
        : è la posizione "a casa". Espansione culturale, attrazione per
        viaggi e studio, cornici di significato larghe. Spesso lavori
        legati all'insegnamento o all'editoria.
      </p>
      <p>
        <strong>Sole in nona casa</strong>: l'identità si costruisce
        attraverso esperienze ampie, viaggi formativi, contatto con
        contesti culturali diversi.
      </p>
      <p>
        <strong>Mercurio in nona casa</strong>: pensiero sintetico,
        capacità di tenere insieme idee provenienti da fonti diverse.
        Possibile professione legata alla scrittura ampia, traduzione,
        insegnamento.
      </p>
      <p>
        <strong>Saturno in nona casa</strong>: studio impegnato e di
        lungo periodo, rapporto serio con la conoscenza, possibile
        figura di mentore importante o assenza di mentore necessaria.
      </p>
      <p>
        <strong>Nettuno in nona casa</strong>: attrazione per
        spiritualità, arte, dimensioni non razionali della conoscenza.
        Rischio di idealizzare un sistema di pensiero.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sull'asse terza-nona
      </h2>
      <p>
        La nona è opposta alla <Link to="/glossario/case/terza-casa" className="text-primary hover:underline">terza casa</Link>. L'asse descrive il
        movimento dalla conoscenza locale (terza) alla conoscenza
        ampia (nona). Un'asse ben integrata produce una mente che sa
        tenere insieme dettaglio quotidiano e visione larga.
        Sbilanciata sulla nona, una persona può sapere molto del
        mondo ma poco della propria strada in città; sbilanciata sulla
        terza, può conoscere tutti i vicini e mai aver letto un libro
        che le abbia spostato la cornice di partenza.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere la tua nona casa dentro la geografia completa della
        tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "segni", slug: "sagittario" },
    { kind: "glossario", tipo: "pianeti", slug: "giove" },
    { kind: "glossario", tipo: "case", slug: "terza-casa" },
    { kind: "guide", slug: "come-leggere-tema-natale" },
  ],
};

export default nonaCasa;
