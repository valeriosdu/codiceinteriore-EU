import { SectionHero } from './SectionHero';

interface SynastryReportSectionProps {
  section: number;
  title: string;
  body: string;
}

export function SynastryReportSection({ section, title, body }: SynastryReportSectionProps) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <section className="mb-12 last:mb-0">
      <div className="flex items-center gap-4 mb-4">
        <SectionHero section={section} size={80} />
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
          {title}
        </h2>
      </div>
      <div className="prose prose-sm md:prose-base max-w-none">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-foreground leading-relaxed mb-4">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}

export default SynastryReportSection;
