const SITE_URL = "https://www.codiceinteriore.it";
const DEFAULT_PRODUCT_IMAGES = [
  "/og/codice-interiore-1x1.webp",
  "https://storage.googleapis.com/gpt-engineer-file-uploads/aVZLfEnbxJa0xgnu23ciVWX02mn2/social-images/social-1775810599830-hf_20260410_084149_80649ee2-59cc-4089-b616-cd3a7ef4c012.webp",
];

const toAbsoluteImage = (raw: string) =>
  raw.startsWith("http") ? raw : `${SITE_URL}${raw.startsWith("/") ? raw : `/${raw}`}`;

const digitalShippingDetails = {
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "EUR" },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "IT" },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
  },
};

const merchantReturnPolicy = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "IT",
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
    name: overrides?.name ?? "Lettura del Tema Natale",
    description:
      overrides?.description ??
      "Lettura personalizzata del tema natale, scritta in italiano. Report di circa 10 pagine basato sui dati di nascita, con focus psicologico anziché predittivo.",
    brand: { "@type": "Brand", name: "Codice Interiore" },
    url: overrides?.url ?? SITE_URL,
    image,
    category: "Astrologia psicologica",
    offers: [
      {
        "@type": "Offer",
        name: "Lettura Completa",
        price: "19",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: SITE_URL,
        shippingDetails: digitalShippingDetails,
        hasMerchantReturnPolicy: merchantReturnPolicy,
      },
      {
        "@type": "Offer",
        name: "Lettura + 1 mese di Transiti",
        price: "29",
        priceCurrency: "EUR",
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
  name: "Contatti — Codice Interiore",
  url: `${SITE_URL}/contatti`,
  inLanguage: "it-IT",
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
    inLanguage: "it-IT",
    datePublished: args.datePublished,
    dateModified: args.dateModified ?? args.datePublished,
    author: { "@type": "Organization", name: "Codice Interiore", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Codice Interiore",
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
    inLanguage: "it-IT",
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
  inLanguage: "it-IT",
});

export const DEFAULT_FAQS = [
  {
    question: "L'astrologia non è scienza, è fuffa?",
    answer:
      "Non è una predizione né una scienza esatta: è un linguaggio simbolico che usiamo come griglia per leggere la struttura interiore. Il valore viene dalla precisione psicologica della lettura, non da pretese predittive. Garanzia rimborso se la lettura ti sembra generica.",
  },
  {
    question: "Trovo letture gratis online, perché pagare?",
    answer:
      "Le letture gratis sono frammenti tecnici (un significato per pianeta, uno per casa, uno per aspetto). Qui leggiamo la carta come insieme coerente, in italiano umano, in circa 10 pagine. È l'opposto della frammentazione.",
  },
  {
    question: "Mi dirà cosa fare?",
    answer:
      "No, e lo diciamo prima. Descriviamo come sei costruito o costruita, non diamo consigli motivazionali. La credibilità del prodotto sta in questa modestia.",
  },
  {
    question: "Quanto è personalizzata davvero?",
    answer:
      "La lettura è generata sulla tua carta natale specifica (data, ora e luogo di nascita) più le risposte a 2 domande di intake che modulano il tono. Tutto deriva dal cielo del giorno in cui sei nato o nata.",
  },
];
