import type { CmsPage } from "@shared/schema";

export interface PublicSitemapEntry {
  loc: string;
  lastmod?: string;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function publicPagePath(page: CmsPage) {
  if (page.slug === "home") return "/";
  if (page.pageType === "location") return `/service-areas/${page.slug}`;
  if (page.pageType === "blog-post") return `/blog/${page.slug}`;
  return `/${page.slug}`;
}

export function getPublicSitemapEntries(siteUrl: string, pages: CmsPage[]): PublicSitemapEntry[] {
  const base = siteUrl.replace(/\/+$/, "");
  return pages
    .filter((page) => page.status === "published" && !page.noindex && page.slug !== "404")
    .map((page) => {
      const pathname = publicPagePath(page);
      const canonical = page.canonicalUrl?.trim();
      return {
        loc: canonical
          ? /^https?:\/\//i.test(canonical) ? canonical : `${base}${canonical.startsWith("/") ? "" : "/"}${canonical}`
          : `${base}${pathname === "/" ? "/" : pathname}`,
        lastmod: page.updatedAt ? new Date(page.updatedAt).toISOString().slice(0, 10) : undefined,
      };
    })
    .sort((a, b) => a.loc.localeCompare(b.loc));
}

export function buildPublicSitemapXml(siteUrl: string, pages: CmsPage[]) {
  const entries = getPublicSitemapEntries(siteUrl, pages);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => {
      const parts = ["  <url>", `    <loc>${escapeXml(entry.loc)}</loc>`];
      if (entry.lastmod) parts.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      parts.push("  </url>");
      return parts.join("\n");
    }),
    "</urlset>",
  ].join("\n");
}
