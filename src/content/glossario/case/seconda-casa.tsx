import { Link } from "react-router-dom";
import type { GlossarioEntry } from "../../types";

const secondaCasa: GlossarioEntry = {
  slug: "seconda-casa",
  tipo: "case",
  title: "La seconda casa nel tema natale",
  metaTitle: "Seconda casa nel tema natale: significato | Codice Interiore",
  metaDescription:
    "La seconda casa nel tema natale: l'ambito del valore personale, delle risorse, di cosa una persona considera proprio. Lettura psicologica oltre il cliché 'denaro'.",
  heading: "La seconda casa nel tema natale",
  shortDefinition:
    "La seconda casa, nel tema natale, descrive l'ambito del valore proprio: cosa una persona considera suo, come gestisce risorse materiali e talenti, come misura il proprio peso interno.",
  publishedAt: "2026-05-05",
  readingMinutes: 4,
  wordCount: 740,
  keywords: [
    "seconda casa tema natale",
    "denaro astrologia",
    "case astrologiche",
    "valore personale",
  ],
  coverImage: {
    src: "/illustrations/glossario/case/seconda-casa.webp",
    srcSmall: "/illustrations/glossario/case/seconda-casa@small.webp",
    alt: "Incisione della seconda casa astrologica in stile editoriale vintage",
    width: 1600,
    height: 900,
  },
  body: (
    <>
      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Cosa rappresenta come ambito
      </h2>
      <p>
        La seconda casa descrive l'ambito del valore proprio. Cosa una
        persona considera suo, come si rapporta alle risorse materiali,
        quali talenti riconosce come parte stabile di sé, come misura il
        proprio peso interno. È la casa del denaro, sì, ma in un senso
        più largo: descrive il rapporto con tutto quello che resta dopo
        che gli altri se ne vanno (quello che si possiede, quello che si
        sa fare, quello a cui si è arrivati con lavoro proprio).
      </p>
      <p>
        Nel tema natale lo stile della seconda casa dipende dal segno
        zodiacale sul quale cade. Una seconda in <Link to="/glossario/segni/toro" className="text-primary hover:underline">Toro</Link> produce
        un rapporto stabile e tattile con il possesso. Una seconda in
        Gemelli produce un rapporto fluttuante e plurale: si guadagna
        attraverso più fonti, si spende con leggerezza. Una seconda in
        Capricorno produce un rapporto serio e di lungo periodo: si
        costruisce un patrimonio lentamente e con disciplina.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una premessa: il valore non è solo monetario
      </h2>
      <p>
        Capita di leggere la seconda casa come "la casa del denaro" e
        basta. Questa lettura è funzionale ma stretta. La seconda casa
        descrive il valore in senso più ampio: include i talenti che una
        persona riconosce come suoi, le competenze costruite,
        l'autostima legata a quello che produce, il modo in cui si dà un
        prezzo nel mercato. Una persona può avere una seconda casa
        difficile non perché manchino i soldi, ma perché non riesce a
        riconoscere il proprio valore e a chiederlo. Viceversa, può
        avere risorse abbondanti senza saperle gestire perché manca un
        rapporto stabile con il piano materiale.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Come si manifesta con pianeti in seconda casa
      </h2>
      <p>
        <strong>
          <Link to="/glossario/pianeti/venere" className="text-primary hover:underline">Venere</Link> in seconda casa
        </strong>
        : il gusto si lega al possesso. La persona ama oggetti di
        qualità, ambienti curati, comfort. Spesso attrae risorse
        naturalmente perché il rapporto con la bellezza è anche un
        rapporto con il valore monetario.
      </p>
      <p>
        <strong>Sole in seconda casa</strong>: l'identità si costruisce
        attraverso quello che si possiede e si produce. La persona si
        riconosce nel proprio lavoro materiale, nelle proprie risorse,
        e fatica quando queste vengono messe in discussione.
      </p>
      <p>
        <strong>Giove in seconda casa</strong>: tendenza a espandere le
        risorse. Si guadagna spesso bene, ma si tende anche a non
        trattenere: il flusso è facile in entrambe le direzioni.
      </p>
      <p>
        <strong>Saturno in seconda casa</strong>: rapporto serio e a
        volte ansioso con il denaro. Si costruisce lentamente, si
        controlla la spesa, c'è paura di non avere abbastanza anche
        quando oggettivamente c'è.
      </p>
      <p>
        <strong>Plutone in seconda casa</strong>: tema profondo sul
        valore proprio. Cicli di guadagno e perdita radicali, e una
        relazione intensa con il proprio potere economico.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8 mb-3">
        Una nota sull'asse seconda-ottava
      </h2>
      <p>
        La seconda è opposta all'<Link to="/glossario/case/ottava-casa" className="text-primary hover:underline">ottava casa</Link>, e l'asse descrive il
        rapporto tra "quello che è mio" e "quello che si condivide". La
        seconda è proprietà personale, l'ottava è risorse condivise
        (eredità, denaro di coppia, fondi comuni). Tensioni su questo
        asse spesso producono difficoltà nel passare dal proprio
        personale al condiviso e viceversa.
      </p>

      <p className="mt-6 text-muted-foreground">
        Per leggere la tua seconda casa dentro la geografia completa
        della tua carta natale puoi <Link to="/quiz" className="text-primary hover:underline">iniziare il quiz</Link>.
      </p>
    </>
  ),
  related: [
    { kind: "glossario", tipo: "segni", slug: "toro" },
    { kind: "glossario", tipo: "pianeti", slug: "venere" },
    { kind: "glossario", tipo: "case", slug: "ottava-casa" },
    { kind: "guide", slug: "tema-natale-psicologico" },
  ],
};

export default secondaCasa;
