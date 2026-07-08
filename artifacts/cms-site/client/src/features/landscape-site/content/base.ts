export type Block = { type: "h2" | "h3" | "p" | "li"; text: string };

export type LandscapeMedia = {
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

export type PageContent = {
  slug: string;
  h1: string;
  titleTag: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  schemaType: string;
  wordCountTarget: string;
  blocks: Block[];
  media?: LandscapeMedia;
};

export type LocationContent = PageContent & {
  city: string;
  state: string;
};

export type BlogPost = PageContent & {
  category: "residential" | "commercial";
  date: string;
  readMinutes: number;
  excerpt: string;
  image: string;
  imageUrl?: string;
};

export const LANDSCAPE_IMAGE_BASE = "/images/landscape";
