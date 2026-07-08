import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import type { InsertCmsMedia } from "@shared/schema";
import {
  generateCmsImageVariants,
  isCmsImageVariantCandidate,
  storeCmsImageVariants,
} from "./cms-image-variants.service";
import * as r2Service from "./r2.service";

const PUBLIC_DIR = path.resolve(process.cwd(), "client/public");
const LANDSCAPE_ASSETS_DIR = path.resolve(process.cwd(), "client/src/features/landscape-site/assets");
const LOCAL_CMS_DIR = path.resolve(process.cwd(), "uploads", "cms");
const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);
const ORIGINAL_STATIC_IMAGE_EXTENSIONS = new Set([".gif", ".jpg", ".jpeg", ".png", ".svg"]);

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

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function shouldRegenerateVariant(sourcePath: string, variantPath: string) {
  if (!(await fileExists(variantPath))) return true;
  const [sourceStat, variantStat] = await Promise.all([fs.stat(sourcePath), fs.stat(variantPath)]);
  return sourceStat.mtimeMs > variantStat.mtimeMs;
}

async function buildStaticImageVariants(filePath: string, urlPath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (!isCmsImageVariantCandidate(MIME_TYPES[extension] ?? "", filePath)) return null;

  const basePath = filePath.slice(0, -extension.length);
  const webpPath = `${basePath}.webp`;
  const avifPath = `${basePath}.avif`;
  let [sourceStat, webpStat, avifStat] = await Promise.all([
    fs.stat(filePath),
    fileExists(webpPath).then((exists) => (exists ? fs.stat(webpPath) : null)),
    fileExists(avifPath).then((exists) => (exists ? fs.stat(avifPath) : null)),
  ]);
  let generated:
    | Awaited<ReturnType<typeof generateCmsImageVariants>>
    | null = null;

  if (!webpStat || !avifStat || (await shouldRegenerateVariant(filePath, webpPath)) || (await shouldRegenerateVariant(filePath, avifPath))) {
    const sourceBuffer = await fs.readFile(filePath);
    generated = await generateCmsImageVariants(sourceBuffer, MIME_TYPES[extension] ?? "application/octet-stream");
    if (!generated) return null;

    const writes: Promise<unknown>[] = [];
    if (!webpStat || sourceStat.mtimeMs > webpStat.mtimeMs) {
      writes.push(fs.writeFile(webpPath, generated.webp.buffer));
    }
    if (!avifStat || sourceStat.mtimeMs > avifStat.mtimeMs) {
      writes.push(fs.writeFile(avifPath, generated.avif.buffer));
    }
    await Promise.all(writes);
    [webpStat, avifStat] = await Promise.all([fs.stat(webpPath), fs.stat(avifPath)]);
  }

  const urlBase = urlPath.slice(0, -path.extname(urlPath).length);
  return {
    source: {
      url: urlPath,
      key: null,
      mimeType: MIME_TYPES[extension] ?? "application/octet-stream",
      fileSize: sourceStat.size,
      width: generated?.original.width,
      height: generated?.original.height,
    },
    webp: {
      url: `${urlBase}.webp`,
      key: null,
      mimeType: "image/webp" as const,
      fileSize: webpStat!.size,
      width: generated?.webp.width,
      height: generated?.webp.height,
    },
    avif: {
      url: `${urlBase}.avif`,
      key: null,
      mimeType: "image/avif" as const,
      fileSize: avifStat!.size,
      width: generated?.avif.width,
      height: generated?.avif.height,
    },
  };
}

