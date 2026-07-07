import fs from "fs";
import path from "path";
import type { InsertCmsMenu, InsertCmsPage, MenuItem } from "@shared/schema";
import { storage } from "../storage";

type LandscapeBlock = { type: "h2" | "h3" | "p" | "li"; text: string };

type LandscapePage = {
  slug: string;
  h1: string;
  titleTag: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  schemaType: string;
  wordCountTarget: string;
  blocks: LandscapeBlock[];
};

type LandscapeLocation = LandscapePage & {
  city: string;
  state: string;
};

type LandscapeBlogPost = LandscapePage & {
  category: "residential" | "commercial";
  date: string;
  readMinutes: number;
  excerpt: string;
  image: string;
};

type LandscapeCmsKind = "page" | "location" | "blog" | "virtual";

const LANDSCAPE_CONTENT_VERSION = "carolina-landscape-v1";

const SECURITY_LOW_VOLTAGE_PATTERNS = [
  "low voltage",
  "security camera",
  "security cameras",
  "security systems",
  "access control",
  "gate access",
  "burglar alarm",
  "fire alarm",
  "structured cabling",
  "control4",
  "metal fabrication",
  "fort mill",
  "(803) 995-1522",
  "van@",
  "cca-",
];

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8")) as T;
}

function pagePath(slug: string) {
  return slug === "home" ? "/" : `/${slug}`;
}

function canonicalFor(pathname: string) {
  return `https://carolinaexteriorlandscapes.com${pathname === "/" ? "" : pathname}`;
}

function pageRecord(
  data: LandscapePage | LandscapeLocation | LandscapeBlogPost | Record<string, unknown>,
  options: {
    slug: string;
    title: string;
    path: string;
    kind: LandscapeCmsKind;
    pageType?: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords?: string;
    ogImageUrl?: string;
  },
): InsertCmsPage {
  return {
    title: options.title,
    slug: options.slug,
    status: "published",
    pageType: options.pageType ?? options.kind,
    template: "landscape-site",
    sidebarId: null,
    content: {
      source: LANDSCAPE_CONTENT_VERSION,
      landscape: {
        kind: options.kind,
        path: options.path,
        data,
      },
    },
    seoTitle: options.seoTitle,
    seoDescription: options.seoDescription,
    seoKeywords: options.seoKeywords ?? "",
    ogImageUrl: options.ogImageUrl ?? "/assets/logo-full-Bi8L3m5F.png",
    canonicalUrl: canonicalFor(options.path),
    noindex: false,
    publishedAt: new Date(),
  };
}

function menuItem(id: string, label: string, url: string, children: MenuItem[] = []): MenuItem {
  return { id, label, url, openInNewTab: false, children };
}

function isLandscapePageContent(content: unknown): boolean {
  if (!content || typeof content !== "object") return false;
  const source = (content as { source?: unknown }).source;
  const landscape = (content as { landscape?: unknown }).landscape;
  return source === LANDSCAPE_CONTENT_VERSION && Boolean(landscape && typeof landscape === "object");
}

function containsSecurityLowVoltageCopy(value: unknown): boolean {
  const haystack = JSON.stringify(value ?? "").toLowerCase();
  return SECURITY_LOW_VOLTAGE_PATTERNS.some((pattern) => haystack.includes(pattern));
}

