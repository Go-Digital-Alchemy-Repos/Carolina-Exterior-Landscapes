import fs from "fs";
import path from "path";
import pagesData from "../../client/src/features/landscape-site/content/pages.json";
import locationsData from "../../client/src/features/landscape-site/content/locations.json";
import blogData from "../../client/src/features/landscape-site/content/blog.json";
import { normalizeBlogFaq, splitBlogFaqBlocks, type BlogFaq } from "../../shared/blog-faq";

interface PublicHtmlSnapshot {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl?: string | null;
  ogImageAlt?: string | null;
  robots?: string | null;
  bodyHtml: string;
  jsonLd: Array<Record<string, unknown>>;
}

type Block = { type: "h2" | "h3" | "p" | "li"; text: string };

type PageContent = {
  slug: string;
  h1: string;
  titleTag: string;
  metaDescription: string;
  blocks: Block[];
};

type LocationContent = PageContent & {
  city: string;
  state: string;
};

type BlogPost = PageContent & {
  category: "residential" | "commercial";
  date: string;
  readMinutes: number;
  excerpt: string;
  image: string;
  faq?: BlogFaq;
};

const BRAND = {
  name: "Carolina Exterior Landscapes",
  domain: "https://carolinaexteriorlandscapes.com",
  phoneTel: "+17049755867",
  email: "info@carolinaexteriorlandscapes.com",
  addressLocality: "Waxhaw",
  addressRegion: "NC",
  postalCode: "28173",
  county: "Union County",
  region: "greater Charlotte region",
};

const LANDSCAPE_IMAGE_BASE = `${BRAND.domain}/images/landscape`;

const PAGE_OG_IMAGES: Record<string, string> = {
  home: "hero-home.webp",
  about: "about-story.webp",
  "residential-lawn-maintenance": "gallery-res-1.webp",
  "residential-landscaping": "gallery-res-1.webp",
  "residential-hardscape": "hero-hardscape.webp",
  "mulching-and-planting": "hero-mulch.webp",
  "drainage-solutions": "hero-drainage.webp",
  commercial: "hero-commercial.webp",
  "commercial-grounds-maintenance": "hero-commercial-grounds.webp",
  "commercial-landscaping": "hero-commercial-landscaping.webp",
  "commercial-hardscape": "hero-commercial-hardscape.webp",
  "commercial-drainage": "hero-commercial-drainage.webp",
  "hoa-services": "hero-hoa.webp",
  "service-areas": "community-aerial.webp",
  "get-a-quote": "hero-home.webp",
  "commercial-quote": "hero-commercial.webp",
};

function absoluteLandscapeImage(filename: string) {
  return `${LANDSCAPE_IMAGE_BASE}/${filename}`;
}

const pages = pagesData as Record<string, PageContent>;
const locations = locationsData as LocationContent[];
const blogPosts = (blogData as BlogPost[]).slice().sort((a, b) => (a.date < b.date ? 1 : -1));

const STATIC_PAGE_SNAPSHOTS: Array<
  Pick<PublicHtmlSnapshot, "title" | "description" | "bodyHtml" | "jsonLd"> & {
    path: string;
    h1: string;
  }
