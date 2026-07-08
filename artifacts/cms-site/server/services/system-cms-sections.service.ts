import { createBlock, ALL_BLOCKS, type BlockDef, type BlockInstance, type PropDef } from "../../client/src/features/admin/cms/builder/block-registry";
import { storage } from "../storage";
import { logger } from "../utils/logger";

const SYSTEM_SECTION_NAME_PREFIX = "Starter - ";

const LOREM_SHORT = "Lorem ipsum";
const LOREM_TITLE = "Lorem Ipsum Dolor";
const LOREM_SUBTITLE = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const LOREM_BODY =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
const LOREM_LONG =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
const LOREM_RICHTEXT = `<p>${LOREM_BODY}</p><p>${LOREM_LONG}</p>`;
const STARTER_LIBRARY_BLOCKS = ALL_BLOCKS.filter((block) => !block.isDynamic);
const CAROLINA_SECTION_NAME_PREFIX = "Carolina - ";
const LANDSCAPE_IMAGE_BASE = "/images/landscape";

function mapBlockToSectionCategory(block: BlockDef): string {
  if (block.type.includes("hero")) return "hero";
  if (block.type.includes("faq")) return "faq";
  if (block.type.includes("testimonial")) return "testimonials";
  if (block.type.includes("team")) return "team";
  if (
    block.type.includes("card") ||
    block.type.includes("feature") ||
    block.type.includes("benefit") ||
    block.type.includes("stat") ||
    block.type.includes("trust")
  ) {
    return "features";
  }
  if (block.category === "conversion" || block.type.includes("cta") || block.type.includes("button")) {
    return "cta";
  }
  if (block.category === "content" || block.category === "media" || block.category === "dynamic") {
    return "content";
  }
  return "general";
}

function placeholderTextForKey(key: string): string {
  const normalized = key.toLowerCase();

  if (normalized.includes("question")) return "Lorem ipsum dolor sit amet?";
  if (normalized.includes("quote")) return LOREM_LONG;
  if (normalized.includes("title") || normalized.includes("heading")) return LOREM_TITLE;
  if (normalized.includes("subtitle") || normalized.includes("subheading")) return LOREM_SUBTITLE;
  if (normalized.includes("eyebrow") || normalized.includes("badge") || normalized.includes("label")) return LOREM_SHORT;
  if (normalized.includes("caption")) return "Lorem ipsum dolor sit amet.";
  if (normalized.includes("description") || normalized.includes("answer") || normalized.includes("response")) return LOREM_BODY;
  if (normalized.includes("body") || normalized.includes("content")) return LOREM_BODY;
  if (normalized.includes("cta") || normalized.includes("button")) return "Lorem Ipsum";
  if (normalized.includes("name")) return "Lorem Ipsum";
  if (normalized.includes("role")) return "Dolor Sit";
  if (normalized.includes("location") || normalized.includes("address")) return "Lorem ipsum dolor";
  if (normalized.includes("milestone") || normalized.includes("step")) return "Lorem ipsum";
  if (normalized.includes("value")) return "Lorem ipsum";
  if (normalized.includes("disclaimer")) return LOREM_SUBTITLE;
  return LOREM_BODY;
}

function placeholderValueForProp(prop: PropDef, existingValue: unknown): unknown {
  switch (prop.type) {
    case "text":
      if (prop.key.toLowerCase().includes("icon")) {
        return typeof existingValue === "string" && existingValue.trim().length > 0 ? existingValue : "Sparkles";
      }
      return placeholderTextForKey(prop.key);
    case "textarea":
      return placeholderTextForKey(prop.key);
    case "richtext":
      return LOREM_RICHTEXT;
    case "url":
      return prop.key.toLowerCase().includes("video") ? "" : "/";
    case "image-url":
      return "";
    case "select":
      return existingValue ?? prop.options?.[0]?.value ?? "";
    case "boolean":
      return typeof existingValue === "boolean" ? existingValue : false;
    case "number":
      return typeof existingValue === "number" ? existingValue : prop.min ?? 0;
    case "color":
      return typeof existingValue === "string" ? existingValue : "#ffffff";
    case "array-items": {
      const schema = prop.itemSchema ?? [];
      const currentItems = Array.isArray(existingValue) ? existingValue : [];
      const sourceItems = currentItems.length > 0 ? currentItems : Array.from({ length: 2 }, () => ({}));
      return sourceItems.map((item) => {
        const itemRecord = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
        const nextItem: Record<string, unknown> = {};
        for (const field of schema) {
          nextItem[field.key] = placeholderValueForProp(field as PropDef, itemRecord[field.key]);
        }
        return nextItem;
      });
    }
    default:
      return existingValue;
  }
}

