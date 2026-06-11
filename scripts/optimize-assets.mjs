// One-shot: ricomprime logo + preview report.
// Uso: node scripts/optimize-assets.mjs
import sharp from "sharp";
import { readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// I sorgenti sono molto oversize rispetto alle dimensioni renderizzate
// (logo 1024×326 renderizzato a ~100px, preview 1920×1920 in carousel a ~600px).
// Ridimensionare è dove sta il vero risparmio, non solo la qualità.
const tasks = [
  // Logo: renderizzato a h-8 (32px). Width 320 dà ~3× retina headroom.
  { from: "src/assets/logo.png", to: "src/assets/logo.webp", resize: { width: 320 }, opts: { quality: 90 } },
  { from: "src/assets/logo-nobg.png", to: "src/assets/logo-nobg.webp", resize: { width: 320 }, opts: { quality: 90 } },
  // Preview report: nel carousel la slide è max ~600px. Width 1200 dà 2× retina.
  { from: "src/assets/report-preview/1-identita.webp", to: "src/assets/report-preview/1-identita.webp", resize: { width: 1200 }, opts: { quality: 72 } },
  { from: "src/assets/report-preview/2-emozioni.webp", to: "src/assets/report-preview/2-emozioni.webp", resize: { width: 1200 }, opts: { quality: 72 } },
  { from: "src/assets/report-preview/3-relazioni.webp", to: "src/assets/report-preview/3-relazioni.webp", resize: { width: 1200 }, opts: { quality: 72 } },
  { from: "src/assets/report-preview/4-consigli.webp", to: "src/assets/report-preview/4-consigli.webp", resize: { width: 1200 }, opts: { quality: 72 } },
  { from: "src/assets/report-preview/5-poesia.webp", to: "src/assets/report-preview/5-poesia.webp", resize: { width: 1200 }, opts: { quality: 72 } },
  { from: "src/assets/report-preview/hero.webp", to: "src/assets/report-preview/hero.webp", resize: { width: 1200 }, opts: { quality: 75 } },
];

function fmt(bytes) {
  return (bytes / 1024).toFixed(1) + " KB";
}

let totalBefore = 0;
let totalAfter = 0;

for (const t of tasks) {
  const fromAbs = path.join(ROOT, t.from);
  const toAbs = path.join(ROOT, t.to);
  const before = (await stat(fromAbs)).size;
  const input = await readFile(fromAbs);
  let pipeline = sharp(input);
  if (t.resize) {
    // withoutEnlargement: se l'immagine è già più piccola del target, non ingrandire.
    pipeline = pipeline.resize({ ...t.resize, withoutEnlargement: true });
  }
  const output = await pipeline.webp(t.opts).toBuffer();
  await writeFile(toAbs, output);
  const after = output.length;
  totalBefore += before;
  totalAfter += after;
  const delta = before - after;
  const pct = before > 0 ? ((delta / before) * 100).toFixed(0) : "0";
  console.log(`${t.to.padEnd(45)} ${fmt(before).padStart(10)} → ${fmt(after).padStart(10)}  (-${pct}%)`);
}

console.log("─".repeat(80));
console.log(
  `TOTALE${" ".repeat(43)}${fmt(totalBefore).padStart(10)} → ${fmt(totalAfter).padStart(10)}  (-${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(0)}%)`,
);
