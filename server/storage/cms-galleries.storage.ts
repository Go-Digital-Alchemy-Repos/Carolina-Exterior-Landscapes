import { and, asc, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "../db";
import {
  DEFAULT_GALLERY_SETTINGS,
  cmsGalleries,
  cmsGalleryItems,
  users,
  type CmsGallery,
  type CmsGalleryItem,
  type CmsGalleryListItem,
  type CmsGalleryWithItems,
  type GallerySettings,
  type InsertCmsGallery,
  type InsertCmsGalleryItem,
} from "@shared/schema";

export type GallerySort = "updated" | "created" | "title";

export interface GalleryListFilters {
  search?: string;
  status?: string;
  sort?: GallerySort;
}

export interface GalleryMutationInput extends Omit<InsertCmsGallery, "settings"> {
  settings?: Partial<GallerySettings> | GallerySettings;
  items?: Array<Omit<InsertCmsGalleryItem, "galleryId" | "sortOrder"> & { sortOrder?: number }>;
}

export function normalizeGallerySlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s/-]+/g, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/(^[-/]+|[-/]+$)/g, "");
}

function normalizeSettings(settings: Partial<GallerySettings> | GallerySettings | undefined): GallerySettings {
  return {
    ...DEFAULT_GALLERY_SETTINGS,
    ...(settings ?? {}),
  };
}

function normalizeItems(
  galleryId: string,
  items: GalleryMutationInput["items"] = [],
): InsertCmsGalleryItem[] {
  return items
    .filter((item) => item.imageUrl?.trim())
    .map((item, index) => ({
      galleryId,
      mediaId: item.mediaId || null,
      imageUrl: item.imageUrl.trim(),
      alt: item.alt?.trim() || null,
      title: item.title?.trim() || null,
      caption: item.caption?.trim() || null,
      linkUrl: item.linkUrl?.trim() || null,
      ctaText: item.ctaText?.trim() || null,
      tags: Array.isArray(item.tags) ? item.tags : [],
      sortOrder: index,
    }));
}

async function getSortedItems(galleryId: string): Promise<CmsGalleryItem[]> {
  return db
    .select()
    .from(cmsGalleryItems)
    .where(eq(cmsGalleryItems.galleryId, galleryId))
    .orderBy(asc(cmsGalleryItems.sortOrder), asc(cmsGalleryItems.createdAt));
}

export class CmsGalleriesStorage {
  async list(filters: GalleryListFilters = {}): Promise<CmsGalleryListItem[]> {
    const conditions = [];
    if (filters.status && filters.status !== "all") {
      conditions.push(eq(cmsGalleries.status, filters.status));
    }
    if (filters.search?.trim()) {
      const search = `%${filters.search.trim()}%`;
      conditions.push(or(ilike(cmsGalleries.title, search), ilike(cmsGalleries.slug, search)));
    }

    const orderBy =
      filters.sort === "created"
        ? desc(cmsGalleries.createdAt)
        : filters.sort === "title"
          ? asc(cmsGalleries.title)
          : desc(cmsGalleries.updatedAt);

    const rows = await db
      .select({
        gallery: cmsGalleries,
        imageCount: count(cmsGalleryItems.id),
        authorName: users.email,
      })
      .from(cmsGalleries)
      .leftJoin(cmsGalleryItems, eq(cmsGalleryItems.galleryId, cmsGalleries.id))
      .leftJoin(users, eq(users.id, cmsGalleries.updatedBy))
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(cmsGalleries.id, users.email)
      .orderBy(orderBy);

    return rows.map((row) => ({
      ...row.gallery,
      imageCount: Number(row.imageCount),
      authorName: row.authorName,
    }));
  }

  async getById(id: string): Promise<CmsGallery | undefined> {
    const [gallery] = await db.select().from(cmsGalleries).where(eq(cmsGalleries.id, id));
    return gallery;
  }

  async getBySlug(slug: string): Promise<CmsGallery | undefined> {
    const [gallery] = await db.select().from(cmsGalleries).where(eq(cmsGalleries.slug, slug));
    return gallery;
  }

  async getByIdOrSlug(identifier: string): Promise<CmsGalleryWithItems | undefined> {
    const gallery = (await this.getById(identifier)) ?? (await this.getBySlug(identifier));
    if (!gallery) return undefined;
    return {
      ...gallery,
      settings: normalizeSettings(gallery.settings),
      items: await getSortedItems(gallery.id),
    };
  }

