import type { ReactNode } from "react";

// Tipi condivisi per i contenuti editoriali SEO (Sprint 3).
//
// - GuideEntry  → articoli pillar lunghi (/guide/<slug>)
// - GlossarioEntry → voci glossario (/glossario/<tipo>/<slug>)
//
// I body sono ReactNode (non stringhe) per permettere JSX inline: <Link> per
// internal linking, <em>, liste, ecc. Il prezzo è perdere il rendering da
// stringa pura, ma per 58 pagine curate il vantaggio del type-safe linking
// supera il costo.

export type GlossarioTipo = "pianeti" | "segni" | "case" | "aspetti" | "punti";

export const GLOSSARIO_TIPO_LABEL: Record<GlossarioTipo, string> = {
  pianeti: "Pianeti",
  segni: "Segni zodiacali",
  case: "Case astrologiche",
  aspetti: "Aspetti planetari",
  punti: "Punti speciali",
};

export interface CoverImage {
  src: string; // path relativo dalla root del sito, es. /illustrations/guide/cos-e-il-tema-natale.webp
  srcSmall?: string; // versione 800w opzionale per srcset
  alt: string;
  width?: number;
  height?: number;
}

export interface GuideEntry {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heading: string;
  intro: ReactNode;
  body: ReactNode;
  publishedAt: string; // ISO date "2026-05-11"
  updatedAt?: string;
  readingMinutes?: number; // tempo di lettura visibile in header
  wordCount?: number; // usato in Article JSON-LD
  keywords?: string[]; // opzionali, finiscono in JSON-LD
  related?: { kind: "guide" | "glossario"; slug: string; tipo?: GlossarioTipo }[];
  coverImage?: CoverImage;
}

export interface GlossarioEntry {
  slug: string;
  tipo: GlossarioTipo;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heading: string;
  shortDefinition: string;
  body: ReactNode;
  publishedAt: string; // ISO date
  updatedAt?: string;
  readingMinutes?: number;
  wordCount?: number;
  keywords?: string[];
  related?: { kind: "guide" | "glossario"; slug: string; tipo?: GlossarioTipo }[];
  coverImage?: CoverImage;
}

export const guidePath = (slug: string) => `/guide/${slug}`;
export const glossarioPath = (tipo: GlossarioTipo, slug: string) =>
  `/glossario/${tipo}/${slug}`;
