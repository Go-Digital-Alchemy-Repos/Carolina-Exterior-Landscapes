import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error-handler";
import { storage } from "../../storage";
import * as r2Service from "../../services/r2.service";
import { paramString } from "../../utils/params";
import {
  deleteCmsImageVariantFiles,
  generateCmsImageVariants,
  isCmsImageVariantCandidate,
  storeCmsImageVariants,
} from "../../services/cms-image-variants.service";
import { buildCmsMediaLibraryAssets } from "../../services/cms-media-usage.service";
import type { CmsMediaVariant, CmsMediaVariants } from "@shared/schema";

const router = Router();

const CMS_MEDIA_MIMES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "application/pdf",
  "application/msword",
  "application/vnd.ms-word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
  "application/rtf",
  "text/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
];
const CMS_MEDIA_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".ppt", ".pptx", ".csv", ".txt", ".rtf", ".odt", ".ods", ".odp",
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const updateMediaSchema = z.object({
  originalName: z.string().trim().min(1).max(255).optional(),
  title: z.string().trim().max(255).optional(),
  alt: z.string().trim().max(255).optional(),
  caption: z.string().trim().max(500).optional(),
  description: z.string().trim().max(2000).optional(),
  seoTitle: z.string().trim().max(255).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  ogTitle: z.string().trim().max(255).optional(),
  ogDescription: z.string().trim().max(320).optional(),
});
const bulkDeleteMediaSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

const cmsUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (CMS_MEDIA_MIMES.includes(file.mimetype) || CMS_MEDIA_EXTENSIONS.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error("Accepted file types: images, PDF, Word, Excel, PowerPoint, CSV, TXT, RTF, and OpenDocument files"));
    }
  },
});

const LOCAL_CMS_DIR = path.resolve(process.cwd(), "uploads", "cms");

function ensureCmsDir() {
  if (!fs.existsSync(LOCAL_CMS_DIR)) {
    fs.mkdirSync(LOCAL_CMS_DIR, { recursive: true });
  }
}

