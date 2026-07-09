import fs from "fs";
import path from "path";
import type { InsertCmsMenu, InsertCmsPage, MenuItem } from "@shared/schema";
import { storage } from "../storage";

type LandscapeBlock = { type: "h2" | "h3" | "p" | "li"; text: string };

type LandscapeMedia = {
  heroImageUrl?: string;
  heroImageAlt?: string;
  sidebarImageUrl?: string;
  sidebarImageAlt?: string;
  serviceImages?: Record<string, string>;
  featureCards?: { title: string; imageUrl: string; imageAlt: string }[];
  galleryPreview?: { src: string; alt: string; label: string }[];
  projects?: {
    src: string;
    alt: string;
    title: string;
    location: string;
    category: "residential" | "commercial";
    tag: string;
  }[];
  images?: { src: string; alt: string }[];
};

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
  media?: LandscapeMedia;
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
  imageUrl?: string;
};

type LandscapeCmsKind = "page" | "location" | "blog" | "virtual";

type CmsBuilderBlock = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

const LANDSCAPE_CONTENT_VERSION = "carolina-landscape-v1";
const LANDSCAPE_IMAGE_BASE = "/images/landscape";

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

function imageUrl(filename: string) {
  return `${LANDSCAPE_IMAGE_BASE}/${filename}`;
}

function serviceImageUrl(filename: string) {
  return `${LANDSCAPE_IMAGE_BASE}/services/${filename}.png`;
}

const SERVICE_IMAGE_CONCEPTS: Record<string, Record<string, string>> = {
  "residential-landscaping": {
    "Custom Landscape Design": "landscape-design",
    "Plant & Shrub Installation": "plant-shrub",
    "Sod Installation": "sod",
    "Seasonal Color Programs": "seasonal-color",
    "Bed Creation & Renovation": "garden-beds",
  },
  "residential-hardscape": {
    "Patio Installation": "patio",
    "Walkways & Pathways": "walkway",
    "Retaining Walls": "retaining-wall",
    "Decorative Borders & Edging": "edging",
    "Steps & Stairs": "steps",
  },
  "residential-pressure-washing": {
    "Driveway Pressure Washing": "hero-residential-pressure-washing",
    "Sidewalks, Walkways & Front Entries": "hero-residential-pressure-washing",
    "Patio, Porch & Outdoor Living Area Cleaning": "hero-residential-pressure-washing",
    "House Washing & Exterior Surface Cleaning": "hero-residential-pressure-washing",
    "Fence, Wall & Hardscape Cleaning": "hero-residential-pressure-washing",
  },
  "drainage-solutions": {
    "French Drain Installation": "french-drain",
    "Yard Regrading & Grading": "regrading",
    "Catch Basin Installation": "catch-basin",
    "Downspout Extensions & Management": "downspout",
    Swales: "swale",
  },
  "mulching-and-planting": {
    "Types of Mulch We Install": "mulch",
    "Benefits of Professional Mulching": "mulched-landscape",
    "How Much Mulch Do You Need?": "mulch-delivery",
    "Seasonal Flower Planting": "seasonal-color",
    "Shrub & Ornamental Grass Installation": "ornamental-grass",
    "Bed Preparation & Cleanup": "garden-beds",
  },
  "commercial-landscaping": {
    "Entryway & Signage Landscaping": "commercial-entryway",
    "Seasonal Color Programs": "commercial-seasonal-color",
    "Commercial Sod Installation": "commercial-sod",
    "Tree & Shrub Planting": "commercial-plant-shrub",
    "Mulch Installation for Commercial Properties": "commercial-mulch",
    "Bed Creation & Renovation": "commercial-garden-beds",
  },
  "commercial-hardscape": {
    "Parking Lot Islands & Borders": "parking-island",
    "Commercial Walkways & Paths": "commercial-walkway",
    "Retaining Walls for Commercial Sites": "commercial-retaining-wall",
    "Dumpster Enclosures": "dumpster-enclosure",
    "Outdoor Seating Areas & Plazas": "plaza",
    "Steps, Ramps & Entry Features": "commercial-steps",
  },
  "commercial-drainage": {
    "French Drain Systems for Commercial Sites": "commercial-french-drain",
    "Catch Basin Installation & Maintenance": "commercial-catch-basin",
    "Site Regrading & Grading": "commercial-regrading",
    "Stormwater Management Solutions": "stormwater",
    "Downspout & Roof Drainage Management": "commercial-downspout",
    "Erosion Control & Stabilization": "commercial-erosion",
  },
  "commercial-pressure-washing": {
    "Sidewalk & Walkway Cleaning": "hero-commercial-pressure-washing",
    "Storefront, Entryway & Common Area Cleaning": "hero-commercial-pressure-washing",
    "Concrete, Curb & Parking Island Cleaning": "hero-commercial-pressure-washing",
    "Dumpster Pad & Service Area Cleaning": "hero-commercial-pressure-washing",
    "HOA Amenity & Community Area Washing": "hero-commercial-pressure-washing",
  },
  "hoa-services": {
    "Common Area Grounds Maintenance": "commercial-grounds-maintenance",
    "Entrance & Signage Landscaping": "commercial-entryway",
    "Seasonal Color & Planting Programs": "commercial-seasonal-color",
    "Community-Wide Mulch Programs": "commercial-mulch",
    "Tree & Shrub Maintenance": "commercial-tree-shrub-maintenance",
    "Drainage Management for HOA Properties": "commercial-french-drain",
    "Common Area Hardscape Maintenance": "plaza",
  },
};

