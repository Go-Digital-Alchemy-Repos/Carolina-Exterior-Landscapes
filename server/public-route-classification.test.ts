import { describe, expect, it } from "vitest";
import { isLandscapePublicRoute } from "./public-landscape-routes";
import { isRetiredPublicPath } from "./retired-public-routes";

describe("public route classification", () => {
  it("serves the contact URL through the app shell instead of retiring it", () => {
    expect(isLandscapePublicRoute("/contact")).toBe(true);
    expect(isLandscapePublicRoute("/contact/")).toBe(true);
    expect(isRetiredPublicPath("/contact")).toBe(false);
    expect(isRetiredPublicPath("/contact/")).toBe(false);
  });

  it("only treats known dynamic landscape URLs as public routes", () => {
    expect(isLandscapePublicRoute("/blog/what-s-included-in-a-year-round-lawn-maintenance-contract-in-nc")).toBe(true);
    expect(isLandscapePublicRoute("/service-areas/waxhaw-nc")).toBe(true);

    expect(isLandscapePublicRoute("/blog/not-a-real-post")).toBe(false);
    expect(isLandscapePublicRoute("/service-areas/not-a-real-city")).toBe(false);
  });

  it("serves pressure-washing service pages as public routes", () => {
    expect(isLandscapePublicRoute("/residential-pressure-washing")).toBe(true);
    expect(isLandscapePublicRoute("/commercial-pressure-washing/")).toBe(true);
    expect(isRetiredPublicPath("/residential-pressure-washing")).toBe(false);
    expect(isRetiredPublicPath("/commercial-pressure-washing/")).toBe(false);
  });
});