> = [
  {
    path: "/blog",
    h1: "Landscaping & Lawn Care Journal",
    title: `Landscaping & Lawn Care Blog | ${BRAND.name}`,
    description:
      "Practical lawn care, landscaping, hardscape, drainage, HOA, and commercial grounds maintenance advice for Waxhaw, Union County, and the Charlotte region.",
    bodyHtml: renderArticleBody({
      h1: "Landscaping & Lawn Care Journal",
      blocks: blogPosts.flatMap((post) => [
        { type: "h2" as const, text: post.h1 },
        { type: "p" as const, text: post.excerpt || post.metaDescription },
      ]),
    }),
    jsonLd: [],
  },
  {
    path: "/gallery",
    h1: "Landscaping & Hardscape Gallery",
    title: `Landscaping & Hardscape Gallery | ${BRAND.name}`,
    description:
      "See residential and commercial landscaping, hardscape, lawn care, drainage, and grounds maintenance work from Carolina Exterior Landscapes.",
    bodyHtml: renderArticleBody({
      h1: "Landscaping & Hardscape Gallery",
      blocks: [
        {
          type: "p",
          text: "Explore examples of outdoor spaces, commercial grounds, plantings, hardscape features, and maintained properties completed by Carolina Exterior Landscapes.",
        },
      ],
    }),
    jsonLd: [],
  },
  {
    path: "/commercial-portfolio",
    h1: "Commercial Landscaping Portfolio",
    title: `Commercial Landscaping Portfolio | ${BRAND.name}`,
    description:
      "Commercial grounds maintenance, landscaping, hardscape, drainage, and HOA project examples from Carolina Exterior Landscapes.",
    bodyHtml: renderArticleBody({
      h1: "Commercial Landscaping Portfolio",
      blocks: [
        {
          type: "p",
          text: "Review commercial landscaping and grounds maintenance work for office, retail, HOA, multi-family, and business properties across Union County and the Charlotte region.",
        },
      ],
    }),
    jsonLd: [],
  },
  {
    path: "/contact",
    h1: "Contact Carolina Exterior Landscapes",
    title: `Contact ${BRAND.name} | Waxhaw NC`,
    description:
      "Contact Carolina Exterior Landscapes for lawn care, landscaping, hardscape, drainage, HOA, and commercial grounds maintenance in Waxhaw and Union County.",
    bodyHtml: renderArticleBody({
      h1: "Contact Carolina Exterior Landscapes",
      blocks: [
        {
          type: "p",
          text: "Tell us about your lawn care, landscaping, hardscape, mulching, planting, or drainage needs. We respond to inquiries within one business day.",
        },
        { type: "h2", text: "Request a Landscaping Quote" },
        {
          type: "p",
          text: "Call Carolina Exterior Landscapes at (704) 975-5867 or use the contact form to request a residential or commercial property assessment.",
        },
      ],
    }),
    jsonLd: [],
  },
  {
    path: "/residential-pressure-washing",
    h1: "Residential Pressure Washing",
    title: `Residential Pressure Washing | ${BRAND.name}`,
    description:
      "Professional pressure washing for driveways, walkways, patios, home exteriors, fences, and hardscape throughout Waxhaw and the greater Charlotte area.",
    bodyHtml: renderArticleBody({
      h1: "Residential Pressure Washing",
      blocks: [
        {
          type: "p",
          text: "Restore driveways, walkways, patios, porches, home exteriors, fences, walls, and hardscape with professional residential pressure washing.",
        },
        { type: "h2", text: "Exterior Cleaning for Homes and Outdoor Spaces" },
        {
          type: "p",
          text: "Carolina Exterior Landscapes provides pressure washing services throughout Waxhaw, Union County, and the greater Charlotte area.",
        },
      ],
    }),
    jsonLd: [],
  },
  {
    path: "/commercial-pressure-washing",
    h1: "Commercial Pressure Washing",
    title: `Commercial Pressure Washing | ${BRAND.name}`,
    description:
      "Scheduled commercial pressure washing for sidewalks, storefronts, concrete, dumpster pads, and HOA common areas across the greater Charlotte region.",
    bodyHtml: renderArticleBody({
      h1: "Commercial Pressure Washing",
      blocks: [
        {
          type: "p",
          text: "Maintain clean sidewalks, storefronts, entries, concrete, curbs, dumpster pads, service areas, and HOA amenities with scheduled commercial pressure washing.",
        },
        { type: "h2", text: "Commercial Exterior Cleaning" },
        {
          type: "p",
          text: "Flexible service plans support office, retail, multi-family, HOA, and commercial properties across Union County and the greater Charlotte region.",
        },
      ],
    }),
    jsonLd: [],
  },
  buildFaqSnapshot(
    "/faq",
    "Residential FAQ",
    "Residential FAQ",
    "Frequently asked questions about residential lawn maintenance, landscaping, hardscape, planting, mulching, and drainage services.",
    [
      "residential-lawn-maintenance",
      "residential-landscaping",
      "residential-hardscape",
      "mulching-and-planting",
      "drainage-solutions",
    ],
  ),
  buildFaqSnapshot(
    "/commercial-faq",
    "Commercial & HOA FAQ",
    "Commercial FAQ",
    "Frequently asked questions about commercial landscaping, HOA grounds maintenance, commercial hardscape, and drainage services.",
    [
      "commercial",
      "commercial-grounds-maintenance",
      "commercial-landscaping",
      "commercial-hardscape",
      "commercial-drainage",
      "hoa-services",
    ],
  ),
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function compactMetaTitle(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 60) return normalized;

  const withoutBrand = normalized.replace(/\s*\|\s*Carolina Exterior(?: Landscapes)?$/i, "").trim();
  if (withoutBrand.length <= 60) return withoutBrand;
  return `${withoutBrand
    .slice(0, 57)
    .replace(/\s+\S*$/, "")
    .trim()}...`;
}

