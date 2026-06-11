import { motion } from 'framer-motion';

interface ReportSectionProps {
  title: string;
  children: React.ReactNode;
  index?: number;
}

const ReportSection = ({ title, children, index = 0 }: ReportSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="space-y-4 pb-4"
    >
      <h2 className="font-display text-2xl lg:text-[28px] font-semibold text-foreground">{title}</h2>
      <div className="text-foreground/85 leading-relaxed space-y-4 text-[15px] lg:text-base">
        {children}
      </div>
    </motion.section>
  );
};

export default ReportSection;
