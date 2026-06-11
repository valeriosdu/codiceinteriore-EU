import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const testimonials = [
  {
    text: "Mi aspettavo qualcosa di generico. Invece ci sono stati vari passaggi che mi hanno descritta in un modo quasi scomodo da quanto erano precisi.",
    name: "Giulia",
    age: 31,
  },
  {
    text: "La differenza rispetto alle letture gratuite online si sente. Qui non trovi frasi sparse: c'è un filo, una struttura. Alla fine hai davvero una visione più completa di come funzioni e di cosa fare",
    name: "Serena",
    age: 39,
  },
  {
    text: "Mi è piaciuto perché non cerca di predire tutto. Ti aiuta piuttosto a capire cosa si ripete, dove ti blocchi, che tipo di dinamica stai vivendo adesso e cosa fare.",
    name: "Valentina",
    age: 33,
  },
  {
    text: "Avevo paura fosse una lettura costruita per dire cose belle a tutti. Invece no: soprattutto nella parte relazionale mi sono sentita veramente vista.",
    name: "Laura",
    age: 35,
  },
  {
    text: "Il report completo mi ha aiutata a capire la struttura, che in parte già intuivo ma non con così tanta chiarezza... Il resto mi ha fatto collegare tutto a quello che sto vivendo adesso. Consigliato l'acquisto.",
    name: "Beatrice",
    age: 24,
  },
];

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
  }, [isMobile]);

  return (
    <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="py-2">
      <div className="text-center space-y-3 mb-10">
        <span className="text-xs uppercase tracking-[0.2em] text-primary/70 font-medium">Testimonianze</span>
        <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground max-w-xl mx-auto leading-snug">
          Cosa ha colpito di più i nostri clienti
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
