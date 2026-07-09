import blogData from "../../client/src/features/landscape-site/content/blog.json";
import { getPrerenderedPublicPaths } from "./public-prerender.service";

type BlogEntry = { slug: string; date: string };

export interface PublicSitemapEntry {
  loc: string;
  lastmod?: string;
}

const blogLastModified = new Map(
  (blogData as BlogEntry[]).map((post) => [`/blog/${post.slug}`, post.date]),
);

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function getPublicSitemapEntries(siteUrl: string): PublicSitemapEntry[] {
  const base = siteUrl.replace(/\/+$/, "");
  return getPrerenderedPublicPaths().map((pathname) => ({
    loc: `${base}${pathname === "/" ? "/" : pathname}`,
    lastmod: blogLastModified.get(pathname),
  }));
}

export function buildPublicSitemapXml(siteUrl: string) {
  const entries = getPublicSitemapEntries(siteUrl);
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
