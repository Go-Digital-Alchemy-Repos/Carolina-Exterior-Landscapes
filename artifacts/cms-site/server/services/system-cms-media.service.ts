import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import type { InsertCmsMedia } from "@shared/schema";

const PUBLIC_DIR = path.resolve(process.cwd(), "client/public");
const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);

const MIME_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function normalizeAssetUrl(url: string) {
  const [withoutHash] = url.split("#");
  const [withoutQuery] = withoutHash.split("?");
  return withoutQuery;
}

function titleFromFilename(filename: string) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function findStaticImageFiles(dir: string): Promise<string[]> {
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findStaticImageFiles(absolutePath);
      if (!entry.isFile()) return [];
      return IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ? [absolutePath] : [];
    }),
  );

  return files.flat().sort((a, b) => a.localeCompare(b));
}

export async function buildStaticCmsMediaAssets(publicDir = PUBLIC_DIR): Promise<InsertCmsMedia[]> {
  const files = await findStaticImageFiles(publicDir);

  return Promise.all(
    files.map(async (filePath) => {
      const relativePath = path.relative(publicDir, filePath).split(path.sep).join("/");
      const filename = path.basename(filePath);
      const extension = path.extname(filename).toLowerCase();
      const stat = await fs.stat(filePath);

      return {
        filename,
        originalName: filename,
        title: titleFromFilename(filename),
        url: `/${relativePath}`,
        mimeType: MIME_TYPES[extension] ?? "application/octet-stream",
        fileSize: stat.size,
        r2Key: null,
        alt: "",
        uploadedBy: null,
      };
    }),
  );
}

export async function ensureSystemCmsMedia() {
  const { storage } = await import("../storage");
  const [existingAssets, staticAssets] = await Promise.all([
    storage.cmsMedia.getAllMedia(),
    buildStaticCmsMediaAssets(),
  ]);
  const existingUrls = new Set(existingAssets.map((asset) => normalizeAssetUrl(asset.url)));

  for (const asset of staticAssets) {
    if (existingUrls.has(normalizeAssetUrl(asset.url))) continue;
    await storage.cmsMedia.createMedia(asset);
    existingUrls.add(normalizeAssetUrl(asset.url));
  }
}
