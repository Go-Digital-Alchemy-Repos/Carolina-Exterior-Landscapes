import pagesData from "./pages.json";
import locationsData from "./locations.json";
import blogData from "./blog.json";

export type Block = { type: "h2" | "h3" | "p" | "li"; text: string };

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

const blogImages = import.meta.glob<string>("../assets/blog/*.webp", {
  eager: true,
  import: "default",
});

export function getBlogImage(filename: string | undefined): string | undefined {
  if (!filename) return undefined;
  const webpFilename = filename.replace(/\.png$/i, ".webp");
  const entry = Object.entries(blogImages).find(([path]) =>
    path.endsWith(`/${webpFilename}`),
  );
  return entry?.[1];
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
