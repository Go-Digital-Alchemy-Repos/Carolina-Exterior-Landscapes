import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { CmsMediaAsset, CmsMediaVariant, CmsMediaVariants } from "@shared/schema";
import * as r2Service from "./r2.service";
import { logger } from "../utils/logger";

const CMS_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const CMS_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export type GeneratedCmsImageVariant = {
  buffer: Buffer;
  mimeType: "image/webp" | "image/avif";
  extension: ".webp" | ".avif";
  fileSize: number;
  width?: number;
  height?: number;
};

export type GeneratedCmsImageVariants = {
  source: GeneratedCmsImageVariant & { mimeType: "image/webp"; extension: ".webp" };
  webp: GeneratedCmsImageVariant & { mimeType: "image/webp"; extension: ".webp" };
  avif: GeneratedCmsImageVariant & { mimeType: "image/avif"; extension: ".avif" };
  original: {
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
  };
};

export type StoredCmsImageVariants = {
  filename: string;
  url: string;
  mimeType: "image/webp";
  fileSize: number;
  r2Key: string | null;
  variants: CmsMediaVariants;
};

type LocalVariantDestination = {
  kind: "local";
  directory: string;
  publicBaseUrl: string;
  filenameBase: string;
};

type R2VariantDestination = {
  kind: "r2";
  keyBase: string;
};

export type CmsImageVariantDestination = LocalVariantDestination | R2VariantDestination;

