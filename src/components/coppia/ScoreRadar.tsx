// 6-axis radar chart per i domini di compatibilita coppia.
// Input: scores 0-100 in italiano (sintonia_emotiva, attrazione, comunicazione,
// stabilita, crescita, tensione).

interface ScoreRadarProps {
  scores: {
    sintonia_emotiva?: number;
    attrazione?: number;
    comunicazione?: number;
    stabilita?: number;
    crescita?: number;
    tensione?: number;
  };
  size?: number;
}

const AXES = [
  { key: 'sintonia_emotiva', label: 'Sintonia' },
  { key: 'attrazione', label: 'Attrazione' },
  { key: 'comunicazione', label: 'Comunicazione' },
  { key: 'stabilita', label: 'Stabilita' },
  { key: 'crescita', label: 'Crescita' },
  { key: 'tensione', label: 'Tensione' },
] as const;

export function ScoreRadar({ scores, size = 280 }: ScoreRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40;

  const axisAngles = AXES.map((_, i) => (Math.PI * 2 * i) / AXES.length - Math.PI / 2);

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const points = AXES.map((axis, i) => {
    const raw = (scores as any)[axis.key];
    const v = Math.max(0, Math.min(100, typeof raw === 'number' ? raw : 0));
    const r = (v / 100) * radius;
    const angle = axisAngles[i];
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), v };
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      {/* Grid hexagons */}
      {gridLevels.map((lvl, idx) => {
        const path = axisAngles
          .map((a, i) => {
            const x = cx + radius * lvl * Math.cos(a);
            const y = cy + radius * lvl * Math.sin(a);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          })
          .join(' ') + ' Z';
        return (
          <path
            key={idx}
            d={path}
            fill="none"
            stroke="rgba(141,74,53,0.15)"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {axisAngles.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + radius * Math.cos(a)}
          y2={cy + radius * Math.sin(a)}
          stroke="rgba(141,74,53,0.15)"
          strokeWidth={1}
        />
      ))}

      {/* Data polygon */}
      <path
        d={polygonPath}
        fill="rgba(141,74,53,0.22)"
        stroke="#8D4A35"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#8D4A35" />
      ))}

      {/* Numeric values per axis */}
      {points.map((p, i) => {
        const a = axisAngles[i];
        const dataR = (p.v / 100) * radius;
        const numR = Math.max(dataR + 12, 30);
        const nx = cx + numR * Math.cos(a);
        const ny = cy + numR * Math.sin(a);
        return (
          <text
            key={`num-${i}`}
            x={nx}
            y={ny}
            fontSize={10}
            fontWeight={600}
            fill="#8D4A35"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {Math.round(p.v)}
          </text>
        );
      })}

      {/* Labels */}
      {AXES.map((axis, i) => {
        const a = axisAngles[i];
        const lx = cx + (radius + 24) * Math.cos(a);
        const ly = cy + (radius + 24) * Math.sin(a);
        return (
          <text
            key={axis.key}
            x={lx}
            y={ly}
            fontSize={11}
            fill="#3a2418"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}

export default ScoreRadar;
