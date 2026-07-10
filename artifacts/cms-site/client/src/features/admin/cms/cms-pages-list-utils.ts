import type { CmsPage } from "@shared/schema";

export type CmsPageSort =
  | "published-desc"
  | "published-asc"
  | "image-desc"
  | "image-asc"
  | "title-asc"
  | "title-desc"
  | "updated-desc"
  | "updated-asc"
  | "created-desc"
  | "created-asc"
  | "status-asc"
  | "status-desc"
  | "type-asc"
  | "type-desc"
  | "slug-asc"
  | "slug-desc";

const STATUS_SORT_ORDER = ["published", "scheduled", "draft", "archived"];

function statusRank(status: string): number {
  const index = STATUS_SORT_ORDER.indexOf(status);
  return index === -1 ? STATUS_SORT_ORDER.length : index;
}

function normalize(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).toLowerCase();
}

function timeValue(value: Date | string | null | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function getCmsPageSearchText(page: CmsPage): string {
  return [
    page.title,
    page.slug,
    page.pageType,
    page.status,
    page.seoTitle,
    page.seoDescription,
    page.seoKeywords,
    page.content ? JSON.stringify(page.content) : "",
  ]
    .map(normalize)
    .join(" ");
}

export function getCmsPageTitleSearchText(page: CmsPage): string {
  return normalize(page.title);
}

export function isBlogPostPage(page: CmsPage): boolean {
  return page.pageType === "blog-post";
}

export function isStandardCmsPage(page: CmsPage): boolean {
  return !isBlogPostPage(page);
}

export function getCmsBlogPostMetadata(page: CmsPage): {
  category: string;
  publishedDate: string;
  featuredImageUrl: string;
  imagePositionX: number;
  imagePositionY: number;
  excerpt: string;
  readMinutes: number | null;
} {
  const content = page.content && typeof page.content === "object" ? page.content as Record<string, unknown> : {};
  const landscape = content.landscape && typeof content.landscape === "object" ? content.landscape as Record<string, unknown> : {};
  const data = landscape.data && typeof landscape.data === "object" ? landscape.data as Record<string, unknown> : {};
  const category = typeof data.category === "string" && data.category.trim() ? data.category : "uncategorized";
  const publishedDate = page.publishedAt
    ? new Date(page.publishedAt).toISOString()
    : typeof data.date === "string" && data.date ? data.date : "";
  const media = data.media && typeof data.media === "object" ? data.media as Record<string, unknown> : {};
  const featuredImageUrl = [data.imageUrl, media.heroImageUrl, page.ogImageUrl]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0) ?? "";
  const imagePositionX = typeof data.imagePositionX === "number" ? data.imagePositionX : 50;
  const imagePositionY = typeof data.imagePositionY === "number" ? data.imagePositionY : 50;
  const excerpt = typeof data.excerpt === "string" ? data.excerpt : "";
  const readMinutes = typeof data.readMinutes === "number" ? data.readMinutes : null;

  return { category, publishedDate, featuredImageUrl, imagePositionX, imagePositionY, excerpt, readMinutes };
}

export function sortCmsPages(pages: CmsPage[], sort: CmsPageSort): CmsPage[] {
  const sorted = [...pages];
  sorted.sort((a, b) => {
    const titleCompare = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    const statusCompare = statusRank(a.status) - statusRank(b.status);
    const aBlogMeta = getCmsBlogPostMetadata(a);
    const bBlogMeta = getCmsBlogPostMetadata(b);
    const imageCompare = Number(Boolean(bBlogMeta.featuredImageUrl)) - Number(Boolean(aBlogMeta.featuredImageUrl));
    switch (sort) {
      case "published-desc":
        return timeValue(bBlogMeta.publishedDate) - timeValue(aBlogMeta.publishedDate) || titleCompare;
      case "published-asc":
        return timeValue(aBlogMeta.publishedDate) - timeValue(bBlogMeta.publishedDate) || titleCompare;
      case "image-desc":
        return imageCompare || titleCompare;
      case "image-asc":
        return -imageCompare || titleCompare;
      case "title-desc":
        return b.title.localeCompare(a.title, undefined, { sensitivity: "base" });
      case "updated-desc":
        return timeValue(b.updatedAt) - timeValue(a.updatedAt) || titleCompare;
      case "updated-asc":
        return timeValue(a.updatedAt) - timeValue(b.updatedAt) || titleCompare;
      case "created-desc":
        return timeValue(b.createdAt) - timeValue(a.createdAt) || titleCompare;
      case "created-asc":
        return timeValue(a.createdAt) - timeValue(b.createdAt) || titleCompare;
      case "status-desc":
        return -statusCompare || titleCompare;
      case "status-asc":
        return statusCompare || titleCompare;
      case "type-desc":
        return b.pageType.localeCompare(a.pageType, undefined, { sensitivity: "base" }) || titleCompare;
      case "type-asc":
        return a.pageType.localeCompare(b.pageType, undefined, { sensitivity: "base" }) || titleCompare;
      case "slug-desc":
        return b.slug.localeCompare(a.slug, undefined, { sensitivity: "base" }) || titleCompare;
      case "slug-asc":
        return a.slug.localeCompare(b.slug, undefined, { sensitivity: "base" }) || titleCompare;
      case "title-asc":
      default:
        return titleCompare;
    }
  });
  return sorted;
}

export function filterAndSortCmsPages(pages: CmsPage[], search: string, sort: CmsPageSort): CmsPage[] {
  const terms = normalize(search).split(/\s+/).filter(Boolean);
  const filtered = terms.length === 0
    ? pages
    : pages.filter((page) => {
        const haystack = getCmsPageSearchText(page);
        return terms.every((term) => haystack.includes(term));
      });

  return sortCmsPages(filtered, sort);
}

export function filterAndSortStandardCmsPages(pages: CmsPage[], search: string, sort: CmsPageSort): CmsPage[] {
  const terms = normalize(search).split(/\s+/).filter(Boolean);
  const standardPages = pages.filter(isStandardCmsPage);
  const filtered = terms.length === 0
    ? standardPages
    : standardPages.filter((page) => {
        const haystack = getCmsPageTitleSearchText(page);
        return terms.every((term) => haystack.includes(term));
      });

  return sortCmsPages(filtered, sort);
}

export function filterAndSortCmsBlogPosts(pages: CmsPage[], search: string, sort: CmsPageSort): CmsPage[] {
  return filterAndSortCmsPages(pages.filter(isBlogPostPage), search, sort);
}
