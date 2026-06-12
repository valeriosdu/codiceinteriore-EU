import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useI18n } from "@/i18n/I18nProvider";

const TestimonialCard = ({ text, name, age }: { text: string; name: string; age: number }) => (
  <div className="rounded-2xl border border-border/40 bg-card p-7 md:p-8 flex flex-col justify-between h-full">
    <p className="text-[15px] leading-[1.85] text-foreground/85 italic font-body">"{text}"</p>
    <p className="mt-5 text-xs tracking-wide text-muted-foreground">
      — {name}, {age}
    </p>
  </div>
);

const Testimonials = () => {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { m } = useI18n();
  const testimonials = m.social.testimonials.items;

  useEffect(() => {
    if (!isMobile || !scrollRef.current) return;
    const container = scrollRef.current;
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth * 0.82;
      const gap = 16;
      const index = Math.round(scrollLeft / (cardWidth + gap));
      setActiveIndex(Math.min(index, testimonials.length - 1));
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isMobile, testimonials.length]);

  return (
    <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="py-2">
      <div className="text-center space-y-3 mb-10">
        <span className="text-xs uppercase tracking-[0.2em] text-primary/70 font-medium">{m.social.testimonials.kicker}</span>
        <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground max-w-xl mx-auto leading-snug">
          {m.social.testimonials.heading}
        </h3>
      </div>

      {isMobile ? (
        <>
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {testimonials.map((t, i) => (
              <div key={i} className="snap-center shrink-0" style={{ width: "82%" }}>
                <TestimonialCard {...t} />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 mt-5">
            {testimonials.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  i === activeIndex ? "bg-primary/70" : "bg-border"
                }`}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {testimonials.slice(0, 2).map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {testimonials.slice(2, 4).map((t, i) => (
              <TestimonialCard key={i + 2} {...t} />
            ))}
          </div>
          <div className="flex justify-center">
            <div className="w-1/2">
              <TestimonialCard {...testimonials[4]} />
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
};

export default Testimonials;
