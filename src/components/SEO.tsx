import { Helmet } from "react-helmet-async";

const SITE_URL = "https://www.codiceinteriore.it";
const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/aVZLfEnbxJa0xgnu23ciVWX02mn2/social-images/social-1775810599830-hf_20260410_084149_80649ee2-59cc-4089-b616-cd3a7ef4c012.webp";

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
      <meta property="og:locale" content="it_IT" />
      <meta property="og:site_name" content="Codice Interiore" />

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
