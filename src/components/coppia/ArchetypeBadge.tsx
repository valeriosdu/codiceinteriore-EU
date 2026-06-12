// Archetype badge in stile editoriale: NON una pill generica.
// Nome dell'archetipo in italic Cormorant grande, sopra una etichetta in
// small caps tracking-extra che fa da "categoria" tipo libro Adelphi.

import { resolveArchetypeId } from '@/lib/synastry-archetypes';
import { useI18n } from '@/i18n/I18nProvider';

interface ArchetypeBadgeProps {
  archetypeId: string | null | undefined;
  /** 'inline' = piccolo, usato come tag. 'hero' = grande, usato in copertina teaser. */
  variant?: 'inline' | 'hero';
}

export function ArchetypeBadge({ archetypeId, variant = 'inline' }: ArchetypeBadgeProps) {
  const { m } = useI18n();
  const meta = m.coppia.archetypes[resolveArchetypeId(archetypeId)];

  if (variant === 'hero') {
    return (
      <div className="flex flex-col items-center gap-2 text-center mt-2">
        <span
          className="text-xs uppercase text-muted-foreground"
          style={{ letterSpacing: '0.42em' }}
        >
          {m.coppia.archetypeLabel}
        </span>
        <h2
          className="font-editorial text-primary leading-[0.95]"
          style={{
            fontWeight: 500,
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
          }}
        >
          {meta.label}
        </h2>
      </div>
    );
  }

  return (
    <span className="inline-flex items-baseline gap-2 text-xs">
      <span
        className="uppercase text-muted-foreground font-medium"
        style={{ letterSpacing: '0.28em', fontSize: '0.65rem' }}
      >
        {m.coppia.archetypeLabel}
      </span>
      <span
        aria-hidden
        className="inline-block h-px w-4 bg-primary/60 self-center"
      />
      <span className="font-editorial italic text-primary" style={{ fontSize: '1.15em' }}>
        {meta.label}
      </span>
    </span>
  );
}

export default ArchetypeBadge;
