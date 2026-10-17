import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  clearSynastryPdfCache,
  SYNASTRY_PDF_BUCKET,
  synastryCustomerPdfPath,
} from "../../supabase/functions/_shared/synastry-pdf-cache";

// Il PDF sinastria del cliente e' cachato in report-pdfs con un path che porta
// versione e lingua ma non il contenuto. Quindi la cache e' corretta solo se:
//  - la lingua sta nel path (lo stesso id puo' essere rigenerato in un'altra
//    lingua e non deve ricevere il file della precedente);
//  - ogni punto che cambia full_report (rigenera, cancella) la svuota, senza
//    toccare la copia -previous che serve al download admin ?version=previous;
//  - un report cancellato non serve mai un file cachato.

const SID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ALTRA = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function fakeStorage(initial: string[]) {
  const files = new Set(initial);
  const removed: string[] = [];
  const client = {
    storage: {
      from: (bucket: string) => {
        expect(bucket).toBe(SYNASTRY_PDF_BUCKET);
        return {
          list: async (folder: string, opts?: { search?: string }) => ({
            data: [...files]
              .filter((p) => p.startsWith(`${folder}/`))
              .map((p) => ({ name: p.slice(folder.length + 1) }))
              .filter((f) => !opts?.search || f.name.includes(opts.search)),
          }),
          remove: async (paths: string[]) => {
            for (const p of paths) {
              files.delete(p);
              removed.push(p);
            }
            return { data: paths };
          },
        };
      },
    },
  };
  return { client, files, removed };
}

describe("synastryCustomerPdfPath", () => {
  it("mette versione e lingua nel path", () => {
    expect(synastryCustomerPdfPath(SID, "synastry-v12", "nl")).toBe(
      `synastry/${SID}-synastry-v12-nl.pdf`,
    );
  });

  it("una lingua diversa e' un file diverso", () => {
    const paths = (["it", "es", "en", "nl"] as const).map((l) =>
      synastryCustomerPdfPath(SID, "v1", l),
    );
    expect(new Set(paths).size).toBe(4);
  });
});

describe("clearSynastryPdfCache", () => {
  it("rimuove copie cliente e admin in ogni lingua e versione, ma non -previous", async () => {
    const { client, files } = fakeStorage([
      `synastry/${SID}-v12-it.pdf`,
      `synastry/${SID}-v12-nl.pdf`,
      `synastry/${SID}-v11-es.pdf`,
      `admin/synastry-${SID}-v12-it.pdf`,
      `admin/synastry-${SID}-v12-en.pdf`,
      `admin/synastry-${SID}-previous.pdf`,
    ]);
    const cleared = await clearSynastryPdfCache(client, SID);
    expect(cleared).toBe(5);
    expect([...files]).toEqual([`admin/synastry-${SID}-previous.pdf`]);
  });

  it("non tocca i file di un'altra sinastria ne' del ramo natale", async () => {
    const { client, files } = fakeStorage([
      `synastry/${ALTRA}-v12-it.pdf`,
      `admin/synastry-${ALTRA}-v12-it.pdf`,
      `admin/${SID}-v1-it.pdf`,
      `user-1/${SID}/report-v1-it.pdf`,
      `synastry/${SID}-v12-it.pdf`,
    ]);
    expect(await clearSynastryPdfCache(client, SID)).toBe(1);
    expect(files.has(`synastry/${ALTRA}-v12-it.pdf`)).toBe(true);
    expect(files.has(`admin/synastry-${ALTRA}-v12-it.pdf`)).toBe(true);
    expect(files.has(`admin/${SID}-v1-it.pdf`)).toBe(true);
    expect(files.has(`user-1/${SID}/report-v1-it.pdf`)).toBe(true);
  });

  it("senza cache non chiama remove e ritorna 0", async () => {
    const { client, removed } = fakeStorage([`synastry/${ALTRA}-v12-it.pdf`]);
    expect(await clearSynastryPdfCache(client, SID)).toBe(0);
    expect(removed).toEqual([]);
  });

  it("cancella il path che la funzione cliente scrive", async () => {
    const { client, files } = fakeStorage([synastryCustomerPdfPath(SID, "synastry-v12", "es")]);
    await clearSynastryPdfCache(client, SID);
    expect(files.size).toBe(0);
  });
});

describe("cablaggio edge function", () => {
  const read = (name: string) => readFileSync(`supabase/functions/${name}/index.ts`, "utf8");

  it("la funzione cliente legge la cache solo dopo il guard su full_report", () => {
    const src = read("generate-synastry-report-pdf");
    const guard = src.indexOf("Report not ready yet");
    const cacheRead = src.indexOf(".download(storagePath)");
    expect(guard).toBeGreaterThan(-1);
    expect(cacheRead).toBeGreaterThan(guard);
  });

  it("la funzione cliente cacha sotto un path con la lingua", () => {
    const src = read("generate-synastry-report-pdf");
    expect(src).toContain("synastryCustomerPdfPath(session.id, SYNASTRY_PDF_VERSION, pdfLang)");
  });

  it("rigenera e cancella svuotano la cache", () => {
    for (const fn of ["admin-regenerate-synastry-report", "admin-delete-synastry-report"]) {
      expect(read(fn)).toContain("clearSynastryPdfCache(supabase, synastrySessionId)");
    }
  });

  it("rigenera archivia il PDF corrente prima di svuotare la cache", () => {
    const src = read("admin-regenerate-synastry-report");
    expect(src.indexOf("await archivePreviousPdf(")).toBeLessThan(
      src.indexOf("await clearSynastryPdfCache("),
    );
  });
});
