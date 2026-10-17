// Cache su storage del PDF sinastria servito al cliente.
//
// Il path porta versione e lingua ma non il contenuto: dopo una rigenerazione o
// una cancellazione il file vecchio resterebbe valido per la cache e verrebbe
// scaricato al posto del report nuovo. Per questo chi cambia full_report deve
// chiamare clearSynastryPdfCache.
//
// Modulo puro (nessun import remoto, nessun pdf-lib) cosi' le funzioni admin lo
// importano senza pagare il costo del builder PDF.

export const SYNASTRY_PDF_BUCKET = "report-pdfs";

type StorageClient = { storage: { from: (bucket: string) => any } };

// Stessa convenzione del path admin (admin/synastry-<id>-<versione>-<lingua>.pdf):
// la lingua e' nel path perche' lo stesso id puo' essere rigenerato in un'altra
// lingua e non deve ricevere il PDF della precedente.
export const synastryCustomerPdfPath = (
  sessionId: string,
  version: string,
  lang: string,
): string => `synastry/${sessionId}-${version}-${lang}.pdf`;

// Butta via i PDF cachati di una sinastria, in qualunque versione e lingua:
// quello servito all'admin (admin/synastry-<id>-...) e quello servito al cliente
// (synastry/<id>-...). La copia -previous non si tocca: serve al download
// admin ?version=previous. Ritorna quanti file ha rimosso.
export async function clearSynastryPdfCache(
  supabase: StorageClient,
  synastrySessionId: string,
): Promise<number> {
  const bucket = supabase.storage.from(SYNASTRY_PDF_BUCKET);
  const toRemove: string[] = [];

  const { data: adminFiles } = await bucket.list("admin", {
    search: `synastry-${synastrySessionId}-`,
  });
  for (const f of (adminFiles ?? []) as { name: string }[]) {
    if (f.name.startsWith(`synastry-${synastrySessionId}-`) && !f.name.includes("-previous")) {
      toRemove.push(`admin/${f.name}`);
    }
  }

  const { data: customerFiles } = await bucket.list("synastry", {
    search: `${synastrySessionId}-`,
  });
  for (const f of (customerFiles ?? []) as { name: string }[]) {
    if (f.name.startsWith(`${synastrySessionId}-`)) {
      toRemove.push(`synastry/${f.name}`);
    }
  }

  if (toRemove.length > 0) {
    await bucket.remove(toRemove);
  }
  return toRemove.length;
}
