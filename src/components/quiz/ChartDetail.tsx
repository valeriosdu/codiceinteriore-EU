import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PLANET_GLYPHS, SIGN_GLYPHS, glyphStroke, type PlanetKey } from "./glyphs";

// "Dettaglio" di un tema natale illustrativo, uno per risposta alla domanda 1.
// Non sono i dati dell'utente: sono carte disegnate a mano che mostrano DOVE si
// guarda per quella domanda (l'etichetta "esempio illustrativo" lo dice).
// Geometria: angolo in gradi dall'Ascendente (ore 9) in senso antiorario, come
// nelle carte vere, quindi theta=90 e' in basso e theta=-90 in alto (MC).

export type BridgeVariant = 0 | 1 | 2 | 3;

const CX = 108;
const CY = 100;
const R_OUTER = 78;
const R_BAND = 62;
const R_HOUSES = 14;

const INK = "hsl(var(--foreground) / 0.5)";
const INK_SOFT = "hsl(var(--foreground) / 0.22)";
const PRIMARY = "hsl(var(--primary))";
const ACCENT = "hsl(var(--accent))";
const CARD = "hsl(var(--card))";

const rad = (deg: number) => (deg * Math.PI) / 180;
const pt = (theta: number, r: number): [number, number] => [
  CX - r * Math.cos(rad(theta)),
  CY + r * Math.sin(rad(theta)),
];
const f = (n: number) => Math.round(n * 100) / 100;
const xy = ([x, y]: [number, number]) => `${f(x)} ${f(y)}`;

// Settore (corona circolare) tra due angoli, riempito in tinta tenue.
const wedge = (from: number, to: number, r0: number, r1: number, clockwise: boolean) =>
  `M ${xy(pt(from, r0))} L ${xy(pt(from, r1))} A ${r1} ${r1} 0 0 ${clockwise ? 1 : 0} ${xy(pt(to, r1))} L ${xy(pt(to, r0))} A ${r0} ${r0} 0 0 ${clockwise ? 0 : 1} ${xy(pt(from, r0))} Z`;

const arc = (from: number, to: number, r: number, clockwise: boolean) =>
  `M ${xy(pt(from, r))} A ${r} ${r} 0 0 ${clockwise ? 1 : 0} ${xy(pt(to, r))}`;

const Badge = ({
  at,
  planet,
  tone = "primary",
}: {
  at: [number, number];
  planet: PlanetKey;
  tone?: "primary" | "ink";
}) => {
  const color = tone === "primary" ? PRIMARY : INK;
  return (
    <g transform={`translate(${f(at[0])} ${f(at[1])})`} style={{ color }}>
      <circle r="9.5" fill={CARD} stroke={color} strokeWidth={tone === "primary" ? 1.3 : 0.9} />
      <g transform="scale(0.95)" {...glyphStroke}>
        {PLANET_GLYPHS[planet]}
      </g>
    </g>
  );
};

const Wheel = () => (
  <g fill="none" stroke={INK}>
    <circle cx={CX} cy={CY} r={R_OUTER} strokeWidth="1.1" />
    <circle cx={CX} cy={CY} r={R_OUTER - 5} strokeWidth="0.4" strokeOpacity="0.7" />
    <circle cx={CX} cy={CY} r={R_BAND} strokeWidth="0.7" />
    <circle cx={CX} cy={CY} r={40} strokeWidth="0.4" strokeOpacity="0.7" />
    <circle cx={CX} cy={CY} r={R_HOUSES} strokeWidth="0.7" />
    {Array.from({ length: 72 }).map((_, i) => {
      const major = i % 6 === 0;
      const a = pt(i * 5, R_OUTER);
      const b = pt(i * 5, R_OUTER - (major ? 5 : 2.5));
      return (
        <line
          key={i}
          x1={f(a[0])}
          y1={f(a[1])}
          x2={f(b[0])}
          y2={f(b[1])}
          strokeWidth={major ? 0.7 : 0.35}
          strokeOpacity={major ? 0.8 : 0.5}
        />
      );
    })}
    {Array.from({ length: 12 }).map((_, i) => {
      const a = pt(i * 30, R_HOUSES);
      const b = pt(i * 30, R_BAND);
      return (
        <line
          key={i}
          x1={f(a[0])}
          y1={f(a[1])}
          x2={f(b[0])}
          y2={f(b[1])}
          strokeWidth="0.5"
          strokeOpacity={i % 3 === 0 ? 0.55 : 0.3}
        />
      );
    })}
    <g {...glyphStroke} strokeWidth="1.1" strokeOpacity="0.62">
      {SIGN_GLYPHS.map((g, i) => {
        const [x, y] = pt(i * 30 + 15, 69.5);
        return (
          <g key={i} transform={`translate(${f(x)} ${f(y)}) scale(0.5)`}>
            {g}
          </g>
        );
      })}
    </g>
    <circle cx={CX} cy={CY} r="2" fill={INK} stroke="none" />
  </g>
);