function compactMetaDescription(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 160) return normalized;
  return `${normalized
    .slice(0, 157)
    .replace(/\s+\S*$/, "")
    .trim()}...`;
}

function normalizePathname(pathname: string) {
  const parsed = pathname.startsWith("http")
    ? new URL(pathname).pathname
    : pathname.split(/[?#]/)[0] || "/";
  if (!parsed || parsed === "/") return "/";
  return parsed.replace(/\/+$/, "");
}

function canonicalUrl(pathname: string) {
  const normalized = normalizePathname(pathname);
  return `${BRAND.domain}${normalized === "/" ? "/" : normalized}`;
}

function serializeJsonForHtml(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function renderArticleBody(page: Pick<PageContent, "h1" | "blocks">) {
  const parts = [`<main>`, `<article>`, `<h1>${escapeHtml(page.h1)}</h1>`];
  let listOpen = false;

  for (const block of page.blocks) {
    if (block.type !== "li" && listOpen) {
      parts.push("</ul>");
      listOpen = false;
    }

    if (block.type === "h2" || block.type === "h3") {
      parts.push(`<${block.type}>${escapeHtml(block.text)}</${block.type}>`);
    } else if (block.type === "p") {
      parts.push(`<p>${escapeHtml(block.text)}</p>`);
    } else if (block.type === "li") {
      if (!listOpen) {
        parts.push("<ul>");
        listOpen = true;
      }
      parts.push(`<li>${escapeHtml(block.text)}</li>`);
    }
  }

  if (listOpen) parts.push("</ul>");
  parts.push("</article>", "</main>");
  return parts.join("\n");
}

function renderBlogFaqBody(faq: BlogFaq | null) {
  if (!faq) return "";
  const description = faq.description
    ? faq.description
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("\n")
    : "";
  const items = faq.items
    .map(
      (item) =>
        `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`,
    )
    .join("\n");
  return `<section aria-label="Frequently Asked Questions"><h2>${escapeHtml(faq.title)}</h2>${description}${items}</section>`;
}

function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BRAND.domain}/#localbusiness`,
    name: BRAND.name,
    url: BRAND.domain,
    telephone: BRAND.phoneTel,
    email: BRAND.email,
    image: `${BRAND.domain}/images/header-logo-horizontal.svg`,
    logo: `${BRAND.domain}/images/header-logo-horizontal.svg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: BRAND.addressLocality,
      addressRegion: BRAND.addressRegion,
      postalCode: BRAND.postalCode,
      addressCountry: "US",
    },
    areaServed: [
      "Waxhaw, NC",
      "Monroe, NC",
      "Weddington, NC",
      "Marvin, NC",
      "Indian Trail, NC",
      "Charlotte, NC",
      "Indian Land, SC",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: BRAND.phoneTel,
      email: BRAND.email,
      contactType: "customer service",
      areaServed: ["NC", "SC"],
      availableLanguage: "English",
    },
    slogan: "Rooted in Carolina. Built for Life.",
    knowsAbout: [
      "Lawn maintenance",
      "Landscape design and installation",
      "Hardscape installation",
      "Yard drainage",
      "Commercial grounds maintenance",
      "HOA landscaping",
    ],
  };
}

function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: BRAND.domain,
  };
}

function breadcrumbLd(items: Array<{ name: string; url: string }>) {
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

function serviceLd(page: PageContent, pathname: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonicalUrl(pathname)}#service`,
    name: page.h1,
    description: page.metaDescription,
    serviceType: page.h1,
    areaServed: `${BRAND.county}, ${BRAND.region}`,
    provider: {
      "@type": "LocalBusiness",
      "@id": `${BRAND.domain}/#localbusiness`,
      name: BRAND.name,
      telephone: BRAND.phoneTel,
      email: BRAND.email,
    },
    url: canonicalUrl(pathname),
  };
}

