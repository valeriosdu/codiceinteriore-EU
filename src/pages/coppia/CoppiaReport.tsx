import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSynastry } from '@/context/SynastryContext';
import { ArchetypeBadge } from '@/components/coppia/ArchetypeBadge';
import { ScoreOverallRing } from '@/components/coppia/ScoreOverallRing';
import { ScoreRadar } from '@/components/coppia/ScoreRadar';
import { SynastryReportSection } from '@/components/coppia/SynastryReportSection';

function compressScore(raw: number): number {
  return Math.round(30 + (raw / 100) * 67);
}

const SECTION_META: Array<{
  key: string;
  section: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
}> = [
  { key: 'ritratto_coppia', section: 1, title: 'Il ritratto della coppia' },
  { key: 'attrazione_chimica', section: 2, title: 'Attrazione e chimica' },
  { key: 'comunicazione', section: 3, title: 'Comunicazione' },
  { key: 'mondo_emotivo', section: 4, title: 'Mondo emotivo' },
  { key: 'sfide', section: 5, title: 'Sfide come crescita' },
  { key: 'pattern_karmico', section: 6, title: 'Pattern karmico' },
  { key: 'direzione', section: 7, title: 'Direzione' },
];

function mapScoresIt(raw: any) {
  if (!raw) return {};
  return {
    sintonia_emotiva: raw.intimacy ?? raw.emotional ?? raw.romance ?? 0,
    attrazione: raw.romance ?? 0,
    comunicazione: raw.communication ?? 0,
    stabilita: raw.stability ?? 0,
    crescita: raw.growth ?? 0,
    tensione: raw.tension ?? 0,
  };
}

export default function CoppiaReport() {
  const navigate = useNavigate();
  const { data } = useSynastry();
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    document.title = 'Sinastria di Coppia - Report | Codice Interiore';
    if (!data.fullReport) {
      // Se manca il report (es. accesso diretto al URL), torna al processing
      navigate('/coppia/report-processing', { replace: true });
    }
  }, [data.fullReport, navigate]);

  if (!data.fullReport) return null;

  const handleDownloadPdf = async () => {
    if (!data.sessionId) return;
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const resp = await fetch(
        `${(supabase as any).functionsUrl || ''}/generate-synastry-report-pdf?synastrySessionId=${encodeURIComponent(data.sessionId)}`,
        {
          method: 'GET',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        },
      );
      if (!resp.ok) {
        console.error('PDF download failed:', resp.status);
        setDownloading(false);
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codice-interiore-coppia-${data.personA.name || 'persona-a'}-${data.personB.name || 'persona-b'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF download error:', e);
    } finally {
      setDownloading(false);
    }
  };

  const scoresIt = mapScoresIt(data.scores);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 pt-10 pb-24">
        {/* COVER */}
        <header className="text-center mb-12">
          <p className="text-sm uppercase tracking-widest text-primary mb-2">
            {data.personA.name || 'Persona A'} & {data.personB.name || 'Persona B'}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-6">
            La vostra sinastria
          </h1>
          <div className="flex flex-col items-center gap-3">
            {data.scoreOverall != null && <ScoreOverallRing score={compressScore(Math.max(0, Math.min(100, Math.round(data.scoreOverall))))} />}
            <ArchetypeBadge archetypeId={data.archetype} variant="hero" />
          </div>
        </header>

        {/* APERTURA */}
        {(data.fullReport as any)?.apertura && (
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-12">
            <h2 className="font-display text-xl font-semibold text-foreground mb-6">
              La vostra mappa
            </h2>
            <dl className="space-y-4">
              {([
                ['Cosa siete', (data.fullReport as any).apertura.cosa_siete],
                ['Dove brillate', (data.fullReport as any).apertura.dove_brillate],
                ['Dove inciampate', (data.fullReport as any).apertura.dove_inciampate],
                ['Dove andate', (data.fullReport as any).apertura.dove_andate],
              ] as const).map(([label, value]) => value && (
                <div key={label}>
                  <dt className="text-sm font-medium text-primary tracking-wide uppercase">{label}</dt>
                  <dd className="mt-1 text-foreground leading-relaxed">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* SCORE RADAR */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-12 flex flex-col items-center">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            I sei domini della vostra relazione
          </h2>
          <ScoreRadar scores={scoresIt} />
        </div>

        {/* BI-WHEEL */}
        {data.biWheelSvg && (
          <div className="rounded-2xl border border-border bg-card p-6 mb-12">
            <h2 className="font-display text-xl font-semibold text-foreground mb-4 text-center">
              La carta della coppia
            </h2>
            <div
              className="flex justify-center"
              dangerouslySetInnerHTML={{ __html: data.biWheelSvg }}
            />
          </div>
        )}

        {/* 7 SEZIONI */}
        {SECTION_META.map(({ key, section, title }) => {
          const body = (data.fullReport as any)?.[key];
          if (!body) return null;
          return (
            <SynastryReportSection key={key} section={section} title={title} body={body} />
          );
        })}

        {/* DOWNLOAD PDF */}
        <div className="mt-16 text-center">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            {downloading ? 'Preparazione PDF...' : 'Scarica il PDF'}
          </button>
        </div>
      </main>
    </div>
  );
}
