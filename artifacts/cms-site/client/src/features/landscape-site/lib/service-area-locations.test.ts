import { describe, expect, it } from "vitest";
import { buildServiceAreas, type CmsLandscapePage } from "./service-area-locations";

function locationPage(slug: string, data: Record<string, unknown>): CmsLandscapePage {
  return {
    slug,
    content: {
      landscape: {
        kind: "location",
        data,
      },
    },
  } as CmsLandscapePage;
}

describe("buildServiceAreas", () => {
  it("uses canonical coordinates when CMS coordinates are missing", () => {
    const areas = buildServiceAreas([
      locationPage("waxhaw-nc", { city: "Waxhaw", state: "NC" }),
    ]);

    expect(areas).toEqual([
      {
        slug: "waxhaw-nc",
        city: "Waxhaw",
        state: "NC",
        lat: 34.9246,
        lng: -80.7434,
      },
    ]);
  });

  it("prefers coordinates configured in the CMS", () => {
    const [area] = buildServiceAreas([
      locationPage("waxhaw-nc", {
        city: "Waxhaw",
        state: "NC",
        lat: 35,
        lng: -81,
      }),
    ]);

    expect(area).toMatchObject({ lat: 35, lng: -81 });
  });

  it("omits non-location and unknown pages without usable coordinates", () => {
    const areas = buildServiceAreas([
      locationPage("unknown-nc", { city: "Unknown", state: "NC" }),
      {
        slug: "service-areas",
        content: { landscape: { kind: "service-areas", data: {} } },
      },
    ]);

    expect(areas).toEqual([]);
  });
});
