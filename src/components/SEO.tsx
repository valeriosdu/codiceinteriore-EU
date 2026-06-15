import { Helmet } from "react-helmet-async";
import { MARKET } from "@/markets";

const SITE_URL = MARKET.siteUrl;
const OG_LOCALE = MARKET.locale.replace("-", "_");
const DEFAULT_OG_IMAGE = MARKET.ogImage.startsWith("http")
  ? MARKET.ogImage
  : `${SITE_URL}${MARKET.ogImage.startsWith("/") ? MARKET.ogImage : `/${MARKET.ogImage}`}`;

interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const SEO = ({
  title,
  description,
  path,
  ogImage,
  noindex = false,
  jsonLd,
}: SEOProps) => {
  const canonical = `${SITE_URL}${path}`;
  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  // Per articoli con immagine cover, passare una URL relativa (es.
  // /illustrations/...) e la promuoviamo a URL assoluta cosi' Google/Open Graph
  // la accettano senza ambiguita'.
  const resolvedOg = ogImage
    ? ogImage.startsWith("http")
      ? ogImage
      : `${SITE_URL}${ogImage.startsWith("/") ? ogImage : `/${ogImage}`}`
    : DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        // max-image-preview:large = permette a Google di mostrare l'immagine
        // grande in SERP per editorial content (importante con coverImage).
        // max-snippet:-1 = niente limite arbitrario sullo snippet.
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      )}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={resolvedOg} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={OG_LOCALE} />
      <meta property="og:site_name" content={MARKET.siteName} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedOg} />

      {jsonLdArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
