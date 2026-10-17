import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

const ProgressBar = ({ current, total, label }: ProgressBarProps) => {
  const { m } = useI18n();
  const percentage = (current / total) * 100;

  return (
    <div className="w-full space-y-2">
      {label && (
        <p className="text-xs text-muted-foreground text-center">{label}</p>
      )}
      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {m.quiz.stepOf(current, total)}
      </p>
    </div>
  );
};

export default ProgressBar;
