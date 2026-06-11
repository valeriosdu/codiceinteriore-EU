import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const nodiLunari: GlossarioEntry = {
  slug: "nodi-lunari",
  tipo: "punti",
  title: "I Nodi Lunari nel tema natale",
  metaTitle: "Nodi Lunari nel tema natale: significato | Codice Interiore",
  metaDescription:
    "I Nodi Lunari nel tema natale: l'asse Nodo Nord-Nodo Sud, descrive direzione di crescita e pattern già conosciuti. Lettura psicologica oltre il cliché karmico.",
  heading: "I Nodi Lunari nel tema natale",
  shortDefinition:
    "I Nodi Lunari sono due punti calcolati (non pianeti reali): l'asse Nodo Nord-Nodo Sud. Descrivono la direzione di crescita (Nodo Nord) e l'area di comfort già conosciuta (Nodo Sud), in opposizione esatta a 180°.",
  publishedAt: "2026-05-09",
  readingMinutes: 4,
  wordCount: 720,
  keywords: [
    "nodi lunari tema natale",
    "nodo nord",
    "nodo sud",
    "punti astrologici",
  ],
  coverImage: {
    src: "/illustrations/glossario/punti/nodi-lunari.webp",
    srcSmall: "/illustrations/glossario/punti/nodi-lunari@small.webp",
    alt: "Incisione dei Nodi Lunari in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresentano
      </h2>
      <p>
        I Nodi Lunari non sono pianeti reali: sono i due punti
        matematici in cui l'orbita della <Link to="/glossario/pianeti/luna" className="text-primary hover:underline">Luna</Link> intercetta
        l'eclittica. Sono sempre due, in opposizione esatta a 180°: il
        Nodo Nord e il Nodo Sud. Insieme formano un asse importante della
        carta natale.
      </p>
      <p>
        Nel linguaggio del tema natale psicologico, il Nodo Sud
        descrive un'area di comfort già conosciuta: pattern abituali,
        risorse innate, modi di funzionare che la persona usa per
        difesa quando è sotto pressione. Il Nodo Nord descrive la
        direzione di crescita: quello che la persona non sa ancora
        fare bene, ma che è chiamata a imparare per evolversi nel
        tempo.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si leggono
      </h2>
      <p>
        Il Nodo Sud è familiare ma comfortable in modo regressivo:
        rifugiarcisi spesso significa ripetere un pattern già usato. Il
        Nodo Nord è scomodo, perché chiede di lavorare in un'area in
        cui la persona ha meno strumenti. Per esempio un Nodo Sud in
        Vergine con Nodo Nord in Pesci suggerisce una persona che si è
        formata su precisione e analisi, e che è chiamata a imparare
        permeabilità, ascolto non-analitico, compassione.
      </p>
      <p>
        Il segno e la casa di entrambi i Nodi vanno letti insieme. Il
        Nodo Nord per casa indica l'ambito di vita in cui la crescita
        si gioca; il Nodo Sud per casa indica dove la persona si
        ripiega per istinto.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sul "karma"
      </h2>
      <p>
        I Nodi Lunari sono spesso descritti come "punti karmici",
        legati a vite precedenti. Questa è una lettura legata a una
        cornice religiosa specifica (riincarnazione), che non è
        universale né necessaria. Nel tema natale psicologico i Nodi
        si possono leggere benissimo senza riferimento al karma: il
        Nodo Sud descrive pattern già installati nella psiche
        (provengano dall'infanzia, dall'eredità familiare, o da
        altre fonti), e il Nodo Nord descrive una direzione che la
        struttura della carta indica come crescita possibile. La
        lettura funziona ugualmente senza dover decidere cosa si
        crede su vite precedenti.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere i tuoi Nodi Lunari dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "pianeti", slug: "luna" },
    { kind: "glossario", tipo: "punti", slug: "ascendente" },
    { kind: "guide", slug: "tema-natale-psicologico" },
  ],
};

export default nodiLunari;
