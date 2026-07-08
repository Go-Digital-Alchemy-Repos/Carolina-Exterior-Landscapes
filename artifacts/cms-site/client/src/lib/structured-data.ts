import type { SeoSettings } from "@shared/schema";

export type JsonLdObject = Record<string, unknown>;

const LANDSCAPE_SCHEMA_LOGO_PATH = "/images/logo-icon.png";

const LANDSCAPE_SERVICE_AREAS = [
  { name: "Marvin", state: "NC" },
  { name: "Wesley Chapel", state: "NC" },
  { name: "Waxhaw", state: "NC" },
  { name: "Indian Land", state: "SC" },
  { name: "Monroe", state: "NC" },
  { name: "Indian Trail", state: "NC" },
  { name: "Charlotte", state: "NC" },
  { name: "Lancaster", state: "SC" },
  { name: "Mineral Springs", state: "NC" },
  { name: "Weddington", state: "NC" },
  { name: "Matthews", state: "NC" },
];

const LANDSCAPE_SERVICES = [
  { name: "Annual Lawn Maintenance", path: "/residential-lawn-maintenance/" },
  { name: "Residential Landscaping", path: "/residential-landscaping/" },
  { name: "Residential Hardscape", path: "/residential-hardscape/" },
  { name: "Residential Pressure Washing", path: "/residential-pressure-washing/" },
  { name: "Mulching and Planting", path: "/mulching-and-planting/" },
  { name: "Drainage Solutions", path: "/drainage-solutions/" },
  { name: "Commercial Grounds Maintenance", path: "/commercial-grounds-maintenance/" },
  { name: "Commercial Landscaping", path: "/commercial-landscaping/" },
  { name: "Commercial Hardscape", path: "/commercial-hardscape/" },
  { name: "Commercial Drainage", path: "/commercial-drainage/" },
  { name: "Commercial Pressure Washing", path: "/commercial-pressure-washing/" },
  { name: "HOA Services", path: "/hoa-services/" },
];

function compactObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined && value !== ""),
  );
}

function normalizeBaseUrl(base?: string | null): string {
  const origin = base || (typeof window !== "undefined" ? window.location.origin : "");
  return origin.replace(/\/$/, "");
}

function absoluteUrl(path: string, base?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = normalizeBaseUrl(base);
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

function localBusinessId(siteUrl?: string | null): string | undefined {
  const baseUrl = normalizeBaseUrl(siteUrl);
  return baseUrl ? `${baseUrl}/#localbusiness` : undefined;
}

function cityArea(name: string, state: string): JsonLdObject {
  return {
    "@type": "City",
    name: state ? `${name}, ${state}` : name,
  };
}

export function buildOrganizationLd(globalSeo: SeoSettings): JsonLdObject | null {
  if (!globalSeo.organizationName && !globalSeo.siteName) return null;

  const name = globalSeo.organizationName || globalSeo.siteName || "Website";
  const siteUrl = normalizeBaseUrl(globalSeo.siteUrl);
  const sameAs: string[] = [
    globalSeo.facebookUrl,
    globalSeo.linkedinUrl,
    globalSeo.instagramUrl,
    globalSeo.twitterHandle ? `https://x.com/${globalSeo.twitterHandle.replace(/^@/, "")}` : null,
  ].filter((url): url is string => Boolean(url));

  return compactObject({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": localBusinessId(siteUrl),
    name,
    url: siteUrl || undefined,
    telephone: "+17049755867",
    email: "info@carolinaexteriorlandscapes.com",
    image: absoluteUrl(LANDSCAPE_SCHEMA_LOGO_PATH, siteUrl),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Monroe",
      addressRegion: "NC",
      postalCode: "28110",
      addressCountry: "US",
    },
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(LANDSCAPE_SCHEMA_LOGO_PATH, siteUrl),
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "17:00",
      },
    ],
    areaServed: LANDSCAPE_SERVICE_AREAS.map((area) => cityArea(area.name, area.state)),
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  });
}

export function buildWebSiteLd(globalSeo: SeoSettings): JsonLdObject | null {
  const siteUrl = globalSeo.siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  if (!siteUrl) return null;

  return compactObject({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: globalSeo.siteName || "Website",
    url: siteUrl,
  });
}

export function buildBreadcrumbLd(items: Array<{ name: string; url: string }>): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function extractFaqItems(content: unknown): Array<{ question: string; answer: string }> {
  if (!content || typeof content !== "object") return [];
  const blocks = Array.isArray((content as { blocks?: unknown }).blocks)
    ? ((content as { blocks: unknown[] }).blocks)
    : [];

  return blocks
    .filter((block): block is { type: string; props?: Record<string, unknown> } =>
      Boolean(block) && typeof block === "object" && (block as { type?: unknown }).type === "faq",
    )
    .flatMap((block) => {
      const items = Array.isArray(block.props?.items) ? block.props.items : [];
      return items
        .filter((item): item is { question?: unknown; answer?: unknown } => Boolean(item) && typeof item === "object")
        .map((item) => ({
          question: typeof item.question === "string" ? item.question : "",
          answer: typeof item.answer === "string" ? item.answer : "",
        }))
        .filter((item) => item.question && item.answer);
    });
}

export function extractServiceLd(content: unknown): JsonLdObject | null {
  if (!content || typeof content !== "object") return null;
  const serviceSchema = (content as { serviceSchema?: unknown }).serviceSchema;
  if (!serviceSchema || typeof serviceSchema !== "object" || Array.isArray(serviceSchema)) return null;
  return serviceSchema as JsonLdObject;
}

export function buildLocationServiceLd({
  pageType,
  title,
  description,
  url,
  siteUrl,
  organizationName,
}: {
  pageType?: string | null;
  title: string;
  description?: string | null;
  url: string;
  siteUrl?: string | null;
  organizationName?: string | null;
}): JsonLdObject | null {
  if (pageType !== "location") return null;

  const [rawCity, rawState] = title.split(",").map((part) => part.trim());
  const city = rawCity || title;
  const state = rawState || "";
  const baseUrl = normalizeBaseUrl(siteUrl);
  const pageUrl = absoluteUrl(url, baseUrl);

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    serviceType: "Landscaping and lawn care",
    name: `Landscaping and lawn care in ${state ? `${city}, ${state}` : city}`,
    description: description || `Lawn maintenance, landscaping, hardscape, planting, and drainage services in ${state ? `${city}, ${state}` : city}.`,
    provider: {
      "@type": "LocalBusiness",
      "@id": localBusinessId(baseUrl),
      name: organizationName || "Carolina Exterior Landscapes",
      telephone: "+17049755867",
      url: baseUrl || undefined,
    },
    areaServed: cityArea(city, state),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Lawn care and landscaping services in ${state ? `${city}, ${state}` : city}`,
      itemListElement: LANDSCAPE_SERVICES.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          url: absoluteUrl(service.path, baseUrl),
        },
      })),
    },
    url: pageUrl,
  };
}

export function buildFaqPageLd(items: Array<{ question: string; answer: string }>): JsonLdObject | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
