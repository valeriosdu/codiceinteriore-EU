// Formatter condivisi dai tab della scheda cliente.

const euroFmt = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function formatEuros(cents: number | null | undefined, currency = "EUR"): string {
  if (cents == null || cents === 0) return "—";
  const value = cents / 100;
  const cur = currency.toUpperCase();
  if (cur === "EUR") return euroFmt.format(value);
  try {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: cur }).format(value);
  } catch {
    return `${value.toFixed(2)} ${cur}`;
  }
}

export function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  } catch {
    return "—";
  }
}

export function formatBirth(
  bd: { day?: number; month?: number; year?: number } | null | undefined,
): string {
  if (!bd?.day || !bd?.month || !bd?.year) return "—";
  return `${bd.day}/${bd.month}/${bd.year}`;
}

export function formatTime(
  bt: { hour?: number; minute?: number } | null | undefined,
): string {
  if (bt == null || bt.hour == null) return "—";
  const hh = String(bt.hour).padStart(2, "0");
  const mm = String(bt.minute ?? 0).padStart(2, "0");
  return `${hh}:${mm}`;
}