function serviceImagesForPage(slug: string) {
  const concepts = SERVICE_IMAGE_CONCEPTS[slug];
  if (!concepts) return undefined;
  return Object.fromEntries(Object.entries(concepts).map(([title, concept]) => [title, serviceImageUrl(concept)]));
}

const HERO_IMAGES: Record<string, string> = {
  home: imageUrl("hero-home.png"),
  about: imageUrl("about-story.png"),
  "service-areas": imageUrl("community-aerial.png"),
  "residential-lawn-maintenance": imageUrl("hero-home.png"),
  "residential-landscaping": imageUrl("hero-home.png"),
  "residential-hardscape": imageUrl("hero-hardscape.png"),
  "residential-pressure-washing": imageUrl("hero-residential-pressure-washing.avif"),
  "mulching-and-planting": imageUrl("hero-mulch.png"),
  "drainage-solutions": imageUrl("hero-drainage.png"),
  commercial: imageUrl("hero-commercial.png"),
  "commercial-grounds-maintenance": imageUrl("hero-commercial-grounds.png"),
  "commercial-landscaping": imageUrl("hero-commercial-landscaping.png"),
  "commercial-hardscape": imageUrl("hero-commercial-hardscape.png"),
  "commercial-drainage": imageUrl("hero-commercial-drainage.png"),
  "commercial-pressure-washing": imageUrl("hero-commercial-pressure-washing.avif"),
  "hoa-services": imageUrl("hero-hoa.png"),
  "get-a-quote": imageUrl("hero-quote.png"),
};

