// Glifi disegnati a mano per i dettagli di carta del ponte dopo la domanda 1.
// Stessa grammatica di IndexAttivazione.tsx: tratto sottile, viewBox 14x14
// centrato (origine 0,0, range -7..7), `currentColor` per il colore. Qui servono
// pianeti e nodi, che la landing non ha, e i dodici segni per la fascia dello
// zodiaco. I caratteri Unicode non vanno bene: EB Garamond e molti font di
// sistema li rendono "quadrati" o come emoji (♂ ♀).
import type { ReactNode } from "react";

export const SIGN_GLYPHS: ReactNode[] = [
  <path key="aries" d="M -6 5 Q -7 -4 -2 -5 Q 0 -5 0 -2 M 0 -2 Q 0 -5 2 -5 Q 7 -4 6 5" />,
  <g key="taurus">
    <circle cx="0" cy="2" r="3.2" />
    <path d="M -2.7 -0.8 Q -6 -5 0 -4.5 Q 6 -5 2.7 -0.8" />
  </g>,
  <path key="gemini" d="M -3.5 -5 V 5 M 3.5 -5 V 5 M -5.5 -5 H -1.5 M 1.5 -5 H 5.5 M -5.5 5 H -1.5 M 1.5 5 H 5.5" />,
  <g key="cancer">
    <circle cx="-3" cy="-1.5" r="1.2" fill="currentColor" stroke="none" />
    <path d="M -1.8 -0.7 Q 4 -0.7 4 3" />
    <circle cx="3" cy="1.5" r="1.2" fill="currentColor" stroke="none" />
    <path d="M 1.8 0.7 Q -4 0.7 -4 -3" />
  </g>,
  <g key="leo">
    <circle cx="-2" cy="-2" r="2.2" />
    <path d="M 0.2 -1.8 Q 5 -3 5 3 Q 5 6 2 6 Q -1 6 -1 3" />
  </g>,
  <path key="virgo" d="M -6 5 V -3 Q -6 -5 -4 -5 Q -2 -5 -2 -3 V 5 M -2 -3 Q -2 -5 0 -5 Q 2 -5 2 -3 V 5 M 2 -3 Q 2 -5 4 -5 Q 6 -5 6 -3 V 4 Q 6 6 4 6 Q 2 6 2 4" />,
  <path key="libra" d="M -6 4 H 6 M -4 4 V 1 M -4 1 Q -4 -3 0 -3 Q 4 -3 4 1 M 4 1 V 4" />,
  <path key="scorpio" d="M -6 5 V -3 Q -6 -5 -4 -5 Q -2 -5 -2 -3 V 5 M -2 -3 Q -2 -5 0 -5 Q 2 -5 2 -3 V 5 M 2 -3 Q 2 -5 4 -5 Q 6 -5 6 -3 V 4 L 7.5 4 M 7.5 4 L 6 2.5 M 7.5 4 L 6 5.5" />,
  <path key="sagittarius" d="M -6 6 L 6 -6 M 6 -6 L 3 -5 M 6 -6 L 5 -3 M -3 1 L 1 -3" />,
  <path key="capricorn" d="M -5 -5 L -1 4 L 2 -3 Q 2 5 5 5 Q 7 5 7 3 Q 7 0 4 0" />,
  <path key="aquarius" d="M -6 -2 L -4 -1 L -2 -3 L 0 -1 L 2 -3 L 4 -1 L 6 -3 M -6 2 L -4 3 L -2 1 L 0 3 L 2 1 L 4 3 L 6 1" />,
  <path key="pisces" d="M -5 -5 Q -2 0 -5 5 M 5 -5 Q 2 0 5 5 M -3 0 H 3" />,
];

export type PlanetKey =
  | "sun"
  | "moon"
  | "mercury"
  | "mars"
  | "jupiter"
  | "saturn"
  | "northNode"
  | "southNode";

export const PLANET_GLYPHS: Record<PlanetKey, ReactNode> = {
  sun: (
    <g>
      <circle r="5.4" />
      <circle r="0.9" fill="currentColor" stroke="none" />
    </g>
  ),
  moon: <path d="M 2 -5.6 A 6 6 0 1 0 2 5.6 A 5.6 5.6 0 0 1 2 -5.6 Z" />,
  mercury: (
    <g>
      <circle cx="0" cy="-0.6" r="2.6" />
      <path d="M -2.6 -6.4 Q 0 -3.4 2.6 -6.4" />
      <path d="M 0 2 V 6.4 M -2.2 4.3 H 2.2" />
    </g>
  ),
  mars: (
    <g>
      <circle cx="-1.6" cy="1.6" r="3.8" />
      <path d="M 1.1 -1.1 L 5.6 -5.6 M 1.6 -5.6 H 5.6 V -1.6" />
    </g>
  ),
  jupiter: <path d="M -5.2 -1 Q -3.6 -6 0 -4 Q 2.4 -2.2 -0.3 1.2 L -5.5 4.2 H 5.5 M 2.6 -1.6 V 6.8" />,
  saturn: <path d="M -2.6 -6.6 V 1 M -4.8 -4.4 H -0.4 M -2.6 -1.2 Q 1 -3.8 3.2 -0.6 Q 4.2 2 1.6 4 Q -0.4 5.4 -0.4 6.6" />,
  northNode: (
    <g>
      <path d="M -4.4 3.6 Q -4.4 -4.8 0 -4.8 Q 4.4 -4.8 4.4 3.6" />
      <circle cx="-4.4" cy="4.8" r="1.2" />
      <circle cx="4.4" cy="4.8" r="1.2" />
    </g>
  ),
  southNode: (
    <g>
      <path d="M -4.4 -3.6 Q -4.4 4.8 0 4.8 Q 4.4 4.8 4.4 -3.6" />
      <circle cx="-4.4" cy="-4.8" r="1.2" />
      <circle cx="4.4" cy="-4.8" r="1.2" />
    </g>
  ),
};

export const glyphStroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
