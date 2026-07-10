const RETIRED_PUBLIC_PREFIXES = [
  "/services",
  "/reviews",
  "/privacy-policy",
  "/directory",
  "/events",
  "/insights",
  "/join",
  "/recordings",
  "/newsletter",
  "/membership",
  "/memberships",
  "/subscription",
  "/subscriptions",
  "/providers",
  "/provider",
  "/therapists",
  "/therapist",
  "/applications",
  "/apply",
];

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function isRetiredPublicPath(pathname: string) {
  const path = normalizePathname(pathname);
  return RETIRED_PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
