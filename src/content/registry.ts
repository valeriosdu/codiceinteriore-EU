// Registry centrale di tutti i contenuti editoriali (/guide/* + /glossario/*).
// Importato dai template pagina e dagli hub per il listing. Da aggiornare ogni
// volta che si aggiunge una nuova entry. Niente magic auto-discovery file
// system per non introdurre import dinamici (Vite non li gestisce idealmente
// per SSR/prerender futuro).
//
// IMPORTANTE: quando aggiungi una entry qui, aggiungi anche la riga
// corrispondente in public/sitemap.xml. Niente generazione automatica per ora
// (motivazioni nella conversazione di setup Sprint 3).

import luna from "./glossario/pianeti/luna";
import sole from "./glossario/pianeti/sole";
import mercurio from "./glossario/pianeti/mercurio";
import venere from "./glossario/pianeti/venere";
import marte from "./glossario/pianeti/marte";
import giove from "./glossario/pianeti/giove";
import saturno from "./glossario/pianeti/saturno";
import urano from "./glossario/pianeti/urano";
import nettuno from "./glossario/pianeti/nettuno";
import plutone from "./glossario/pianeti/plutone";
import ariete from "./glossario/segni/ariete";
import leone from "./glossario/segni/leone";
import sagittario from "./glossario/segni/sagittario";
import toro from "./glossario/segni/toro";
import vergine from "./glossario/segni/vergine";
import capricorno from "./glossario/segni/capricorno";
import gemelli from "./glossario/segni/gemelli";
import bilancia from "./glossario/segni/bilancia";
import acquario from "./glossario/segni/acquario";
import cancro from "./glossario/segni/cancro";
import scorpione from "./glossario/segni/scorpione";
import pesci from "./glossario/segni/pesci";
import primaCasa from "./glossario/case/prima-casa";
import secondaCasa from "./glossario/case/seconda-casa";
import terzaCasa from "./glossario/case/terza-casa";
import quartaCasa from "./glossario/case/quarta-casa";
import quintaCasa from "./glossario/case/quinta-casa";
import sestaCasa from "./glossario/case/sesta-casa";
import settimaCasa from "./glossario/case/settima-casa";
import ottavaCasa from "./glossario/case/ottava-casa";
import nonaCasa from "./glossario/case/nona-casa";
import decimaCasa from "./glossario/case/decima-casa";
import undicesimaCasa from "./glossario/case/undicesima-casa";
import dodicesimaCasa from "./glossario/case/dodicesima-casa";
import congiunzione from "./glossario/aspetti/congiunzione";
import opposizione from "./glossario/aspetti/opposizione";
import trigono from "./glossario/aspetti/trigono";
import quadratura from "./glossario/aspetti/quadratura";
import sestile from "./glossario/aspetti/sestile";
import semisestile from "./glossario/aspetti/semisestile";
import quinconce from "./glossario/aspetti/quinconce";
import semiquadratura from "./glossario/aspetti/semiquadratura";
import ascendente from "./glossario/punti/ascendente";
import discendente from "./glossario/punti/discendente";
import medioCielo from "./glossario/punti/medio-cielo";
import fondoCielo from "./glossario/punti/fondo-cielo";
import nodiLunari from "./glossario/punti/nodi-lunari";
import lilith from "./glossario/punti/lilith";
import chirone from "./glossario/punti/chirone";
import cosETemaNatale from "./guide/cos-e-il-tema-natale";
import temaNataleVsOroscopo from "./guide/tema-natale-vs-oroscopo";
import comeLeggereTemaNatale from "./guide/come-leggere-tema-natale";
import temaNatalePsicologico from "./guide/tema-natale-psicologico";
import temaNataleRelazioni from "./guide/tema-natale-relazioni";
import temaNataleBloccoEmotivo from "./guide/tema-natale-blocco-emotivo";
import comeCalcolareTemaNatale from "./guide/come-calcolare-tema-natale";
import temaNataleGratisOnline from "./guide/tema-natale-gratis-online";

import type { GlossarioEntry, GuideEntry } from "./types";

export const GUIDE_ENTRIES: GuideEntry[] = [
  cosETemaNatale,
  temaNataleVsOroscopo,
  comeLeggereTemaNatale,
  temaNatalePsicologico,
  temaNataleRelazioni,
  temaNataleBloccoEmotivo,
  comeCalcolareTemaNatale,
  temaNataleGratisOnline,
];

export const GLOSSARIO_ENTRIES: GlossarioEntry[] = [
  sole,
  luna,
  mercurio,
  venere,
  marte,
  giove,
  saturno,
  urano,
  nettuno,
  plutone,
  ariete,
  leone,
  sagittario,
  toro,
  vergine,
  capricorno,
  gemelli,
  bilancia,
  acquario,
  cancro,
  scorpione,
  pesci,
  primaCasa,
  secondaCasa,
  terzaCasa,
  quartaCasa,
  quintaCasa,
  sestaCasa,
  settimaCasa,
  ottavaCasa,
  nonaCasa,
  decimaCasa,
  undicesimaCasa,
  dodicesimaCasa,
  congiunzione,
  opposizione,
  trigono,
  quadratura,
  sestile,
  semisestile,
  quinconce,
  semiquadratura,
  ascendente,
  discendente,
  medioCielo,
  fondoCielo,
  nodiLunari,
  lilith,
  chirone,
];

export const getGuideBySlug = (slug: string): GuideEntry | undefined =>
  GUIDE_ENTRIES.find((e) => e.slug === slug);

export const getGlossarioEntry = (
  tipo: string,
  slug: string,
): GlossarioEntry | undefined =>
  GLOSSARIO_ENTRIES.find((e) => e.tipo === tipo && e.slug === slug);

export const getGlossarioByTipo = (tipo: string): GlossarioEntry[] =>
  GLOSSARIO_ENTRIES.filter((e) => e.tipo === tipo);
