// Formattazione date in italiano per metadati visibili negli articoli (Guide
// + Glossario). Esempio: "11 maggio 2026". I bot vedono comunque l'attributo
// machine-readable nell'elemento <time datetime="2026-05-11">.

const formatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const formatItalianDate = (isoDate: string): string => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return formatter.format(d);
};
