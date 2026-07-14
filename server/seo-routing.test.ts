import { describe, expect, it } from "vitest";
import { getCanonicalPublicRedirect, normalizePublicPath } from "./seo-routing";

describe("public SEO route normalization", () => {
  it("removes trailing slashes from non-root URLs", () => {
    expect(normalizePublicPath("/about/")).toBe("/about");
    expect(getCanonicalPublicRedirect("/about/")).toBe("/about");
    expect(getCanonicalPublicRedirect("/")).toBeNull();
  });

  it("redirects legacy location and blog paths to canonical directories", () => {
    expect(getCanonicalPublicRedirect("/waxhaw-nc/")).toBe("/service-areas/waxhaw-nc");
    expect(getCanonicalPublicRedirect("/tall-fescue-lawn-care-guide-for-union-county-nc-homeowners/"))
      .toBe("/blog/tall-fescue-lawn-care-guide-for-union-county-nc-homeowners");
  });
});
