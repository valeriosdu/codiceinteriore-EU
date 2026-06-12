// Frontend funnel registry. Da qui passa solo la STRUTTURA dei funnel
// (slug + id/tipo/ordine delle sezioni report): è il contratto con il
// backend (generate-report restituisce JSON con queste chiavi) e NON si
// traduce. La copy (label, titoli, FAQ, offerte) vive nel catalogo i18n:
// src/i18n/{it,es}/funnels.ts.
//
// To add a new angle:
//   1. Add the slug to FunnelSlug
//   2. Add the section spec to FUNNEL_SECTIONS
//   3. Add the copy to src/i18n/<lang>/funnels.ts for every language
//   4. Wire the landing CTA to /quiz?funnel=<slug>
//   5. Mirror the angle's prompts in supabase/functions/_shared (see
//      process-session-insights and generate-report)

export type FunnelSlug = "classica" | "attivazione";

export type ReportSectionSpec = {
  id: string; // matches the JSON key returned by generate-report
  type?: "prose" | "poem"; // poem rendering is a special case (italic, line-per-line)
};

// Order is the order shown to the reader. Each id must match a JSON key
// returned by generate-report for the corresponding funnel; mismatched ids
// render as empty sections.
export const FUNNEL_SECTIONS: Record<FunnelSlug, ReportSectionSpec[]> = {
  classica: [
    { id: "identity" },
    { id: "emotions" },
    { id: "relationships" },
    { id: "work" },
    { id: "patterns_blocks" },
    { id: "advice" },
    { id: "poem", type: "poem" },
  ],
  attivazione: [
    { id: "identity" },
    { id: "emotions_relationships" },
    { id: "blocks_patterns" },
    { id: "work_direction" },
    { id: "advice" },
    { id: "poem", type: "poem" },
  ],
};

// --- Copy contracts (implementati per lingua in src/i18n/<lang>/funnels.ts) ---

export type FunnelSectionCopy = { label: string; title: string };

export type FunnelCopy = {
  teaser: {
    fallbackInsights: { title: string; body: string }[];
    offerHeadline: string;
    offerSubhead: string;
    reportSectionsList: string[];
    baseOffer: { promise: string; features: string[] };
    trustBullets: string[];
    faqItems: { q: string; a: string }[];
  };
  report: {
    sections: Record<string, FunnelSectionCopy>;
  };
};

// --- Vista composta consumata dalle pagine (stessa shape pre-i18n) ---

export type ReportSectionConfig = {
  id: string;
  label: string;
  title: string;
  type?: "prose" | "poem";
};

export type FunnelUIContent = {
  slug: FunnelSlug;
  teaser: FunnelCopy["teaser"];
  report: {
    sections: ReportSectionConfig[];
  };
};

export function getFunnelContent(
  slug: string | null | undefined,
  funnels: Record<FunnelSlug, FunnelCopy>,
): FunnelUIContent {
  const s: FunnelSlug = slug === "attivazione" ? "attivazione" : "classica";
  const copy = funnels[s];
  return {
    slug: s,
    teaser: copy.teaser,
    report: {
      sections: FUNNEL_SECTIONS[s].map((spec) => ({
        id: spec.id,
        type: spec.type,
        label: copy.report.sections[spec.id]?.label ?? spec.id,
        title: copy.report.sections[spec.id]?.title ?? spec.id,
      })),
    },
  };
}
