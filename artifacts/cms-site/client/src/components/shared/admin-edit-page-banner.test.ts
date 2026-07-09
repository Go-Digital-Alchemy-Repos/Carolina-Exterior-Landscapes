import { describe, expect, it } from "vitest";
import { editorHref, isPublicEditablePath, slugFromPublicPath } from "./admin-edit-page-banner";

describe("AdminEditPageBanner helpers", () => {
  it("maps public paths to CMS slugs", () => {
    expect(slugFromPublicPath("/")).toBe("home");
    expect(slugFromPublicPath("/gallery/")).toBe("gallery");
    expect(slugFromPublicPath("/service-areas/waxhaw-nc")).toBe("waxhaw-nc");
    expect(slugFromPublicPath("/blog/mulching-101?preview=1")).toBe("mulching-101");
  });

  it("keeps admin and system paths from showing the public edit banner", () => {
    expect(isPublicEditablePath("/gallery")).toBe(true);
    expect(isPublicEditablePath("/admin/cms/pages/123")).toBe(false);
    expect(isPublicEditablePath("/auth/login")).toBe(false);
    expect(isPublicEditablePath("/forms/contact-form")).toBe(false);
  });

  it("routes blog posts to the blog editor and pages to the page editor", () => {
    expect(editorHref({ id: "blog-1", pageType: "blog-post" })).toBe("/admin/cms/blog/blog-1");
    expect(editorHref({ id: "page-1", pageType: "service" })).toBe("/admin/cms/pages/page-1");
  });
});
