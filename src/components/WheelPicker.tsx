import { useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export type WheelItem = { value: number; label: string };

interface WheelPickerProps {
  items: WheelItem[];
  /** Currently chosen value, or null when the user hasn't picked yet. */
  value: number | null;
  /** Where to center the wheel while `value` is still null. */
  anchor: number;
  /** Fired only on a real user gesture (scroll settle or row tap). */
  onChange: (value: number) => void;
  itemHeight?: number;
  /** Odd number of visible rows; the middle one is the selection band. */
  visibleCount?: number;
  ariaLabel?: string;
  className?: string;
}

// iOS-style swipeable wheel built on native CSS scroll-snap (no library). The OS
// gives touch momentum and snapping for free, and centering is exact because the
// row height and the top/bottom spacers are controlled here: at scrollTop =
// index * itemHeight the matching row sits exactly in the centre band.
//
// It never auto-commits: `onChange` fires only from a real gesture (scroll settle
// or row tap), never from the initial positioning, so the anchor shown at rest is
// never confirmed until the user actually engages the wheel.
export default function WheelPicker({
  items,
  value,
  anchor,
  onChange,
  itemHeight = 40,
  visibleCount = 5,
  ariaLabel,
  className,
}: WheelPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Commit-from-scroll only runs after a real user gesture. The initial
  // positioning writes el.scrollTop, and writing scrollTop emits a 'scroll'
  // event: the previous guard re-opened after a requestAnimationFrame (~16ms)
  // while the settle commit fires at 120ms, so every wheel whose anchor was not
  // the first index confirmed its own value at mount (a user who touched
  // nothing submitted 15/06/1980 12:00).
  const gesturedRef = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>();

  const pad = (itemHeight * (visibleCount - 1)) / 2;
  const viewportHeight = itemHeight * visibleCount;

  const indexOfValue = (v: number | null) => {
    const target = v ?? anchor;
    const i = items.findIndex((it) => it.value === target);
    return i >= 0 ? i : 0;
  };

  // Position the wheel on the current value (or anchor) without firing onChange.
  // Steps remount this component as the funnel advances, so this also covers the
  // "navigate back" case. gesturedRef gates out the scroll events this triggers.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = indexOfValue(value) * itemHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, anchor, items, itemHeight]);

  const commitFromScroll = () => {
    const el = scrollRef.current;
    if (!el || !gesturedRef.current) return;
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / itemHeight)));
    const item = items[idx];
    if (item && item.value !== value) onChange(item.value);
  };

  const markGesture = () => {
    gesturedRef.current = true;
  };

  const handleScroll = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(commitFromScroll, 120);
  };

  // While value is null the wheel shows the anchor but no row gets the
  // "chosen" style: otherwise an unconfirmed value looks identical to a real
  // choice and the user cannot tell why Continue does not respond.
  const hasValue = value !== null;

  return (
    <div
      className={cn('relative select-none', className)}
      style={{ height: viewportHeight }}
      role="listbox"
      aria-label={ariaLabel}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onPointerDown={markGesture}
        onTouchStart={markGesture}
        onWheel={markGesture}
        onKeyDown={markGesture}
        className="h-full overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: 'y mandatory', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
      >
        <div style={{ height: pad }} aria-hidden />
        {items.map((it, i) => (
          <button
            type="button"
            key={it.value}
            role="option"
            aria-selected={value === it.value}
            onClick={() => {
              gesturedRef.current = true;
              scrollRef.current?.scrollTo({ top: i * itemHeight, behavior: 'smooth' });
              if (it.value !== value) onChange(it.value);
            }}
            className={cn(
              'flex w-full shrink-0 items-center justify-center text-sm tabular-nums transition-colors',
              hasValue && value === it.value ? 'text-foreground font-medium' : 'text-muted-foreground',
            )}
            style={{ height: itemHeight, scrollSnapAlign: 'center' }}
          >
            {it.label}
          </button>
        ))}
        <div style={{ height: pad }} aria-hidden />
      </div>

      {/* Selection band */}
      <div
        className="pointer-events-none absolute inset-x-0 border-y border-border"
        style={{ top: pad, height: itemHeight }}
      />
      {/* Top / bottom fades */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-background to-transparent"
        style={{ height: pad }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent"
        style={{ height: pad }}
      />
    </div>
  );
}
