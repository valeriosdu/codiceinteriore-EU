// Formattazione date localizzata per metadati visibili negli articoli (Guide
// + Glossario). Esempio IT: "11 maggio 2026". I bot vedono comunque l'attributo
// machine-readable nell'elemento <time datetime="2026-05-11">.

import { MARKET } from "@/markets";

const formatter = new Intl.DateTimeFormat(MARKET.locale, {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const formatLocalizedDate = (isoDate: string): string => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return formatter.format(d);
};

// Alias retro-compatibile.
export const formatItalianDate = formatLocalizedDate;
