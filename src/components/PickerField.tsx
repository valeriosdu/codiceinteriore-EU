import WheelPicker, { type WheelItem } from '@/components/WheelPicker';
import { useIsMobile } from '@/hooks/use-mobile';

interface PickerFieldProps {
  label: string;
  items: WheelItem[];
  /** Chosen value, or null when nothing picked yet. */
  value: number | null;
  /** Where the wheel opens while `value` is null (mobile only). */
  anchor: number;
  onChange: (value: number) => void;
  /** Placeholder shown in the desktop dropdown until a value is picked. */
  placeholder?: string;
}

const selectClasses =
  'h-12 w-full rounded-lg border border-input bg-background px-3 text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none appearance-none';

// One birth-date/-time field that adapts to the device: a swipeable wheel on
// mobile (touch momentum + snap) and the original native dropdown on desktop,
// where dragging a wheel with a mouse isn't natural. Both report a number via
// `onChange` and keep `value` null until the user actually picks.
export default function PickerField({
  label,
  items,
  value,
  anchor,
  onChange,
  placeholder = '—',
}: PickerFieldProps) {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground text-center block">{label}</label>
      {isMobile ? (
        <WheelPicker items={items} value={value} anchor={anchor} onChange={onChange} ariaLabel={label} />
      ) : (
        <select
          className={selectClasses}
          value={value ?? ''}
          onChange={(e) => {
            if (e.target.value !== '') onChange(Number(e.target.value));
          }}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {items.map((it) => (
            <option key={it.value} value={it.value}>
              {it.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
