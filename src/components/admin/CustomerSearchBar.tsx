import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerFilter, CustomerSort } from "@/hooks/admin/useAdminCustomersList";

interface CustomerSearchBarProps {
  q: string;
  onQChange: (value: string) => void;
  filter: CustomerFilter;
  onFilterChange: (value: CustomerFilter) => void;
  sort: CustomerSort;
  onSortChange: (value: CustomerSort) => void;
  hideEmpty: boolean;
  onHideEmptyChange: (value: boolean) => void;
  total?: number;
  loading?: boolean;
}

const FILTER_OPTIONS: Array<{ value: CustomerFilter; label: string }> = [
  { value: "all", label: "Tutti i clienti" },
  { value: "orphan", label: "Solo orfani" },
  { value: "subscriber", label: "Solo abbonati" },
  { value: "has_transits", label: "Con transiti" },
  { value: "has_synastry", label: "Con sinastria" },
  { value: "has_guide", label: "Con guida astrologica" },
  { value: "error", label: "Con report in errore" },
  { value: "no_report", label: "Senza report completato" },
];

const SORT_OPTIONS: Array<{ value: CustomerSort; label: string }> = [
  { value: "last_activity", label: "Ultima attività" },
  { value: "lifetime_spend", label: "Spesa totale" },
];

export default function CustomerSearchBar({
  q,
  onQChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  hideEmpty,
  onHideEmptyChange,
  total,
  loading,
}: CustomerSearchBarProps) {
  return (
    <div className="space-y-2">
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Cerca per email, nome o città…"
          className="pl-9 pr-9"
        />
        {q && (
          <button
            type="button"
            onClick={() => onQChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Pulisci ricerca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Select value={filter} onValueChange={(v) => onFilterChange(v as CustomerFilter)}>
        <SelectTrigger className="w-full md:w-48">
          <SelectValue placeholder="Filtro" />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => onSortChange(v as CustomerSort)}>
        <SelectTrigger className="w-full md:w-44">
          <SelectValue placeholder="Ordina" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="hidden md:block text-sm text-muted-foreground whitespace-nowrap">
        {loading ? "Caricamento…" : total != null ? `${total} clienti` : null}
      </div>
    </div>
    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
      <Checkbox
        checked={hideEmpty}
        onCheckedChange={(v) => onHideEmptyChange(v === true)}
      />
      Nascondi profili senza pagamenti né quiz (registrazioni anomale via magic link / OAuth)
    </label>
    </div>
  );
}
