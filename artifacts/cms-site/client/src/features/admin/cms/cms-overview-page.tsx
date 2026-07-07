import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Blocks, FileCode, Globe, Image, Plus, SearchIcon, SquarePen } from "lucide-react";
import { AdminSidebar } from "@/features/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CmsPage } from "@shared/schema";

export default function CmsOverviewPage() {
  const [, navigate] = useLocation();
  const { data: pages = [], isLoading } = useQuery<CmsPage[]>({
    queryKey: ["/api/admin/cms/pages"],
  });

  const totalPages = pages.length;
  const publishedPages = pages.filter((page) => page.status === "published").length;
  const draftPages = pages.filter((page) => page.status === "draft").length;
  const recentPages = pages.slice(0, 5);

  const quickLinks = [
    { title: "Pages", description: "Create and manage public website pages", icon: FileCode, href: "/admin/cms/pages" },
    { title: "Forms", description: "Manage generic public forms and submissions", icon: SquarePen, href: "/admin/forms" },
    { title: "Media Library", description: "Upload and manage files", icon: Image, href: "/admin/cms/media" },
    { title: "Sections", description: "Save and reuse block groups", icon: Blocks, href: "/admin/cms/sections" },
    { title: "SEO Settings", description: "Configure global SEO, robots, and sitemap settings", icon: SearchIcon, href: "/admin/cms/seo" },
  ];

  return (
    <AdminSidebar>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-cms-title">Content Management System</h1>
            <p className="mt-1 text-muted-foreground">Manage public CMS pages, forms, media, sections, and SEO.</p>
          </div>
          <Button onClick={() => navigate("/admin/cms/pages/new")} data-testid="button-create-page">
            <Plus className="mr-2 h-4 w-4" />
            Create Page
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["Total Pages", totalPages],
            ["Published", publishedPages],
            ["Drafts", draftPages],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
                    <Globe className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    {isLoading ? <Skeleton className="h-6 w-10" /> : <p className="text-xl font-bold">{value}</p>}
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card key={link.href} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(link.href)}>
                <CardContent className="pt-5">
                  <Icon className="mb-3 h-5 w-5 text-violet-600" />
                  <h2 className="font-semibold">{link.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardContent className="pt-5">
            <h2 className="font-semibold">Recent Pages</h2>
            <div className="mt-4 divide-y">
              {recentPages.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">No pages yet.</p>
              ) : (
                recentPages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    className="flex w-full items-center justify-between py-3 text-left"
                    onClick={() => navigate(`/admin/cms/pages/${page.id}`)}
                  >
                    <span>
                      <span className="block text-sm font-medium">{page.title}</span>
                      <span className="block font-mono text-xs text-muted-foreground">/{page.slug}</span>
                    </span>
                    <span className="text-xs capitalize text-muted-foreground">{page.status}</span>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
}