const GALLERY_PROJECTS: NonNullable<LandscapeMedia["projects"]> = [
  {
    src: imageUrl("gallery-res-1.png"),
    alt: "Landscape design with natural stone retaining wall and layered plantings",
    title: "Retaining Wall & Landscape Design",
    location: "Fort Mill, SC",
    category: "residential",
    tag: "Landscaping",
  },
  {
    src: imageUrl("gallery-res-2.png"),
    alt: "Striped residential lawn with vibrant flower beds and clean edging",
    title: "Full Lawn Renovation & Beds",
    location: "Rock Hill, SC",
    category: "residential",
    tag: "Lawn Care",
  },
  {
    src: imageUrl("gallery-res-3.png"),
    alt: "Natural stone patio and outdoor living space with seating area",
    title: "Stone Patio & Outdoor Living",
    location: "Tega Cay, SC",
    category: "residential",
    tag: "Hardscape",
  },
  {
    src: imageUrl("hero-hardscape.png"),
    alt: "Custom paver patio hardscape installation",
    title: "Custom Paver Patio",
    location: "Indian Land, SC",
    category: "residential",
    tag: "Hardscape",
  },
  {
    src: imageUrl("hero-mulch.png"),
    alt: "Freshly mulched garden beds with seasonal plantings",
    title: "Mulch Refresh & Seasonal Planting",
    location: "York, SC",
    category: "residential",
    tag: "Mulch & Planting",
  },
  {
    src: imageUrl("hero-drainage.png"),
    alt: "French drain and drainage solution installation in a residential yard",
    title: "Drainage Correction",
    location: "Clover, SC",
    category: "residential",
    tag: "Drainage",
  },
  {
    src: imageUrl("gallery-com-1.png"),
    alt: "Corporate office park with manicured grounds and entry landscaping",
    title: "Office Park Grounds Program",
    location: "Rock Hill, SC",
    category: "commercial",
    tag: "Grounds Maintenance",
  },
  {
    src: imageUrl("gallery-com-2.png"),
    alt: "HOA community entrance with signage landscaping and seasonal color",
    title: "HOA Entrance Enhancement",
    location: "Fort Mill, SC",
    category: "commercial",
    tag: "HOA Services",
  },
  {
    src: imageUrl("gallery-com-3.png"),
    alt: "Commercial property hardscape walkways and plaza landscaping",
    title: "Commercial Walkways & Plaza",
    location: "Charlotte, NC",
    category: "commercial",
    tag: "Hardscape",
  },
  {
    src: imageUrl("hero-commercial.png"),
    alt: "Pristine commercial property grounds with maintained turf and beds",
    title: "Retail Center Maintenance",
    location: "Pineville, NC",
    category: "commercial",
    tag: "Grounds Maintenance",
  },
];

function cityHeroImage(slug: string) {
  if (slug === "matthews-nc") return imageUrl("matthews-nc-hero.png");
  const pool = [
    imageUrl("hero-home.png"),
    imageUrl("gallery-res-1.png"),
    imageUrl("gallery-res-2.png"),
    imageUrl("gallery-res-3.png"),
    imageUrl("community-aerial.png"),
  ];
  let sum = 0;
  for (let i = 0; i < slug.length; i++) sum += slug.charCodeAt(i);
  return pool[sum % pool.length];
}

function mediaForPage(page: LandscapePage | LandscapeLocation | LandscapeBlogPost | Record<string, unknown>, slug: string): LandscapeMedia | undefined {
  if (slug === "home") {
    return {
      heroImageUrl: HERO_IMAGES.home,
      heroImageAlt: "Carolina beautiful lawn",
      sidebarImageUrl: imageUrl("about-story.png"),
      sidebarImageAlt: "Carolina Exterior crew installing a natural stone patio",
      featureCards: [
        { title: "Residential", imageUrl: imageUrl("gallery-res-1.png"), imageAlt: "Residential landscaping" },
        { title: "Commercial", imageUrl: imageUrl("hero-commercial.png"), imageAlt: "Commercial landscaping" },
      ],
      galleryPreview: [
        { src: imageUrl("gallery-res-2.png"), alt: "Striped residential lawn with vibrant flower beds", label: "Lawn Renovation" },
        { src: imageUrl("gallery-res-3.png"), alt: "Natural stone patio and outdoor living space", label: "Stone Patio" },
        { src: imageUrl("gallery-com-2.png"), alt: "HOA community entrance landscaping", label: "HOA Entrance" },
      ],
    };
  }
  if (slug === "gallery") {
    return {
      heroImageUrl: imageUrl("hero-gallery.png"),
      heroImageAlt: "Manicured residential lawn and landscape beds framing a white brick home",
      projects: GALLERY_PROJECTS,
    };
  }
  if (slug === "commercial-portfolio") {
    return {
      images: GALLERY_PROJECTS.filter((project) => project.category === "commercial")
        .slice(0, 4)
        .map(({ src, alt }) => ({ src, alt })),
    };
  }
  if ("city" in page && typeof (page as LandscapeLocation).city === "string") {
    return {
      heroImageUrl: cityHeroImage(slug),
      heroImageAlt: `${(page as LandscapeLocation).city} landscaping service area`,
    };
  }
  if ("image" in page && typeof (page as LandscapeBlogPost).image === "string") {
    return {
      heroImageUrl: `${LANDSCAPE_IMAGE_BASE}/blog/${(page as LandscapeBlogPost).image}`,
      heroImageAlt: (page as LandscapeBlogPost).h1,
    };
  }
  const heroImageUrl = HERO_IMAGES[slug];
  const serviceImages = serviceImagesForPage(slug);
  if (heroImageUrl || serviceImages) {
    return {
      heroImageUrl,
      heroImageAlt: "h1" in page && typeof page.h1 === "string" ? page.h1 : "Carolina Exterior Landscapes",
      sidebarImageUrl: slug.includes("commercial") || slug === "hoa-services" ? imageUrl("gallery-com-1.png") : imageUrl("gallery-res-1.png"),
      sidebarImageAlt: "Recent landscape project by Carolina Exterior Landscapes",
      serviceImages,
    };
  }
  return undefined;
}

