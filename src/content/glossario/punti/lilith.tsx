import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const lilith: GlossarioEntry = {
  slug: "lilith",
  tipo: "punti",
  title: "Lilith nel tema natale",
  metaTitle: "Lilith (Luna Nera) nel tema natale: significato | Codice Interiore",
  metaDescription:
    "Lilith nel tema natale: la Luna Nera, punto dell'istintuale escluso, del femminile non addomesticato. Lettura psicologica oltre il cliché 'oscuro'.",
  heading: "Lilith nel tema natale",
  shortDefinition:
    "Lilith, detta anche Luna Nera, è un punto matematico della carta natale (apogeo dell'orbita lunare). Descrive la zona di sé che è stata esclusa, censurata o trattata come pericolosa, e che a volte ritorna in forma rabbiosa o sovversiva.",
  publishedAt: "2026-05-09",
  readingMinutes: 4,
  wordCount: 720,
  keywords: [
    "lilith tema natale",
    "luna nera",
    "lilith astrologia",
    "punti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/punti/lilith.webp",
    srcSmall: "/illustrations/glossario/punti/lilith@small.webp",
    alt: "Incisione di Lilith Luna Nera in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        Lilith non è un pianeta reale: è un punto matematico calcolato
        sull'apogeo dell'orbita lunare, cioè il punto in cui la
        <Link to="/glossario/pianeti/luna" className="text-primary hover:underline"> Luna</Link> si trova più
        lontana dalla Terra. Esistono diverse definizioni di Lilith
        usate in astrologia (Lilith Vera, Lilith Media, Lilith reale
        come asteroide); la più diffusa è la "Luna Nera Media", quella
        che la maggior parte dei software di calcolo riportano per
        default.
      </p>
      <p>
        Simbolicamente Lilith descrive la zona di sé che è stata
        esclusa, censurata o trattata come pericolosa. Prende il nome
        dalla figura mitologica di Lilith, prima compagna di Adamo in
        una tradizione rabbinica, allontanata dall'Eden per non aver
        accettato di sottomettersi. In una carta natale, Lilith
        descrive il punto in cui la persona si scontra con quello che
        ha imparato a non poter essere, e che ritorna spesso in forme
        oblique: rabbia improvvisa, attrazione per quello che non
        dovrebbe attrarre, ribellione apparentemente "fuori contesto".
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si legge
      </h2>
      <p>
        Lilith si legge per segno e per casa. Il segno descrive la
        qualità di quello che è stato escluso: una Lilith in Toro
        riguarda piacere fisico e possesso, una Lilith in Vergine
        riguarda il rapporto col corpo e la sua imperfezione, una
        Lilith in Capricorno riguarda l'esercizio del potere e
        dell'autorità femminile, e così via. La casa descrive l'ambito
        di vita in cui questo materiale ritorna.
      </p>
      <p>
        Una persona con Lilith in <Link to="/glossario/case/settima-casa" className="text-primary hover:underline">settima casa</Link>, per esempio, può
        scoprire che certe partner intime attivano in lei aggressività
        o desiderio di rottura inspiegabili: sta lavorando attraverso
        la relazione su materiale che ha imparato a non poter
        esprimere. Una persona con Lilith in <Link to="/glossario/case/decima-casa" className="text-primary hover:underline">decima casa</Link> può
        avere un rapporto carico con il proprio ruolo pubblico,
        attratta da forme di esposizione che la società circostante
        considera "non appropriate" per qualcuno con la sua
        biografia.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sul "lato oscuro"
      </h2>
      <p>
        Lilith viene spesso descritta come "il lato oscuro" della
        carta, e questa etichetta produce drammatizzazione. Nel tema
        natale psicologico Lilith non è oscura in senso morale: è
        rimossa. La differenza è importante. Quello che è stato rimosso
        non è cattivo, è solo non integrato. Una persona che riconosce
        la propria Lilith e impara a darle un posto guadagna accesso a
        una zona di forza che prima funzionava solo come sabotaggio.
        Le persone che non la riconoscono tendono a vederne le
        manifestazioni come "cose strane che mi succedono", senza
        notare che il punto comune è loro.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere la tua Lilith dentro la geografia completa della
        tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "pianeti", slug: "luna" },
    { kind: "glossario", tipo: "pianeti", slug: "plutone" },
    { kind: "glossario", tipo: "punti", slug: "chirone" },
    { kind: "guide", slug: "tema-natale-psicologico" },
  ],
};

export default lilith;