function createPlaceholderBlock(block: BlockDef): BlockInstance {
  const instance = createBlock(block.type);
  const nextProps: Record<string, unknown> = { ...instance.props };

  for (const prop of block.propDefs) {
    nextProps[prop.key] = placeholderValueForProp(prop, nextProps[prop.key]);
  }

  return {
    ...instance,
    props: nextProps,
  };
}

function buildStarterSectionRecord(block: BlockDef) {
  return {
    name: `${SYSTEM_SECTION_NAME_PREFIX}${block.label}`,
    description: `System starter section for the ${block.label} block with placeholder Latin content.`,
    category: mapBlockToSectionCategory(block),
    blocks: [createPlaceholderBlock(block)],
  };
}

function block(type: string, props: Record<string, unknown>): BlockInstance {
  const instance = createBlock(type);
  return {
    ...instance,
    props: {
      ...instance.props,
      ...props,
    },
  };
}

function buildCarolinaLandscapeSections() {
  return [
    {
      name: `${CAROLINA_SECTION_NAME_PREFIX}Homepage Hero`,
      description: "Primary Carolina Exterior Landscapes homepage hero with real brand copy and media-library hero image.",
      category: "hero",
      blocks: [
        block("hero", {
          eyebrow: "Complete Outdoor Care",
          heading: "Landscaping, Lawn Care, Hardscape & Drainage Services",
          subheading:
            "Design, build, and maintenance services for premium residential and commercial outdoor spaces across Union County and the Charlotte region.",
          ctaText: "Request a Quote",
          ctaLink: "/get-a-quote",
          backgroundImageUrl: `${LANDSCAPE_IMAGE_BASE}/hero-home.png`,
          backgroundImageOpacity: 75,
          overlayOpacity: 55,
          gradientEnabled: true,
          alignment: "left",
        }),
      ],
    },
    {
      name: `${CAROLINA_SECTION_NAME_PREFIX}Residential And Commercial Services`,
      description: "Two-column services overview for residential and commercial landscaping paths.",
      category: "features",
      blocks: [
        block("section-header", {
          eyebrow: "Field Notes",
          title: "Expertise for Every Property",
          subtitle: "Comprehensive landscaping services tailored to the Piedmont Carolina climate.",
          alignment: "center",
        }),
        block("cards-grid", {
          title: "",
          subtitle: "",
          columns: "2",
          cards: [
            {
              title: "Residential Landscaping",
              description: "Lawn maintenance, planting, mulch, hardscape, and drainage for homes and estates.",
              imageUrl: `${LANDSCAPE_IMAGE_BASE}/gallery-res-1.png`,
              linkText: "Explore Residential Services",
              linkPath: "/residential-landscaping",
            },
            {
              title: "Commercial Landscaping",
              description: "Grounds maintenance, HOA programs, commercial planting, hardscape, and drainage.",
              imageUrl: `${LANDSCAPE_IMAGE_BASE}/hero-commercial.png`,
              linkText: "Explore Commercial Services",
              linkPath: "/commercial",
            },
          ],
        }),
      ],
    },
    {
      name: `${CAROLINA_SECTION_NAME_PREFIX}Recent Finished Projects`,
      description: "Reusable gallery teaser section using representative residential and commercial project images.",
      category: "media",
      blocks: [
        block("section-header", {
          eyebrow: "Proof In The Work",
          title: "Recent Finished Projects",
          subtitle: "A quick look at lawn renovations, hardscapes, and HOA landscape improvements.",
          alignment: "left",
        }),
        block("cards-grid", {
          title: "",
          subtitle: "",
          columns: "3",
          cards: [
            {
              title: "Lawn Renovation",
              description: "Clean turf, crisp edging, and refreshed planting beds.",
              imageUrl: `${LANDSCAPE_IMAGE_BASE}/gallery-res-2.png`,
              linkText: "View Gallery",
              linkPath: "/gallery",
            },
            {
              title: "Stone Patio",
              description: "Outdoor living spaces with durable natural textures.",
              imageUrl: `${LANDSCAPE_IMAGE_BASE}/gallery-res-3.png`,
              linkText: "View Gallery",
              linkPath: "/gallery",
            },
            {
              title: "HOA Entrance",
              description: "Community entrances with seasonal color and maintained beds.",
              imageUrl: `${LANDSCAPE_IMAGE_BASE}/gallery-com-2.png`,
              linkText: "View Gallery",
              linkPath: "/gallery",
            },
          ],
        }),
      ],
    },
    {
      name: `${CAROLINA_SECTION_NAME_PREFIX}Service Page Sidebar CTA`,
      description: "Reusable quote sidebar callout for service pages.",
      category: "cta",
      blocks: [
        block("cta", {
          heading: "Ready to start?",
          subheading: "Contact us today for a free, no-obligation estimate for your property in the Carolina Piedmont.",
          primaryText: "Request a Quote",
          primaryLink: "/get-a-quote",
        }),
        block("trust-bar", {
          items: [
            { icon: "MapPin", label: "Locally owned in Monroe, NC", sublabel: "" },
            { icon: "Shield", label: "Licensed and insured", sublabel: "" },
            { icon: "Clock", label: "Reliable scheduling and communication", sublabel: "" },
            { icon: "Leaf", label: "Premium materials and craftsmanship", sublabel: "" },
          ],
        }),
      ],
    },
    {
      name: `${CAROLINA_SECTION_NAME_PREFIX}Primary Quote CTA`,
      description: "Full-width quote conversion section for page bottoms.",
      category: "cta",
      blocks: [
        block("cta", {
          heading: "Ready to get started?",
          subheading: "Tell Carolina Exterior Landscapes what your property needs and we will follow up with the right next step.",
          primaryText: "Request a Quote",
          primaryLink: "/get-a-quote",
        }),
      ],
    },
    {
      name: `${CAROLINA_SECTION_NAME_PREFIX}Gallery Project Grid`,
      description: "Reusable photo-card gallery section for portfolio and project pages.",
      category: "media",
      blocks: [
        block("cards-grid", {
          title: "Project Gallery",
          subtitle: "Representative residential and commercial landscape projects from across our service area.",
          columns: "3",
          variant: "photo-gallery",
          cards: [
            {
              title: "Lawn Renovation",
              description: "Residential turf, edging, and refreshed landscape beds.",
              imageUrl: `${LANDSCAPE_IMAGE_BASE}/gallery-res-2.png`,
              imageAlt: "Striped residential lawn with vibrant flower beds",
            },
            {
              title: "Stone Patio",
              description: "Natural stone outdoor living space.",
              imageUrl: `${LANDSCAPE_IMAGE_BASE}/gallery-res-3.png`,
              imageAlt: "Natural stone patio and outdoor living space",
            },
            {
              title: "HOA Entrance",
              description: "Community entrance landscaping and seasonal color.",
              imageUrl: `${LANDSCAPE_IMAGE_BASE}/gallery-com-2.png`,
              imageAlt: "HOA community entrance landscaping",
            },
          ],
        }),
      ],
    },
    {
      name: `${CAROLINA_SECTION_NAME_PREFIX}Residential Quote Form`,
      description: "Reusable residential quote form embed connected to managed forms and CRM ingestion.",
      category: "forms",
      blocks: [
        block("form-embed", {
          formSlug: "residential-quote",
        }),
      ],
    },
    {
      name: `${CAROLINA_SECTION_NAME_PREFIX}Commercial Quote Form`,
      description: "Reusable commercial quote form embed connected to managed forms and CRM ingestion.",
      category: "forms",
      blocks: [
        block("form-embed", {
          formSlug: "commercial-quote",
        }),
      ],
    },
    {
      name: `${CAROLINA_SECTION_NAME_PREFIX}Service Areas Grid`,
      description: "Reusable service-area link grid for location hubs and landing pages.",
      category: "content",
      blocks: [
        block("areas-grid", {
          items: [
            { label: "Monroe, NC", path: "/service-areas/monroe-nc" },
            { label: "Matthews, NC", path: "/service-areas/matthews-nc" },
            { label: "Waxhaw, NC", path: "/service-areas/waxhaw-nc" },
            { label: "Indian Trail, NC", path: "/service-areas/indian-trail-nc" },
            { label: "Charlotte, NC", path: "/service-areas/charlotte-nc" },
            { label: "Fort Mill, SC", path: "/service-areas/fort-mill-sc" },
          ],
        }),
      ],
    },
    {
      name: `${CAROLINA_SECTION_NAME_PREFIX}FAQ Accordion`,
      description: "Reusable landscaping FAQ section for residential and commercial pages.",
      category: "faq",
      blocks: [
        block("faq", {
          items: [
            {
              question: "How quickly can you provide an estimate?",
              answer: "Most residential quote requests receive a follow-up within one business day. Commercial proposal timing depends on property size and scope.",
            },
            {
              question: "Do you handle both residential and commercial properties?",
              answer: "Yes. Carolina Exterior Landscapes provides residential lawn and landscape services along with commercial grounds maintenance, hardscape, drainage, HOA, and pressure washing services.",
            },
            {
              question: "Are services available across the Charlotte region?",
              answer: "Yes. We serve Monroe, Union County, Charlotte-area communities, and nearby South Carolina markets including Fort Mill and Rock Hill.",
            },
          ],
        }),
      ],
    },
  ];
}

