import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error-handler";
import { storage } from "../../storage";
import { paramString } from "../../utils/params";
import {
  DEFAULT_GALLERY_SETTINGS,
  GALLERY_LAYOUTS,
  GALLERY_STATUSES,
  gallerySettingsSchema,
} from "@shared/schema";
import { normalizeGallerySlug } from "../../storage/cms-galleries.storage";

const router = Router();

const galleryItemInputSchema = z.object({
  id: z.string().optional(),
  mediaId: z.string().nullable().optional(),
  imageUrl: z.string().trim().min(1, "Image URL is required"),
  alt: z.string().nullable().optional().default(""),
  title: z.string().nullable().optional().default(""),
  caption: z.string().nullable().optional().default(""),
  linkUrl: z.string().nullable().optional().default(""),
  ctaText: z.string().nullable().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  sortOrder: z.number().int().optional(),
});

const galleryInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().min(1, "Slug is required"),
  description: z.string().nullable().optional().default(""),
  status: z.enum(GALLERY_STATUSES).default("draft"),
  layout: z.enum(GALLERY_LAYOUTS).default("grid"),
  settings: gallerySettingsSchema.partial().optional().default(DEFAULT_GALLERY_SETTINGS),
  items: z.array(galleryItemInputSchema).optional().default([]),
});

function validatePublishable(status: string, imageCount: number) {
  return status !== "published" || imageCount > 0;
}

async function resolveGallery(identifier: string) {
  return storage.cmsGalleries.getByIdOrSlug(identifier);
}

router.get(
  "/galleries",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const status = typeof req.query.status === "string" ? req.query.status : "all";
    const sort = req.query.sort === "created" || req.query.sort === "title" ? req.query.sort : "updated";
    res.json(await storage.cmsGalleries.list({ search, status, sort }));
  }),
);

router.post(
  "/galleries",
  asyncHandler(async (req, res) => {
    const parsed = galleryInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid gallery" });
    }

    const data = parsed.data;
    const slug = normalizeGallerySlug(data.slug || data.title);
    if (!slug) return res.status(400).json({ error: "Slug is required" });
    if (await storage.cmsGalleries.slugExists(slug)) {
      return res.status(409).json({ error: "A gallery with this slug already exists" });
    }
    if (!validatePublishable(data.status, data.items.length)) {
      return res.status(400).json({ error: "Add at least one image before publishing this gallery" });
    }

    const adminId = req.user?.id;
    const gallery = await storage.cmsGalleries.create({
      ...data,
      slug,
      createdBy: adminId,
      updatedBy: adminId,
      publishedAt: data.status === "published" ? new Date() : null,
    });
    res.status(201).json(gallery);
  }),
);

router.get(
  "/galleries/:id",
  asyncHandler(async (req, res) => {
    const gallery = await resolveGallery(paramString(req.params.id));
    if (!gallery) return res.status(404).json({ error: "Gallery not found" });
    res.json(gallery);
  }),
);

router.put(
  "/galleries/:id",
  asyncHandler(async (req, res) => {
    const existing = await resolveGallery(paramString(req.params.id));
    if (!existing) return res.status(404).json({ error: "Gallery not found" });

    const parsed = galleryInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid gallery" });
    }

    const data = parsed.data;
    const slug = normalizeGallerySlug(data.slug || data.title);
    if (!slug) return res.status(400).json({ error: "Slug is required" });
    if (await storage.cmsGalleries.slugExists(slug, existing.id)) {
      return res.status(409).json({ error: "A gallery with this slug already exists" });
    }
    if (!validatePublishable(data.status, data.items.length)) {
      return res.status(400).json({ error: "Add at least one image before publishing this gallery" });
    }

    const gallery = await storage.cmsGalleries.update(existing.id, {
      ...data,
      slug,
      createdBy: existing.createdBy,
      updatedBy: req.user?.id,
    });
    res.json(gallery);
  }),
);

router.delete(
  "/galleries/:id",
  asyncHandler(async (req, res) => {
    const existing = await resolveGallery(paramString(req.params.id));
    if (!existing) return res.status(404).json({ error: "Gallery not found" });
    await storage.cmsGalleries.delete(existing.id);
    res.json({ success: true });
  }),
);

router.post(
  "/galleries/:id/duplicate",
  asyncHandler(async (req, res) => {
    const existing = await resolveGallery(paramString(req.params.id));
    if (!existing) return res.status(404).json({ error: "Gallery not found" });
    const gallery = await storage.cmsGalleries.duplicate(existing.id, req.user?.id);
    res.status(201).json(gallery);
  }),
);

router.post(
  "/galleries/:id/publish",
  asyncHandler(async (req, res) => {
    const existing = await resolveGallery(paramString(req.params.id));
    if (!existing) return res.status(404).json({ error: "Gallery not found" });
    if (existing.items.length === 0) {
      return res.status(400).json({ error: "Add at least one image before publishing this gallery" });
    }
    const gallery = await storage.cmsGalleries.publish(existing.id, req.user?.id);
    res.json(gallery);
  }),
);

router.post(
  "/galleries/:id/unpublish",
  asyncHandler(async (req, res) => {
    const existing = await resolveGallery(paramString(req.params.id));
    if (!existing) return res.status(404).json({ error: "Gallery not found" });
    const gallery = await storage.cmsGalleries.unpublish(existing.id, req.user?.id);
    res.json(gallery);
  }),
);

export default router;
