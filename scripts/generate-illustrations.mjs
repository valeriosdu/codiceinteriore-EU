#!/usr/bin/env node
// Generazione batch delle illustrazioni Sprint 3 via Higgsfield CLI.
//
// Prerequisiti:
//   1. CLI installata: `npm install -g @higgsfield/cli`
//   2. Loggato:        `higgsfield auth login` (one-time, browser flow)
//
// Uso:
//   npm run generate:illustrations               # genera tutte le voci enabled:true
//   npm run generate:illustrations luna          # solo gli slug/tipo che matchano "luna"
//   FORCE=1 npm run generate:illustrations       # rigenera anche se il file esiste
//
// Il CLI gestisce auth (token salvato in ~/.higgsfield/) e polling (--wait).
// Lo script si limita a: iterare i prompt, chiamare il CLI, scaricare il media
// URL ritornato, ottimizzare in WebP 1600w + 800w con sharp, salvare in public/.

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const IS_WINDOWS = process.platform === "win32";
// Su Windows i binari installati globalmente da npm sono shim .cmd. Node 20+
// (CVE-2024-27980) blocca lo spawn diretto di .cmd: bisogna passare per
// shell: true. Su unix il binary normale "higgsfield" senza shell e' piu'
// safe (no escape issues).
const HIGGSFIELD_BIN = IS_WINDOWS ? "higgsfield.cmd" : "higgsfield";