function blogPostingLd(post: BlogPost, pathname: string) {
  const image = absoluteLandscapeImage(`blog/${post.image.replace(/\.(?:png|jpe?g)$/i, ".webp")}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.h1,
    description: post.metaDescription,
    datePublished: post.date,
    dateModified: post.date,
    articleSection: post.category,
    image,
    author: { "@type": "Organization", name: BRAND.name, url: BRAND.domain },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: BRAND.domain,
      logo: { "@type": "ImageObject", url: `${BRAND.domain}/images/header-logo-horizontal.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl(pathname) },
  };
}

function extractFaqs(slugs: string[]) {
  const faqs: Array<{ q: string; a: string; source: string }> = [];
  for (const slug of slugs) {
    const page = pages[slug];
    if (!page) continue;
    let inFaq = false;
    for (let i = 0; i < page.blocks.length; i += 1) {
      const block = page.blocks[i];
      if (block.type === "h2" && block.text.toLowerCase().includes("frequently asked")) {
        inFaq = true;
        continue;
      }
      if (inFaq && block.type === "h2") inFaq = false;
      if (inFaq && block.type === "h3") {
        const next = page.blocks[i + 1];
        if (next?.type === "p") {
          faqs.push({ q: block.text, a: next.text, source: page.h1 });
          i += 1;
        }
      }
    }
  }
  return faqs;
}

