// JSON-LD per la SEO, parametrizzato sul mercato attivo. Vive fuori dall'albero
// React, quindi legge MARKET (costante build-time) e il catalogo via
// getMessages invece di useI18n.

import { MARKET } from "@/markets";
import { getMessages } from "@/i18n";

const SITE_URL = MARKET.siteUrl;
const LOCALE = MARKET.locale;
const COUNTRY = MARKET.countryCode;
const CURRENCY = MARKET.currency;
const SITE_NAME = MARKET.siteName;
const M = getMessages(MARKET.language);

const DEFAULT_PRODUCT_IMAGES = [
  "/og/codice-interiore-1x1.webp",
  "https://storage.googleapis.com/gpt-engineer-file-uploads/aVZLfEnbxJa0xgnu23ciVWX02mn2/social-images/social-1775810599830-hf_20260410_084149_80649ee2-59cc-4089-b616-cd3a7ef4c012.webp",
];

const toAbsoluteImage = (raw: string) =>
  raw.startsWith("http") ? raw : `${SITE_URL}${raw.startsWith("/") ? raw : `/${raw}`}`;

const digitalShippingDetails = {
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: "0", currency: CURRENCY },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: COUNTRY },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
  },
};

const merchantReturnPolicy = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: COUNTRY,
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 14,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/FreeReturn",
};

export const productJsonLd = (overrides?: {
  name?: string;
  description?: string;
  url?: string;
  image?: string | string[];
}) => {
  const rawImages = overrides?.image
    ? Array.isArray(overrides.image)
      ? overrides.image
      : [overrides.image]
    : DEFAULT_PRODUCT_IMAGES;
  const image = rawImages.map(toAbsoluteImage);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: overrides?.name ?? M.seo.product.name,
    description: overrides?.description ?? M.seo.product.description,
    brand: { "@type": "Brand", name: SITE_NAME },
    url: overrides?.url ?? SITE_URL,
    image,
    category: M.seo.product.category,
    offers: [
      {
        "@type": "Offer",
        name: M.seo.product.offerBase,
        price: String(MARKET.prices.base),
        priceCurrency: CURRENCY,
        availability: "https://schema.org/InStock",
        url: SITE_URL,
        shippingDetails: digitalShippingDetails,
        hasMerchantReturnPolicy: merchantReturnPolicy,
      },
      {
        "@type": "Offer",
        name: M.seo.product.offerPremium,
        price: String(MARKET.prices.premium),
        priceCurrency: CURRENCY,
        availability: "https://schema.org/InStock",
        url: SITE_URL,
        shippingDetails: digitalShippingDetails,
        hasMerchantReturnPolicy: merchantReturnPolicy,
      },
    ],
  };
};

export const faqJsonLd = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  })),
});

export const contactPageJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: `${M.seo.contactPageName} — ${SITE_NAME}`,
  url: `${SITE_URL}/contatti`,
  inLanguage: LOCALE,
});

export const articleJsonLd = (args: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  articleSection?: string;
  wordCount?: number;
  keywords?: string[];
}) => {
  const fullUrl = `${SITE_URL}${args.path}`;
  const imageUrl = args.image
    ? args.image.startsWith("http")
      ? args.image
      : `${SITE_URL}${args.image.startsWith("/") ? args.image : `/${args.image}`}`
    : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.headline,
    description: args.description,
    url: fullUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": fullUrl },
    inLanguage: LOCALE,
    datePublished: args.datePublished,
    dateModified: args.dateModified ?? args.datePublished,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
    },
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(args.articleSection ? { articleSection: args.articleSection } : {}),
    ...(args.wordCount ? { wordCount: args.wordCount } : {}),
    ...(args.keywords && args.keywords.length ? { keywords: args.keywords.join(", ") } : {}),
  };
};

export const definedTermJsonLd = (args: {
  term: string;
  description: string;
  path: string;
  inDefinedTermSetName: string;
  image?: string;
}) => {
  const imageUrl = args.image
    ? args.image.startsWith("http")
      ? args.image
      : `${SITE_URL}${args.image.startsWith("/") ? args.image : `/${args.image}`}`
    : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: args.term,
    description: args.description,
    url: `${SITE_URL}${args.path}`,
    inLanguage: LOCALE,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: args.inDefinedTermSetName,
      url: `${SITE_URL}/glossario`,
    },
    ...(imageUrl ? { image: imageUrl } : {}),
  };
};

export const collectionPageJsonLd = (args: {
  name: string;
  description: string;
  path: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: args.name,
  description: args.description,
  url: `${SITE_URL}${args.path}`,
  inLanguage: LOCALE,
});

export const DEFAULT_FAQS = M.seo.defaultFaqs;
