// Hero visual SVG per ogni sezione del report sinastria.
// Glifi astrologici tematici composti, palette warm coerente con CHART_CONFIG.

import { ReactNode } from 'react';

interface SectionHeroProps {
  section: number;
  size?: number;
}

const STROKE = '#8D4A35';
const SOFT = '#A7654A';

const HERO_PATHS: Record<number, () => ReactNode> = {
  1: () => (
    // Sole + Luna intrecciati (ritratto coppia)
    <g fill="none" stroke={STROKE} strokeWidth={1.6}>
      <circle cx="42" cy="36" r="14" />
      <circle cx="42" cy="36" r="3" fill={STROKE} />
      <path d="M70 36a14 14 0 1 0 0 0.01" />
      <path d="M70 36c-4 0-8 4-8 14 0 6 4 14 8 14" stroke={SOFT} />
    </g>
  ),
  2: () => (
    // Venere + Marte (attrazione)
    <g fill="none" stroke={STROKE} strokeWidth={1.6}>
      <circle cx="40" cy="34" r="10" />
      <line x1="40" y1="44" x2="40" y2="60" />
      <line x1="34" y1="54" x2="46" y2="54" />
      <circle cx="76" cy="38" r="9" />
      <line x1="83" y1="31" x2="92" y2="22" />
      <line x1="92" y1="22" x2="86" y2="22" />
      <line x1="92" y1="22" x2="92" y2="28" />
    </g>
  ),
  3: () => (
    // Mercurio x2 in dialogo (comunicazione)
    <g fill="none" stroke={STROKE} strokeWidth={1.6}>
      <circle cx="40" cy="34" r="8" />
      <path d="M34 24 q6 -6 12 0" />
      <line x1="40" y1="42" x2="40" y2="56" />
      <line x1="34" y1="50" x2="46" y2="50" />
      <circle cx="76" cy="34" r="8" />
      <path d="M70 24 q6 -6 12 0" />
      <line x1="76" y1="42" x2="76" y2="56" />
      <line x1="70" y1="50" x2="82" y2="50" />
    </g>
  ),
  4: () => (
    // Luna x2 (emozioni) + onda
    <g fill="none" stroke={STROKE} strokeWidth={1.6}>
      <path d="M42 22 A14 14 0 1 1 30 50 A20 20 0 0 0 42 22 Z" />
      <path d="M84 22 A14 14 0 1 0 96 50 A20 20 0 0 1 84 22 Z" />
      <path d="M30 72 q14 -10 28 0 q14 10 28 0" stroke={SOFT} />
    </g>
  ),
  5: () => (
    // Quadrato + opposizione (sfide)
    <g fill="none" stroke={STROKE} strokeWidth={1.6}>
      <rect x="32" y="22" width="28" height="28" />
      <line x1="68" y1="36" x2="96" y2="36" />
      <circle cx="68" cy="36" r="3" fill={STROKE} />
      <circle cx="96" cy="36" r="3" fill={STROKE} />
    </g>
  ),
  6: () => (
    // Nodi + Chirone (pattern karmico)
    <g fill="none" stroke={STROKE} strokeWidth={1.6}>
      <path d="M30 50 q14 -24 28 0 q-14 24 -28 0 Z" />
      <circle cx="80" cy="32" r="8" />
      <line x1="80" y1="40" x2="80" y2="58" />
      <line x1="74" y1="48" x2="86" y2="48" />
    </g>
  ),
  7: () => (
    // MC + freccia direzionale
    <g fill="none" stroke={STROKE} strokeWidth={1.6}>
      <path d="M28 50 v-24 l8 14 l8 -14 v24" />
      <line x1="60" y1="38" x2="96" y2="38" />
      <polyline points="86,30 96,38 86,46" />
    </g>
  ),
  8: () => (
    // Saturno + Giove (retrocompat vecchi report a 8 sezioni)
    <g fill="none" stroke={STROKE} strokeWidth={1.6}>
      <path d="M36 22 v22 q0 10 10 10 q-6 -8 0 -16" />
      <line x1="32" y1="28" x2="44" y2="28" />
      <path d="M76 22 q14 0 14 14 t-14 14 q-4 0 -4 -8" />
      <line x1="68" y1="50" x2="92" y2="50" />
    </g>
  ),
};

export function SectionHero({ section, size = 120 }: SectionHeroProps) {
  const draw = HERO_PATHS[section] ?? HERO_PATHS[1];
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 128 72"
      className="block opacity-80"
      aria-hidden
    >
      {draw()}
    </svg>
  );
}

export default SectionHero;
