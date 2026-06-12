// Anello score editoriale: cifra italica grande, anello sottile, tick decorativi
// alle posizioni del quadrante (12, 3, 6, 9). Estetica manoscritto contemporaneo.

import { useI18n } from '@/i18n/I18nProvider';

interface ScoreOverallRingProps {
  score: number; // 0-100
  size?: number;
  label?: string;
}

export function ScoreOverallRing({
  score,
  size = 180,
  label,
}: ScoreOverallRingProps) {
  const { m } = useI18n();
  const resolvedLabel = label ?? m.coppia.ringDefaultLabel;
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;
  const dash = (safeScore / 100) * circumference;

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 12 - Math.PI / 2;
    const isCardinal = i % 3 === 0;
    const r1 = r + 2;
    const r2 = r + (isCardinal ? 6 : 4);
    return {
      x1: cx + r1 * Math.cos(angle),
      y1: cy + r1 * Math.sin(angle),
      x2: cx + r2 * Math.cos(angle),
      y2: cy + r2 * Math.sin(angle),
      cardinal: isCardinal,
    };
  });

  return (
    <div className="inline-flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        role="img"
        aria-label={m.coppia.ringAria(safeScore)}
      >
        {/* Tick marks zodiacali esterni */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.cardinal ? '#8D4A35' : 'rgba(141,74,53,0.35)'}
            strokeWidth={t.cardinal ? 1.2 : 0.8}
            strokeLinecap="round"
          />
        ))}

        {/* Anello di sfondo, sottile */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(141,74,53,0.12)"
          strokeWidth="2.5"
        />

        {/* Anello score */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#8D4A35"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />

        {/* Cifra italica centrale */}
        <text
          x={cx}
          y={cy + size * 0.05}
          textAnchor="middle"
          fontSize={size * 0.38}
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontStyle="normal"
          fontWeight={500}
          fill="#2a1810"
        >
          {safeScore}
        </text>

        {/* Pedice "/100" sotto la cifra */}
        <text
          x={cx}
          y={cy + size * 0.22}
          textAnchor="middle"
          fontSize={size * 0.12}
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontStyle="normal"
          fontWeight={400}
          fill="rgba(42,24,16,0.40)"
        >
          /100
        </text>
      </svg>
      {resolvedLabel && (
        <span
          className="mt-3 text-[11px] uppercase text-muted-foreground"
          style={{ letterSpacing: '0.32em' }}
        >
          {resolvedLabel}
        </span>
      )}
    </div>
  );
}

export default ScoreOverallRing;
