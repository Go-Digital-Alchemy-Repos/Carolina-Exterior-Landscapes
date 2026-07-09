import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: {
    cmsPages: { getAllPages: vi.fn() },
    seoSettings: { get: vi.fn() },
  },
}));

vi.mock("../storage", () => ({ storage: mockStorage }));

import { buildCmsMediaLibraryAssets } from "./cms-media-usage.service";

describe("buildCmsMediaLibraryAssets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.seoSettings.get.mockResolvedValue(null);
  });

  it("finds nested page references without rescanning object values for every asset", async () => {
    mockStorage.cmsPages.getAllPages.mockResolvedValue([
      {
        id: "page-1",
        slug: "home",
        title: "Home",
        status: "published",
        ogImageUrl: null,
        content: {
          blocks: [{ props: { imageUrl: "/images/landscape/waxhaw.webp" } }],
        },
      },
    ]);

    const [used, unused] = await buildCmsMediaLibraryAssets([
      {
        id: "used",
        url: "/images/landscape/waxhaw.webp",
        mimeType: "image/webp",
      },
      {
        id: "unused",
        url: "/images/landscape/other.webp",
        mimeType: "image/webp",
      },
    ] as any);

    expect(used).toMatchObject({ usageCount: 1, liveUsageCount: 1, isInUse: true });
    expect(used.usageRefs[0]).toMatchObject({ entityId: "page-1", field: "content" });
    expect(unused).toMatchObject({ usageCount: 0, liveUsageCount: 0, isInUse: false });
  });
});