// Quoting cmd.exe-safe per gli argomenti, usato solo su Windows con shell:true.
const quoteArg = (arg) => {
  if (!/[\s"&<>|^()]/.test(arg)) return arg;
  // Doppie virgolette interne raddoppiate (convention cmd.exe).
  return `"${arg.replace(/"/g, '""')}"`;
};

const runCli = (args) =>
  new Promise((resolveP, rejectP) => {
    const opts = { windowsHide: true };
    let child;
    if (IS_WINDOWS) {
      // shell:true + array passa per cmd.exe; quotiamo noi gli args per
      // gestire spazi/virgolette nel prompt.
      const quoted = args.map(quoteArg).join(" ");
      child = spawn(`${HIGGSFIELD_BIN} ${quoted}`, { ...opts, shell: true });
    } else {
      child = spawn(HIGGSFIELD_BIN, args, opts);
    }
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", rejectP);
    child.on("close", (code) => {
      if (code !== 0) {
        return rejectP(
          new Error(`higgsfield exited with code ${code}\nstderr:\n${stderr}\nstdout:\n${stdout}`),
        );
      }
      resolveP({ stdout, stderr });
    });
  });

const FORCE = process.env.FORCE === "1";
const CONCURRENCY = Math.max(1, parseInt(process.env.CONCURRENCY ?? "4", 10) || 4);
const filterArg = process.argv[2];

const promptsPath = resolve(ROOT, "scripts/illustration-prompts.json");
const promptsData = JSON.parse(await readFile(promptsPath, "utf8"));
const { model, modelDisplayName, params, promptTemplate, items } = promptsData;

const fileExists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

// Estrae l'URL dell'immagine dal payload JSON ritornato dal CLI. Il formato
// puo' variare leggermente tra versioni del CLI / modelli; cerchiamo i campi
// piu' probabili in ordine di likelihood.
const extractImageUrl = (parsed) => {
  // Possibile formato: array di job objects
  const jobs = Array.isArray(parsed) ? parsed : [parsed];
  for (const job of jobs) {
    if (!job) continue;
    // Cerchiamo nei campi piu' comuni
    if (typeof job.media_url === "string") return job.media_url;
    if (typeof job.result_url === "string") return job.result_url;
    if (typeof job.url === "string") return job.url;
    if (typeof job.image_url === "string") return job.image_url;
    if (Array.isArray(job.images) && job.images[0]) {
      const img = job.images[0];
      if (typeof img === "string") return img;
      if (img && typeof img.url === "string") return img.url;
    }
    if (Array.isArray(job.medias) && job.medias[0]) {
      const m = job.medias[0];
      if (typeof m === "string") return m;
      if (m && typeof m.url === "string") return m.url;
    }
    if (job.result && typeof job.result === "object") {
      const r = job.result;
      if (typeof r.url === "string") return r.url;
      if (Array.isArray(r.images) && r.images[0]?.url) return r.images[0].url;
      if (Array.isArray(r.medias) && r.medias[0]?.url) return r.medias[0].url;
    }
    if (job.output && typeof job.output === "object") {
      const o = job.output;
      if (typeof o.url === "string") return o.url;
      if (Array.isArray(o.images) && o.images[0]?.url) return o.images[0].url;
    }
  }
  return null;
};

const callCli = async (item) => {
  const finalPrompt = promptTemplate.replace("[SUBJECT]", item.subject);

  const args = [
    "generate",
    "create",
    model,
    "--prompt",
    finalPrompt,
    "--wait",
    "--wait-timeout",
    "10m",
    "--json",
  ];
  for (const [k, v] of Object.entries(params ?? {})) {
    args.push(`--${k}`, String(v));
  }

  console.log(`  cmd: higgsfield ${args.slice(0, 4).join(" ")} ... --wait --json`);
  const { stdout, stderr } = await runCli(args);

  if (stderr && stderr.trim()) {
    // Il CLI puo' stampare info su stderr senza errore; logghiamo a debug solo.
    if (process.env.DEBUG === "1") console.error("  [stderr]", stderr.trim());
  }

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error(`Impossibile parsare il JSON output del CLI:\n${stdout.slice(0, 500)}`);
  }

  const url = extractImageUrl(parsed);
  if (!url) {
    throw new Error(
      `Nessuna URL immagine trovata nel JSON output. Struttura ricevuta:\n${JSON.stringify(parsed, null, 2).slice(0, 800)}`,
    );
  }
  return url;
};

const downloadAndOptimize = async (imageUrl, outputPathRel) => {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Download fallito: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const absOut = resolve(ROOT, outputPathRel);
  await mkdir(dirname(absOut), { recursive: true });

  // 1600w main + 800w mobile, entrambi WebP.
  await sharp(buf).resize(1600, null, { withoutEnlargement: true }).webp({ quality: 85 }).toFile(absOut);
  const smallOut = absOut.replace(/\.webp$/, "@small.webp");
  await sharp(buf).resize(800, null, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(smallOut);

  return { main: absOut, small: smallOut };
};

const processItem = async (item) => {
  const outAbs = resolve(ROOT, item.outputPath);

  if (!FORCE && (await fileExists(outAbs))) {
    console.log(`[skip] ${item.slug}: gia' presente (FORCE=1 per rigenerare)`);
    return { ok: true, skipped: true };
  }

  console.log(`[start] ${item.slug}`);
  const url = await callCli(item);
  console.log(`        URL: ${url}`);
  console.log(`[download] ${item.slug}: ottimizzazione WebP...`);
  const out = await downloadAndOptimize(url, item.outputPath);
  console.log(`[done] ${item.slug}: ${out.main}\n`);
  return { ok: true };
};

const main = async () => {
  console.log("=== generate-illustrations.mjs ===");
  console.log(`model      : ${model} (${modelDisplayName})`);
  console.log(`params     : ${JSON.stringify(params)}`);
  console.log(`force      : ${FORCE}`);
  console.log(`concurrency: ${CONCURRENCY}`);
  if (filterArg) console.log(`filter     : "${filterArg}"`);
  console.log("==================================\n");

  const todo = items
    .filter((i) => i.enabled)
    .filter((i) => !filterArg || i.slug.includes(filterArg) || i.tipo === filterArg);

  if (todo.length === 0) {
    console.log("Nessuna voce da processare.");
    return;
  }

  console.log(`${todo.length} voci da processare:`);
  todo.forEach((i) => console.log(`  - ${i.kind}/${i.tipo ? i.tipo + "/" : ""}${i.slug}`));
  console.log();

  const results = [];
  const queue = todo.slice();
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      try {
        results.push({ slug: item.slug, ...(await processItem(item)) });
      } catch (err) {
        console.error(`[errore] ${item.slug}: ${err.message}`);
        results.push({ slug: item.slug, ok: false, error: err.message });
      }
    }
  });
  await Promise.all(workers);

  console.log("=== summary ===");
  console.log(`generated: ${results.filter((r) => r.ok && !r.skipped).length}`);
  console.log(`skipped  : ${results.filter((r) => r.skipped).length}`);
  console.log(`failed   : ${results.filter((r) => !r.ok).length}`);

  if (results.some((r) => !r.ok)) process.exit(1);
};

await main();
