import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockStorage } = vi.hoisted(() => {
  const mockStorage = {
    cmsMedia: {
      getAllMedia: vi.fn(),
      createMedia: vi.fn(),
      updateFile: vi.fn(),
    },
  };
  return { mockStorage };
});

vi.mock("../storage", () => ({
  storage: mockStorage,
}));

import { buildStaticCmsMediaAssets, ensureSystemCmsMedia } from "./system-cms-media.service";

let tempDir: string;

describe("buildStaticCmsMediaAssets", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cms-media-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("builds media rows from nested static image files", async () => {
    await fs.mkdir(path.join(tempDir, "images", "nested"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "images", "cca-hero-test.png"),
      Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lJb9WQAAAABJRU5ErkJggg==", "base64"),
    );
    await fs.writeFile(path.join(tempDir, "images", "nested", "logo.svg"), "<svg />");
    await fs.writeFile(path.join(tempDir, "robots.txt"), "User-agent: *");

    const assets = await buildStaticCmsMediaAssets(tempDir, null);

    expect(assets).toEqual([
      expect.objectContaining({
        filename: "cca-hero-test.png",
        originalName: "cca-hero-test.png",
        title: "Cca Hero Test",
        url: "/images/cca-hero-test.png",
        mimeType: "image/png",
        r2Key: null,
        variants: expect.objectContaining({
          source: expect.objectContaining({ url: "/images/cca-hero-test.png" }),
          webp: expect.objectContaining({ url: "/images/cca-hero-test.webp", mimeType: "image/webp" }),
          avif: expect.objectContaining({ url: "/images/cca-hero-test.avif", mimeType: "image/avif" }),
        }),
      }),
      expect.objectContaining({
        filename: "logo.svg",
        url: "/images/nested/logo.svg",
        mimeType: "image/svg+xml",
        fileSize: 7,
      }),
    ]);
  });
});

describe("ensureSystemCmsMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates missing static media records without duplicating cache-busted existing URLs", async () => {
    mockStorage.cmsMedia.getAllMedia.mockResolvedValue([
      { url: "/images/cca-logo-color.svg?v=20260626" },
    ]);

    await ensureSystemCmsMedia();

    const createdUrls = mockStorage.cmsMedia.createMedia.mock.calls.map(([asset]) => asset.url);
    expect(createdUrls).not.toContain("/images/cca-logo-color.svg");
    expect(createdUrls).not.toContain("/images/cca-hero-homepage.webp");
    expect(createdUrls).toContain("/favicon.png");
    expect(createdUrls).toContain("/images/landscape/hero-home.png");
  });
});