export async function ensureSystemCmsSections(options?: { refreshExisting?: boolean }) {
  const refreshExisting = options?.refreshExisting ?? false;
  const existingSections = await storage.cmsSections.getAllSections();
  const existingByName = new Map(existingSections.map((section) => [section.name, section]));
  const desiredStarterNames = new Set(
    STARTER_LIBRARY_BLOCKS.map((block) => `${SYSTEM_SECTION_NAME_PREFIX}${block.label}`)
  );

  let created = 0;
  let updated = 0;
  let deleted = 0;

  if (refreshExisting) {
    for (const section of existingSections) {
      if (section.name.startsWith(SYSTEM_SECTION_NAME_PREFIX) && !desiredStarterNames.has(section.name)) {
        await storage.cmsSections.deleteSection(section.id);
        deleted += 1;
      }
    }
  }

  for (const block of STARTER_LIBRARY_BLOCKS) {
    const starterSection = buildStarterSectionRecord(block);
    const existing = existingByName.get(starterSection.name);

    if (!existing) {
      await storage.cmsSections.createSection({
        ...starterSection,
        blocks: starterSection.blocks as any,
      });
      created += 1;
      continue;
    }

    if (refreshExisting) {
      await storage.cmsSections.updateSection(existing.id, {
        name: starterSection.name,
        description: starterSection.description,
        category: starterSection.category,
        blocks: starterSection.blocks as any,
      });
      updated += 1;
    }
  }

  for (const section of buildCarolinaLandscapeSections()) {
    const existing = existingByName.get(section.name);

    if (!existing) {
      await storage.cmsSections.createSection({
        ...section,
        blocks: section.blocks as any,
      });
      created += 1;
      continue;
    }

    if (refreshExisting) {
      await storage.cmsSections.updateSection(existing.id, {
        name: section.name,
        description: section.description,
        category: section.category,
        blocks: section.blocks as any,
      });
      updated += 1;
    }
  }

  logger.cms.info("Ensured system CMS reusable sections", {
    created,
    updated,
    deleted,
    refreshExisting,
  });

  return {
    created,
    updated,
    deleted,
    total: STARTER_LIBRARY_BLOCKS.length + buildCarolinaLandscapeSections().length,
  };
}