function buildLandscapePages(): InsertCmsPage[] {
  const pages = readJson<Record<string, LandscapePage>>("client/src/features/landscape-site/content/pages.json");
  const locations = readJson<LandscapeLocation[]>("client/src/features/landscape-site/content/locations.json");
  const blogPosts = readJson<LandscapeBlogPost[]>("client/src/features/landscape-site/content/blog.json");

  const records: InsertCmsPage[] = Object.values(pages).map((page) =>
    pageRecord(page, {
      slug: page.slug,
      title: page.h1,
      path: pagePath(page.slug),
      kind: "page",
      pageType: page.slug === "home" ? "home" : "service",
      seoTitle: page.titleTag,
      seoDescription: page.metaDescription,
      seoKeywords: [page.primaryKeyword, ...page.secondaryKeywords].filter(Boolean).join(", "),
    }),
  );

  records.push(
    ...locations.map((location) =>
      pageRecord(location, {
        slug: location.slug,
        title: location.h1,
        path: `/service-areas/${location.slug}`,
        kind: "location",
        pageType: "location",
        seoTitle: location.titleTag,
        seoDescription: location.metaDescription,
        seoKeywords: [location.primaryKeyword, ...location.secondaryKeywords].filter(Boolean).join(", "),
      }),
    ),
  );

  records.push(
    pageRecord(
      {
        slug: "blog",
        h1: "The Landscape Journal",
        titleTag: "Landscaping & Lawn Care Blog | Carolina Exterior",
        metaDescription: "Expert advice, tips, and news about landscaping, lawn maintenance, and hardscaping in the Carolina Piedmont region.",
        posts: blogPosts.map((post) => post.slug),
      },
      {
        slug: "blog",
        title: "The Landscape Journal",
        path: "/blog",
        kind: "virtual",
        pageType: "blog-index",
        seoTitle: "Landscaping & Lawn Care Blog | Carolina Exterior",
        seoDescription: "Expert advice, tips, and news about landscaping, lawn maintenance, and hardscaping in the Carolina Piedmont region.",
      },
    ),
    ...blogPosts.map((post) =>
      pageRecord(post, {
        slug: post.slug,
        title: post.h1,
        path: `/blog/${post.slug}`,
        kind: "blog",
        pageType: "blog-post",
        seoTitle: post.titleTag,
        seoDescription: post.metaDescription,
        seoKeywords: [post.primaryKeyword, ...post.secondaryKeywords].filter(Boolean).join(", "),
      }),
    ),
  );

  const virtualPages = [
    {
      slug: "gallery",
      path: "/gallery",
      title: "Residential & Commercial Landscaping Gallery",
      description: "Explore residential and commercial landscaping, lawn care, hardscape, drainage, and HOA project examples from Carolina Exterior Landscapes.",
    },
    {
      slug: "commercial-portfolio",
      path: "/commercial-portfolio",
      title: "Commercial Landscaping Portfolio",
      description: "Commercial grounds maintenance, HOA, hardscape, and drainage portfolio examples from Carolina Exterior Landscapes.",
    },
    {
      slug: "faq",
      path: "/faq",
      title: "Residential Landscaping FAQ",
      description: "Frequently asked questions about residential lawn care, landscaping, hardscape, mulching, planting, and drainage services.",
    },
    {
      slug: "commercial-faq",
      path: "/commercial-faq",
      title: "Commercial Landscaping FAQ",
      description: "Frequently asked questions about commercial landscaping, grounds maintenance, HOA services, hardscape, and drainage work.",
    },
    {
      slug: "thank-you",
      path: "/thank-you",
      title: "Thank You",
      description: "Thank you for contacting Carolina Exterior Landscapes. We will follow up shortly about your landscaping request.",
    },
  ];

  records.push(
    ...virtualPages.map((page) =>
      pageRecord(
        {
          slug: page.slug,
          h1: page.title,
          titleTag: `${page.title} | Carolina Exterior Landscapes`,
          metaDescription: page.description,
          blocks: [],
        },
        {
          slug: page.slug,
          title: page.title,
          path: page.path,
          kind: "virtual",
          pageType: "custom",
          seoTitle: `${page.title} | Carolina Exterior Landscapes`,
          seoDescription: page.description,
        },
      ),
    ),
  );

  return records;
}

function buildMenus(): InsertCmsMenu[] {
  const pages = readJson<Record<string, LandscapePage>>("client/src/features/landscape-site/content/pages.json");

  const residential = [
    "residential-lawn-maintenance",
    "residential-landscaping",
    "residential-hardscape",
    "mulching-and-planting",
    "drainage-solutions",
  ].map((slug) => menuItem(slug, pages[slug]?.h1.replace(/^Residential\s+/i, "") ?? slug, `/${slug}`));

  const commercial = [
    menuItem("commercial", "Commercial Hub", "/commercial"),
    ...[
      "commercial-grounds-maintenance",
      "commercial-landscaping",
      "commercial-hardscape",
      "commercial-drainage",
      "hoa-services",
    ].map((slug) => menuItem(slug, pages[slug]?.h1.replace(/^Commercial\s+/i, "") ?? slug, `/${slug}`)),
  ];

  return [
    {
      name: "Main Navigation",
      location: "main_navigation",
      items: [
        menuItem("home", "Home", "/"),
        menuItem("residential", "Residential", "/residential-landscaping", residential),
        menuItem("commercial", "Commercial", "/commercial", commercial),
        menuItem("gallery", "Gallery", "/gallery"),
        menuItem("service-areas", "Service Areas", "/service-areas"),
        menuItem("about", "About", "/about"),
        menuItem("blog", "Blog", "/blog"),
      ],
    },
    {
      name: "Footer Residential",
      location: "footer_platform",
      items: residential,
    },
    {
      name: "Footer Commercial",
      location: "footer_secondary",
      items: commercial,
    },
    {
      name: "Footer Company",
      location: "footer_company",
      items: [
        menuItem("about", "About", "/about"),
        menuItem("gallery", "Gallery", "/gallery"),
        menuItem("service-areas", "Service Areas", "/service-areas"),
        menuItem("blog", "Blog", "/blog"),
        menuItem("faq", "FAQ", "/faq"),
      ],
    },
  ];
}

export function getLandscapeCmsSlugs() {
  return new Set(buildLandscapePages().map((page) => page.slug));
}

export async function ensureLandscapeCmsContent() {
  const landscapePages = buildLandscapePages();
  const activeSlugs = new Set(landscapePages.map((page) => page.slug));
  const existingPages = await storage.cmsPages.getAllPages();

  for (const page of existingPages) {
    if (activeSlugs.has(page.slug)) continue;
    if (isLandscapePageContent(page.content)) continue;
    if (containsSecurityLowVoltageCopy(page) || page.status === "published") {
      await storage.cmsPages.updatePage(page.id, {
        status: "archived",
        noindex: true,
      });
    }
  }

  for (const page of landscapePages) {
    const existing = await storage.cmsPages.getPageBySlug(page.slug);
    if (!existing) {
      await storage.cmsPages.createPage(page);
      continue;
    }

    await storage.cmsPages.updatePage(existing.id, page);
  }

  for (const menu of buildMenus()) {
    const existing = await storage.cmsMenus.getByLocation(menu.location ?? "unassigned");
    if (!existing) {
      await storage.cmsMenus.create(menu);
      continue;
    }
    await storage.cmsMenus.update(existing.id, menu);
  }
}