const Draw = ({ children, delay = 0.35 }: { children: ReactNode; delay?: number }) => {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.g>
  );
};

const Triangle = ({ at, heading }: { at: [number, number]; heading: number }) => (
  <path
    d="M 0 -4.5 L -3 2 L 3 2 Z"
    transform={`translate(${f(at[0])} ${f(at[1])}) rotate(${f(heading)})`}
    fill="currentColor"
    stroke="none"
  />
);

const Scene = ({ variant }: { variant: BridgeVariant }) => {
  if (variant === 0) {
    const moon = pt(-34, 51);
    const mercury = pt(-66, 51);
    return (
      <>
        <path d={wedge(0, -78, R_HOUSES, R_BAND, true)} fill={PRIMARY} fillOpacity="0.08" />
        <Draw delay={0.15}>
          <line x1={CX - R_OUTER - 8} y1={CY} x2={CX + R_OUTER} y2={CY} stroke={PRIMARY} strokeWidth="1.5" />
          <g style={{ color: PRIMARY }}>
            <Triangle at={[CX - R_OUTER - 8, CY]} heading={-90} />
          </g>
          <text x={CX - R_OUTER - 21} y={CY - 5} fontSize="9" fill={PRIMARY} className="font-display" fontWeight="600">
            AC
          </text>
        </Draw>
        <Draw>
          <line x1={f(moon[0])} y1={f(moon[1])} x2={f(mercury[0])} y2={f(mercury[1])} stroke={ACCENT} strokeWidth="1.3" strokeDasharray="3 2.5" />
          <Badge at={moon} planet="moon" />
          <Badge at={mercury} planet="mercury" />
        </Draw>
      </>
    );
  }

  if (variant === 1) {
    const mars = pt(-22, 52);
    const saturn = pt(68, 52);
    const label = pt(23, 34);
    return (
      <>
        <Draw delay={0.15}>
          <path d={arc(-22, 68, 27, false)} fill="none" stroke={ACCENT} strokeWidth="1.2" />
          <line x1={f(pt(-22, R_HOUSES)[0])} y1={f(pt(-22, R_HOUSES)[1])} x2={f(mars[0])} y2={f(mars[1])} stroke={INK} strokeWidth="0.8" strokeDasharray="2 2" />
          <line x1={f(pt(68, R_HOUSES)[0])} y1={f(pt(68, R_HOUSES)[1])} x2={f(saturn[0])} y2={f(saturn[1])} stroke={INK} strokeWidth="0.8" strokeDasharray="2 2" />
          <text x={f(label[0])} y={f(label[1]) + 3} fontSize="8.5" textAnchor="middle" fill={ACCENT} className="font-display" fontWeight="600">
            90°
          </text>
        </Draw>
        <Draw>
          <line x1={f(mars[0])} y1={f(mars[1])} x2={f(saturn[0])} y2={f(saturn[1])} stroke={PRIMARY} strokeWidth="1.6" />
          <Badge at={mars} planet="mars" />
          <Badge at={saturn} planet="saturn" />
        </Draw>
      </>
    );
  }

  if (variant === 2) {
    const north = pt(-40, 51);
    const south = pt(140, 51);
    const driftEnd = pt(-40, 31);
    // Il tratto tratteggiato gira in senso orario (theta cala): la punta guarda lungo la tangente, cioe' di -theta gradi.
    const heading = 40;
    return (
      <>
        <path d={wedge(-102, -78, R_HOUSES, R_BAND, true)} fill={PRIMARY} fillOpacity="0.1" />
        <Draw delay={0.15}>
          <line x1={CX} y1={CY - R_HOUSES} x2={CX} y2={CY - R_OUTER - 4} stroke={PRIMARY} strokeWidth="1.5" />
          <g style={{ color: PRIMARY }}>
            <Triangle at={[CX, CY - R_OUTER - 7]} heading={0} />
          </g>
          <text x={CX} y={CY - R_OUTER - 13} fontSize="9" textAnchor="middle" fill={PRIMARY} className="font-display" fontWeight="600">
            MC
          </text>
        </Draw>
        <Draw>
          <line x1={f(pt(-40, R_BAND)[0])} y1={f(pt(-40, R_BAND)[1])} x2={f(pt(140, R_BAND)[0])} y2={f(pt(140, R_BAND)[1])} stroke={ACCENT} strokeWidth="1.1" />
          <path d={arc(140, -40, 30, true)} fill="none" stroke={ACCENT} strokeWidth="1.2" strokeDasharray="2.5 2.5" />
          <g style={{ color: ACCENT }}>
            <Triangle at={driftEnd} heading={heading} />
          </g>
          <Badge at={north} planet="northNode" />
          <Badge at={south} planet="southNode" tone="ink" />
        </Draw>
      </>
    );
  }

  const ringR = 88;
  const saturn = pt(-52, ringR);
  const jupiter = pt(118, ringR);
  const natal = pt(-52, 49);
  return (
    <>
      <circle cx={CX} cy={CY} r={ringR} fill="none" stroke={INK_SOFT} strokeWidth="1" strokeDasharray="1.5 3" />
      <Draw delay={0.15}>
        <path d={arc(-80, -24, ringR, false)} fill="none" stroke={PRIMARY} strokeWidth="3" strokeLinecap="round" />
        <line x1={f(pt(-80, ringR - 6)[0])} y1={f(pt(-80, ringR - 6)[1])} x2={f(pt(-80, ringR + 6)[0])} y2={f(pt(-80, ringR + 6)[1])} stroke={PRIMARY} strokeWidth="1.2" />
        <line x1={f(pt(-24, ringR - 6)[0])} y1={f(pt(-24, ringR - 6)[1])} x2={f(pt(-24, ringR + 6)[0])} y2={f(pt(-24, ringR + 6)[1])} stroke={PRIMARY} strokeWidth="1.2" />
        <path d={arc(96, 142, ringR, false)} fill="none" stroke={ACCENT} strokeWidth="2.4" strokeLinecap="round" strokeOpacity="0.8" />
      </Draw>
      <Draw>
        <line x1={f(saturn[0])} y1={f(saturn[1])} x2={f(natal[0])} y2={f(natal[1])} stroke={PRIMARY} strokeWidth="1.2" strokeDasharray="3 2.5" />
        <Badge at={natal} planet="moon" tone="ink" />
        <Badge at={saturn} planet="saturn" />
        <Badge at={jupiter} planet="jupiter" tone="ink" />
      </Draw>
    </>
  );
};

const ChartDetail = ({ variant, className }: { variant: BridgeVariant; className?: string }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 216 200"
    className={className}
    style={{ overflow: "visible" }}
  >
    <circle cx={CX} cy={CY} r={R_OUTER + 14} fill={PRIMARY} fillOpacity="0.035" />
    <Wheel />
    <Scene variant={variant} />
  </svg>
);

export default ChartDetail;
