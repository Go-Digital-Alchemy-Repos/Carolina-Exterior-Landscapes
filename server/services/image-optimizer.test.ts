import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { AVATAR_OPTIONS, optimizeImage } from "./image-optimizer";

describe("avatar image resource limits", () => {
  it("accepts and normalizes a normal avatar", async () => {
    const input = await sharp({
      create: { width: 100, height: 100, channels: 3, background: "blue" },
    })
      .png()
      .toBuffer();
    const result = await optimizeImage(input, "image/png", AVATAR_OPTIONS);
    expect(result.mimeType).toBe("image/webp");
    expect(result.optimizedSize).toBeGreaterThan(0);
  });

  it("rejects a compressed image whose decoded pixel count exceeds the avatar budget", async () => {
    const input = await sharp({
      create: { width: 2_100, height: 2_100, channels: 3, background: "white" },
    })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await expect(optimizeImage(input, "image/png", AVATAR_OPTIONS)).rejects.toThrow(
      "Invalid or unsupported image",
    );
  });
});