export async function buildStaticCmsMediaAssets(
  publicDir = PUBLIC_DIR,
  landscapeAssetsDir: string | null = LANDSCAPE_ASSETS_DIR,
): Promise<InsertCmsMedia[]> {
  const publicFiles = (await findStaticImageFiles(publicDir)).filter((filePath) =>
    ORIGINAL_STATIC_IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  );
  const landscapeFiles = landscapeAssetsDir
    ? (await findStaticImageFiles(landscapeAssetsDir)).filter((filePath) =>
        ORIGINAL_STATIC_IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
      )
    : [];

  const publicAssets = publicFiles.map((filePath) => ({
    filePath,
    urlPath: `/${path.relative(publicDir, filePath).split(path.sep).join("/")}`,
    isLandscapeAsset: false,
  }));
  const landscapeAssets = landscapeFiles.map((filePath) => ({
    filePath,
    urlPath: `/images/landscape/${path.relative(landscapeAssetsDir!, filePath).split(path.sep).join("/")}`,
    isLandscapeAsset: true,
  }));

  return Promise.all(
    [...publicAssets, ...landscapeAssets].map(async ({ filePath, urlPath, isLandscapeAsset }) => {
      const filename = path.basename(filePath);
      const extension = path.extname(filename).toLowerCase();
      const stat = await fs.stat(filePath);
      const title = titleFromFilename(filename);
      const variants = await buildStaticImageVariants(filePath, urlPath);

      return {
        filename,
        originalName: filename,
        title,
        url: urlPath,
        mimeType: MIME_TYPES[extension] ?? "application/octet-stream",
        fileSize: stat.size,
        r2Key: null,
        variants,
        alt: isLandscapeAsset ? title : "",
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
  const existingByUrl = new Map(existingAssets.map((asset) => [normalizeAssetUrl(asset.url), asset]));
  const existingUrls = new Set(existingByUrl.keys());

  for (const asset of staticAssets) {
    const normalizedUrl = normalizeAssetUrl(asset.url);
    const existingAsset = existingByUrl.get(normalizedUrl);
    if (existingAsset) {
      if (!existingAsset.variants && asset.variants) {
        await storage.cmsMedia.updateFile(existingAsset.id, {
          filename: existingAsset.filename,
          mimeType: existingAsset.mimeType,
          fileSize: existingAsset.fileSize,
          url: existingAsset.url,
          r2Key: existingAsset.r2Key,
          variants: asset.variants,
        });
      }
      continue;
    }
    await storage.cmsMedia.createMedia(asset);
    existingUrls.add(normalizedUrl);
  }

  for (const asset of existingAssets) {
    if (asset.variants) continue;
    if (!asset.mimeType || !asset.filename) continue;
    if (!isCmsImageVariantCandidate(asset.mimeType, asset.filename)) continue;

    let buffer: Buffer | null = null;
    if (asset.r2Key) {
      const downloaded = await r2Service.downloadFile(asset.r2Key);
      buffer = downloaded?.buffer ?? null;
    } else if (asset.url.startsWith("/uploads/cms/")) {
      const localPath = path.resolve(process.cwd(), asset.url.slice(1));
      if (await fileExists(localPath)) buffer = await fs.readFile(localPath);
    }

    if (!buffer) continue;

    const generated = await generateCmsImageVariants(buffer, asset.mimeType);
    if (!generated) continue;

    const extension = path.extname(asset.r2Key ?? asset.url);
    const base = (asset.r2Key ?? path.basename(asset.url)).slice(0, -extension.length);
    const stored = asset.r2Key
      ? await storeCmsImageVariants(generated, { kind: "r2", keyBase: base })
      : await storeCmsImageVariants(generated, {
          kind: "local",
          directory: LOCAL_CMS_DIR,
          publicBaseUrl: "/uploads/cms",
          filenameBase: base,
        });

    await storage.cmsMedia.updateFile(asset.id, {
      filename: path.extname(asset.filename).toLowerCase() === ".webp" ? stored.filename : asset.filename,
      mimeType: path.extname(asset.filename).toLowerCase() === ".webp" ? stored.mimeType : asset.mimeType,
      fileSize: path.extname(asset.filename).toLowerCase() === ".webp" ? stored.fileSize : asset.fileSize,
      url: path.extname(asset.url).toLowerCase() === ".webp" ? stored.url : asset.url,
      r2Key: path.extname(asset.r2Key ?? "").toLowerCase() === ".webp" ? stored.r2Key : asset.r2Key,
      variants: stored.variants,
    });
  }
}