function faqPageLd(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

function buildFaqSnapshot(
  pathname: string,
  titlePrefix: string,
  h1: string,
  description: string,
  slugs: string[],
) {
  const faqs = extractFaqs(slugs);
  return {
    path: pathname,
    h1,
    title: `${titlePrefix} | ${BRAND.name}`,
    description,
    bodyHtml: renderArticleBody({
      h1,
      blocks: faqs.flatMap((faq) => [
        { type: "h2" as const, text: faq.q },
        { type: "p" as const, text: faq.a },
      ]),
    }),
    jsonLd: [faqPageLd(faqs)],
  };
}

function pagePath(slug: string) {
  return slug === "home" ? "/" : `/${slug}`;
}

function buildContentSnapshot(page: PageContent, pathname: string): PublicHtmlSnapshot {
  const schemas = [
    organizationLd(),
    websiteLd(),
    breadcrumbLd([
      { name: "Home", url: `${BRAND.domain}/` },
      ...(pathname === "/" ? [] : [{ name: page.h1, url: canonicalUrl(pathname) }]),
    ]),
  ];

  if (!["home", "about", "service-areas", "get-a-quote", "commercial-quote"].includes(page.slug)) {
    schemas.push(serviceLd(page, pathname));
  }

  return {
    title: page.titleTag,
    description: page.metaDescription,
    canonicalUrl: canonicalUrl(pathname),
    ogTitle: page.titleTag,
    ogDescription: page.metaDescription,
    ogImageUrl: absoluteLandscapeImage(PAGE_OG_IMAGES[page.slug] ?? "hero-home.webp"),
    ogImageAlt: `${page.h1} by ${BRAND.name}`,
    bodyHtml: renderArticleBody(page),
    jsonLd: schemas,
  };
}

function buildLocationSnapshot(location: LocationContent): PublicHtmlSnapshot {
  const pathname = `/service-areas/${location.slug}`;
  return {
    title: location.titleTag,
    description: location.metaDescription,
    canonicalUrl: canonicalUrl(pathname),
    ogTitle: location.titleTag,
    ogDescription: location.metaDescription,
    ogImageUrl: absoluteLandscapeImage(
      location.slug === "matthews-nc" ? "matthews-nc-hero.webp" : "community-aerial.webp",
    ),
    ogImageAlt: `Landscaping and lawn care in ${location.city}, ${location.state}`,
    bodyHtml: renderArticleBody(location),
    jsonLd: [
      organizationLd(),
      breadcrumbLd([
        { name: "Home", url: `${BRAND.domain}/` },
        { name: "Service Areas", url: `${BRAND.domain}/service-areas` },
        { name: `${location.city}, ${location.state}`, url: canonicalUrl(pathname) },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${canonicalUrl(pathname)}#service`,
        serviceType: "Landscaping and lawn care",
        name: `Landscaping and lawn care in ${location.city}, ${location.state}`,
        description: location.metaDescription,
        provider: {
          "@type": "LocalBusiness",
          "@id": `${BRAND.domain}/#localbusiness`,
          name: BRAND.name,
        },
        areaServed: { "@type": "City", name: `${location.city}, ${location.state}` },
        url: canonicalUrl(pathname),
      },
    ],
  };
}

function buildBlogSnapshot(post: BlogPost): PublicHtmlSnapshot {
  const pathname = `/blog/${post.slug}`;
  const splitFaq = splitBlogFaqBlocks(post.blocks);
  const faq = normalizeBlogFaq(post.faq) || splitFaq.faq;
  return {
    title: post.titleTag,
    description: post.metaDescription,
    canonicalUrl: canonicalUrl(pathname),
    ogTitle: post.titleTag,
    ogDescription: post.metaDescription,
    ogImageUrl: absoluteLandscapeImage(`blog/${post.image.replace(/\.(?:png|jpe?g)$/i, ".webp")}`),
    ogImageAlt: post.h1,
    bodyHtml: `${renderArticleBody({ ...post, blocks: splitFaq.blocks })}\n${renderBlogFaqBody(faq)}`,
    jsonLd: [
      organizationLd(),
      breadcrumbLd([
        { name: "Home", url: `${BRAND.domain}/` },
        { name: "Blog", url: `${BRAND.domain}/blog` },
        { name: post.h1, url: canonicalUrl(pathname) },
      ]),
      blogPostingLd(post, pathname),
      ...(faq ? [faqPageLd(faq.items.map((item) => ({ q: item.question, a: item.answer })))] : []),
    ],
  };
}

function buildStaticSnapshot(
  staticPage: (typeof STATIC_PAGE_SNAPSHOTS)[number],
): PublicHtmlSnapshot {
  const staticImage =
    staticPage.path === "/commercial-portfolio"
      ? "hero-commercial.webp"
      : staticPage.path === "/commercial-pressure-washing"
        ? "hero-commercial.webp"
        : staticPage.path === "/gallery"
          ? "gallery-res-1.webp"
          : staticPage.path === "/blog"
            ? "blog/blog-1.webp"
            : "hero-home.webp";
  return {
    title: staticPage.title,
    description: staticPage.description,
    canonicalUrl: canonicalUrl(staticPage.path),
    ogTitle: staticPage.title,
    ogDescription: staticPage.description,
    ogImageUrl: absoluteLandscapeImage(staticImage),
    ogImageAlt: `${staticPage.h1} | ${BRAND.name}`,
    bodyHtml: staticPage.bodyHtml,
    jsonLd: [
      organizationLd(),
      breadcrumbLd([
        { name: "Home", url: `${BRAND.domain}/` },
        { name: staticPage.h1, url: canonicalUrl(staticPage.path) },
      ]),
      ...staticPage.jsonLd,
    ],
  };
}

function allSnapshots() {
  const entries = new Map<string, PublicHtmlSnapshot>();

  Object.values(pages).forEach((page) => {
    entries.set(pagePath(page.slug), buildContentSnapshot(page, pagePath(page.slug)));
  });

  locations.forEach((location) => {
    entries.set(`/service-areas/${location.slug}`, buildLocationSnapshot(location));
  });

  blogPosts.forEach((post) => {
    entries.set(`/blog/${post.slug}`, buildBlogSnapshot(post));
  });

  STATIC_PAGE_SNAPSHOTS.forEach((staticPage) => {
    entries.set(staticPage.path, buildStaticSnapshot(staticPage));
  });

  return entries;
}

export function getPublicHtmlSnapshot(pathname: string): PublicHtmlSnapshot | null {
  return allSnapshots().get(normalizePathname(pathname)) ?? null;
}

export function injectPublicHtmlSnapshot(template: string, snapshot: PublicHtmlSnapshot | null) {
  const normalizedTemplate = template
    .replace(/\s*<meta name="description"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta property="og:title"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta property="og:description"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta property="og:type"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta property="og:image"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta property="og:url"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta name="twitter:card"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta name="twitter:title"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta name="twitter:description"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta name="twitter:image"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta name="robots"[^>]*>\s*/i, "\n")
    .replace(/\s*<link rel="canonical"[^>]*>\s*/i, "\n");

  if (!snapshot) {
    return normalizedTemplate
      .replace("<!--APP_DYNAMIC_HEAD-->", "")
      .replace("<!--APP_PRERENDER_CONTENT-->", "");
  }

  const headParts = [
    `<meta name="description" content="${escapeHtml(compactMetaDescription(snapshot.description))}" />`,
    `<meta property="og:title" content="${escapeHtml(compactMetaTitle(snapshot.ogTitle))}" />`,
    `<meta property="og:description" content="${escapeHtml(compactMetaDescription(snapshot.ogDescription))}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtml(snapshot.canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(snapshot.ogImageUrl || "")}" />`,
    snapshot.ogImageUrl ? `<meta property="og:image:width" content="1408" />` : "",
    snapshot.ogImageUrl ? `<meta property="og:image:height" content="768" />` : "",
    snapshot.ogImageAlt
      ? `<meta property="og:image:alt" content="${escapeHtml(snapshot.ogImageAlt)}" />`
      : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(compactMetaTitle(snapshot.ogTitle))}" />`,
    `<meta name="twitter:description" content="${escapeHtml(compactMetaDescription(snapshot.ogDescription))}" />`,
    snapshot.ogImageUrl
      ? `<meta name="twitter:image" content="${escapeHtml(snapshot.ogImageUrl)}" />`
      : "",
    `<link rel="canonical" href="${escapeHtml(snapshot.canonicalUrl)}" />`,
    snapshot.robots ? `<meta name="robots" content="${escapeHtml(snapshot.robots)}" />` : "",
    ...snapshot.jsonLd.map(
      (schema) =>
        `<script type="application/ld+json" data-prerender-json-ld="true">${serializeJsonForHtml(schema)}</script>`,
    ),
  ].filter(Boolean);

  return normalizedTemplate
    .replace(
      /<title>[\s\S]*?<\/title>/i,
      () => `<title>${escapeHtml(compactMetaTitle(snapshot.title))}</title>`,
    )
    .replace("<!--APP_DYNAMIC_HEAD-->", () => headParts.join("\n"))
    .replace(
      "<!--APP_PRERENDER_CONTENT-->",
      () => `<div id="seo-prerender">${snapshot.bodyHtml}</div>`,
    );
}

export function getPrerenderedPublicPaths() {
  return Array.from(allSnapshots().keys());
}

export function getPrerenderedPublicFilePath(distPublicPath: string, publicPath: string) {
  const normalized = normalizePathname(publicPath);
  if (!getPublicHtmlSnapshot(normalized)) return null;
  const segments = normalized === "/" ? ["index.html"] : [normalized.slice(1), "index.html"];
  return path.join(distPublicPath, "__prerender", ...segments);
}

export async function writePublicHtmlSnapshots() {
  const distPublicPath = path.resolve(process.cwd(), "dist/public");
  const indexPath = path.join(distPublicPath, "index.html");
  const template = await fs.promises.readFile(indexPath, "utf-8");
  const written: string[] = [];

  for (const [publicPath, snapshot] of allSnapshots()) {
    const htmlPath = getPrerenderedPublicFilePath(distPublicPath, publicPath);
    if (!htmlPath) continue;
    await fs.promises.mkdir(path.dirname(htmlPath), { recursive: true });
    await fs.promises.writeFile(htmlPath, injectPublicHtmlSnapshot(template, snapshot), "utf-8");
    written.push(publicPath);
  }

  return written;
}
