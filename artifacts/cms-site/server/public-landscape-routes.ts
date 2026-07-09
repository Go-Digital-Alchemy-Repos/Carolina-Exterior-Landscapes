import blogData from "../client/src/features/landscape-site/content/blog.json";
import locationsData from "../client/src/features/landscape-site/content/locations.json";

const LANDSCAPE_EXACT_PATHS = new Set([
  "/",
  "/about",
  "/contact",
  "/get-a-quote",
  "/commercial-quote",
  "/residential-lawn-maintenance",
  "/residential-landscaping",
  "/residential-hardscape",
  "/residential-pressure-washing",
  "/mulching-and-planting",
  "/drainage-solutions",
  "/commercial",
  "/commercial-grounds-maintenance",
  "/commercial-landscaping",
  "/commercial-hardscape",
  "/commercial-drainage",
  "/commercial-pressure-washing",
  "/hoa-services",
  "/service-areas",
  "/blog",
  "/gallery",
  "/commercial-portfolio",
  "/faq",
  "/commercial-faq",
]);

const BLOG_POST_PATHS = new Set(
  (blogData as Array<{ slug?: string }>)
    .map((post) => post.slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => `/blog/${slug}`),
);

const SERVICE_AREA_PATHS = new Set(
  (locationsData as Array<{ slug?: string }>)
    .map((location) => location.slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => `/service-areas/${slug}`),
);

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function isLandscapePublicRoute(pathname: string) {
  const normalized = normalizePathname(pathname);
  return (
    LANDSCAPE_EXACT_PATHS.has(normalized) ||
    BLOG_POST_PATHS.has(normalized) ||
    SERVICE_AREA_PATHS.has(normalized)
  );
}
