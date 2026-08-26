// Genera public/robots.txt e public/sitemap.xml per il mercato del build
// corrente. Node puro, nessuna dipendenza. Eseguito come `prebuild`.
//
// Sorgente di verità: le env VITE_SITE_URL e VITE_MARKET (impostate nel
// pannello Vercel per dominio, o in .env per il dev locale). Lo script legge
// prima process.env, poi fa fallback su un parsing minimale di .env.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv() {
  const out = {};
  const path = join(root, ".env");
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const fileEnv = loadDotEnv();
const env = (k, fallback) => process.env[k] || fileEnv[k] || fallback;

const SITE_URL = (env("VITE_SITE_URL", "https://www.codiceinteriore.it")).replace(/\/$/, "");
const MARKET = env("VITE_MARKET", "it");
const hasEditorial = MARKET === "it";

// Slug localizzati per mercato, allineati a SLUGS_BY_LANG in src/lib/routes.ts
// (il test market-parity verifica che le due tabelle non divergano).
const SLUGS_IT = {
  lpClassica: "/lp/classica",
  lpAttivazione: "/lp/attivazione",
  contact: "/contatti",
  terms: "/termini",
  gift: "/regalo",
};
const SLUGS_BY_MARKET = {
  it: SLUGS_IT,
  es: SLUGS_IT,
  us: {
    lpClassica: "/lp/classic",
    lpAttivazione: "/lp/activation",
    contact: "/contact",
    terms: "/terms",
    gift: "/gift",
  },
  nl: {
    lpClassica: "/lp/klassiek",
    lpAttivazione: "/lp/activatie",
    contact: "/contact",
    terms: "/voorwaarden",
    gift: "/cadeau",
  },
};
const slug = SLUGS_BY_MARKET[MARKET] || SLUGS_IT;

// Route base, presenti in tutti i mercati.
const baseRoutes = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: slug.lpClassica, changefreq: "weekly", priority: "0.9" },
  { path: slug.lpAttivazione, changefreq: "weekly", priority: "0.9" },
  { path: slug.contact, changefreq: "monthly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
  { path: slug.terms, changefreq: "yearly", priority: "0.2" },
];

// Route editoriali (guide + glossario): solo nei mercati con editorialContent.
const editorialPaths = [
  "/guide", "/guide/cos-e-il-tema-natale", "/guide/tema-natale-vs-oroscopo",
  "/guide/come-leggere-tema-natale", "/guide/tema-natale-psicologico",
  "/guide/tema-natale-relazioni", "/guide/tema-natale-blocco-emotivo",
  "/guide/come-calcolare-tema-natale", "/guide/tema-natale-gratis-online",
  "/glossario",
  "/glossario/pianeti/luna", "/glossario/pianeti/sole", "/glossario/pianeti/mercurio",
  "/glossario/pianeti/venere", "/glossario/pianeti/marte", "/glossario/pianeti/giove",
  "/glossario/pianeti/saturno", "/glossario/pianeti/urano", "/glossario/pianeti/nettuno",
  "/glossario/pianeti/plutone",
  "/glossario/segni/ariete", "/glossario/segni/toro", "/glossario/segni/gemelli",
  "/glossario/segni/cancro", "/glossario/segni/leone", "/glossario/segni/vergine",
  "/glossario/segni/bilancia", "/glossario/segni/scorpione", "/glossario/segni/sagittario",
  "/glossario/segni/capricorno", "/glossario/segni/acquario", "/glossario/segni/pesci",
  "/glossario/case/prima-casa", "/glossario/case/seconda-casa", "/glossario/case/terza-casa",
  "/glossario/case/quarta-casa", "/glossario/case/quinta-casa", "/glossario/case/sesta-casa",
  "/glossario/case/settima-casa", "/glossario/case/ottava-casa", "/glossario/case/nona-casa",
  "/glossario/case/decima-casa", "/glossario/case/undicesima-casa", "/glossario/case/dodicesima-casa",
  "/glossario/aspetti/congiunzione", "/glossario/aspetti/opposizione", "/glossario/aspetti/trigono",
  "/glossario/aspetti/quadratura", "/glossario/aspetti/sestile", "/glossario/aspetti/semisestile",
  "/glossario/aspetti/quinconce", "/glossario/aspetti/semiquadratura",
  "/glossario/punti/ascendente", "/glossario/punti/discendente", "/glossario/punti/medio-cielo",
  "/glossario/punti/fondo-cielo", "/glossario/punti/nodi-lunari", "/glossario/punti/lilith",
  "/glossario/punti/chirone",
].map((path) => ({
  path,
  changefreq: path === "/guide" || path === "/glossario" ? "weekly" : "monthly",
  priority: path.startsWith("/guide") ? "0.7" : "0.6",
}));

const routes = hasEditorial ? [...baseRoutes, ...editorialPaths] : baseRoutes;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) =>
      `  <url>\n    <loc>${SITE_URL}${r.path === "/" ? "/" : r.path}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;

const funnelDisallow = [
  // slug.gift, non "/regalo" fisso: il robots.txt us vietava una rotta che li
  // non esiste e lasciava /gift indicizzabile.
  "/quiz", slug.gift, "/processing", "/teaser", "/offer", "/checkout",
  "/success", "/activate", "/report-processing", "/report",
];

const aiBots = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai",
  "Claude-Web", "PerplexityBot", "Perplexity-User", "Google-Extended",
];

const robots = `Sitemap: ${SITE_URL}/sitemap.xml

User-agent: *
Allow: /
${[...funnelDisallow, "/unsubscribe", "/admin/", "/dev/"].map((p) => `Disallow: ${p}`).join("\n")}

# AI crawler — esplicitamente permessi per visibilità su ChatGPT, Claude,
# Perplexity, Gemini. Il prodotto è informazionale: essere citati dagli LLM
# è un canale di acquisizione.
${aiBots
  .map(
    (bot) =>
      `User-agent: ${bot}\nAllow: /\n${funnelDisallow.map((p) => `Disallow: ${p}`).join("\n")}\nDisallow: /admin/\n`,
  )
  .join("\n")}`;

writeFileSync(join(root, "public", "sitemap.xml"), sitemap);
writeFileSync(join(root, "public", "robots.txt"), robots);

console.log(`[seo] generati robots.txt + sitemap.xml per market=${MARKET} (${SITE_URL}), ${routes.length} URL`);
