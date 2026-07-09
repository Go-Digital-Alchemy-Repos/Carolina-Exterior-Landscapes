import { describe, expect, it } from "vitest";
import { getBlockDef, normalizeBlockType } from "@/features/admin/cms/builder/block-registry";
import { createFallbackBlockDef } from "@/features/admin/cms/builder/block-editor";

describe("block registry compatibility helpers", () => {
  it("keeps retained block types direct and retired aliases unavailable", () => {
    expect(normalizeBlockType("cta")).toBe("cta");
    expect(getBlockDef("cta")?.type).toBe("cta");
    expect(getBlockDef("service-area-map")).toEqual(
      expect.objectContaining({
        label: "Service Area Map",
        defaultProps: expect.objectContaining({ height: 500 }),
      }),
    );
    expect(getBlockDef("blog-feed")).toBeUndefined();
  });

  it("creates a compatibility editor definition from primitive block props", () => {
    const fallbackDef = createFallbackBlockDef("legacy-cta", {
      heading: "Contact us",
      primaryLink: "/",
      enableHoverMotion: true,
      limit: 5,
    });

    expect(fallbackDef.label).toContain("Compatibility Mode");
    expect(fallbackDef.propDefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "heading", type: "text" }),
        expect.objectContaining({ key: "primaryLink", type: "url" }),
        expect.objectContaining({ key: "enableHoverMotion", type: "boolean" }),
        expect.objectContaining({ key: "limit", type: "number" }),
      ]),
    );
  });
});