function ensureParentDir(filePath: string) {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function stripExtension(filename: string) {
  return filename.replace(/\.[^.]+$/, "");
}

function coerceEmptyToNull(value: string | undefined) {
  if (value === undefined) return undefined;
  return value.trim() ? value.trim() : null;
}

function normalizeDisplayName(name: string, extension: string) {
  const raw = name.trim().replace(/[\\/:"*?<>|]+/g, " ").replace(/\s+/g, " ");
  const withoutExtension = stripExtension(raw) || "image";
  const normalizedExtension = extension.startsWith(".") ? extension : `.${extension}`;
  return `${withoutExtension}${normalizedExtension}`;
}

function buildUniqueDisplayName(
  baseName: string,
  extension: string,
  existingNames: Iterable<string>
) {
  const normalizedExtension = extension.startsWith(".") ? extension : `.${extension}`;
  const existing = new Set(Array.from(existingNames, (name) => name.toLowerCase()));

  let suffix = 0;
  let candidate = `${baseName}${normalizedExtension}`;
  while (existing.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${baseName}${suffix}${normalizedExtension}`;
  }

  return candidate;
}

async function deleteMediaAssetFiles(asset: { r2Key: string | null; url: string; variants?: any }) {
  await deleteCmsImageVariantFiles(asset);
}

function appServedR2Url(key: string) {
  return `/r2/${key
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

function appServedR2Variants(variants: CmsMediaVariants): CmsMediaVariants {
  return Object.fromEntries(
    Object.entries(variants).map(([key, variant]) => [
      key,
      variant?.key ? { ...variant, url: appServedR2Url(variant.key) } : variant,
    ]),
  ) as CmsMediaVariants;
}

async function normalizeMediaAssetUrls<T extends { url: string; variants?: any }>(asset: T): Promise<T> {
  const url = (await r2Service.normalizePublicUrl(asset.url)) ?? asset.url;
  if (!asset.variants) return { ...asset, url };

  const variants: Record<string, any> = {};
  for (const [key, variant] of Object.entries(asset.variants)) {
    if (!variant || typeof variant !== "object") {
      variants[key] = variant;
      continue;
    }
    const typedVariant = variant as CmsMediaVariant;
    const variantUrl = (await r2Service.normalizePublicUrl(typedVariant.url)) ?? typedVariant.url;
    variants[key] = { ...typedVariant, url: variantUrl };
  }
  return { ...asset, url, variants };
}

router.post(
  "/upload",
  cmsUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const adminId = (req as any).user?.id;
    const baseName = safeName.replace(/\.[^.]+$/, "");
    const extension = path.extname(safeName) || ".bin";
    const variants = isCmsImageVariantCandidate(req.file.mimetype, req.file.originalname)
      ? await generateCmsImageVariants(req.file.buffer, req.file.mimetype)
      : null;
    const fileExtension = variants ? ".webp" : extension;

    const existingAssets = await storage.cmsMedia.getAllMedia();
    const originalName = buildUniqueDisplayName(
      baseName,
      fileExtension,
      existingAssets.map((asset) => asset.originalName)
    );
    const fileBase = `${Date.now()}-${stripExtension(originalName)}`;

    const r2Configured = await r2Service.isConfigured();
    let storedFile: {
      filename: string;
      url: string;
      mimeType: string;
      fileSize: number;
      r2Key: string | null;
      variants?: any;
    };

    if (variants) {
      if (r2Configured) {
        const stored = await storeCmsImageVariants(variants, {
          kind: "r2",
          keyBase: `cms/media/${fileBase}`,
        });
        storedFile = {
          ...stored,
          url: appServedR2Url(stored.r2Key!),
          variants: appServedR2Variants(stored.variants),
        };
      } else {
        storedFile = await storeCmsImageVariants(variants, {
          kind: "local",
          directory: LOCAL_CMS_DIR,
          publicBaseUrl: "/uploads/cms",
          filenameBase: fileBase,
        });
      }
    } else {
      const filename = `${fileBase}${fileExtension}`;
      const r2Key = `cms/media/${filename}`;
      let publicUrl: string | null = null;

      if (r2Configured) {
        publicUrl = await r2Service.uploadFile(r2Key, req.file.buffer, req.file.mimetype);
      }

      if (!publicUrl) {
        ensureCmsDir();
        const localPath = path.join(LOCAL_CMS_DIR, filename);
        fs.writeFileSync(localPath, req.file.buffer);
        publicUrl = `/uploads/cms/${filename}`;
      } else {
        publicUrl = appServedR2Url(r2Key);
      }

      storedFile = {
        filename,
        url: publicUrl,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        r2Key: r2Configured ? r2Key : null,
        variants: null,
      };
    }

    const asset = await storage.cmsMedia.createMedia({
      filename: storedFile.filename,
      originalName,
      title: stripExtension(originalName),
      url: storedFile.url,
      mimeType: storedFile.mimeType,
      fileSize: storedFile.fileSize,
      r2Key: storedFile.r2Key,
      variants: storedFile.variants,
      alt: "",
      uploadedBy: adminId,
    });

    res.status(201).json(asset);
  })
);

router.get(
  "/media",
  asyncHandler(async (_req, res) => {
    const assets = await storage.cmsMedia.getAllMedia();
    const normalizedAssets = await Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        ...(await normalizeMediaAssetUrls(asset)),
      }))
    );
    res.json(await buildCmsMediaLibraryAssets(normalizedAssets));
  })
);

router.post(
  "/media/bulk-delete",
  asyncHandler(async (req, res) => {
    const parsed = bulkDeleteMediaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Select at least one media item to delete" });
    }

    const uniqueIds = Array.from(new Set(parsed.data.ids));
    const deletedIds: string[] = [];
    const missingIds: string[] = [];

    for (const id of uniqueIds) {
      const asset = await storage.cmsMedia.getMedia(id);
      if (!asset) {
        missingIds.push(id);
        continue;
      }

      await deleteMediaAssetFiles(asset);
      await storage.cmsMedia.deleteMedia(id);
      deletedIds.push(id);
    }

    res.json({ success: true, deletedIds, missingIds });
  })
);

router.get(
  "/media/:id/source",
  asyncHandler(async (req, res) => {
    const id = paramString(req.params.id);
    const asset = await storage.cmsMedia.getMedia(id);
    if (!asset) return res.status(404).json({ error: "Media not found" });

    let fileBuffer: Buffer | null = null;
    let contentType = asset.mimeType;

    if (asset.r2Key) {
      const downloaded = await r2Service.downloadFile(asset.r2Key);
      if (!downloaded) {
        return res.status(404).json({ error: "Unable to load media source" });
      }
      fileBuffer = downloaded.buffer;
      contentType = downloaded.contentType ?? asset.mimeType;
    } else if (asset.url.startsWith("/uploads/cms/")) {
      const localPath = path.resolve(process.cwd(), asset.url.slice(1));
      if (!fs.existsSync(localPath)) {
        return res.status(404).json({ error: "Media file not found" });
      }
      fileBuffer = fs.readFileSync(localPath);
    } else {
      return res.status(400).json({ error: "This media asset cannot be streamed for editing" });
    }

    res.setHeader("Content-Type", contentType || "application/octet-stream");
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.send(fileBuffer);
  })
);

