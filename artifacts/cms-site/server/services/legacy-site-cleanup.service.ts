import { storage } from "../storage";
import { logger } from "../utils/logger";
import { containsLegacySiteContent } from "./legacy-site-content";
import fs from "node:fs/promises";
import path from "node:path";

async function deleteLocalUpload(url: string) {
  if (!url.startsWith("/uploads/cms/")) return;
  const uploadsRoot = path.resolve(process.cwd(), "uploads", "cms");
  const filePath = path.resolve(process.cwd(), url.slice(1));
  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) return;
  await fs.unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}

export async function removeLegacySiteContent() {
  const [pages, media, menus, sections, forms, sidebars, galleryRows, redirects] = await Promise.all([
    storage.cmsPages.getAllPages(),
    storage.cmsMedia.getAllMedia(),
    storage.cmsMenus.getAll(),
    storage.cmsSections.getAllSections(),
    storage.forms.getAll(),
    storage.cmsSidebars.getAll(),
    storage.cmsGalleries.list(),
    storage.redirects.getAll(),
  ]);

  let deleted = 0;

  for (const page of pages) {
    if (!containsLegacySiteContent(page)) continue;
    if (await storage.cmsPages.deletePage(page.id)) deleted += 1;
  }

  for (const asset of media) {
    if (!containsLegacySiteContent(asset)) continue;
    await deleteLocalUpload(asset.url);
    if (await storage.cmsMedia.deleteMedia(asset.id)) deleted += 1;
  }

  for (const menu of menus) {
    if (!containsLegacySiteContent(menu)) continue;
    if (await storage.cmsMenus.delete(menu.id)) deleted += 1;
  }

  for (const section of sections) {
    if (!containsLegacySiteContent(section)) continue;
    if (await storage.cmsSections.deleteSection(section.id)) deleted += 1;
  }

  for (const form of forms) {
    if (!containsLegacySiteContent(form)) continue;
    if (await storage.forms.delete(form.id)) deleted += 1;
  }

  for (const sidebar of sidebars) {
    if (!containsLegacySiteContent(sidebar)) continue;
    if (await storage.cmsSidebars.delete(sidebar.id)) deleted += 1;
  }

  for (const galleryRow of galleryRows) {
    const gallery = await storage.cmsGalleries.getByIdOrSlug(galleryRow.id);
    if (!containsLegacySiteContent(gallery)) continue;
    if (await storage.cmsGalleries.delete(galleryRow.id)) deleted += 1;
  }

  for (const redirect of redirects) {
    if (!containsLegacySiteContent(redirect)) continue;
    if (await storage.redirects.delete(redirect.id)) deleted += 1;
  }

  logger.cms.info("Removed legacy site content", { deleted });
  return { deleted };
}
