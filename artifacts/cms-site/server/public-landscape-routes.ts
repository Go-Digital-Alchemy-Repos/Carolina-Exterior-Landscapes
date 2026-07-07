const LANDSCAPE_EXACT_PATHS = new Set([
  "/",
  "/about",
  "/get-a-quote",
  "/commercial-quote",
  "/residential-lawn-maintenance",
  "/residential-landscaping",
  "/residential-hardscape",
  "/mulching-and-planting",
  "/drainage-solutions",
  "/commercial",
  "/commercial-grounds-maintenance",
  "/commercial-landscaping",
  "/commercial-hardscape",
  "/commercial-drainage",
  "/hoa-services",
  "/service-areas",
  "/blog",
  "/gallery",
  "/commercial-portfolio",
  "/faq",
  "/commercial-faq",
]);

const LANDSCAPE_PREFIXES = [
  "/service-areas/",
  "/blog/",
];

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function isLandscapePublicRoute(pathname: string) {
  const normalized = normalizePathname(pathname);
  return LANDSCAPE_EXACT_PATHS.has(normalized) || LANDSCAPE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}
