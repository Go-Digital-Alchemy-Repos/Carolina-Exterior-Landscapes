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
const LANDSCAPE_CMS_WIRING_VERSION = 3;
const LANDSCAPE_QUOTE_LAYOUT_VERSION = 1;
const LANDSCAPE_CTA_LAYOUT_VERSION = 1;
const LANDSCAPE_IMAGE_BASE = "/images/landscape";
const CONTACT_PAGE_SLUG = "contact";
const NOT_FOUND_PAGE_SLUG = "404";

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
  return `${LANDSCAPE_IMAGE_BASE}/${modernImageFilename(filename)}`;
}

function serviceImageUrl(filename: string) {
  return `${LANDSCAPE_IMAGE_BASE}/services/${filename}.webp`;
}

function modernImageFilename(filename: string) {
  if (["logo-full.png", "logo-icon.png"].includes(filename)) return filename;
  return filename.replace(/\.png$/i, ".webp");
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
  if (slug === "residential-pressure-washing" || slug === "commercial-pressure-washing") {
    const fallback = slug.startsWith("commercial") ? imageUrl("hero-commercial.png") : imageUrl("hero-home.png");
    return Object.fromEntries(Object.keys(concepts).map((title) => [title, fallback]));
  }
  return Object.fromEntries(Object.entries(concepts).map(([title, concept]) => [title, serviceImageUrl(concept)]));
}

