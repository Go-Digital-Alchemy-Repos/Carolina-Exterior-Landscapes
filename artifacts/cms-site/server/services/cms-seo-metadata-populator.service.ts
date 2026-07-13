import pagesData from "../../client/src/features/landscape-site/content/pages.json";
import locationsData from "../../client/src/features/landscape-site/content/locations.json";
import blogData from "../../client/src/features/landscape-site/content/blog.json";
import type { CmsMediaAsset, CmsPage } from "@shared/schema";
import { storage } from "../storage";

type LandscapeBlock = { type: "h2" | "h3" | "p" | "li"; text: string };

type LandscapeContent = {
  slug: string;
  h1: string;
  titleTag: string;
  metaDescription: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  blocks?: LandscapeBlock[];
  image?: string;
  excerpt?: string;
};

type PageSeoPlan = {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogImageUrl: string;
};

type MediaUsageContext = {
  page: CmsPage;
  alt?: string;
  field: string;
};

const BRAND_NAME = "Carolina Exterior Landscapes";
const BRAND_SHORT_NAME = "Carolina Exterior Landscapes";
const SITE_URL = "https://carolinaexteriorlandscapes.com";
const DEFAULT_OG_IMAGE_URL = "/images/logo-full.png";
const ORGANIZATION_LOGO_URL = "/images/header-logo-horizontal.svg";

const pages = pagesData as Record<string, LandscapeContent>;
const locations = locationsData as LandscapeContent[];
const blogPosts = blogData as LandscapeContent[];

const seededContentBySlug = new Map<string, LandscapeContent>([
  ...Object.values(pages).map((page) => [page.slug, page] as const),
  ...locations.map((location) => [location.slug, location] as const),
  ...blogPosts.map((post) => [post.slug, post] as const),
]);

const virtualPageSeo: Record<string, Pick<PageSeoPlan, "title" | "description" | "keywords">> = {
  blog: {
    title: `Landscaping & Lawn Care Blog | ${BRAND_SHORT_NAME}`,
    description:
      "Expert lawn care, landscaping, hardscape, drainage, HOA, and commercial grounds maintenance advice for Waxhaw, Union County, and the greater Charlotte region.",
    keywords:
      "landscaping blog, lawn care tips, Waxhaw NC landscaping, Union County lawn care, Carolina Exterior Landscapes",
  },
  gallery: {
    title: `Landscaping & Hardscape Gallery | ${BRAND_NAME}`,
    description:
      "Residential and commercial landscaping, lawn care, hardscape, drainage, and HOA project examples from Carolina Exterior Landscapes.",
    keywords:
      "landscaping gallery, hardscape gallery, Waxhaw NC landscaping, commercial landscaping portfolio, Carolina Exterior Landscapes",
  },
  "commercial-portfolio": {
    title: `Commercial Landscaping Portfolio | ${BRAND_NAME}`,
    description:
      "Commercial grounds maintenance, HOA landscaping, hardscape, and drainage portfolio examples from Carolina Exterior Landscapes.",
    keywords:
      "commercial landscaping portfolio, HOA landscaping, commercial grounds maintenance, Waxhaw NC commercial landscaping",
  },
  faq: {
    title: `Residential Landscaping FAQ | ${BRAND_NAME}`,
    description:
      "Frequently asked questions about residential lawn maintenance, landscaping, hardscape, mulching, planting, and drainage services.",
    keywords:
      "residential landscaping FAQ, lawn care questions, Waxhaw NC lawn maintenance, drainage FAQ",
  },
  "commercial-faq": {
    title: `Commercial Landscaping FAQ | ${BRAND_NAME}`,
    description:
      "Frequently asked questions about commercial landscaping, grounds maintenance, HOA services, hardscape, and drainage work.",
    keywords:
      "commercial landscaping FAQ, HOA grounds maintenance questions, commercial drainage services, Waxhaw NC",
  },
  contact: {
    title: `Contact ${BRAND_NAME} | Waxhaw NC`,
    description:
      "Contact Carolina Exterior Landscapes for residential lawn maintenance, landscaping, hardscape, drainage, HOA, and commercial grounds maintenance in Waxhaw and Union County.",
    keywords:
      "contact Carolina Exterior Landscapes, Waxhaw NC landscaper, Union County lawn care estimate",
  },
  "404": {
    title: `Page Not Found | ${BRAND_NAME}`,
    description:
      "The page you requested could not be found. Visit Carolina Exterior Landscapes for lawn care, landscaping, hardscape, drainage, and commercial grounds services.",
    keywords: "Carolina Exterior Landscapes, Waxhaw NC landscaping",
  },
};

