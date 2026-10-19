import { ADMIN_MARKETS } from "@/components/admin/markets";
import type { MarketId } from "@/markets/types";

interface MarketFieldProps {
  value: MarketId | "";
  onChange: (value: MarketId) => void;
  disabled?: boolean;
}

export default function MarketField({ value, onChange, disabled }: MarketFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">Mercato</label>
      <select
        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value as MarketId)}
        disabled={disabled}
      >
        <option value="" disabled>
          Seleziona il mercato del cliente
        </option>
        {ADMIN_MARKETS.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        Decide lingua, valuta e brand di report, PDF ed email.
      </p>
    </div>
  );
}
