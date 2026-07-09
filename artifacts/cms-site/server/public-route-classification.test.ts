import { describe, expect, it } from "vitest";
import { isLandscapePublicRoute } from "./public-landscape-routes";
import { isRetiredPublicPath } from "./retired-public-routes";

describe("public route classification", () => {
  it("serves the landscape contact page instead of retiring it", () => {
    expect(isLandscapePublicRoute("/contact")).toBe(true);
    expect(isLandscapePublicRoute("/contact/")).toBe(true);
    expect(isRetiredPublicPath("/contact")).toBe(false);
    expect(isRetiredPublicPath("/contact/")).toBe(false);
  });
});
