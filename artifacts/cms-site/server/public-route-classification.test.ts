import { describe, expect, it } from "vitest";
import { isLandscapePublicRoute } from "./public-landscape-routes";
import { isRetiredPublicPath } from "./retired-public-routes";

describe("public route classification", () => {
  it("lets the CMS contact slug render instead of retiring it", () => {
    expect(isLandscapePublicRoute("/contact")).toBe(false);
    expect(isLandscapePublicRoute("/contact/")).toBe(false);
    expect(isRetiredPublicPath("/contact")).toBe(false);
    expect(isRetiredPublicPath("/contact/")).toBe(false);
  });
});