const filenameConceptOverrides: Record<string, string> = {
  "bbb-accredited-business-seal": "BBB Accredited Business seal for Carolina Exterior Landscapes",
  "header-logo-horizontal": "Carolina Exterior Landscapes horizontal header logo",
  "footer-logo-horizontal": "Carolina Exterior Landscapes horizontal footer logo",
  "logo-full": "Carolina Exterior Landscapes full color logo",
  "logo-icon": "Carolina Exterior Landscapes icon logo",
  symbol: "Carolina Exterior Landscapes brand symbol",
  favicon: "Carolina Exterior Landscapes favicon",
  "city-waxhaw-hero": "Waxhaw NC landscaping and lawn care service area",
  "city-weddington-hero": "Weddington NC landscaping and lawn care service area",
  "city-matthews-hero": "Matthews NC landscaping and lawn care service area",
  "city-charlotte-hero": "Charlotte NC landscaping and lawn care service area",
  "city-indian-trail-hero": "Indian Trail NC landscaping and lawn care service area",
  "city-indian-land-hero": "Indian Land SC landscaping and lawn care service area",
  "city-fort-mill-hero": "Greater Charlotte landscaping service area",
  "city-pineville-hero": "Greater Charlotte landscaping service area",
};

function limit(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength - 1).replace(/\s+\S*$/, "").trimEnd();
}

function sentence(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function titleCase(value: string) {
  return value
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_+/]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bN C\b/g, "NC")
    .replace(/\bS C\b/g, "SC")
    .replace(/\bHoa\b/g, "HOA")
    .replace(/\bBbb\b/g, "BBB")
    .replace(/\bCca\b/g, "");
}

function pagePath(slug: string) {
  if (slug === "home") return "/";
  if (locations.some((location) => location.slug === slug)) return `/service-areas/${slug}`;
  if (blogPosts.some((post) => post.slug === slug)) return `/blog/${slug}`;
  return `/${slug}`;
}

function canonicalUrlFor(slug: string) {
  const path = pagePath(slug);
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

function keywordsFor(content: LandscapeContent | undefined, fallbackTitle: string) {
  const keywords = [
    content?.primaryKeyword,
    ...(content?.secondaryKeywords ?? []),
    `${BRAND_NAME}`,
    "Waxhaw NC landscaping",
    "Union County lawn care",
  ].filter((keyword): keyword is string => Boolean(keyword?.trim()));

  if (keywords.length > 0) return Array.from(new Set(keywords)).join(", ");
  return `${fallbackTitle}, ${BRAND_NAME}, Waxhaw NC landscaping`;
}

function extractText(value: unknown, output: string[] = []): string[] {
  if (!value) return output;
  if (typeof value === "string") {
    const trimmed = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (trimmed.length > 20) output.push(trimmed);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => extractText(entry, output));
    return output;
  }
  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      if (/^(id|url|href|src|imageUrl|backgroundImageUrl)$/i.test(key)) return;
      extractText(entry, output);
    });
  }
  return output;
}

function firstMeaningfulText(page: CmsPage) {
  return extractText(page.content).find((text) => !text.includes("http")) ?? "";
}

function imageUrlsFromContent(value: unknown, output = new Set<string>()): Set<string> {
  if (!value) return output;
  if (typeof value === "string") {
    if (/\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(value)) output.add(value);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => imageUrlsFromContent(entry, output));
    return output;
  }
  if (typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((entry) => imageUrlsFromContent(entry, output));
  }
  return output;
}

function pathNeedles(url: string) {
  const needles = new Set([url]);
  try {
    const parsed = new URL(url, SITE_URL);
    needles.add(parsed.pathname);
    needles.add(parsed.toString());
  } catch {
    // Relative asset URL.
  }
  return Array.from(needles).filter(Boolean);
}

