import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AdminPermission } from "@shared/types";
import type { CmsPage } from "@shared/schema";

const FRONTEND_EXCLUDED_PREFIXES = ["/admin", "/auth", "/setup", "/preview", "/forms"];

function cleanPathname(location: string) {
  return location.split(/[?#]/)[0]?.replace(/\/+$/, "") || "/";
}

export function getCmsSlugForPublicPath(location: string) {
  const pathname = cleanPathname(location);
  if (FRONTEND_EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }
  if (pathname === "/") return "home";

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "home";
  if ((segments[0] === "blog" || segments[0] === "service-areas") && segments[1]) {
    return segments[1];
  }
  return segments[0] ?? null;
}

function getEditorHref(page: CmsPage) {
  if (page.pageType === "blog-post") {
    return `/admin/cms/blog/${page.id}`;
  }
  return `/admin/cms/pages/${page.id}`;
}

export function PublicAdminEditButton() {
  const [location] = useLocation();
  const { isLoading, hasAdminPermission } = useAuth();
  const slug = useMemo(() => getCmsSlugForPublicPath(location), [location]);
  const canEditContent = hasAdminPermission(AdminPermission.CONTENT);

  const { data: page } = useQuery<CmsPage | null>({
    queryKey: ["/api/cms/pages/by-slug", slug, "admin-edit-shortcut"],
    enabled: Boolean(slug && canEditContent && !isLoading),
    queryFn: async () => {
      const res = await fetch(`/api/cms/pages/by-slug/${encodeURIComponent(slug ?? "")}`, {
        credentials: "include",
      });
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new Error(`CMS page lookup failed: ${res.status}`);
      }
      return (await res.json()) as CmsPage;
    },
    retry: false,
    staleTime: 30_000,
  });

  if (!slug || !canEditContent || !page) return null;

  return (
    <Button
      asChild
      size="sm"
      className="fixed bottom-4 left-4 z-[70] rounded-full border border-white/20 bg-slate-950 px-3 py-2 text-white shadow-xl shadow-slate-950/20 hover:bg-slate-800 md:bottom-5 md:left-5"
    >
      <Link href={getEditorHref(page)} aria-label={`Edit ${page.title} in CMS`}>
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Edit</span>
      </Link>
    </Button>
  );
}
