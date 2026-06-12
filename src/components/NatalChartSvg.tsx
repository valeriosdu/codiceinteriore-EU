import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Maximize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/I18nProvider";

interface NatalChartSvgProps {
  svg: string | null | undefined;
  /** Optional caption shown under the chart (e.g. birth data). */
  caption?: string;
  className?: string;
}

/**
 * Renders the natal chart SVG in a minimal, restrained way and exposes a
 * zoomable full-screen view on tap. SVG is injected via dangerouslySetInnerHTML
 * because the source comes from our own trusted backend (FreeAstro API).
 */
const NatalChartSvg = ({ svg, caption, className }: NatalChartSvgProps) => {
  const [open, setOpen] = useState(false);
  const { m } = useI18n();

  if (!svg) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center ${className ?? ""}`}
    >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label={m.common.chart.openFullscreen}
            className="group relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[380px] rounded-xl p-2 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div
              className="natal-chart-svg w-full"
              // SVG comes from our own backend
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <span className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full bg-background/80 p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Maximize2 className="h-3.5 w-3.5" />
            </span>
          </button>
        </DialogTrigger>

        <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-background p-4 sm:p-6">
          <DialogTitle className="sr-only">{m.common.chart.title}</DialogTitle>
          <ZoomableChart svg={svg} />
        </DialogContent>
      </Dialog>

      {caption && (
        <p className="mt-2 text-[11px] text-muted-foreground/80 tracking-wide">{caption}</p>
      )}

      <style>{`
        .natal-chart-svg svg {
          width: 100%;
          height: auto;
          display: block;
        }
      `}</style>
    </motion.div>
  );
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

const ZoomableChart = ({ svg }: { svg: string }) => {
  const { m } = useI18n();
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);

  // Reset transform whenever a new chart is opened.
  useEffect(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, [svg]);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => clampScale(s * (e.deltaY < 0 ? 1.1 : 0.9)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx, ty };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setTx(dragRef.current.tx + (e.clientX - dragRef.current.startX));
    setTy(dragRef.current.ty + (e.clientY - dragRef.current.startY));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-[70vh] w-full overflow-hidden rounded-lg bg-surface touch-none cursor-grab active:cursor-grabbing"
      >
        <div
          className="natal-chart-svg absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: dragRef.current ? "none" : "transform 0.15s ease-out",
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setScale((s) => clampScale(s / 1.25))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-surface"
          aria-label={m.common.chart.zoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => { setScale(1); setTx(0); setTy(0); }}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-surface"
          aria-label={m.common.chart.zoomReset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setScale((s) => clampScale(s * 1.25))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-surface"
          aria-label={m.common.chart.zoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      <style>{`
        .natal-chart-svg svg {
          width: 90%;
          height: 90%;
          max-height: 100%;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default NatalChartSvg;
