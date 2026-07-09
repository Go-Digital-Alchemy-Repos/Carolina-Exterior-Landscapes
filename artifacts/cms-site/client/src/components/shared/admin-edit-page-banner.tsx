import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Edit3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AdminPermission } from "@shared/types";
import type { CmsPage } from "@shared/schema";

export function slugFromPublicPath(pathname: string) {
  const cleanPath = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (cleanPath === "/") return "home";

  const parts = cleanPath.split("/").filter(Boolean);
  if (parts[0] === "blog" && parts[1]) return parts[1];
  if (parts[0] === "service-areas" && parts[1]) return parts[1];
  if (parts.length === 1) return parts[0];
  return "";
}

export function isPublicEditablePath(pathname: string) {
  return !(
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/preview") ||
    pathname.startsWith("/forms") ||
    pathname.startsWith("/api")
  );
}

export function editorHref(page: Pick<CmsPage, "id" | "pageType">) {
  if (page.pageType === "blog-post") return `/admin/cms/blog/${page.id}`;
  return `/admin/cms/pages/${page.id}`;
}

export function AdminEditPageBanner() {
  const [location] = useLocation();
  const { user, isLoading, hasAdminPermission } = useAuth();
  const pathname = location.split(/[?#]/)[0] || "/";
  const slug = slugFromPublicPath(pathname);
  const canEditContent = Boolean(user) && (user?.role === "admin" || hasAdminPermission(AdminPermission.CONTENT));

  const { data: page } = useQuery<CmsPage | null>({
    queryKey: ["/api/cms/pages/by-slug", slug, "admin-edit-banner"],
    queryFn: async () => {
      const res = await fetch(`/api/cms/pages/by-slug/${encodeURIComponent(slug)}`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Unable to resolve CMS page for ${slug}`);
      return res.json() as Promise<CmsPage>;
    },
    enabled: !isLoading && canEditContent && isPublicEditablePath(pathname) && Boolean(slug),
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading || !canEditContent || !isPublicEditablePath(pathname) || !page) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[10060] border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin Editing</p>
          <p className="truncate text-sm font-semibold text-slate-900">{page.title}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm" variant="outline">
            <a href={pathname || "/"} target="_blank" rel="noopener noreferrer">
              View Page
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
          <Button asChild size="sm" className="shadow-sm">
            <Link href={editorHref(page)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Page
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
