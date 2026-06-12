import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nProvider';

interface OfferCardProps {
  name: string;
  price: string;
  promise: string;
  features: string[];
  recommended?: boolean;
  ctaLabel: string;
  onSelect: () => void;
  loading?: boolean;
  index?: number;
}

const OfferCard = ({ name, price, promise, features, recommended, ctaLabel, onSelect, loading, index = 0 }: OfferCardProps) => {
  const { m } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`relative rounded-2xl border-2 p-8 space-y-6 transition-shadow duration-300 ${
        recommended
          ? 'border-primary bg-card shadow-lg'
          : 'border-border bg-card hover:shadow-md'
      }`}
    >
      {recommended && (
        <span className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
          {m.common.recommendedChoice}
        </span>
      )}
      <div className="space-y-2">
        <h3 className="font-display text-xl font-semibold text-foreground">{name}</h3>
        <p className="text-3xl font-display font-bold text-foreground">{price}</p>
        <p className="text-sm text-muted-foreground">{promise}</p>
      </div>
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-foreground">
            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={recommended ? 'premium' : 'outline-premium'}
        size="quiz"
        onClick={onSelect}
        disabled={loading}
      >
        {loading ? m.common.loading : ctaLabel}
      </Button>
    </motion.div>
  );
};

export default OfferCard;
