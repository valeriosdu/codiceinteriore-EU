// buildSynastryBrief: assembles the compact brief passed to the model for the
// synastry report. The brief holds structural data + short ENGLISH labels
// pre-formatted from the lookup tables (neutral): the report's output language
// is set by the prompt directive, not by these labels.

import { calcolaEta, fasciaEtaCoppia, gapSignificativo, FasciaEta } from "./synastry-age-bands.ts";
import { formatAspectForBrief, AspectInput, PLANET_IT } from "./synastry-aspect-labels.ts";
import { formatHouseOverlayForBrief, houseOverlayRelevance } from "./synastry-house-themes.ts";
import { topAspects, topSupportive, topChallenging } from "./synastry-derive.ts";
import { getArchetypeMeta } from "./synastry-archetypes.ts";

const SIGN_IT: Record<string, string> = {
  Ari: "Aries", Tau: "Taurus", Gem: "Gemini", Can: "Cancer",
  Leo: "Leo", Vir: "Virgo", Lib: "Libra", Sco: "Scorpio",
  Sag: "Sagittarius", Cap: "Capricorn", Aqu: "Aquarius", Pis: "Pisces",
};

const MONTH_IT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export interface BirthData {
  name: string;
  birthDate: { day: number; month: number; year: number };
  timeKnown: boolean;
}

export interface SynastryBriefInput {
  personA: BirthData;
  personB: BirthData;
  chartA: any; // raw natal payload con planets[]
  chartB: any;
  synastryData: any; // raw payload /api/v1/western/synastry
  relationshipDuration: string | null;
}

export interface SynastryBrief {
  persone: {
    a: string;
    b: string;
  };
  note_contesto: {
    eta_a: number;
    eta_b: number;
    differenza_eta: number;
    fascia_eta_coppia: FasciaEta;
    gap_significativo: boolean;
    durata_relazione: string | null;
    ora_nascita_a_known: boolean;
    ora_nascita_b_known: boolean;
  };
  archetipo: {
    id: string;
    nome: string;
    definizione_breve: string;
  };
  scores: {
    sintonia_emotiva: number;
    attrazione: number;
    comunicazione: number;
    stabilita: number;
    crescita: number;
    tensione: number;
  };
  aspetti_chiave: string[];
  case_significative: string[];
  punti_forza: string[];
  sfide: string[];
}

function extractSignFromChart(chart: any, planetId: string): string {
  const planets = chart?.planets ?? [];
  const p = planets.find((pl: any) => pl?.id === planetId);
  if (!p) return "";
  return SIGN_IT[p.sign] ?? p.sign ?? "";
}

function shortDate(d: { day: number; month: number; year: number }): string {
  const m = MONTH_IT[d.month - 1] ?? String(d.month);
  return `${d.day} ${m} ${d.year}`;
}

function personLine(p: BirthData, chart: any, eta: number): string {
  const sun = extractSignFromChart(chart, "sun");
  const moon = extractSignFromChart(chart, "moon");
  const asc = extractSignFromChart(chart, "asc");

  const segs = [
    `${p.name}, ${eta} years old, ${shortDate(p.birthDate)}`,
  ];
  if (sun) segs.push(`Sun ${sun}`);
  if (moon) segs.push(`Moon ${moon}`);
  if (asc && p.timeKnown) segs.push(`Asc ${asc}`);
  return segs.join(", ");
}

function clampScore(v: any): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function mapScoreLabel(raw: Record<string, any> | undefined): SynastryBrief["scores"] {
  const r = raw ?? {};
  return {
    sintonia_emotiva: clampScore(r.intimacy ?? r.emotional ?? r.romance ?? 0),
    attrazione: clampScore(r.romance ?? 0),
    comunicazione: clampScore(r.communication ?? 0),
    stabilita: clampScore(r.stability ?? 0),
    crescita: clampScore(r.growth ?? 0),
    tensione: clampScore(r.tension ?? 0),
  };
}

