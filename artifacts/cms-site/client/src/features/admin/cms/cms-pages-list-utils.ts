import type { CmsPage } from "@shared/schema";

export type CmsPageSort =
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

export function sortCmsPages(pages: CmsPage[], sort: CmsPageSort): CmsPage[] {
  const sorted = [...pages];
  sorted.sort((a, b) => {
    const titleCompare = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    const statusCompare = statusRank(a.status) - statusRank(b.status);
    switch (sort) {
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