function valueReferencesUrl(value: unknown, url: string) {
  const needles = pathNeedles(url);
  const haystack = JSON.stringify(value ?? "");
  return needles.some((needle) => haystack.includes(needle));
}

function findAltNearUrl(value: unknown, url: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findAltNearUrl(entry, url);
      if (found) return found;
    }
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const references = Object.values(record).some((entry) =>
    typeof entry === "string" ? pathNeedles(url).some((needle) => entry.includes(needle)) : valueReferencesUrl(entry, url),
  );

  if (references) {
    for (const key of ["alt", "imageAlt", "heroImageAlt", "label", "title"]) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
  }

  for (const entry of Object.values(record)) {
    const found = findAltNearUrl(entry, url);
    if (found) return found;
  }

  return undefined;
}

function bestOgImageForPage(page: CmsPage) {
  const contentImages = Array.from(imageUrlsFromContent(page.content));
  return contentImages[0] ?? page.ogImageUrl ?? DEFAULT_OG_IMAGE_URL;
}

function buildSeoPlan(page: CmsPage): PageSeoPlan {
  const seeded = seededContentBySlug.get(page.slug);
  const virtual = virtualPageSeo[page.slug];
  const fallbackText = firstMeaningfulText(page);
  const fallbackDescription =
    fallbackText ||
    `${BRAND_NAME} provides residential lawn maintenance, landscaping, hardscape, drainage, HOA, and commercial grounds services in Waxhaw, Union County, and the greater Charlotte region.`;

  return {
    title: limit(seeded?.titleTag ?? virtual?.title ?? `${page.title} | ${BRAND_NAME}`, 255),
    description: limit(seeded?.metaDescription ?? virtual?.description ?? fallbackDescription, 320),
    keywords: limit(seeded ? keywordsFor(seeded, page.title) : virtual?.keywords ?? keywordsFor(undefined, page.title), 500),
    canonicalUrl: canonicalUrlFor(page.slug),
    ogImageUrl: bestOgImageForPage(page),
  };
}

function mediaContexts(asset: CmsMediaAsset, pagesToSearch: CmsPage[]): MediaUsageContext[] {
  const contexts: MediaUsageContext[] = [];
  for (const page of pagesToSearch) {
    if (page.ogImageUrl && valueReferencesUrl(page.ogImageUrl, asset.url)) {
      contexts.push({ page, alt: undefined, field: "Open Graph image" });
    }
    if (valueReferencesUrl(page.content, asset.url)) {
      contexts.push({
        page,
        alt: findAltNearUrl(page.content, asset.url),
        field: "Page content",
      });
    }
  }
  return contexts;
}

