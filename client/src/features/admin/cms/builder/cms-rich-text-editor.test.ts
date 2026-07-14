import { describe, expect, it } from "vitest";
import { buildGalleryShortcode } from "./cms-rich-text-editor";

describe("buildGalleryShortcode", () => {
  it("builds the shortcode inserted by the blog/content editor", () => {
    expect(buildGalleryShortcode("gallery-123")).toBe('[gallery id="gallery-123"]');
  });
});
