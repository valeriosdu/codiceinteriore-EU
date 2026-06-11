// Ornamento editoriale per i divisori del teaser sinastria.
// Linea sottile con simbolo centrale (rombo, stella, cerchio) in stile
// rinascimentale italiano restituente l'aria di un libro Adelphi/Einaudi.

interface OrnamentProps {
  variant?: 'rhombus' | 'star' | 'circle' | 'cross';
  width?: number;
}

export function Ornament({ variant = 'rhombus', width = 120 }: OrnamentProps) {
  const stroke = '#8D4A35';
  const soft = 'rgba(141,74,53,0.35)';

  return (
    <div
      className="flex items-center justify-center my-6 opacity-90"
      style={{ width: '100%' }}
      aria-hidden
    >
      <svg width={width} height="16" viewBox="0 0 120 16" fill="none">
        <line x1="0" y1="8" x2="48" y2="8" stroke={soft} strokeWidth="0.8" />
        <line x1="72" y1="8" x2="120" y2="8" stroke={soft} strokeWidth="0.8" />
        {variant === 'rhombus' && (
          <>
            <path
              d="M60 2 L66 8 L60 14 L54 8 Z"
              stroke={stroke}
              strokeWidth="1"
              fill="none"
            />
            <circle cx="60" cy="8" r="1.2" fill={stroke} />
          </>
        )}
        {variant === 'star' && (
          <g transform="translate(60 8)" stroke={stroke} strokeWidth="0.9" fill="none">
            <path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" />
          </g>
        )}
        {variant === 'circle' && (
          <>
            <circle cx="60" cy="8" r="4" stroke={stroke} strokeWidth="0.9" fill="none" />
            <circle cx="60" cy="8" r="1" fill={stroke} />
          </>
        )}
        {variant === 'cross' && (
          <g stroke={stroke} strokeWidth="0.9" fill="none">
            <line x1="56" y1="8" x2="64" y2="8" />
            <line x1="60" y1="4" x2="60" y2="12" />
            <circle cx="60" cy="8" r="2" />
          </g>
        )}
      </svg>
    </div>
  );
}

export default Ornament;