function assetFilenameStem(asset: CmsMediaAsset) {
  const fromUrl = asset.url.split(/[/?#]/).filter(Boolean).pop();
  return (fromUrl ?? asset.originalName ?? asset.filename).replace(/\.[a-z0-9]+$/i, "");
}

function conceptFromFilename(asset: CmsMediaAsset) {
  const stem = assetFilenameStem(asset);
  const normalized = stem.toLowerCase().replace(/[-_+/]+/g, " ").replace(/\s+/g, " ").trim();
  const override = filenameConceptOverrides[normalized] ?? filenameConceptOverrides[stem.toLowerCase()];
  if (override) return override;
  return `${BRAND_NAME} ${titleCase(stem).trim()}`.replace(/\s+/g, " ");
}

function buildMediaMetadata(asset: CmsMediaAsset, contexts: MediaUsageContext[]) {
  const primaryContext = contexts.find((context) => context.page.status === "published") ?? contexts[0];
  const seeded = primaryContext ? seededContentBySlug.get(primaryContext.page.slug) : undefined;
  const pageTitle = seeded?.h1 ?? primaryContext?.page.title;
  const pageDescription = seeded?.metaDescription ?? (primaryContext ? buildSeoPlan(primaryContext.page).description : "");
  const concept = primaryContext?.alt ?? (pageTitle ? `${pageTitle} image` : conceptFromFilename(asset));
  const title = pageTitle ? `${concept} | ${BRAND_NAME}` : concept;
  const alt = primaryContext?.alt ?? concept;
  const description = primaryContext
    ? `${sentence(alt)} Used on ${primaryContext.page.title} to support content about ${pageDescription}`
    : `${sentence(concept)} Business-appropriate media library asset for ${BRAND_NAME} website content.`;
  const seoTitle = pageTitle ? `${concept} | ${BRAND_SHORT_NAME}` : `${concept} | ${BRAND_SHORT_NAME}`;
  const seoDescription = primaryContext
    ? `${sentence(alt)} ${BRAND_NAME} uses this image with content about ${pageDescription}`
    : `${sentence(concept)} Image asset for ${BRAND_NAME}, serving Waxhaw, Union County, and the greater Charlotte region.`;

  return {
    title: limit(title, 255),
    alt: limit(alt, 255),
    caption: limit(primaryContext ? `${BRAND_NAME} - ${primaryContext.page.title}` : BRAND_NAME, 500),
    description: limit(description, 2000),
    seoTitle: limit(seoTitle, 255),
    seoDescription: limit(seoDescription, 320),
    ogTitle: limit(seoTitle, 255),
    ogDescription: limit(seoDescription, 320),
  };
}

export async function populateCmsSeoMetadata() {
  const [pagesToUpdate, mediaAssets, globalSeo] = await Promise.all([
    storage.cmsPages.getAllPages(),
    storage.cmsMedia.getAllMedia(),
    storage.seoSettings.get(),
  ]);

  let updatedPages = 0;
  let updatedMedia = 0;

  for (const page of pagesToUpdate) {
    const plan = buildSeoPlan(page);
    const missingMetadata = {
      ...(!page.seoTitle ? { seoTitle: plan.title } : {}),
      ...(!page.seoDescription ? { seoDescription: plan.description } : {}),
      ...(!page.seoKeywords ? { seoKeywords: plan.keywords } : {}),
      ...(!page.canonicalUrl ? { canonicalUrl: plan.canonicalUrl } : {}),
      ...(!page.ogImageUrl ? { ogImageUrl: plan.ogImageUrl } : {}),
    };
    if (Object.keys(missingMetadata).length === 0) continue;
    await storage.cmsPages.updatePage(page.id, missingMetadata);
    updatedPages += 1;
  }

  for (const asset of mediaAssets) {
    if (!asset.mimeType.startsWith("image/")) continue;
    if (asset.title && asset.alt && asset.seoTitle && asset.seoDescription) continue;
    const contexts = mediaContexts(asset, pagesToUpdate);
    const metadata = buildMediaMetadata(asset, contexts);
    await storage.cmsMedia.updateMetadata(asset.id, {
      ...(!asset.title ? { title: metadata.title } : {}),
      ...(!asset.alt ? { alt: metadata.alt } : {}),
      ...(!asset.caption ? { caption: metadata.caption } : {}),
      ...(!asset.description ? { description: metadata.description } : {}),
      ...(!asset.seoTitle ? { seoTitle: metadata.seoTitle } : {}),
      ...(!asset.seoDescription ? { seoDescription: metadata.seoDescription } : {}),
      ...(!asset.ogTitle ? { ogTitle: metadata.ogTitle } : {}),
      ...(!asset.ogDescription ? { ogDescription: metadata.ogDescription } : {}),
    });
    updatedMedia += 1;
  }

  if (!globalSeo) {
    await storage.seoSettings.upsert({
      siteName: BRAND_NAME,
      titleSuffix: ` | ${BRAND_SHORT_NAME}`,
      defaultMetaDescription:
        "Carolina Exterior Landscapes provides residential lawn maintenance, landscaping, hardscape, drainage, HOA, and commercial grounds services across Waxhaw, Union County, and the greater Charlotte region.",
      siteUrl: SITE_URL,
      defaultOgImageUrl: DEFAULT_OG_IMAGE_URL,
      organizationName: BRAND_NAME,
      organizationLogoUrl: ORGANIZATION_LOGO_URL,
      defaultRobotsNoindex: false,
    });
  }

  return {
    updatedPages,
    updatedMedia,
    updatedGlobalSeo: !globalSeo,
  };
}
