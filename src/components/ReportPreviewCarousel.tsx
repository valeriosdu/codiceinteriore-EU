import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

import hero from "@/assets/report-preview/hero.webp";
import identita from "@/assets/report-preview/1-identita.webp";
import emozioni from "@/assets/report-preview/2-emozioni.webp";
import relazioni from "@/assets/report-preview/3-relazioni.webp";
import lavoro from "@/assets/report-preview/4-lavoro.webp";
import schemi from "@/assets/report-preview/5-schemi.webp";
import consigli from "@/assets/report-preview/6-consigli.webp";
import poesia from "@/assets/report-preview/7-poesia.webp";

import heroEn from "@/assets/report-preview/hero-US.webp";
import identitaEn from "@/assets/report-preview/1-identita-en.webp";
import emozioniEn from "@/assets/report-preview/carta-interior-valerio_pages-to-jpg-0005.webp";
import relazioniEn from "@/assets/report-preview/carta-interior-valerio_pages-to-jpg-0006_11zon.webp";
import lavoroEn from "@/assets/report-preview/carta-interior-valerio_pages-to-jpg-0008.webp";
import schemiEn from "@/assets/report-preview/carta-interior-valerio_pages-to-jpg-0009.webp";
import consigliEn from "@/assets/report-preview/carta-interior-valerio_pages-to-jpg-0010.webp";
import poesiaEn from "@/assets/report-preview/carta-interior-valerio_pages-to-jpg-0011.webp";

import heroNl from "@/assets/report-preview/hero-nl.webp";
import identitaNl from "@/assets/report-preview/1-identita-nl.webp";
import emozioniNl from "@/assets/report-preview/2-emozioni-nl.webp";
import relazioniNl from "@/assets/report-preview/3-relazioni-nl.webp";
import lavoroNl from "@/assets/report-preview/4-lavoro-nl.webp";
import schemiNl from "@/assets/report-preview/5-schemi-nl.webp";
import consigliNl from "@/assets/report-preview/6-consigli-nl.webp";
import poesiaNl from "@/assets/report-preview/7-poesia-nl.webp";

// Screenshot del report: asset per-lingua, da sostituire quando un nuovo
// mercato avrà i propri estratti (es oggi riusa ancora quelli italiani).
const SLIDE_IMAGES_IT = [hero, identita, emozioni, relazioni, lavoro, schemi, consigli, poesia];
const SLIDE_IMAGES_EN = [heroEn, identitaEn, emozioniEn, relazioniEn, lavoroEn, schemiEn, consigliEn, poesiaEn];
// Estratti di un report NL reale (Sanne de Vries), filigranati "Voorbeelddata".
// L'ordine segue slideAlts di src/i18n/nl/social.ts: ogni immagine sta nello slot
// il cui alt text porta lo stesso titolo di sezione.
const SLIDE_IMAGES_NL = [heroNl, identitaNl, emozioniNl, relazioniNl, lavoroNl, schemiNl, consigliNl, poesiaNl];

const SLIDE_IMAGES_BY_LANG: Record<string, typeof SLIDE_IMAGES_IT> = {
  it: SLIDE_IMAGES_IT,
  es: SLIDE_IMAGES_IT,
  en: SLIDE_IMAGES_EN,
  nl: SLIDE_IMAGES_NL,
};

const ReportPreviewCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
  const { m, market } = useI18n();
  const rp = m.social.reportPreview;
  const SLIDE_IMAGES = SLIDE_IMAGES_BY_LANG[market.language] ?? SLIDE_IMAGES_IT;
  const slides = SLIDE_IMAGES.map((src, i) => ({ src, alt: rp.slideAlts[i] ?? "" }));

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Lock body scroll + ESC to close when zoomed
  useEffect(() => {
    if (zoomedIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomedIndex(null);
      if (e.key === "ArrowRight") setZoomedIndex((i) => (i === null ? i : (i + 1) % SLIDE_IMAGES.length));
      if (e.key === "ArrowLeft") setZoomedIndex((i) => (i === null ? i : (i - 1 + SLIDE_IMAGES.length) % SLIDE_IMAGES.length));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomedIndex]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
      aria-label={rp.aria}
    >
      <div className="relative">
        <Carousel setApi={setApi} opts={{ align: "center", loop: true }} className="w-full">
          <CarouselContent className="-ml-4">
            {slides.map((slide, i) => (
              <CarouselItem key={i} className="pl-4 basis-[85%] sm:basis-[70%] md:basis-[60%] lg:basis-[55%]">
                <button
                  type="button"
                  onClick={() => setZoomedIndex(i)}
                  aria-label={rp.zoomAria(slide.alt)}
                  className="group block w-full overflow-hidden rounded-2xl bg-surface ring-1 ring-border/40 shadow-[0_8px_30px_-12px_hsl(var(--foreground)/0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-zoom-in"
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="w-full h-auto block aspect-square object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Arrows — visible on all sizes, smaller on mobile */}
        <button
          type="button"
          onClick={() => api?.scrollPrev()}
          aria-label={rp.prevSlide}
          className="absolute left-1 md:left-2 lg:-left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-full bg-background/90 backdrop-blur ring-1 ring-border/60 text-foreground/80 hover:text-foreground hover:bg-background transition-colors shadow-sm"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        </button>
        <button
          type="button"
          onClick={() => api?.scrollNext()}
          aria-label={rp.nextSlide}
          className="absolute right-1 md:right-2 lg:-right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-full bg-background/90 backdrop-blur ring-1 ring-border/60 text-foreground/80 hover:text-foreground hover:bg-background transition-colors shadow-sm"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => api?.scrollTo(i)}
            aria-label={rp.goToSlide(i + 1)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              current === i ? "w-6 bg-primary" : "w-1.5 bg-foreground/20 hover:bg-foreground/40",
            )}
          />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
        {rp.note}
      </p>

      {/* Zoom Lightbox */}
      <AnimatePresence>
        {zoomedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-foreground/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setZoomedIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label={rp.zoomedAria}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedIndex(null);
              }}
              aria-label={rp.closePreview}
              className="absolute top-4 right-4 z-10 h-11 w-11 flex items-center justify-center rounded-full bg-background/95 text-foreground hover:bg-background transition-colors shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Prev */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedIndex((i) => (i === null ? i : (i - 1 + slides.length) % slides.length));
              }}
              aria-label={rp.prevImage}
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 h-11 w-11 flex items-center justify-center rounded-full bg-background/90 text-foreground hover:bg-background transition-colors shadow-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedIndex((i) => (i === null ? i : (i + 1) % slides.length));
              }}
              aria-label={rp.nextImage}
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 h-11 w-11 flex items-center justify-center rounded-full bg-background/90 text-foreground hover:bg-background transition-colors shadow-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <motion.img
              key={zoomedIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={slides[zoomedIndex].src}
              alt={slides[zoomedIndex].alt}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[92vw] md:max-w-[80vw] w-auto h-auto object-contain rounded-lg shadow-2xl"
            />

            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-background/70">
              {rp.escHint}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default ReportPreviewCarousel;
