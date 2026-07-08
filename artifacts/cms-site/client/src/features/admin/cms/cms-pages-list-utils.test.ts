import { describe, expect, it } from "vitest";
import type { CmsPage } from "@shared/schema";
import { filterAndSortCmsPages, sortCmsPages } from "./cms-pages-list-utils";

function page(overrides: Partial<CmsPage>): CmsPage {
  return {
    id: overrides.id ?? overrides.slug ?? "page",
    title: overrides.title ?? "Page",
    slug: overrides.slug ?? "page",
    status: overrides.status ?? "published",
    pageType: overrides.pageType ?? "custom",
    template: overrides.template ?? "full-width",
    sidebarId: null,
    content: overrides.content ?? {},
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    ogImageUrl: null,
    canonicalUrl: null,
    noindex: false,
    createdBy: null,
    updatedBy: null,
    scheduledAt: null,
    publishedAt: null,
    createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("CMS page list helpers", () => {
  it("sorts pages alphabetically by title by default", () => {
    const sorted = sortCmsPages([
      page({ title: "Thank You", slug: "thank-you" }),
      page({ title: "Commercial Landscaping FAQ", slug: "commercial-faq" }),
      page({ title: "About", slug: "about" }),
    ], "title-asc");

    expect(sorted.map((item) => item.title)).toEqual([
      "About",
      "Commercial Landscaping FAQ",
      "Thank You",
    ]);
  });

  it("searches title, slug, seo fields, and nested content keywords", () => {
    const pages = [
      page({ title: "Lawn Care", slug: "lawn-care", content: { blocks: [{ text: "Fescue overseeding services" }] } }),
      page({ title: "Gallery", slug: "gallery", content: { blocks: [{ text: "Finished outdoor projects" }] } }),
      page({ title: "Commercial Hub", slug: "commercial", seoDescription: "HOA and retail property maintenance" }),
    ];

    expect(filterAndSortCmsPages(pages, "overseeding", "title-asc").map((item) => item.slug)).toEqual(["lawn-care"]);
    expect(filterAndSortCmsPages(pages, "retail maintenance", "title-asc").map((item) => item.slug)).toEqual(["commercial"]);
    expect(filterAndSortCmsPages(pages, "gallery", "title-asc").map((item) => item.slug)).toEqual(["gallery"]);
  });

  it("supports newest updated sorting", () => {
    const sorted = filterAndSortCmsPages([
      page({ title: "Older", slug: "older", updatedAt: new Date("2026-01-01T00:00:00.000Z") }),
      page({ title: "Newer", slug: "newer", updatedAt: new Date("2026-02-01T00:00:00.000Z") }),
    ], "", "updated-desc");

    expect(sorted.map((item) => item.slug)).toEqual(["newer", "older"]);
  });

  it("toggles status sorting between published-first and archived-first", () => {
    const pages = [
      page({ title: "Draft", slug: "draft", status: "draft" }),
      page({ title: "Archived", slug: "archived", status: "archived" }),
      page({ title: "Published", slug: "published", status: "published" }),
      page({ title: "Scheduled", slug: "scheduled", status: "scheduled" }),
    ];

    expect(sortCmsPages(pages, "status-asc").map((item) => item.status)).toEqual([
      "published",
      "scheduled",
      "draft",
      "archived",
    ]);
    expect(sortCmsPages(pages, "status-desc").map((item) => item.status)).toEqual([
      "archived",
      "draft",
      "scheduled",
      "published",
    ]);
  });

  it("supports bidirectional slug and type sorting", () => {
    const pages = [
      page({ title: "B", slug: "beta", pageType: "service" }),
      page({ title: "A", slug: "alpha", pageType: "custom" }),
    ];

    expect(sortCmsPages(pages, "slug-asc").map((item) => item.slug)).toEqual(["alpha", "beta"]);
    expect(sortCmsPages(pages, "slug-desc").map((item) => item.slug)).toEqual(["beta", "alpha"]);
    expect(sortCmsPages(pages, "type-asc").map((item) => item.pageType)).toEqual(["custom", "service"]);
    expect(sortCmsPages(pages, "type-desc").map((item) => item.pageType)).toEqual(["service", "custom"]);
  });
});