router.patch(
  "/media/:id",
  asyncHandler(async (req, res) => {
    const id = paramString(req.params.id);
    const asset = await storage.cmsMedia.getMedia(id);
    if (!asset) return res.status(404).json({ error: "Media not found" });

    const parsed = updateMediaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid media metadata" });
    }

    const extension = path.extname(asset.filename) || path.extname(asset.originalName) || ".webp";
    const existingAssets = await storage.cmsMedia.getAllMedia();
    const existingNames = existingAssets
      .filter((item) => item.id !== id)
      .map((item) => item.originalName);

    const nextOriginalName = parsed.data.originalName
      ? buildUniqueDisplayName(
          stripExtension(normalizeDisplayName(parsed.data.originalName, extension)),
          extension,
          existingNames
        )
      : asset.originalName;

    const updated = await storage.cmsMedia.updateMetadata(id, {
      originalName: nextOriginalName,
      title: coerceEmptyToNull(parsed.data.title),
      alt: coerceEmptyToNull(parsed.data.alt),
      caption: coerceEmptyToNull(parsed.data.caption),
      description: coerceEmptyToNull(parsed.data.description),
      seoTitle: coerceEmptyToNull(parsed.data.seoTitle),
      seoDescription: coerceEmptyToNull(parsed.data.seoDescription),
      ogTitle: coerceEmptyToNull(parsed.data.ogTitle),
      ogDescription: coerceEmptyToNull(parsed.data.ogDescription),
    });

    if (!updated) return res.status(404).json({ error: "Media not found" });
    res.json(await normalizeMediaAssetUrls(updated));
  })
);

router.post(
  "/media/:id/replace",
  cmsUpload.single("file"),
  asyncHandler(async (req, res) => {
    const id = paramString(req.params.id);
    const asset = await storage.cmsMedia.getMedia(id);
    if (!asset) return res.status(404).json({ error: "Media not found" });
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!isCmsImageVariantCandidate(req.file.mimetype, req.file.originalname)) {
      return res.status(400).json({ error: "Only PNG, JPEG, or WebP images can be cropped and replaced in place" });
    }

    const variants = await generateCmsImageVariants(req.file.buffer, req.file.mimetype);
    if (!variants) {
      return res.status(400).json({ error: "Unable to optimize replacement image" });
    }

    if (asset.r2Key) {
      await deleteCmsImageVariantFiles(asset);
    } else if (asset.url.startsWith("/uploads/cms/")) {
      await deleteCmsImageVariantFiles(asset);
    } else {
      return res.status(400).json({ error: "This media asset cannot be replaced in place" });
    }

    const currentBase = stripExtension(asset.r2Key ? asset.r2Key : path.basename(asset.url));
    const stored = asset.r2Key
      ? await storeCmsImageVariants(variants, { kind: "r2", keyBase: currentBase })
      : await storeCmsImageVariants(variants, {
          kind: "local",
          directory: LOCAL_CMS_DIR,
          publicBaseUrl: "/uploads/cms",
          filenameBase: currentBase,
        });

    const nextVariants = asset.r2Key
      ? appServedR2Variants(stored.variants)
      : stored.variants;

    const updated = await storage.cmsMedia.updateFile(id, {
      filename: stored.filename,
      mimeType: stored.mimeType,
      fileSize: stored.fileSize,
      url: asset.r2Key ? appServedR2Url(stored.r2Key!) : stored.url,
      r2Key: stored.r2Key,
      variants: nextVariants,
    });

    if (!updated) return res.status(404).json({ error: "Media not found" });
    res.json(await normalizeMediaAssetUrls(updated));
  })
);

router.patch(
  "/media/:id/alt",
  asyncHandler(async (req, res) => {
    const id = paramString(req.params.id);
    const { alt } = req.body;
    if (typeof alt !== "string") {
      return res.status(400).json({ error: "alt must be a string" });
    }
    const asset = await storage.cmsMedia.updateAlt(id, alt);
    if (!asset) return res.status(404).json({ error: "Media not found" });
    res.json(await normalizeMediaAssetUrls(asset));
  })
);

router.delete(
  "/media/:id",
  asyncHandler(async (req, res) => {
    const id = paramString(req.params.id);
    const asset = await storage.cmsMedia.getMedia(id);
    if (!asset) return res.status(404).json({ error: "Media not found" });

    await deleteMediaAssetFiles(asset);

    await storage.cmsMedia.deleteMedia(id);
    res.json({ success: true });
  })
);

export default router;