  async getPublishedByIdOrSlug(identifier: string): Promise<CmsGalleryWithItems | undefined> {
    const gallery = await this.getByIdOrSlug(identifier);
    if (!gallery || gallery.status !== "published") return undefined;
    return gallery;
  }

  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    const conditions = exceptId ? and(eq(cmsGalleries.slug, slug), ne(cmsGalleries.id, exceptId)) : eq(cmsGalleries.slug, slug);
    const [gallery] = await db.select({ id: cmsGalleries.id }).from(cmsGalleries).where(conditions).limit(1);
    return Boolean(gallery);
  }

  async create(data: GalleryMutationInput): Promise<CmsGalleryWithItems> {
    return db.transaction(async (tx) => {
      const { items: galleryItemsInput, settings, ...galleryData } = data;
      const [gallery] = await tx
        .insert(cmsGalleries)
        .values({
          ...galleryData,
          description: data.description || null,
          settings: normalizeSettings(settings),
          publishedAt: data.status === "published" ? data.publishedAt ?? new Date() : data.publishedAt ?? null,
        })
        .returning();

      const items = normalizeItems(gallery.id, galleryItemsInput);
      if (items.length > 0) {
        await tx.insert(cmsGalleryItems).values(items);
      }

      return {
        ...gallery,
        settings: normalizeSettings(gallery.settings),
        items: await tx
          .select()
          .from(cmsGalleryItems)
          .where(eq(cmsGalleryItems.galleryId, gallery.id))
          .orderBy(asc(cmsGalleryItems.sortOrder)),
      };
    });
  }

  async update(id: string, data: GalleryMutationInput): Promise<CmsGalleryWithItems | undefined> {
    return db.transaction(async (tx) => {
      const [existing] = await tx.select().from(cmsGalleries).where(eq(cmsGalleries.id, id));
      if (!existing) return undefined;

      const { items: galleryItemsInput, settings, ...galleryData } = data;
      const shouldPublish = data.status === "published";
      const [gallery] = await tx
        .update(cmsGalleries)
        .set({
          ...galleryData,
          description: data.description || null,
          settings: normalizeSettings(settings),
          publishedAt: shouldPublish ? existing.publishedAt ?? new Date() : data.status === "draft" ? null : existing.publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(cmsGalleries.id, id))
        .returning();

      await tx.delete(cmsGalleryItems).where(eq(cmsGalleryItems.galleryId, id));
      const items = normalizeItems(id, galleryItemsInput);
      if (items.length > 0) {
        await tx.insert(cmsGalleryItems).values(items);
      }

      return {
        ...gallery,
        settings: normalizeSettings(gallery.settings),
        items: await tx
          .select()
          .from(cmsGalleryItems)
          .where(eq(cmsGalleryItems.galleryId, id))
          .orderBy(asc(cmsGalleryItems.sortOrder)),
      };
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(cmsGalleries).where(eq(cmsGalleries.id, id)).returning();
    return result.length > 0;
  }

  async publish(id: string, adminId?: string): Promise<CmsGalleryWithItems | undefined> {
    const items = await getSortedItems(id);
    if (items.length === 0) return undefined;
    const [gallery] = await db
      .update(cmsGalleries)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date(), updatedBy: adminId })
      .where(eq(cmsGalleries.id, id))
      .returning();
    if (!gallery) return undefined;
    return { ...gallery, settings: normalizeSettings(gallery.settings), items };
  }

  async unpublish(id: string, adminId?: string): Promise<CmsGalleryWithItems | undefined> {
    const [gallery] = await db
      .update(cmsGalleries)
      .set({ status: "draft", publishedAt: null, updatedAt: new Date(), updatedBy: adminId })
      .where(eq(cmsGalleries.id, id))
      .returning();
    if (!gallery) return undefined;
    return { ...gallery, settings: normalizeSettings(gallery.settings), items: await getSortedItems(id) };
  }

  async uniqueCopySlug(slug: string): Promise<string> {
    const base = `${slug}-copy`;
    let candidate = base;
    let index = 2;
    while (await this.slugExists(candidate)) {
      candidate = `${base}-${index}`;
      index += 1;
    }
    return candidate;
  }

  async duplicate(id: string, adminId?: string): Promise<CmsGalleryWithItems | undefined> {
    const source = await this.getByIdOrSlug(id);
    if (!source) return undefined;
    const slug = await this.uniqueCopySlug(source.slug);
    return this.create({
      title: `${source.title} Copy`,
      slug,
      description: source.description,
      status: "draft",
      layout: source.layout,
      settings: source.settings,
      createdBy: adminId,
      updatedBy: adminId,
      publishedAt: null,
      items: source.items.map((item) => ({
        mediaId: item.mediaId,
        imageUrl: item.imageUrl,
        alt: item.alt,
        title: item.title,
        caption: item.caption,
        linkUrl: item.linkUrl,
        ctaText: item.ctaText,
        tags: item.tags ?? [],
      })),
    });
  }
}