function withMedia<T extends LandscapePage | LandscapeLocation | LandscapeBlogPost | Record<string, unknown>>(data: T, slug: string): T {
  const media = mediaForPage(data, slug);
  if (!media) return data;
  const next = { ...data, media };
  if ("image" in next && typeof next.image === "string") {
    return { ...next, imageUrl: `${LANDSCAPE_IMAGE_BASE}/blog/${next.image}` } as T;
  }
  return next as T;
}

function htmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function richParagraph(text: unknown) {
  const paragraphs = String(text ?? "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  return paragraphs.map((part) => `<p>${htmlEscape(part)}</p>`).join("");
}

function blockHtml(block: LandscapeBlock): string {
  if (block.type === "h2") return `<h2>${htmlEscape(block.text)}</h2>`;
  if (block.type === "h3") return `<h3>${htmlEscape(block.text)}</h3>`;
  if (block.type === "li") return `<ul><li>${htmlEscape(block.text)}</li></ul>`;
  return richParagraph(block.text);
}

function landscapeBlocksToHtml(blocks: LandscapeBlock[]): string {
  return blocks.map(blockHtml).join("\n");
}

function isStructuredCardSection(section: { body: LandscapeBlock[] }) {
  return section.body.some((block) => block.type === "h3");
}

function buildCardsFromSection(section: { body: LandscapeBlock[] }) {
  const cards: Array<{ title: string; description: string }> = [];
  let current: { title: string; paragraphs: string[] } | null = null;
  for (const block of section.body) {
    if (block.type === "h3") {
      if (current) cards.push({ title: current.title, description: current.paragraphs.map(richParagraph).join("") });
      current = { title: block.text, paragraphs: [] };
      continue;
    }
    if (current && block.type === "p") {
      current.paragraphs.push(block.text);
    }
  }
  if (current) cards.push({ title: current.title, description: current.paragraphs.map(richParagraph).join("") });
  return cards.filter((card) => card.title && card.description);
}

function landscapeBlocksToBuilderBlocks(slug: string, blocks: LandscapeBlock[], media?: LandscapeMedia): CmsBuilderBlock[] {
  const sections: Array<{ heading?: string; body: LandscapeBlock[] }> = [];
  let current: { heading?: string; body: LandscapeBlock[] } = { body: [] };
  for (const block of blocks) {
    if (block.type === "h2") {
      if (current.heading || current.body.length) sections.push(current);
      current = { heading: block.text, body: [] };
    } else {
      current.body.push(block);
    }
  }
  if (current.heading || current.body.length) sections.push(current);

  return sections.flatMap((section, index): CmsBuilderBlock[] => {
    const idBase = `${slug}-content-${index + 1}`;
    const heading = section.heading ?? "";
    const isFaq = /faq|frequently asked/i.test(heading);
    const isCta = /^request a quote/i.test(heading);
    const introBlocks = section.body.filter((block) => block.type === "p");

    if (isFaq && isStructuredCardSection(section)) {
      return [{
        id: idBase,
        type: "faq",
        props: {
          background: index % 2 === 0 ? "white" : "muted",
          items: buildCardsFromSection(section).map((card) => ({
            question: card.title,
            answer: card.description,
          })),
        },
      }];
    }

    if (isCta) {
      return [{
        id: idBase,
        type: "cta",
        props: {
          heading,
          subheading: landscapeBlocksToHtml(section.body),
          primaryText: "Request a Quote",
          primaryLink: slug.includes("commercial") || slug === "hoa-services" ? "/commercial-quote" : "/get-a-quote",
        },
      }];
    }

    if (heading && isStructuredCardSection(section)) {
      const cards = buildCardsFromSection(section);
      if (cards.length > 0) {
        return [{
          id: idBase,
          type: "cards-grid",
          props: {
            title: heading,
            subtitle: introBlocks.length ? introBlocks.map((block) => richParagraph(block.text)).join("") : "",
            columns: cards.length === 2 ? "2" : "3",
            cards: cards.map((card) => ({
              ...card,
              imageUrl: media?.serviceImages?.[card.title] ?? "",
              imagePositionX: 50,
              imagePositionY: 50,
            })),
          },
        }];
      }
    }

    return [{
      id: idBase,
      type: "rich-text",
      props: {
        content: landscapeBlocksToHtml(heading ? [{ type: "h2", text: heading }, ...section.body] : section.body),
        alignment: "left",
        background: index % 2 === 0 ? "white" : "muted",
      },
    }];
  });
}

function buildBuilderBlocks(
  data: LandscapePage | LandscapeLocation | LandscapeBlogPost | Record<string, unknown>,
  options: { slug: string; kind: LandscapeCmsKind; title: string; path: string; seoDescription: string },
): CmsBuilderBlock[] {
  const slug = options.slug;
  const media = mediaForPage(data, slug);
  const sourceBlocks = Array.isArray((data as { blocks?: unknown }).blocks) ? (data as { blocks: LandscapeBlock[] }).blocks : [];
  const isCommercial = slug.includes("commercial") || slug === "hoa-services";
  const heroImageUrl = media?.heroImageUrl ?? "";
  const heroAlt = media?.heroImageAlt ?? options.title;
  const blocks: CmsBuilderBlock[] = [
    {
      id: `${slug}-hero`,
      type: "hero",
      props: {
        eyebrow: options.kind === "blog" ? "Landscape Journal" : isCommercial ? "Commercial Services" : "Carolina Exterior Landscapes",
        heading: options.title,
        subheading: richParagraph(options.seoDescription),
        ctaText: options.kind === "blog" || slug === "gallery" ? "" : "Request a Quote",
        ctaLink: options.kind === "blog" || slug === "gallery" ? "" : isCommercial ? "/commercial-quote" : "/get-a-quote",
        backgroundImageUrl: heroImageUrl,
        backgroundImageAlt: heroAlt,
        backgroundPositionX: 50,
        backgroundPositionY: 50,
        backgroundImageOpacity: 100,
        overlayColor: "#000000",
        overlayOpacity: slug === "gallery" || slug.includes("quote") ? 25 : 40,
        gradientEnabled: true,
        gradientColor: "#000000",
        gradientOpacity: 35,
        gradientHeight: 40,
        alignment: slug === "home" ? "left" : "center",
      },
    },
  ];

  if (slug === "home" && media?.featureCards?.length) {
    blocks.push({
      id: "home-service-paths",
      type: "cards-grid",
      props: {
        title: "Expertise for Every Property",
        subtitle: "<p>Comprehensive landscaping services tailored to the Piedmont Carolina climate.</p>",
        columns: "2",
        cards: media.featureCards.map((card) => ({
          title: card.title,
          description: card.title === "Residential"
            ? "Lawn maintenance, landscape installation, hardscape, mulching, planting, drainage, and pressure washing for homes."
            : "Grounds maintenance, commercial landscaping, hardscape, drainage, HOA services, and pressure washing for managed properties.",
          imageUrl: card.imageUrl,
          imageAlt: card.imageAlt,
          linkText: `Explore ${card.title} Services`,
          linkPath: card.title === "Residential" ? "/residential-landscaping" : "/commercial",
        })),
      },
    });
  }

  if (media?.sidebarImageUrl && slug === "home") {
    const intro = sourceBlocks.filter((block) => block.type === "p").slice(0, 2).map((block) => richParagraph(block.text)).join("");
    blocks.push({
      id: "home-owner-story",
      type: "text-image",
      props: {
        heading: "Local Outdoor Care, Built Around Reliability",
        body: intro,
        imageUrl: media.sidebarImageUrl,
        imageAlt: media.sidebarImageAlt ?? "Carolina Exterior Landscapes project",
        imagePosition: "right",
        imagePositionX: 50,
        imagePositionY: 50,
      },
    });
  }

  if (media?.galleryPreview?.length) {
    blocks.push({
      id: `${slug}-gallery-preview`,
      type: "cards-grid",
      props: {
        title: "Recent Outdoor Transformations",
        subtitle: "<p>A quick look at finished residential and commercial landscape projects.</p>",
        columns: "3",
        variant: "photo-gallery",
        cards: media.galleryPreview.map((item) => ({
          title: item.label,
          description: item.alt,
          imageUrl: item.src,
          imageAlt: item.alt,
        })),
      },
    });
  }

  blocks.push(...landscapeBlocksToBuilderBlocks(slug, sourceBlocks, media));

  if (media?.projects?.length) {
    blocks.push({
      id: `${slug}-projects`,
      type: "cards-grid",
      props: {
        title: "Project Gallery",
        subtitle: "<p>Representative residential and commercial projects from across our service area.</p>",
        columns: "3",
        variant: "photo-gallery",
        cards: media.projects.map((project) => ({
          title: project.title,
          description: `${project.location} · ${project.tag}`,
          imageUrl: project.src,
          imageAlt: project.alt,
        })),
      },
    });
  }

  if (media?.images?.length) {
    blocks.push({
      id: `${slug}-images`,
      type: "cards-grid",
      props: {
        title: "Commercial Portfolio",
        columns: "2",
        variant: "photo-gallery",
        cards: media.images.map((image, index) => ({
          title: `Project ${index + 1}`,
          description: image.alt,
          imageUrl: image.src,
          imageAlt: image.alt,
        })),
      },
    });
  }

  if (slug === "get-a-quote" || slug === "commercial-quote") {
    blocks.push({
      id: `${slug}-form`,
      type: "form-embed",
      props: {
        formSlug: slug === "commercial-quote" ? "commercial-quote" : "residential-quote",
      },
    });
  }

  if (options.kind !== "blog" && !slug.includes("quote")) {
    blocks.push({
      id: `${slug}-cta`,
      type: "cta",
      props: {
        heading: "Ready to improve your outdoor space?",
        subheading: "<p>Tell us about your property and we will help you choose the right next step.</p>",
        primaryText: isCommercial ? "Request a Commercial Proposal" : "Request a Quote",
        primaryLink: isCommercial ? "/commercial-quote" : "/get-a-quote",
      },
    });
  }

  return blocks;
}

function hasBuilderBlocks(content: unknown): boolean {
  return Boolean(content && typeof content === "object" && Array.isArray((content as { blocks?: unknown }).blocks) && (content as { blocks: unknown[] }).blocks.length > 0);
}

function mergeLandscapeContent(existingContent: unknown, seededContent: unknown) {
  const existing = existingContent && typeof existingContent === "object" ? existingContent as Record<string, unknown> : {};
  const seeded = seededContent && typeof seededContent === "object" ? seededContent as Record<string, unknown> : {};
  return {
    ...existing,
    source: seeded.source,
    landscape: existing.landscape ?? seeded.landscape,
    blocks: hasBuilderBlocks(existing) ? existing.blocks : seeded.blocks,
  };
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
  const landscapeData = withMedia(data, options.slug);
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
        data: landscapeData,
      },
      blocks: buildBuilderBlocks(data, options),
    },
    seoTitle: options.seoTitle,
    seoDescription: options.seoDescription,
    seoKeywords: options.seoKeywords ?? "",
    ogImageUrl: options.ogImageUrl ?? mediaForPage(data, options.slug)?.heroImageUrl ?? imageUrl("logo-full.png"),
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
  const menuLabelOverrides: Record<string, string> = {
    "residential-pressure-washing": "Pressure Washing",
    "commercial-pressure-washing": "Pressure Washing",
  };
  const serviceLabel = (slug: string, prefix: RegExp) => menuLabelOverrides[slug] ?? pages[slug]?.h1.replace(prefix, "") ?? slug;

  const residential = [
    "residential-lawn-maintenance",
    "residential-landscaping",
    "residential-hardscape",
    "residential-pressure-washing",
    "mulching-and-planting",
    "drainage-solutions",
  ].map((slug) => menuItem(slug, serviceLabel(slug, /^Residential\s+/i), `/${slug}`));

  const commercialServices = [
    "commercial-grounds-maintenance",
    "commercial-landscaping",
    "commercial-hardscape",
    "commercial-drainage",
    "commercial-pressure-washing",
    "hoa-services",
  ].map((slug) => menuItem(slug, serviceLabel(slug, /^Commercial\s+/i), `/${slug}`));

  const mainCommercial = commercialServices;
  const footerCommercial = [
    menuItem("commercial", "Commercial Hub", "/commercial"),
    ...commercialServices,
  ];
  const mobileNavigation = [
    menuItem("home", "Home", "/"),
    menuItem("residential", "Residential Services", "/residential-landscaping", residential),
    menuItem("commercial", "Commercial Services", "/commercial", mainCommercial),
    menuItem("gallery", "Gallery", "/gallery"),
    menuItem("about", "About Us", "/about"),
    menuItem("service-areas", "Service Areas", "/service-areas"),
    menuItem("blog", "Blog", "/blog"),
    menuItem("faq", "FAQ", "/faq"),
    menuItem("get-a-quote", "Get A Quote", "/get-a-quote"),
  ];

  return [
    {
      name: "Main Navigation",
      location: "main_navigation",
      items: [
        menuItem("home", "Home", "/"),
        menuItem("residential", "Residential", "/residential-landscaping", residential),
        menuItem("commercial", "Commercial", "/commercial", mainCommercial),
        menuItem("gallery", "Gallery", "/gallery"),
        menuItem("service-areas", "Service Areas", "/service-areas"),
        menuItem("about", "About", "/about"),
        menuItem("blog", "Blog", "/blog"),
      ],
    },
    {
      name: "Mobile Navigation",
      location: "mobile_navigation",
      items: mobileNavigation,
    },
    {
      name: "Footer Residential",
      location: "footer_platform",
      items: residential,
    },
    {
      name: "Footer Commercial",
      location: "footer_secondary",
      items: footerCommercial,
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

    await storage.cmsPages.updatePage(existing.id, {
      ...page,
      title: existing.title || page.title,
      status: existing.status || page.status,
      pageType: existing.pageType || page.pageType,
      template: existing.template || page.template,
      sidebarId: existing.sidebarId ?? page.sidebarId,
      seoTitle: existing.seoTitle ?? page.seoTitle,
      seoDescription: existing.seoDescription ?? page.seoDescription,
      seoKeywords: existing.seoKeywords ?? page.seoKeywords,
      ogImageUrl: existing.ogImageUrl ?? page.ogImageUrl,
      canonicalUrl: existing.canonicalUrl ?? page.canonicalUrl,
      noindex: existing.noindex ?? page.noindex,
      publishedAt: existing.publishedAt ?? page.publishedAt,
      content: mergeLandscapeContent(existing.content, page.content),
    });
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
