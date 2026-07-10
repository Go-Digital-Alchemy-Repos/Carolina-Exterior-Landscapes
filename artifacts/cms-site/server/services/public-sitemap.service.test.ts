import { describe, expect, it } from "vitest";
import { buildPublicSitemapXml, getPublicSitemapEntries } from "./public-sitemap.service";

describe("public sitemap", () => {
  const pages = [
    { slug: "home", pageType: "page", status: "published", noindex: false, canonicalUrl: null, updatedAt: new Date("2026-05-30") },
    { slug: "contact", pageType: "page", status: "published", noindex: false, canonicalUrl: null, updatedAt: new Date("2026-05-30") },
    { slug: "waxhaw-nc", pageType: "location", status: "published", noindex: false, canonicalUrl: null, updatedAt: new Date("2026-05-30") },
    { slug: "lawn-care-guide", pageType: "blog-post", status: "published", noindex: false, canonicalUrl: null, updatedAt: new Date("2026-05-30") },
    { slug: "private", pageType: "page", status: "draft", noindex: false, canonicalUrl: null, updatedAt: new Date("2026-05-30") },
    { slug: "404", pageType: "page", status: "published", noindex: true, canonicalUrl: null, updatedAt: new Date("2026-05-30") },
  ] as any;

  it("contains only published, indexable CMS URLs", () => {
    const entries = getPublicSitemapEntries("https://carolinaexteriorlandscapes.com/", pages);
    const locations = entries.map((entry) => entry.loc);

    expect(locations).toContain("https://carolinaexteriorlandscapes.com/contact");
    expect(locations).toContain("https://carolinaexteriorlandscapes.com/service-areas/waxhaw-nc");
    expect(locations).toContain("https://carolinaexteriorlandscapes.com/blog/lawn-care-guide");
    expect(locations).not.toContain("https://carolinaexteriorlandscapes.com/private");
    expect(locations).not.toContain("https://carolinaexteriorlandscapes.com/404");
    expect(new Set(locations).size).toBe(locations.length);
  });

  it("uses CMS update dates for lastmod", () => {
    const xml = buildPublicSitemapXml("https://carolinaexteriorlandscapes.com", pages);
    expect(xml).toContain("<lastmod>2026-05-30</lastmod>");
    expect(xml).not.toContain("<changefreq>");
    expect(xml).not.toContain("<priority>");
  });
});
