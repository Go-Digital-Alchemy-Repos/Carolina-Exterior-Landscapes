import { describe, expect, it } from "vitest";

describe("cms gallery storage helpers", () => {
  it("normalizes gallery slugs", async () => {
    process.env.DATABASE_URL ??= "postgres://user:pass@localhost:5432/test";
    const { normalizeGallerySlug } = await import("./cms-galleries.storage");

    expect(normalizeGallerySlug("  Summer Lawn Care Gallery!!  ")).toBe("summer-lawn-care-gallery");
    expect(normalizeGallerySlug("Commercial / Hardscapes --- 2026")).toBe("commercial/hardscapes-2026");
    expect(normalizeGallerySlug("//// Featured ### Work ////")).toBe("featured-work");
  });
});
