import { describe, expect, it } from "vitest";
import type { CmsPage } from "@shared/schema";
import { buildPagePayload, draftFromPage } from "./cms-blog-editor-page";

function page(content: Record<string, unknown>): CmsPage {
  return {
    id: "post-1",
    title: "Lawn Care Guide",
    slug: "lawn-care-guide",
    status: "draft",
    pageType: "blog-post",
    template: "full-width",
    sidebarId: null,
    content,
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    ogImageUrl: null,
    canonicalUrl: "/blog/lawn-care-guide",
    noindex: false,
    createdBy: null,
    updatedBy: null,
    scheduledAt: null,
    publishedAt: null,
    createdAt: new Date("2026-07-01T12:00:00.000Z"),
    updatedAt: new Date("2026-07-01T12:00:00.000Z"),
  };
}

describe("blog editor content model", () => {
  it("migrates legacy body text and reads existing hero content", () => {
    const draft = draftFromPage(page({
      landscape: { data: { excerpt: "Article summary", blocks: [] } },
      blog: { bodyText: "Opening paragraph.\n\n## Seasonal Timing\n\nMore detail." },
      blocks: [{
        id: "existing-hero",
        type: "hero",
        props: { eyebrow: "Field Notes", heading: "Custom Hero", subheading: "<p>Hero copy.</p>" },
      }],
    }));

    expect(draft.body).toBe("<p>Opening paragraph.</p><h2>Seasonal Timing</h2><p>More detail.</p>");
    expect(draft.heroEyebrow).toBe("Field Notes");
    expect(draft.heroHeading).toBe("Custom Hero");
    expect(draft.heroSubheading).toBe("<p>Hero copy.</p>");
  });

  it("writes hero and rich-text content into public builder blocks", () => {
    const currentContent = {
      landscape: { data: { excerpt: "Article summary" } },
      blog: { bodyText: "Old body" },
      blocks: [
        { id: "existing-hero", type: "hero", props: { heading: "Old hero" } },
        { id: "existing-cta", type: "cta", props: { heading: "Request a quote" } },
      ],
    };
    const draft = draftFromPage(page(currentContent));
    draft.heroEyebrow = "Landscape Advice";
    draft.heroHeading = "A Better Lawn";
    draft.heroSubheading = "<p>Practical seasonal guidance.</p>";
    draft.body = "<h2>Start Here</h2><p>Rich article content.</p>";

    const payload = buildPagePayload(draft, currentContent);
    const content = payload.content as Record<string, unknown>;
    const blocks = content.blocks as Array<{ type: string; props: Record<string, unknown> }>;

    expect(blocks[0].props).toMatchObject({
      eyebrow: "Landscape Advice",
      heading: "A Better Lawn",
      subheading: "<p>Practical seasonal guidance.</p>",
    });
    expect(blocks[1]).toMatchObject({
      type: "rich-text",
      props: { content: "<h2>Start Here</h2><p>Rich article content.</p>" },
    });
    expect(blocks[2].type).toBe("cta");
  });
});
