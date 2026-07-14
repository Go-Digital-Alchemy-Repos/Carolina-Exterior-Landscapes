import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { cmsMedia } from "./cms-media";
import {
  DEFAULT_GALLERY_SETTINGS,
  GALLERY_LAYOUTS,
  GALLERY_STATUSES,
  type GalleryLayout,
  type GallerySettings,
  type GalleryStatus,
} from "../gallery-settings";

export {
  DEFAULT_GALLERY_SETTINGS,
  GALLERY_LAYOUTS,
  GALLERY_STATUSES,
  type GalleryLayout,
  type GallerySettings,
  type GalleryStatus,
} from "../gallery-settings";

export const gallerySettingsSchema = z.object({
  columnsDesktop: z.number().int().min(1).max(6).default(3),
  columnsTablet: z.number().int().min(1).max(4).default(2),
  columnsMobile: z.number().int().min(1).max(2).default(1),
  spacing: z.enum(["none", "sm", "md", "lg"]).default("md"),
  imageRatio: z.enum(["auto", "1/1", "4/3", "3/2", "16/9"]).default("4/3"),
  cropMode: z.enum(["cover", "contain"]).default("cover"),
  borderRadius: z.enum(["none", "sm", "md", "lg"]).default("md"),
  transitionEffect: z.enum(["none", "fade", "slide", "zoom"]).default("none"),
  arrowIconColor: z.string().default("#ffffff"),
  arrowBackgroundColor: z.string().default("#6b7280"),
  showTitle: z.boolean().default(true),
  showCaptions: z.boolean().default(true),
  captionPosition: z.enum(["below", "overlay"]).default("below"),
  lightbox: z.boolean().default(true),
  hoverEffect: z.enum(["none", "zoom", "fade"]).default("zoom"),
  maxImages: z.number().int().min(0).max(200).default(0),
  customClassName: z.string().max(120).default(""),
});

export const cmsGalleries = pgTable("cms_galleries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"),
  layout: text("layout").notNull().default("grid"),
  settings: jsonb("settings").$type<GallerySettings>().default(DEFAULT_GALLERY_SETTINGS).notNull(),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_cms_galleries_slug").on(table.slug),
  index("idx_cms_galleries_status").on(table.status),
  index("idx_cms_galleries_updated_at").on(table.updatedAt),
]);

export const cmsGalleryItems = pgTable("cms_gallery_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  galleryId: varchar("gallery_id").notNull().references(() => cmsGalleries.id, { onDelete: "cascade" }),
  mediaId: varchar("media_id").references(() => cmsMedia.id, { onDelete: "set null" }),
  imageUrl: text("image_url").notNull(),
  alt: text("alt"),
  title: text("title"),
  caption: text("caption"),
  linkUrl: text("link_url"),
  ctaText: text("cta_text"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_cms_gallery_items_gallery_id").on(table.galleryId),
  index("idx_cms_gallery_items_media_id").on(table.mediaId),
  index("idx_cms_gallery_items_sort_order").on(table.sortOrder),
]);

export const insertCmsGallerySchema = createInsertSchema(cmsGalleries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCmsGalleryItemSchema = createInsertSchema(cmsGalleryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CmsGallery = typeof cmsGalleries.$inferSelect;
export type CmsGalleryItem = typeof cmsGalleryItems.$inferSelect;
export type InsertCmsGallery = z.infer<typeof insertCmsGallerySchema>;
export type InsertCmsGalleryItem = z.infer<typeof insertCmsGalleryItemSchema>;

export interface CmsGalleryWithItems extends CmsGallery {
  items: CmsGalleryItem[];
}

export interface CmsGalleryListItem extends CmsGallery {
  imageCount: number;
  authorName?: string | null;
}
