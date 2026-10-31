import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/I18nProvider";
import ChartDetail, { type BridgeVariant } from "./ChartDetail";
import { PLANET_GLYPHS, glyphStroke, type PlanetKey } from "./glyphs";

// Schermata dopo la domanda 1 del funnel attivazione: un titolo legato alla
// risposta, un dettaglio di carta (illustrativo) che mostra cosa si legge in un
// tema natale e la prova sociale. Contenuto e variante dipendono dall'indice
// della risposta nell'elenco opzioni, cosi' funziona identico in ogni lingua.

type LegendKind = PlanetKey | "ac" | "mc" | "square" | "phase";

const LEGEND_KINDS: Record<BridgeVariant, LegendKind[]> = {
  0: ["moon", "mercury", "ac"],
  1: ["mars", "saturn", "square"],
  2: ["mc", "northNode"],
  3: ["saturn", "jupiter", "phase"],
};

const LegendGlyph = ({ kind }: { kind: LegendKind }) => (
  <svg aria-hidden="true" viewBox="-12 -12 24 24" className="h-6 w-6 shrink-0 text-primary">
    <circle r="10.5" fill="hsl(var(--card))" stroke="currentColor" strokeWidth="1.2" />
    {kind === "ac" || kind === "mc" ? (
      <text
        textAnchor="middle"
        y="3.2"
        fontSize="8.5"
        fill="currentColor"
        className="font-display"
        fontWeight="600"
      >
        {kind === "ac" ? "AC" : "MC"}
      </text>
    ) : (
      <g transform="scale(0.95)" {...glyphStroke}>
        {kind === "square" ? (
          <rect x="-4" y="-4" width="8" height="8" />
        ) : kind === "phase" ? (
          <path d="M -5.5 3 A 6 6 0 0 1 5.5 3" strokeWidth="2.2" />
        ) : (
          PLANET_GLYPHS[kind]
        )}
      </g>
    )}
  </svg>
);

interface QuizBridgeProps {
  variant: BridgeVariant;
}

const QuizBridge = ({ variant }: QuizBridgeProps) => {
  const { m } = useI18n();
  const b = m.quiz.steps.bridge;
  const v = b.variants[variant];
  const proof = m.landingAttivazione.hero;
  const kinds = LEGEND_KINDS[variant];

  return (
    <div className="space-y-4">
      <h2 className="font-display text-[1.6rem] font-semibold leading-[1.2] text-foreground">{v.headline}</h2>
      <p className="text-sm leading-relaxed text-foreground/75">{v.body}</p>

      <motion.figure
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_-14px_hsl(var(--foreground)/0.18)]"
      >
        <div className="flex items-center gap-2 px-3.5 pt-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary/70" aria-hidden="true" />
          {b.exampleLabel}
        </div>
        <div className="flex items-center gap-1 px-2 pb-1">
          <ChartDetail variant={variant} className="h-auto w-[56%] shrink-0" />
          <ul className="flex-1 space-y-2.5 pr-2">
            {kinds.map((kind, i) => (
              <li key={kind} className="flex items-center gap-2">
                <LegendGlyph kind={kind} />
                <span className="text-[13px] font-medium leading-tight text-foreground/85">{v.legend[i]}</span>
              </li>
            ))}
          </ul>
        </div>
        <figcaption className="border-t border-border/60 bg-surface/60 px-3.5 py-2.5 text-[13px] leading-snug text-foreground/80">
          <span className="font-semibold text-primary">{b.showsLabel}</span> {v.shows}
        </figcaption>
      </motion.figure>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5 text-center">
        <Sparkles className="mx-auto mb-1 h-4 w-4 text-primary/70" aria-hidden="true" />
        <p className="font-display text-[1.7rem] font-semibold leading-tight text-primary lining-nums">{proof.socialProofLine1}</p>
        <p className="mt-0.5 text-sm text-foreground/75">{proof.socialProofLine2}</p>
      </div>
    </div>
  );
};

export default QuizBridge;
