import blogData from "../client/src/features/landscape-site/content/blog.json";
import locationsData from "../client/src/features/landscape-site/content/locations.json";

export const CANONICAL_SITE_HOST = "carolinaexteriorlandscapes.com";

const LEGACY_PUBLIC_PATH_REDIRECTS = new Map<string, string>([
  ...(locationsData as Array<{ slug: string }>).map(
    ({ slug }) => [`/${slug}`, `/service-areas/${slug}`] as const,
  ),
  ...(blogData as Array<{ slug: string }>).map(
    ({ slug }) => [`/${slug}`, `/blog/${slug}`] as const,
  ),
]);

export function normalizePublicPath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function getCanonicalPublicRedirect(pathname: string): string | null {
  const normalized = normalizePublicPath(pathname);
  const legacyTarget = LEGACY_PUBLIC_PATH_REDIRECTS.get(normalized);
  if (legacyTarget) return legacyTarget;
  if (pathname !== normalized) return normalized;
  return null;
}
