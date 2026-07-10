import { describe, expect, it } from "vitest";
import { MENU_LOCATIONS, MENU_LOCATION_LABELS, PUBLIC_MENU_LOCATIONS } from "./cms-menus";

describe("CMS menu locations", () => {
  it("supports a dedicated public mobile navigation location", () => {
    expect(MENU_LOCATIONS).toContain("mobile_navigation");
    expect(PUBLIC_MENU_LOCATIONS).toContain("mobile_navigation");
    expect(MENU_LOCATION_LABELS.mobile_navigation).toBe("Mobile Navigation");
  });
});