export function buildSynastryBrief(input: SynastryBriefInput): SynastryBrief {
  const { personA, personB, chartA, chartB, synastryData, relationshipDuration } = input;

  const etaA = calcolaEta(personA.birthDate);
  const etaB = calcolaEta(personB.birthDate);
  const archetipoId =
    synastryData?.synastry?.archetype?.id ??
    synastryData?.archetype?.id ??
    "balanced_connection";
  const archetipoMeta = getArchetypeMeta(archetipoId);

  const EXCLUDED_ASPECTS = new Set(["quincunx", "semisextile", "semisquare", "sesquisquare"]);
  const rawAspects: AspectInput[] = (synastryData?.synastry?.aspects ?? []) as AspectInput[];
  const filteredAspects = rawAspects.filter((a) => !EXCLUDED_ASPECTS.has(a.aspect));
  const top12 = topAspects(filteredAspects as any[], 12) as AspectInput[];

  const aspetti_chiave = top12.map((a) =>
    formatAspectForBrief(a, personA.name, personB.name),
  );

  // Top supportive/challenging escludendo gli aspetti gia in aspetti_chiave per evitare ridondanza
  const top12Keys = new Set(top12.map((a) => `${a.a_point}-${a.b_point}-${a.aspect}`));
  const aspectsForStrengthsChallenges = filteredAspects.filter(
    (a) => !top12Keys.has(`${a.a_point}-${a.b_point}-${a.aspect}`),
  );
  const punti_forza = topSupportive(aspectsForStrengthsChallenges as any[], 3).map((a) =>
    formatAspectForBrief(a as AspectInput, personA.name, personB.name),
  );
  const sfide = topChallenging(aspectsForStrengthsChallenges as any[], 3).map((a) =>
    formatAspectForBrief(a as AspectInput, personA.name, personB.name),
  );

  // House overlays: API restituisce {a_in_b: [...], b_in_a: [...]}
  const aInBRaw = synastryData?.synastry?.house_overlays?.a_in_b ?? [];
  const bInARaw = synastryData?.synastry?.house_overlays?.b_in_a ?? [];

  type OverlayItem = { planet: string; house: number; relevance: number; line: string };
  const overlays: OverlayItem[] = [];

  if (personB.timeKnown) {
    for (const ov of aInBRaw) {
      const planet = ov?.point ?? ov?.planet;
      const house = Number(ov?.target_house ?? ov?.house);
      if (!planet || !Number.isFinite(house)) continue;
      overlays.push({
        planet,
        house,
        relevance: houseOverlayRelevance(planet, house),
        line: formatHouseOverlayForBrief({
          planet,
          house,
          fromPersonName: personA.name,
          toPersonName: personB.name,
        }),
      });
    }
  }
  if (personA.timeKnown) {
    for (const ov of bInARaw) {
      const planet = ov?.point ?? ov?.planet;
      const house = Number(ov?.target_house ?? ov?.house);
      if (!planet || !Number.isFinite(house)) continue;
      overlays.push({
        planet,
        house,
        relevance: houseOverlayRelevance(planet, house),
        line: formatHouseOverlayForBrief({
          planet,
          house,
          fromPersonName: personB.name,
          toPersonName: personA.name,
        }),
      });
    }
  }
  overlays.sort((x, y) => y.relevance - x.relevance);
  const case_significative = overlays.slice(0, 7).map((o) => o.line);

  const scoresRaw = synastryData?.synastry?.scores ?? {};

  return {
    persone: {
      a: personLine(personA, chartA, etaA),
      b: personLine(personB, chartB, etaB),
    },
    note_contesto: {
      eta_a: etaA,
      eta_b: etaB,
      differenza_eta: Math.abs(etaA - etaB),
      fascia_eta_coppia: fasciaEtaCoppia(etaA, etaB),
      gap_significativo: gapSignificativo(etaA, etaB),
      durata_relazione: relationshipDuration,
      ora_nascita_a_known: personA.timeKnown,
      ora_nascita_b_known: personB.timeKnown,
    },
    archetipo: {
      id: archetipoId,
      nome: archetipoMeta.label,
      definizione_breve: archetipoMeta.definizione,
    },
    scores: mapScoreLabel(scoresRaw),
    aspetti_chiave,
    case_significative,
    punti_forza,
    sfide,
  };
}

/** Estrae l'overall score 0-100 dal raw payload. */
export function extractOverallScore(synastryData: any): number {
  const raw = synastryData?.synastry?.scores?.overall;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

/** Estrae l'archetipo ID dal raw payload. */
export function extractArchetypeId(synastryData: any): string {
  return (
    synastryData?.synastry?.archetype?.id ??
    synastryData?.archetype?.id ??
    "balanced_connection"
  );
}
