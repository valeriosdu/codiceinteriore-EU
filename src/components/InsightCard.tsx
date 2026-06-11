import { motion } from 'framer-motion';

interface InsightCardProps {
  title: string;
  body: string;
  index?: number;
}

const InsightCard = ({ title, body, index = 0 }: InsightCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="rounded-xl border border-border bg-card p-6 md:p-7 space-y-3 h-full transition-shadow duration-300 hover:shadow-sm"
    >
      <h3 className="text-lg md:text-xl font-display font-semibold text-foreground">{title}</h3>
      <p className="text-sm md:text-[15px] text-muted-foreground leading-relaxed">{body}</p>
    </motion.div>
  );
};

export default InsightCard;