const HERO_IMAGES: Record<string, string> = {
  home: imageUrl("hero-home.png"),
  about: imageUrl("about-story.png"),
  "service-areas": imageUrl("community-aerial.png"),
  "residential-lawn-maintenance": imageUrl("hero-home.png"),
  "residential-landscaping": imageUrl("hero-home.png"),
  "residential-hardscape": imageUrl("hero-hardscape.png"),
  "residential-pressure-washing": imageUrl("hero-home.png"),
  "mulching-and-planting": imageUrl("hero-mulch.png"),
  "drainage-solutions": imageUrl("hero-drainage.png"),
  commercial: imageUrl("hero-commercial.png"),
  "commercial-grounds-maintenance": imageUrl("hero-commercial-grounds.png"),
  "commercial-landscaping": imageUrl("hero-commercial-landscaping.png"),
  "commercial-hardscape": imageUrl("hero-commercial-hardscape.png"),
  "commercial-drainage": imageUrl("hero-commercial-drainage.png"),
  "commercial-pressure-washing": imageUrl("hero-commercial.png"),
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
      heroImageUrl: imageUrl("gallery-res-1.png"),
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
      heroImageUrl: `${LANDSCAPE_IMAGE_BASE}/blog/${modernImageFilename((page as LandscapeBlogPost).image)}`,
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
    return { ...next, imageUrl: `${LANDSCAPE_IMAGE_BASE}/blog/${modernImageFilename(next.image)}` } as T;
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
        ctaText: options.kind === "blog" || slug === "gallery" || slug.includes("quote") ? "" : "Request a Quote",
        ctaLink: options.kind === "blog" || slug === "gallery" || slug.includes("quote") ? "" : isCommercial ? "/commercial-quote" : "/get-a-quote",
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
        variant: slug.includes("quote") ? "quote" : undefined,
      },
    },
  ];

  if (slug === "get-a-quote" || slug === "commercial-quote") {
    blocks.push({
      id: `${slug}-form`,
      type: "form-embed",
      props: {
        formSlug: slug === "commercial-quote" ? "commercial-quote" : "residential-quote",
      },
    });
    return blocks;
  }

  if (slug === "service-areas") {
    blocks.push({
      id: "service-areas-map",
      type: "service-area-map",
      props: {
        heading: "Communities We Serve",
        intro: "Explore our service territory across Union County and the greater Charlotte region. Select any pin to view local services for that community.",
        height: 500,
        background: "muted",
      },
    });
  }

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

  const serviceAreas = Array.isArray((data as { areas?: unknown }).areas)
    ? ((data as { areas: LandscapeLocation[] }).areas)
    : [];
  if (slug === "service-areas" && serviceAreas.length > 0) {
    blocks.push({
      id: "service-areas-directory",
      type: "areas-grid",
      props: {
        title: "Communities We Serve",
        items: serviceAreas.map((area) => ({
          label: `${area.city}, ${area.state}`,
          path: `/service-areas/${area.slug}`,
        })),
      },
    });
  }

  if (slug === "blog") {
    blocks.push({
      id: "blog-post-directory",
      type: "blog-listing",
      props: {
        title: "Latest Articles",
        subtitle: "<p>Practical guidance for healthier lawns, better landscapes, and well-managed commercial properties.</p>",
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

  if (options.kind !== "blog" && !slug.includes("quote")) {
    blocks.push({
      id: `${slug}-cta`,
      type: "cta",
      props: {
        eyebrow: "Start Your Project",
        heading: "Ready to transform your property?",
        subheading: "Contact Carolina Exterior Landscapes today for a free estimate on your residential or commercial landscaping needs.",
        primaryText: "Request Residential Quote",
        primaryLink: "/get-a-quote",
        secondaryText: "Commercial Inquiry",
        secondaryLink: "/commercial-quote",
      },
    });
  }

  return blocks;
}

function cloneSeedContent(seededContent: unknown) {
  return JSON.parse(JSON.stringify(seededContent ?? {})) as InsertCmsPage["content"];
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
  const builderBlocks = buildBuilderBlocks(data, options);
  const hasStandardCta = builderBlocks.some((block) => block.type === "cta");
  return {
    title: options.title,
    slug: options.slug,
    status: "published",
    pageType: options.pageType ?? options.kind,
    template: "full-width",
    sidebarId: null,
    content: {
      source: LANDSCAPE_CONTENT_VERSION,
      landscapeCmsWiringVersion: LANDSCAPE_CMS_WIRING_VERSION,
      ...(options.slug.includes("quote") ? { landscapeQuoteLayoutVersion: LANDSCAPE_QUOTE_LAYOUT_VERSION } : {}),
      ...(hasStandardCta ? { landscapeCtaLayoutVersion: LANDSCAPE_CTA_LAYOUT_VERSION } : {}),
      landscape: {
        kind: options.kind,
        path: options.path,
        data: landscapeData,
      },
      blocks: builderBlocks,
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

const RETIRED_PUBLIC_LINKS = [
  "/privacy-policy",
  "/service-areas/tega-cay-sc",
  "/service-areas/fort-mill-sc",
  "/service-areas/lake-wylie-sc",
  "/service-areas/rock-hill-sc",
  "/service-areas/pineville-nc",
];

function containsRetiredPublicLink(value: unknown): boolean {
  const serialized = JSON.stringify(value ?? "").toLowerCase();
  return RETIRED_PUBLIC_LINKS.some((pathname) => serialized.includes(pathname));
}

function hasBuilderBlocks(content: unknown): boolean {
  if (!content || typeof content !== "object") return false;
  const blocks = (content as { blocks?: unknown }).blocks;
  return Array.isArray(blocks) && blocks.length > 0;
}

function landscapeCmsWiringVersion(content: unknown): number {
  if (!content || typeof content !== "object") return 0;
  const version = (content as { landscapeCmsWiringVersion?: unknown }).landscapeCmsWiringVersion;
  return typeof version === "number" ? version : 0;
}

function landscapeQuoteLayoutVersion(content: unknown): number {
  if (!content || typeof content !== "object") return 0;
  const version = (content as { landscapeQuoteLayoutVersion?: unknown }).landscapeQuoteLayoutVersion;
  return typeof version === "number" ? version : 0;
}

function landscapeCtaLayoutVersion(content: unknown): number {
  if (!content || typeof content !== "object") return 0;
  const version = (content as { landscapeCtaLayoutVersion?: unknown }).landscapeCtaLayoutVersion;
  return typeof version === "number" ? version : 0;
}

function migrateStandardCta(existingContent: unknown, seedContent: unknown) {
  const existing = cloneSeedContent(existingContent) as Record<string, unknown>;
  const seed = cloneSeedContent(seedContent) as Record<string, unknown>;
  const existingBlocks = Array.isArray(existing.blocks) ? existing.blocks as CmsBuilderBlock[] : [];
  const seedBlocks = Array.isArray(seed.blocks) ? seed.blocks as CmsBuilderBlock[] : [];
  const standardCta = seedBlocks.find((block) => block.type === "cta");
  if (!standardCta) return existingContent as InsertCmsPage["content"];

  let replaced = false;
  const blocks = existingBlocks.map((block) => {
    if (block.type !== "cta") return block;
    replaced = true;
    return standardCta;
  });
  if (!replaced) blocks.push(standardCta);

  return {
    ...existing,
    landscapeCtaLayoutVersion: LANDSCAPE_CTA_LAYOUT_VERSION,
    blocks,
  } as InsertCmsPage["content"];
}

function faqBlocksFromPages(pages: Record<string, LandscapePage>, slugs: string[]): LandscapeBlock[] {
  const blocks: LandscapeBlock[] = [{ type: "h2", text: "Frequently Asked Questions" }];
  for (const slug of slugs) {
    const page = pages[slug];
    if (!page) continue;
    let inFaq = false;
    for (let index = 0; index < page.blocks.length; index += 1) {
      const block = page.blocks[index];
      if (block.type === "h2") {
        inFaq = /frequently asked|faq/i.test(block.text);
        continue;
      }
      const answer = page.blocks[index + 1];
      if (inFaq && block.type === "h3" && answer?.type === "p") {
        blocks.push(block, answer);
        index += 1;
      }
    }
  }
  return blocks;
}

function pressureWashingPages(): LandscapePage[] {
  return [
    {
      slug: "residential-pressure-washing",
      h1: "Residential Pressure Washing",
      titleTag: "Residential Pressure Washing | Carolina Exterior Landscapes",
      metaDescription: "Professional pressure washing for driveways, walkways, patios, home exteriors, fences, and hardscape throughout Waxhaw and the greater Charlotte area.",
      primaryKeyword: "residential pressure washing",
      secondaryKeywords: ["driveway cleaning", "patio pressure washing", "house washing Waxhaw NC"],
      schemaType: "Service",
      wordCountTarget: "800",
      blocks: [
        { type: "p", text: "Restore a clean, well-kept appearance to the outdoor surfaces around your home with careful, property-specific pressure washing." },
        { type: "h2", text: "Residential Pressure Washing Services" },
        { type: "h3", text: "Driveway Pressure Washing" },
        { type: "p", text: "We remove built-up dirt, organic staining, and surface grime from concrete driveways while using the appropriate pressure for the material." },
        { type: "h3", text: "Sidewalks, Walkways & Front Entries" },
        { type: "p", text: "Clean paths and entry areas improve curb appeal and create a more welcoming approach to your home." },
        { type: "h3", text: "Patio, Porch & Outdoor Living Area Cleaning" },
        { type: "p", text: "We clean patios, porches, and outdoor gathering spaces so they are ready for everyday use and entertaining." },
        { type: "h3", text: "House Washing & Exterior Surface Cleaning" },
        { type: "p", text: "Our team selects a suitable cleaning method for siding and exterior finishes to lift dirt without unnecessary surface damage." },
        { type: "h3", text: "Fence, Wall & Hardscape Cleaning" },
        { type: "p", text: "Fences, landscape walls, and masonry features can be cleaned as part of a coordinated exterior refresh." },
        { type: "h2", text: "Frequently Asked Questions" },
        { type: "h3", text: "How often should residential surfaces be pressure washed?" },
        { type: "p", text: "Most properties benefit from cleaning every one to two years, though shaded areas and surfaces exposed to heavy organic growth may need attention sooner." },
        { type: "h3", text: "Can pressure washing damage concrete or siding?" },
        { type: "p", text: "Incorrect pressure can cause damage. We match the cleaning method, pressure, and distance to the surface being cleaned." },
      ],
    },
    {
      slug: "commercial-pressure-washing",
      h1: "Commercial Pressure Washing",
      titleTag: "Commercial Pressure Washing | Carolina Exterior Landscapes",
      metaDescription: "Scheduled commercial pressure washing for sidewalks, storefronts, concrete, dumpster pads, and HOA common areas across the greater Charlotte region.",
      primaryKeyword: "commercial pressure washing",
      secondaryKeywords: ["storefront cleaning", "commercial concrete cleaning", "HOA pressure washing"],
      schemaType: "Service",
      wordCountTarget: "800",
      blocks: [
        { type: "p", text: "Keep customer-facing and common areas cleaner with pressure washing planned around your property's traffic, materials, and operating schedule." },
        { type: "h2", text: "Commercial Pressure Washing Services" },
        { type: "h3", text: "Sidewalk & Walkway Cleaning" },
        { type: "p", text: "Routine cleaning helps maintain a professional appearance across pedestrian approaches and shared paths." },
        { type: "h3", text: "Storefront, Entryway & Common Area Cleaning" },
        { type: "p", text: "We clean high-visibility entrances and common areas with scheduling designed to minimize disruption." },
        { type: "h3", text: "Concrete, Curb & Parking Island Cleaning" },
        { type: "p", text: "Concrete edges, curbs, and parking-lot islands can be included in a broader exterior maintenance plan." },
        { type: "h3", text: "Dumpster Pad & Service Area Cleaning" },
        { type: "p", text: "Cleaning service areas helps property teams manage appearance and recurring buildup in back-of-house zones." },
        { type: "h3", text: "HOA Amenity & Community Area Washing" },
        { type: "p", text: "Community entrances, pool decks, sidewalks, and amenity areas can be scheduled as individual projects or recurring service." },
        { type: "h2", text: "Frequently Asked Questions" },
        { type: "h3", text: "Can commercial cleaning be scheduled outside business hours?" },
        { type: "p", text: "Scheduling depends on property access and scope, but we work with managers to reduce disruption to tenants, residents, and customers." },
        { type: "h3", text: "Do you offer recurring commercial pressure washing?" },
        { type: "p", text: "Yes. Recurring frequency can be tailored to traffic, exposure, budget, and the standards required for the property." },
      ],
    },
  ];
}

function buildLandscapePages(): InsertCmsPage[] {
  const pages = readJson<Record<string, LandscapePage>>("client/src/features/landscape-site/content/pages.json");
  const locations = readJson<LandscapeLocation[]>("client/src/features/landscape-site/content/locations.json");
  const blogPosts = readJson<LandscapeBlogPost[]>("client/src/features/landscape-site/content/blog.json");

  const contentPages = [...Object.values(pages), ...pressureWashingPages()];
  const allPagesBySlug = Object.fromEntries(contentPages.map((page) => [page.slug, page]));
  const records: InsertCmsPage[] = contentPages.map((page) => {
    const data = page.slug === "service-areas" ? { ...page, areas: locations } : page;
    return pageRecord(data, {
      slug: page.slug,
      title: page.h1,
      path: pagePath(page.slug),
      kind: "page",
      pageType: page.slug === "home" ? "home" : "service",
      seoTitle: page.titleTag,
      seoDescription: page.metaDescription,
      seoKeywords: [page.primaryKeyword, ...page.secondaryKeywords].filter(Boolean).join(", "),
    });
  });

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
        posts: blogPosts,
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
          blocks: page.slug === "faq"
            ? faqBlocksFromPages(allPagesBySlug, ["residential-lawn-maintenance", "residential-landscaping", "residential-hardscape", "residential-pressure-washing", "mulching-and-planting", "drainage-solutions"])
            : page.slug === "commercial-faq"
              ? faqBlocksFromPages(allPagesBySlug, ["commercial", "commercial-grounds-maintenance", "commercial-landscaping", "commercial-hardscape", "commercial-drainage", "commercial-pressure-washing", "hoa-services"])
              : [],
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
  const locations = readJson<LandscapeLocation[]>("client/src/features/landscape-site/content/locations.json");
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

  const residentialFooter = [
    ...residential,
    menuItem("gallery", "View Gallery", "/gallery"),
  ];
  const mainCommercial = [
    ...commercialServices,
    menuItem("commercial-portfolio", "View Portfolio", "/commercial-portfolio"),
  ];
  const footerCommercial = [
    menuItem("commercial", "Commercial Hub", "/commercial"),
    ...commercialServices,
  ];

  return [
    {
      name: "Main Navigation",
      location: "main_navigation",
      items: [
        menuItem("residential", "Residential Services", "/residential-landscaping", residentialFooter),
        menuItem("commercial", "Commercial Services", "/commercial", mainCommercial),
        menuItem("home", "Home", "/"),
        menuItem("about", "About", "/about"),
        menuItem("gallery", "Gallery", "/gallery"),
        menuItem("service-areas", "Service Areas", "/service-areas"),
        menuItem("blog", "Blog", "/blog"),
        menuItem("faq", "FAQ", "/faq"),
        menuItem("contact", "Contact", "/contact"),
      ],
    },
    {
      name: "Footer Residential",
      location: "footer_platform",
      items: residentialFooter,
    },
    {
      name: "Footer Commercial",
      location: "footer_secondary",
      items: footerCommercial,
    },
    {
      name: "Footer Service Areas",
      location: "footer_resources",
      items: locations.map((location) =>
        menuItem(location.slug, `${location.city}, ${location.state}`, `/service-areas/${location.slug}`),
      ),
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
    {
      name: "Footer Legal",
      location: "footer_legal",
      items: [
        menuItem("about", "About Us", "/about"),
        menuItem("service-areas", "Service Areas", "/service-areas"),
        menuItem("blog", "Blog", "/blog"),
      ],
    },
  ];
}

function contactCmsPageRecord(): InsertCmsPage {
  return {
    title: "Contact Carolina Exterior Landscapes",
    slug: CONTACT_PAGE_SLUG,
    status: "published",
    pageType: "custom",
    template: "full-width",
    sidebarId: null,
    content: {
      blocks: [
        {
          id: "contact-hero",
          type: "hero",
          props: {
            eyebrow: "Contact",
            heading: "Contact Carolina Exterior Landscapes",
            subheading: "Tell us about your lawn care, landscaping, hardscape, mulching, or drainage needs. We respond to inquiries within one business day.",
            ctaText: "Call (704) 975-5867",
            ctaLink: "tel:+17049755867",
            imageUrl: imageUrl("hero-home.png"),
            alignment: "left",
            overlayColor: "#000000",
            overlayOpacity: 45,
            gradientEnabled: true,
            gradientColor: "#102234",
            gradientOpacity: 70,
            gradientHeight: 45,
            heroHeightPx: 520,
          },
        },
        {
          id: "contact-intro",
          type: "rich-text",
          props: {
            alignment: "left",
            content:
              "<p>Call us directly at <a href=\"tel:+17049755867\">(704) 975-5867</a> or fill out the form below and we will follow up within one business day.</p>",
          },
        },
        {
          id: "contact-details",
          type: "contact-nap",
          props: {
            background: "white",
          },
        },
        {
          id: "contact-form",
          type: "form-embed",
          props: {
            formSlug: "residential-quote",
          },
        },
      ],
    },
    seoTitle: "Contact Carolina Exterior Landscapes | Waxhaw NC",
    seoDescription: "Contact Carolina Exterior Landscapes for lawn care, landscaping, hardscape, mulching, planting, and drainage services in Waxhaw, Union County, and the greater Charlotte area.",
    seoKeywords: "contact Carolina Exterior Landscapes, landscaping quote Waxhaw NC, lawn care estimate Waxhaw NC",
    ogImageUrl: imageUrl("hero-home.png"),
    canonicalUrl: canonicalFor("/contact"),
    noindex: false,
    publishedAt: new Date(),
  };
}

function notFoundCmsPageRecord(): InsertCmsPage {
  return {
    title: "Page Not Found",
    slug: NOT_FOUND_PAGE_SLUG,
    status: "published",
    pageType: "custom",
    template: "full-width",
    sidebarId: null,
    content: {
      blocks: [
        {
          id: "not-found-hero",
          type: "hero",
          props: {
            eyebrow: "404",
            heading: "We could not find that page",
            subheading:
              "The page may have moved, or the link may be out of date. Here are a few helpful places to get back on track.",
            ctaText: "Back to Home",
            ctaLink: "/",
            backgroundImageUrl: imageUrl("hero-home.png"),
            backgroundPositionX: 50,
            backgroundPositionY: 50,
            backgroundImageOpacity: 80,
            alignment: "center",
            overlayColor: "#000000",
            overlayOpacity: 45,
            gradientEnabled: true,
            gradientColor: "#102234",
            gradientOpacity: 70,
            gradientHeight: 45,
            heroHeightPx: 500,
          },
        },
        {
          id: "not-found-links",
          type: "cards-grid",
          props: {
            title: "Popular Pages",
            subtitle: "Jump to one of our most visited lawn care and landscaping pages.",
            variant: "link-list",
            columns: "3",
            cards: [
              { title: "Residential Landscaping", path: "/residential-landscaping" },
              { title: "Lawn Maintenance", path: "/residential-lawn-maintenance" },
              { title: "Hardscape", path: "/residential-hardscape" },
              { title: "Drainage Solutions", path: "/drainage-solutions" },
              { title: "Service Areas", path: "/service-areas" },
              { title: "Get a Quote", path: "/get-a-quote" },
            ],
          },
        },
        {
          id: "not-found-help",
          type: "rich-text",
          props: {
            alignment: "center",
            content:
              "<p>Still not finding what you need? Call Carolina Exterior Landscapes at <a href=\"tel:+17049755867\">(704) 975-5867</a> and we will point you in the right direction.</p>",
          },
        },
      ],
    },
    seoTitle: "Page Not Found | Carolina Exterior Landscapes",
    seoDescription: "The page you are looking for could not be found.",
    seoKeywords: "",
    ogImageUrl: imageUrl("hero-home.png"),
    canonicalUrl: canonicalFor("/404"),
    noindex: true,
    publishedAt: new Date(),
  };
}

export function getLandscapeCmsSlugs() {
  return new Set([...buildLandscapePages().map((page) => page.slug), CONTACT_PAGE_SLUG, NOT_FOUND_PAGE_SLUG]);
}

export async function ensureLandscapeCmsContent() {
  const landscapePages = buildLandscapePages();

  for (const page of landscapePages) {
    const existing = await storage.cmsPages.getPageBySlug(page.slug);
    if (!existing) {
      await storage.cmsPages.createPage(page);
      continue;
    }

    const needsQuoteLayoutMigration = page.slug.includes("quote")
      && landscapeQuoteLayoutVersion(existing.content) < LANDSCAPE_QUOTE_LAYOUT_VERSION;
    const seedHasStandardCta = landscapeCtaLayoutVersion(page.content) === LANDSCAPE_CTA_LAYOUT_VERSION;
    const needsCtaLayoutMigration = seedHasStandardCta
      && landscapeCtaLayoutVersion(existing.content) < LANDSCAPE_CTA_LAYOUT_VERSION;
    if (
      !isLandscapePageContent(existing.content)
      || landscapeCmsWiringVersion(existing.content) < LANDSCAPE_CMS_WIRING_VERSION
      || needsQuoteLayoutMigration
    ) {
      await storage.cmsPages.updatePage(existing.id, {
        ...page,
        publishedAt: existing.publishedAt ?? page.publishedAt,
        content: cloneSeedContent(page.content),
      });
      continue;
    }

    if (needsCtaLayoutMigration) {
      await storage.cmsPages.updatePage(existing.id, {
        content: migrateStandardCta(existing.content, page.content),
      });
    }
  }

  const existingContactPage = await storage.cmsPages.getPageBySlug(CONTACT_PAGE_SLUG);
  if (!existingContactPage) {
    await storage.cmsPages.createPage(contactCmsPageRecord());
  } else if (!hasBuilderBlocks(existingContactPage.content)) {
    const contactSeed = contactCmsPageRecord();
    await storage.cmsPages.updatePage(existingContactPage.id, {
      ...contactSeed,
      status: "published",
      noindex: false,
      publishedAt: existingContactPage.publishedAt ?? new Date(),
    });
  }

  const existingNotFoundPage = await storage.cmsPages.getPageBySlug(NOT_FOUND_PAGE_SLUG);
  if (!existingNotFoundPage) {
    await storage.cmsPages.createPage(notFoundCmsPageRecord());
  } else if (!hasBuilderBlocks(existingNotFoundPage.content)) {
    const notFoundSeed = notFoundCmsPageRecord();
    await storage.cmsPages.updatePage(existingNotFoundPage.id, {
      ...notFoundSeed,
      status: "published",
      noindex: true,
      publishedAt: existingNotFoundPage.publishedAt ?? new Date(),
    });
  }

  for (const menu of buildMenus()) {
    const existing = await storage.cmsMenus.getByLocation(menu.location ?? "unassigned");
    if (!existing) {
      await storage.cmsMenus.create(menu);
      continue;
    }
    const serializedItems = JSON.stringify(existing.items ?? []);
    const needsMainNavigationMigration = menu.location === "main_navigation"
      && (serializedItems.includes("Commercial Hub") || !serializedItems.includes('"Contact"'));
    if (containsRetiredPublicLink(existing) || needsMainNavigationMigration) {
      await storage.cmsMenus.update(existing.id, menu);
    }
  }
}
