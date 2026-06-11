import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { GLOSSARIO_ENTRIES } from "@/content/registry";
import {
  GLOSSARIO_TIPO_LABEL,
  GlossarioTipo,
  glossarioPath,
} from "@/content/types";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
} from "@/lib/seo-jsonld";

const TIPI_ORDER: GlossarioTipo[] = ["pianeti", "segni", "case", "aspetti", "punti"];

const GlossarioIndex = () => {
  const byTipo = TIPI_ORDER.map((tipo) => ({
    tipo,
    label: GLOSSARIO_TIPO_LABEL[tipo],
    entries: GLOSSARIO_ENTRIES.filter((e) => e.tipo === tipo).sort((a, b) =>
      a.title.localeCompare(b.title, "it"),
    ),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Glossario del Tema Natale — Codice Interiore"
        description="Glossario di astrologia psicologica: pianeti, segni, case e aspetti del tema natale spiegati in italiano con taglio descrittivo, non predittivo."
        path="/glossario"
        jsonLd={[
          collectionPageJsonLd({
            name: "Glossario del Tema Natale",
            description:
              "Voci di astrologia psicologica: pianeti, segni, case, aspetti, punti speciali.",
            path: "/glossario",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Glossario", path: "/glossario" },
          ]),
        ]}
      />
      <Header />

      <main className="container max-w-3xl mx-auto px-5 py-12 flex-1">
        <header className="mb-10">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3 font-medium">
            Glossario
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3">
            Glossario del Tema Natale
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Pianeti, segni, case e aspetti spiegati in italiano. Ogni voce è
            descrittiva: cosa significa nella struttura interiore di una
            persona, non cosa succederà.
          </p>
        </header>

        <div className="space-y-12">
          {byTipo.map((group) => (
            <section key={group.tipo}>
              <h2 className="font-display text-xl md:text-2xl font-semibold mb-4">
                {group.label}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {group.entries.map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      to={glossarioPath(entry.tipo, entry.slug)}
                      className="block py-2 text-primary hover:underline"
                    >
                      {entry.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GlossarioIndex;