export function isCmsImageVariantCandidate(mimeType: string, filename?: string) {
  if (CMS_IMAGE_MIMES.has(mimeType)) return true;
  if (!filename) return false;
  return CMS_IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

function ensureDirectory(directory: string) {
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
}

function normalizePublicBaseUrl(publicBaseUrl: string) {
  return publicBaseUrl.replace(/\/+$/, "");
}

function appServedR2Url(key: string) {
  return `/r2/${key
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

function variantMetadata(variant: GeneratedCmsImageVariant, url: string, key: string | null): CmsMediaVariant {
  return {
    url,
    key,
    mimeType: variant.mimeType,
    fileSize: variant.fileSize,
    width: variant.width,
    height: variant.height,
  };
}

async function getBufferDimensions(buffer: Buffer) {
  const metadata = await sharp(buffer, { failOn: "none" }).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
  };
}

export async function generateCmsImageVariants(
  buffer: Buffer,
  mimeType: string,
): Promise<GeneratedCmsImageVariants | null> {
  if (!isCmsImageVariantCandidate(mimeType)) return null;

  try {
    const basePipeline = sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      });

    const [originalMetadata, webpBuffer, avifBuffer] = await Promise.all([
      sharp(buffer, { failOn: "none" }).metadata(),
      basePipeline.clone().webp({ quality: 82, effort: 5 }).toBuffer(),
      basePipeline.clone().avif({ quality: 58, effort: 6 }).toBuffer(),
    ]);

    const [webpDimensions, avifDimensions] = await Promise.all([
      getBufferDimensions(webpBuffer),
      getBufferDimensions(avifBuffer),
    ]);

    const webp: GeneratedCmsImageVariant & { mimeType: "image/webp"; extension: ".webp" } = {
      buffer: webpBuffer,
      mimeType: "image/webp",
      extension: ".webp",
      fileSize: webpBuffer.length,
      ...webpDimensions,
    };
    const avif: GeneratedCmsImageVariant & { mimeType: "image/avif"; extension: ".avif" } = {
      buffer: avifBuffer,
      mimeType: "image/avif",
      extension: ".avif",
      fileSize: avifBuffer.length,
      ...avifDimensions,
    };

    logger.app.info("CMS image variants generated", {
      originalKb: Math.round(buffer.length / 1024),
      webpKb: Math.round(webp.fileSize / 1024),
      avifKb: Math.round(avif.fileSize / 1024),
    });

    return {
      source: webp,
      webp,
      avif,
      original: {
        fileSize: buffer.length,
        mimeType,
        width: originalMetadata.width,
        height: originalMetadata.height,
      },
    };
  } catch (error) {
    logger.app.warn("CMS image variant generation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function storeCmsImageVariants(
  generated: GeneratedCmsImageVariants,
  destination: CmsImageVariantDestination,
): Promise<StoredCmsImageVariants> {
  if (destination.kind === "local") {
    ensureDirectory(destination.directory);
    const filename = `${destination.filenameBase}.webp`;
    const avifFilename = `${destination.filenameBase}.avif`;
    const webpPath = path.join(destination.directory, filename);
    const avifPath = path.join(destination.directory, avifFilename);

    fs.writeFileSync(webpPath, generated.webp.buffer);
    fs.writeFileSync(avifPath, generated.avif.buffer);

    const publicBaseUrl = normalizePublicBaseUrl(destination.publicBaseUrl);
    const webpUrl = `${publicBaseUrl}/${filename}`;
    const avifUrl = `${publicBaseUrl}/${avifFilename}`;
    const source = variantMetadata(generated.source, webpUrl, null);
    const webp = variantMetadata(generated.webp, webpUrl, null) as CmsMediaVariants["webp"];
    const avif = variantMetadata(generated.avif, avifUrl, null) as CmsMediaVariants["avif"];

    return {
      filename,
      url: webpUrl,
      mimeType: "image/webp",
      fileSize: generated.webp.fileSize,
      r2Key: null,
      variants: { source, webp, avif },
    };
  }

  const webpKey = `${destination.keyBase}.webp`;
  const avifKey = `${destination.keyBase}.avif`;
  const [uploadedWebpUrl, uploadedAvifUrl] = await Promise.all([
    r2Service.uploadFile(webpKey, generated.webp.buffer, generated.webp.mimeType),
    r2Service.uploadFile(avifKey, generated.avif.buffer, generated.avif.mimeType),
  ]);

  if (!uploadedWebpUrl || !uploadedAvifUrl) {
    throw new Error("Failed to upload CMS image variants");
  }

  const webpUrl = appServedR2Url(webpKey);
  const avifUrl = appServedR2Url(avifKey);
  const source = variantMetadata(generated.source, webpUrl, webpKey);
  const webp = variantMetadata(generated.webp, webpUrl, webpKey) as CmsMediaVariants["webp"];
  const avif = variantMetadata(generated.avif, avifUrl, avifKey) as CmsMediaVariants["avif"];

  return {
    filename: path.basename(webpKey),
    url: webpUrl,
    mimeType: "image/webp",
    fileSize: generated.webp.fileSize,
    r2Key: webpKey,
    variants: { source, webp, avif },
  };
}

function acceptsFormat(acceptHeader: string | undefined, mimeType: string) {
  if (!acceptHeader) return false;
  return acceptHeader.includes(mimeType);
}

export function resolveBestCmsImageVariant(
  assetOrVariants: Pick<CmsMediaAsset, "url" | "r2Key" | "mimeType" | "fileSize" | "variants"> | CmsMediaVariants,
  acceptHeader: string | undefined,
): CmsMediaVariant | null {
  const variants = "variants" in assetOrVariants ? assetOrVariants.variants : assetOrVariants;
  if (!variants) return null;

  if (acceptsFormat(acceptHeader, "image/avif") && variants.avif) return variants.avif;
  if (acceptsFormat(acceptHeader, "image/webp") && variants.webp) return variants.webp;
  return variants.source ?? variants.webp ?? null;
}

export function resolveBestLocalCmsImagePath(requestedPath: string, acceptHeader: string | undefined) {
  const extension = path.extname(requestedPath).toLowerCase();
  if (![".webp", ".png", ".jpg", ".jpeg"].includes(extension)) return null;

  const basePath = requestedPath.slice(0, -extension.length);
  for (const format of ["avif", "webp"] as const) {
    if (!acceptsFormat(acceptHeader, `image/${format}`)) continue;
    const variantPath = `${basePath}.${format}`;
    if (!fs.existsSync(variantPath)) continue;
    return {
      filePath: variantPath,
      mimeType: `image/${format}`,
    };
  }

  return null;
}

export function resolveBestR2CmsImageKey(requestedKey: string, acceptHeader: string | undefined) {
  const extension = path.extname(requestedKey).toLowerCase();
  if (![".webp", ".png", ".jpg", ".jpeg"].includes(extension)) return requestedKey;
  const baseKey = requestedKey.slice(0, -extension.length);
  if (acceptsFormat(acceptHeader, "image/avif")) return `${baseKey}.avif`;
  if (acceptsFormat(acceptHeader, "image/webp")) return `${baseKey}.webp`;
  return requestedKey;
}

export async function deleteCmsImageVariantFiles(asset: Pick<CmsMediaAsset, "url" | "r2Key"> & { variants?: CmsMediaVariants | null }) {
  const keys = new Set<string>();
  const localUrls = new Set<string>();

  if (asset.r2Key) keys.add(asset.r2Key);
  if (asset.url.startsWith("/uploads/cms/")) localUrls.add(asset.url);

  for (const variant of Object.values(asset.variants ?? {})) {
    if (!variant) continue;
    if (variant.key) keys.add(variant.key);
    if (variant.url?.startsWith("/uploads/cms/")) localUrls.add(variant.url);
  }

  await Promise.all(Array.from(keys, (key) => r2Service.deleteFile(key)));

  for (const url of localUrls) {
    const localPath = path.resolve(process.cwd(), url.slice(1));
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }
}
