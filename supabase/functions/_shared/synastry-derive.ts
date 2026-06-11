// Helper per derivare strutture extra dal payload Detailed di /synastry,
// senza dover chiamare l'endpoint Cards.

interface AspectLike {
  a_point: string;
  b_point: string;
  aspect: string;
  polarity?: string;
  strength?: number;
  strength_label?: string;
  categories?: string[];
  themes?: string[];
}

/** Restituisce i top N aspetti ordinati per strength discendente. */
export function topAspects<T extends { strength?: number }>(
  aspects: T[] | undefined,
  n: number,
): T[] {
  if (!aspects) return [];
  return [...aspects]
    .sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0))
    .slice(0, n);
}

/** Restituisce i top N aspetti supportive ordinati per strength. */
export function topSupportive<T extends AspectLike>(
  aspects: T[] | undefined,
  n: number,
): T[] {
  if (!aspects) return [];
  return [...aspects]
    .filter((a) => a.polarity === "supportive")
    .sort((x, y) => (y.strength ?? 0) - (x.strength ?? 0))
    .slice(0, n);
}

/** Restituisce i top N aspetti challenging ordinati per strength. */
export function topChallenging<T extends AspectLike>(
  aspects: T[] | undefined,
  n: number,
): T[] {
  if (!aspects) return [];
  return [...aspects]
    .filter((a) => a.polarity === "challenging")
    .sort((x, y) => (y.strength ?? 0) - (x.strength ?? 0))
    .slice(0, n);
}

/**
 * Raggruppa gli aspetti per dominio (`categories`) e ranka per strength.
 * Sostituisce drivers_by_domain dell'endpoint Cards.
 */
export function driversByDomain<T extends AspectLike>(
  aspects: T[] | undefined,
): Record<string, T[]> {
  if (!aspects) return {};
  const out: Record<string, T[]> = {};
  for (const a of aspects) {
    for (const cat of a.categories ?? []) {
      if (!out[cat]) out[cat] = [];
      out[cat].push(a);
    }
  }
  for (const cat of Object.keys(out)) {
    out[cat].sort((x, y) => (y.strength ?? 0) - (x.strength ?? 0));
  }
  return out;
}
