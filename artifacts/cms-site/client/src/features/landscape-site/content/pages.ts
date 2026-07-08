import pagesData from "./pages.json";
import type { PageContent } from "./base";

const pages = pagesData as Record<string, PageContent>;

export function getPage(slug: string): PageContent | undefined {
  return pages[slug];
}

export function getAllPages(): PageContent[] {
  return Object.values(pages);
}

export { pages };
