import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import {
  GLOSSARIO_ENTRIES,
  GUIDE_ENTRIES,
  getGlossarioEntry,
} from "@/content/registry";
import {
  GLOSSARIO_TIPO_LABEL,
  glossarioPath,
  guidePath,
} from "@/content/types";
import {
  breadcrumbJsonLd,
  definedTermJsonLd,
} from "@/lib/seo-jsonld";
import { formatItalianDate } from "@/lib/date";

const GlossarioPage = () => {
  const { tipo, slug } = useParams<{ tipo: string; slug: string }>();
  const navigate = useNavigate();
  const entry = tipo && slug ? getGlossarioEntry(tipo, slug) : undefined;

  if (!entry) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO
          title="Voce non trovata — Codice Interiore"
          description="La voce del glossario richiesta non esiste."
          path={`/glossario/${tipo ?? ""}/${slug ?? ""}`}
          noindex
        />
        <Header />
        <main className="container max-w-2xl mx-auto px-5 py-20 flex-1 text-center">
          <h1 className="font-display text-3xl font-semibold mb-3">Voce non trovata</h1>
          <p className="text-muted-foreground mb-6">
            La voce che cerchi non esiste o non è stata ancora pubblicata.
          </p>
          <Link to="/glossario" className="text-primary underline hover:no-underline">
            Torna al glossario
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const path = glossarioPath(entry.tipo, entry.slug);
  const tipoLabel = GLOSSARIO_TIPO_LABEL[entry.tipo];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={entry.metaTitle}
        description={entry.metaDescription}
        path={path}
        ogImage={entry.coverImage?.src}
        jsonLd={[
          definedTermJsonLd({
            term: entry.title,
            description: entry.shortDefinition,
            path,
            inDefinedTermSetName: `Glossario del Tema Natale, ${tipoLabel}`,
            image: entry.coverImage?.src,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Glossario", path: "/glossario" },
            { name: tipoLabel, path: "/glossario" },
            { name: entry.title, path },
          ]),
        ]}
      />
      <Header
        backButton={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/glossario")}
            aria-label="Torna al glossario"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <main className="container max-w-3xl mx-auto px-5 py-10 flex-1">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/glossario" className="hover:text-foreground">Glossario</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground/80">{tipoLabel}</span>
          <span className="mx-2">/</span>
          <span className="text-foreground/80">{entry.title}</span>
        </nav>

        <article className="prose prose-neutral max-w-none">
          {entry.coverImage && (
            <figure className="mb-8 -mx-5 sm:mx-0">
              <img
                src={entry.coverImage.src}
                srcSet={
                  entry.coverImage.srcSmall
                    ? `${entry.coverImage.srcSmall} 800w, ${entry.coverImage.src} 1600w`
                    : undefined
                }
                sizes="(max-width: 768px) 100vw, 768px"
                alt={entry.coverImage.alt}
                width={entry.coverImage.width ?? 1600}
                height={entry.coverImage.height ?? 900}
                loading="eager"
                decoding="async"
                className="w-full h-auto rounded-md sm:rounded-lg"
              />
            </figure>
          )}
          <header className="mb-8 border-b border-border pb-6">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2 font-medium">
              {tipoLabel}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3">
              {entry.heading}
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {entry.shortDefinition}
            </p>
            <p className="mt-4 text-xs text-muted-foreground/80 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Codice Interiore</span>
              <span aria-hidden="true">·</span>
              <span>
                Pubblicato il{" "}
                <time dateTime={entry.publishedAt}>{formatItalianDate(entry.publishedAt)}</time>
              </span>
              {entry.updatedAt && entry.updatedAt !== entry.publishedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Aggiornato il{" "}
                    <time dateTime={entry.updatedAt}>{formatItalianDate(entry.updatedAt)}</time>
                  </span>
                </>
              )}
              {entry.readingMinutes && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{entry.readingMinutes} min di lettura</span>
                </>
              )}
            </p>
          </header>

          <div className="space-y-5 text-foreground/90 leading-relaxed">
            {entry.body}
          </div>

          {entry.related && entry.related.length > 0 && (
            <aside className="mt-12 pt-8 border-t border-border">
              <h2 className="font-display text-lg font-semibold mb-4">
                Voci e guide correlate
              </h2>
              <ul className="space-y-2">
                {entry.related.map((rel, i) => {
                  if (rel.kind === "glossario" && rel.tipo) {
                    const target = GLOSSARIO_ENTRIES.find(
                      (g) => g.tipo === rel.tipo && g.slug === rel.slug,
                    );
                    if (!target) return null;
                    return (
                      <li key={i}>
                        <Link
                          to={glossarioPath(rel.tipo, rel.slug)}
                          className="text-primary hover:underline"
                        >
                          {target.title}
                        </Link>
                      </li>
                    );
                  }
                  if (rel.kind === "guide") {
                    const target = GUIDE_ENTRIES.find((g) => g.slug === rel.slug);
                    if (!target) return null;
                    return (
                      <li key={i}>
                        <Link
                          to={guidePath(rel.slug)}
                          className="text-primary hover:underline"
                        >
                          {target.title}
                        </Link>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </aside>
          )}

          <section className="mt-12 p-6 rounded-2xl bg-surface text-center space-y-3">
            <p className="text-foreground leading-relaxed max-w-md mx-auto">
              Scopri come questa configurazione si combina con il resto del
              tuo tema natale.
            </p>
            <Button variant="premium" size="default" onClick={() => navigate("/quiz")}>
              Inizia il quiz
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default GlossarioPage;
