import { motion } from 'framer-motion';

interface InsightCardProps {
  title: string;
  body: string;
  index?: number;
}

// Numerazione romana in corsivo garamond, la stessa grammatica dei capitoli
// delle landing /lp/* (ChapterHeading in components/lp/EditorialChrome.tsx).
// Gli insight sono sempre 3 — process-session-insights lo impone nel prompt —
// quindi basta una tabellina, con la cifra araba come rete di sicurezza.
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Il body arriva dal modello come 2-3 frasi di seguito (max 50 parole, vedi
// process-session-insights). Rese in un unico paragrafo si leggono come un
// blocco compatto e vengono saltate: staccare la prima frase le dà il ruolo di
// gancio e lascia il resto come approfondimento. La classe di chiusura accetta
// anche le virgolette curve (”’) perché in inglese e olandese la frase finisce
// spesso dentro la citazione. Niente lookbehind per le abbreviazioni: lancia
// SyntaxError a parse time sui Safari iOS vecchi e farebbe cadere l'intero bundle.
// Al suo posto un lookahead: si stacca solo se la frase dopo comincia con una
// maiuscola (o ¿ ¡ « “), cosi' "bijv. erkenning" o "Forse... non" restano interi.
// body puo' mancare: process-session-insights non valida i singoli item.
const splitLead = (body: string | undefined): [string, string] => {
  const text = (body ?? '').trim();
  const match = text.match(/^(.+?[.!?…]["'»”’)]?)\s+(?=[\p{Lu}¿¡"“«(])(.+)$/su);
  return match ? [match[1], match[2]] : [text, ''];
};

const InsightCard = ({ title, body, index = 0 }: InsightCardProps) => {
  const [lead, rest] = splitLead(body);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="rounded-xl border border-border bg-card px-6 py-4 md:px-7 md:py-5 h-full transition-[border-color,box-shadow] duration-300 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 font-display text-lg md:text-xl font-semibold leading-snug text-foreground">
          {title}
        </h3>
        <span
          aria-hidden="true"
          className="shrink-0 font-editorial italic text-[26px] leading-none text-primary/70"
        >
          {ROMAN[index] ?? index + 1}.
        </span>
      </div>

      <p className="mt-2 text-[15px] md:text-base leading-relaxed text-foreground/85">{lead}</p>
      {rest && (
        <p className="mt-1.5 text-sm md:text-[15px] leading-relaxed text-muted-foreground">{rest}</p>
      )}
    </motion.div>
  );
};

export default InsightCard;
