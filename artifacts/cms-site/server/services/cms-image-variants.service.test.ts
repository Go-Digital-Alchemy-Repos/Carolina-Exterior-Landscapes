import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deleteCmsImageVariantFiles,
  generateCmsImageVariants,
  resolveBestCmsImageVariant,
  resolveBestLocalCmsImagePath,
  resolveBestR2CmsImageKey,
  storeCmsImageVariants,
} from "./cms-image-variants.service";

let tempDir: string;

async function samplePng() {
  return sharp({
    create: {
      width: 24,
      height: 16,
      channels: 3,
      background: "#6b8f3a",
    },
  }).png().toBuffer();
}

describe("cms image variants", () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cms-image-variants-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("generates high-quality webp and avif variants with dimensions", async () => {
    const variants = await generateCmsImageVariants(await samplePng(), "image/png");

    expect(variants?.webp.mimeType).toBe("image/webp");
    expect(variants?.webp.extension).toBe(".webp");
    expect(variants?.webp.width).toBe(24);
    expect(variants?.webp.height).toBe(16);
    expect(variants?.avif.mimeType).toBe("image/avif");
    expect(variants?.avif.extension).toBe(".avif");
    expect(variants?.original.mimeType).toBe("image/png");
  });

  it("stores local variants and resolves the best accepted format", async () => {
    const generated = await generateCmsImageVariants(await samplePng(), "image/png");
    expect(generated).not.toBeNull();
    const uploadSubdir = `cms-image-variants-${Date.now()}`;
    const uploadDir = path.resolve(process.cwd(), "uploads", "cms", uploadSubdir);

    const stored = await storeCmsImageVariants(generated!, {
      kind: "local",
      directory: uploadDir,
      publicBaseUrl: `/uploads/cms/${uploadSubdir}`,
      filenameBase: "front-yard",
    });

    expect(stored.url).toBe(`/uploads/cms/${uploadSubdir}/front-yard.webp`);
    expect(stored.variants.avif?.url).toBe(`/uploads/cms/${uploadSubdir}/front-yard.avif`);
    await expect(fs.stat(path.join(uploadDir, "front-yard.webp"))).resolves.toBeTruthy();
    await expect(fs.stat(path.join(uploadDir, "front-yard.avif"))).resolves.toBeTruthy();

    expect(resolveBestCmsImageVariant(stored, "image/avif,image/webp")?.mimeType).toBe("image/avif");
    expect(resolveBestCmsImageVariant(stored, "image/webp")?.mimeType).toBe("image/webp");
    expect(resolveBestCmsImageVariant(stored, "*/*")?.mimeType).toBe("image/webp");
    expect(resolveBestLocalCmsImagePath(path.join(uploadDir, "front-yard.webp"), "image/avif")?.mimeType).toBe("image/avif");
    expect(resolveBestR2CmsImageKey("cms/media/front-yard.webp", "image/avif")).toBe("cms/media/front-yard.avif");

    await deleteCmsImageVariantFiles({
      url: stored.url,
      r2Key: null,
      variants: stored.variants,
    });

    await expect(fs.stat(path.join(uploadDir, "front-yard.webp"))).rejects.toThrow();
    await expect(fs.stat(path.join(uploadDir, "front-yard.avif"))).rejects.toThrow();
    await fs.rm(uploadDir, { recursive: true, force: true });
  });
});
