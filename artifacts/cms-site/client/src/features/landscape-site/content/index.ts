import pagesData from "./pages.json";
import locationsData from "./locations.json";
import blogData from "./blog.json";

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

export function getBlogImage(filename: string): string | undefined {
  return filename ? `${LANDSCAPE_IMAGE_BASE}/blog/${filename}` : undefined;
}

const pages = pagesData as Record<string, PageContent>;
const locations = locationsData as LocationContent[];
const blog = (blogData as BlogPost[])
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getPage(slug: string): PageContent | undefined {
  return pages[slug];
}

export function getAllPages(): PageContent[] {
  return Object.values(pages);
}

export function getLocations(): LocationContent[] {
  return locations;
}

export function getLocation(slug: string): LocationContent | undefined {
  return locations.find((l) => l.slug === slug);
}

export function getBlogPosts(): BlogPost[] {
  return blog;
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return blog.find((p) => p.slug === slug);
}

export { pages, locations, blog };
