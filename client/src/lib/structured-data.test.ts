import { describe, expect, it } from "vitest";
import { buildOrganizationLd } from "./structured-data";
import type { SeoSettings } from "@shared/schema";

describe("buildOrganizationLd", () => {
  it("uses the canonical landscape logo for LocalBusiness schema", () => {
    const schema = buildOrganizationLd({
      siteName: "Carolina Exterior Landscapes",
      organizationName: "Carolina Exterior Landscapes",
      siteUrl: "https://carolinaexteriorlandscapes.com",
      organizationLogoUrl: "/images/logo-full.png",
      defaultOgImageUrl: "/images/other-og.png",
    } as SeoSettings);

    expect(schema?.image).toBe("https://carolinaexteriorlandscapes.com/images/logo-icon.png");
    expect((schema?.logo as { url?: string } | undefined)?.url).toBe("https://carolinaexteriorlandscapes.com/images/logo-icon.png");
  });
});
