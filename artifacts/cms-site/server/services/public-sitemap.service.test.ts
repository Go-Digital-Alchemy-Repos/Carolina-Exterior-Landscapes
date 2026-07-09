import { describe, expect, it } from "vitest";
import { buildPublicSitemapXml, getPublicSitemapEntries } from "./public-sitemap.service";

describe("public sitemap", () => {
  it("contains only canonical prerendered URLs", () => {
    const entries = getPublicSitemapEntries("https://carolinaexteriorlandscapes.com/");
    const locations = entries.map((entry) => entry.loc);

    expect(locations).toContain("https://carolinaexteriorlandscapes.com/contact");
    expect(locations).toContain("https://carolinaexteriorlandscapes.com/service-areas/waxhaw-nc");
    expect(locations).toContain("https://carolinaexteriorlandscapes.com/blog/tall-fescue-lawn-care-guide-for-union-county-nc-homeowners");
    expect(locations).not.toContain("https://carolinaexteriorlandscapes.com/waxhaw-nc/");
    expect(locations).not.toContain("https://carolinaexteriorlandscapes.com/404/");
    expect(locations).not.toContain("https://carolinaexteriorlandscapes.com/thank-you/");
    expect(locations).toContain("https://carolinaexteriorlandscapes.com/residential-pressure-washing");
    expect(locations).toContain("https://carolinaexteriorlandscapes.com/commercial-pressure-washing");
    expect(new Set(locations).size).toBe(locations.length);
    expect(locations.filter((location) => location !== "https://carolinaexteriorlandscapes.com/" && location.endsWith("/"))).toEqual([]);
  });

  it("adds lastmod only where a meaningful content date exists", () => {
    const xml = buildPublicSitemapXml("https://carolinaexteriorlandscapes.com");
    expect(xml).toContain("<lastmod>2026-05-30</lastmod>");
    expect(xml).not.toContain("<changefreq>");
    expect(xml).not.toContain("<priority>");
  });
});
