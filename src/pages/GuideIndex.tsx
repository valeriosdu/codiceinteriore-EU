import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { GUIDE_ENTRIES } from "@/content/registry";
import { guidePath } from "@/content/types";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
} from "@/lib/seo-jsonld";

const GuideIndex = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Guide al Tema Natale — Codice Interiore"
        description="Approfondimenti sul tema natale: cos'è, come si legge, differenze con l'oroscopo. Articoli scritti in italiano con taglio psicologico, non predittivo."
        path="/guide"
        jsonLd={[
          collectionPageJsonLd({
            name: "Guide al Tema Natale",
            description:
              "Articoli editoriali sul tema natale e l'astrologia psicologica.",
            path: "/guide",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guide", path: "/guide" },
          ]),
        ]}
      />
      <Header />

      <main className="container max-w-3xl mx-auto px-5 py-12 flex-1">
        <header className="mb-10">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3 font-medium">
            Guide
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3">
            Guide al Tema Natale
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Articoli scritti in italiano per leggere il tema natale come uno
            strumento di descrizione psicologica, non come previsione.
          </p>
        </header>

        <ul className="space-y-6">
          {GUIDE_ENTRIES.map((entry) => (
            <li key={entry.slug} className="border-b border-border pb-6 last:border-b-0">
              <Link
                to={guidePath(entry.slug)}
                className="block group"
              >
                <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  {entry.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {entry.metaDescription}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <Footer />
    </div>
  );
};

export default GuideIndex;
