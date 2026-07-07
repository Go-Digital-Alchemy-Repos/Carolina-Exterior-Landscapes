import { storage } from "../storage";
import type {
  CmsMediaAsset,
  CmsMediaLibraryAsset,
  CmsMediaUsageReference,
  CmsPage,
  SeoSettings,
} from "@shared/schema";

function assetKind(asset: CmsMediaAsset): "image" | "document" {
  return asset.mimeType.startsWith("image/") ? "image" : "document";
}

function buildAssetNeedles(asset: CmsMediaAsset): string[] {
  const needles = new Set<string>();
  if (asset.url) {
    needles.add(asset.url);
    try {
      const parsed = new URL(asset.url);
      needles.add(parsed.toString());
      if (parsed.pathname.startsWith("/cms/media/") || parsed.pathname.startsWith("/uploads/")) {
        needles.add(parsed.pathname);
      }
    } catch {
      // Relative URLs are valid asset references.
    }
  }
  return Array.from(needles).filter(Boolean);
}

function valueReferencesAsset(value: unknown, asset: CmsMediaAsset): boolean {
  if (!value) return false;
  if (typeof value === "string") {
    return buildAssetNeedles(asset).some((needle) => value.includes(needle));
  }
  if (Array.isArray(value)) return value.some((entry) => valueReferencesAsset(entry, asset));
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((entry) => valueReferencesAsset(entry, asset));
  }
  return false;
}

function addUsageReference(
  usageMap: Map<string, CmsMediaUsageReference[]>,
  dedupe: Set<string>,
  assetId: string,
  reference: CmsMediaUsageReference,
) {
  const dedupeKey = `${assetId}:${reference.entityType}:${reference.entityId}:${reference.field}`;
  if (dedupe.has(dedupeKey)) return;
  dedupe.add(dedupeKey);
  usageMap.set(assetId, [...(usageMap.get(assetId) ?? []), reference]);
}

function addFieldUsage<T extends { id: string }>(
  assets: CmsMediaAsset[],
  usageMap: Map<string, CmsMediaUsageReference[]>,
  dedupe: Set<string>,
  entity: T,
  entityName: string,
  path: string | undefined,
  field: string,
  fieldValue: unknown,
  isLive: boolean,
  statusLabel: string,
) {
  for (const asset of assets) {
    if (!valueReferencesAsset(fieldValue, asset)) continue;
    addUsageReference(usageMap, dedupe, asset.id, {
      entityType: "page",
      entityId: entity.id,
      entityName,
      field,
      path,
      isLive,
      statusLabel,
    });
  }
}

function pageStatusLabel(page: CmsPage) {
  return page.status === "published" ? "Published page" : `${page.status[0].toUpperCase()}${page.status.slice(1)} page`;
}

export async function buildCmsMediaLibraryAssets(
  assets: CmsMediaAsset[],
): Promise<CmsMediaLibraryAsset[]> {
  const [pages, seoSettings] = await Promise.all([
    storage.cmsPages.getAllPages(),
    storage.seoSettings.get(),
  ]);

  const usageMap = new Map<string, CmsMediaUsageReference[]>();
  const dedupe = new Set<string>();

  for (const page of pages) {
    const isLive = page.status === "published";
    const path = page.slug === "home" ? "/" : `/${page.slug}`;
    addFieldUsage(assets, usageMap, dedupe, page, page.title, path, "ogImageUrl", page.ogImageUrl, isLive, pageStatusLabel(page));
    addFieldUsage(assets, usageMap, dedupe, page, page.title, path, "content", page.content, isLive, pageStatusLabel(page));
  }

  if (seoSettings) {
    const globalSeo = seoSettings as SeoSettings;
    const seoEntity = { id: globalSeo.id };
    for (const asset of assets) {
      for (const [field, value] of Object.entries({
        defaultOgImageUrl: globalSeo.defaultOgImageUrl,
        organizationLogoUrl: globalSeo.organizationLogoUrl,
      })) {
        if (!valueReferencesAsset(value, asset)) continue;
        addUsageReference(usageMap, dedupe, asset.id, {
          entityType: "global_seo",
          entityId: seoEntity.id,
          entityName: "Global SEO",
          field,
          path: undefined,
          isLive: true,
          statusLabel: "Global setting",
        });
      }
    }
  }

  return assets.map((asset) => {
    const usageRefs = (usageMap.get(asset.id) ?? []).sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return a.entityName.localeCompare(b.entityName);
    });
    const liveUsageCount = usageRefs.filter((ref) => ref.isLive).length;
    return {
      ...asset,
      assetKind: assetKind(asset),
      usageRefs,
      usageCount: usageRefs.length,
      liveUsageCount,
      isInUse: liveUsageCount > 0,
    };
  });
}
