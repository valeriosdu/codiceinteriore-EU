import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const congiunzione: GlossarioEntry = {
  slug: "congiunzione",
  tipo: "aspetti",
  title: "La congiunzione nel tema natale",
  metaTitle: "Congiunzione astrologica: significato | Codice Interiore",
  metaDescription:
    "La congiunzione nel tema natale: quando due pianeti sono vicini e le loro funzioni si fondono. Lettura psicologica dell'aspetto astrologico più forte.",
  heading: "La congiunzione",
  shortDefinition:
    "La congiunzione è l'aspetto astrologico che si forma quando due pianeti si trovano molto vicini nello stesso punto della carta natale. È l'aspetto più intenso: le due funzioni si fondono e agiscono come se fossero una cosa sola.",
  publishedAt: "2026-05-08",
  readingMinutes: 4,
  wordCount: 700,
  keywords: [
    "congiunzione astrologia",
    "congiunzione tema natale",
    "aspetti planetari",
    "aspetti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/aspetti/congiunzione.webp",
    srcSmall: "/illustrations/glossario/aspetti/congiunzione@small.webp",
    alt: "Diagramma astronomico della congiunzione in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta
      </h2>
      <p>
        La congiunzione si forma quando due pianeti del tema natale
        cadono molto vicini, entro un orbita di circa 8-10 gradi. È
        l'aspetto astrologico più forte, ma anche il più ambivalente:
        le due funzioni planetarie non si limitano a interagire, si
        fondono. La persona vive le due cose come se fossero una sola.
        Se i due pianeti hanno qualità simili, la fusione potenzia
        entrambe. Se invece hanno qualità diverse, la persona fatica a
        distinguere quale funzione sta agendo in un dato momento.
      </p>
      <p>
        La congiunzione non è "buona" o "cattiva" di per sé: il segno
        della sua qualità dipende dai pianeti coinvolti. Una
        congiunzione <Link to="/glossario/pianeti/sole" className="text-primary hover:underline">Sole</Link>-<Link to="/glossario/pianeti/mercurio" className="text-primary hover:underline">Mercurio</Link> rende
        identità e pensiero allineati, e produce di solito una persona
        molto coerente fra ciò che pensa e ciò che è. Una congiunzione
        <Link to="/glossario/pianeti/marte" className="text-primary hover:underline"> Marte</Link>-<Link to="/glossario/pianeti/saturno" className="text-primary hover:underline">Saturno</Link>, invece,
        produce conflitto interno fra spinta breve e contenimento di
        lungo periodo, e di solito si manifesta come pressione interna
        prolungata.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si legge
      </h2>
      <p>
        Per leggere una congiunzione bisogna guardare tre cose. Primo,
        quali pianeti sono coinvolti: la loro natura determina la
        natura della fusione. Secondo, in che segno cade la
        congiunzione: il segno colora entrambi i pianeti contemporaneamente.
        Terzo, in che casa cade: la casa indica l'ambito di vita in cui
        i due pianeti agiscono insieme.
      </p>
      <p>
        Le congiunzioni che coinvolgono Sole o Luna sono particolarmente
        importanti perché toccano direttamente l'identità o la
        sicurezza emotiva. Le congiunzioni che coinvolgono pianeti
        transpersonali (Urano, Nettuno, Plutone) sono spesso
        generazionali quando coinvolgono solo questi pianeti tra loro,
        ma diventano molto personali quando coinvolgono un pianeta
        personale e uno transpersonale (per esempio Sole-Plutone, o
        Venere-Nettuno).
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sulla "fusione"
      </h2>
      <p>
        La parola fusione, applicata alla congiunzione, può essere
        fraintesa. Non significa che i due pianeti smettono di esistere
        separatamente. Significa che, per la persona che vive la
        congiunzione, separarli mentalmente richiede lavoro. Per esempio
        chi ha Sole-Saturno congiunti spesso sente "sono io stesso a
        impormi limiti", quando in realtà sono due funzioni diverse
        (identità e disciplina) che hanno imparato a operare insieme. Il
        primo lavoro su una congiunzione è proprio questo: imparare a
        nominare le due funzioni come distinte, anche se nella vita
        quotidiana lavorano in coppia.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere le tue congiunzioni dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "aspetti", slug: "opposizione" },
    { kind: "glossario", tipo: "pianeti", slug: "sole" },
    { kind: "guide", slug: "come-leggere-tema-natale" },
  ],
};

export default congiunzione;
