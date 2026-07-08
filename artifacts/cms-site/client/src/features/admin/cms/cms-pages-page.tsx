import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AdminSidebar } from "@/features/admin/admin-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus, Pencil, Trash2, Eye, EyeOff, Globe, CalendarClock, Search } from "lucide-react";
import type { CmsPage } from "@shared/schema";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { filterAndSortCmsPages, type CmsPageSort } from "./cms-pages-list-utils";

const PAGE_TYPE_COLORS: Record<string, string> = {
  home: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  about: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  contact: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  landing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  service: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "service-hub": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "service-area": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  location: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  "blog-index": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "blog-post": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  custom: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

type SortableColumn = "title" | "slug" | "type" | "status" | "updated";
type SortDirection = "asc" | "desc";

const COLUMN_SORTS: Record<SortableColumn, { asc: CmsPageSort; desc: CmsPageSort; defaultDirection: SortDirection }> = {
  title: { asc: "title-asc", desc: "title-desc", defaultDirection: "asc" },
  slug: { asc: "slug-asc", desc: "slug-desc", defaultDirection: "asc" },
  type: { asc: "type-asc", desc: "type-desc", defaultDirection: "asc" },
  status: { asc: "status-asc", desc: "status-desc", defaultDirection: "asc" },
  updated: { asc: "updated-asc", desc: "updated-desc", defaultDirection: "desc" },
};

function getSortState(sort: CmsPageSort): { column: SortableColumn | null; direction: SortDirection | null } {
  for (const [column, values] of Object.entries(COLUMN_SORTS) as Array<[SortableColumn, typeof COLUMN_SORTS[SortableColumn]]>) {
    if (sort === values.asc) return { column, direction: "asc" };
    if (sort === values.desc) return { column, direction: "desc" };
  }
  return { column: null, direction: null };
}

export default function CmsPagesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<CmsPage | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<CmsPageSort>("title-asc");

  const { data: pages = [], isLoading } = useQuery<CmsPage[]>({
    queryKey: ["/api/admin/cms/pages"],
  });

  const { data: pageLocks = [] } = useQuery<Array<{ resourceId: string; lock: { lockedByUserId: string; lockedByName: string } }>>({
    queryKey: ["/api/admin/editor-locks/resource", "cms_page"],
    queryFn: async () => {
      const response = await fetch("/api/admin/editor-locks/resource/cms_page", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to load page lock status");
      return response.json();
    },
    refetchInterval: 15000,
    staleTime: 5000,
  });

  const pageLocksById = new Map(pageLocks.map((entry) => [entry.resourceId, entry.lock] as const));
  const visiblePages = useMemo(() => filterAndSortCmsPages(pages, search, sort), [pages, search, sort]);
  const currentSort = getSortState(sort);

  const setColumnSort = (column: SortableColumn) => {
    const config = COLUMN_SORTS[column];
    if (currentSort.column !== column) {
      setSort(config[config.defaultDirection]);
      return;
    }
    setSort(currentSort.direction === "asc" ? config.desc : config.asc);
  };

  const renderSortableHeader = (column: SortableColumn, label: string, className = "") => {
    const isActive = currentSort.column === column;
    const direction = isActive ? currentSort.direction : null;
    const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ChevronsUpDown;

    return (
      <th
        className={`text-left py-3 px-2 text-muted-foreground font-medium ${className}`}
        aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-sm text-left transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => setColumnSort(column)}
          data-testid={`button-sort-pages-${column}`}
        >
          {label}
          <Icon className={`h-3.5 w-3.5 ${isActive ? "text-foreground" : "text-muted-foreground/60"}`} />
        </button>
      </th>
    );
  };

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/cms/pages/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      toast({ title: "Page published" });
    },
    onError: () => toast({ title: "Failed to publish page", variant: "destructive" }),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/cms/pages/${id}/unpublish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      toast({ title: "Page moved to draft" });
    },
    onError: () => toast({ title: "Failed to unpublish page", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/cms/pages/${id}?force=true`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      toast({ title: "Page deleted" });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "Failed to delete page", variant: "destructive" }),
  });

  const getEditorHref = (page: CmsPage) => `/admin/cms/pages/${page.id}`;

  return (
    <AdminSidebar>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-semibold" data-testid="text-cms-pages-title">
              Pages
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your public-facing website pages
            </p>
          </div>
          <Button onClick={() => navigate("/admin/cms/pages/new")} data-testid="button-new-page">
            <Plus className="h-4 w-4 mr-2" />
            New Page
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            {pages.length > 0 ? (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search pages by title or content keyword"
                    className="pl-9"
                    data-testid="input-search-pages"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[170px_220px] lg:flex lg:items-center">
                  <div className="text-sm text-muted-foreground" data-testid="text-pages-result-count">
                    {visiblePages.length} of {pages.length} page{pages.length === 1 ? "" : "s"}
                  </div>
                  <Select value={sort} onValueChange={(value) => setSort(value as CmsPageSort)}>
                    <SelectTrigger data-testid="select-sort-pages">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title-asc">Title A-Z</SelectItem>
                      <SelectItem value="title-desc">Title Z-A</SelectItem>
                      <SelectItem value="updated-desc">Recently updated</SelectItem>
                      <SelectItem value="updated-asc">Oldest updated</SelectItem>
                      <SelectItem value="created-desc">Recently created</SelectItem>
                      <SelectItem value="created-asc">Oldest created</SelectItem>
                      <SelectItem value="status-asc">Status: Published first</SelectItem>
                      <SelectItem value="status-desc">Status: Archived first</SelectItem>
                      <SelectItem value="type-asc">Type A-Z</SelectItem>
                      <SelectItem value="type-desc">Type Z-A</SelectItem>
                      <SelectItem value="slug-asc">Slug A-Z</SelectItem>
                      <SelectItem value="slug-desc">Slug Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
            {isLoading ? (
              <div className="space-y-3 pt-6">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : pages.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground" data-testid="text-empty-pages">
                <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No pages yet</p>
                <p className="text-sm mt-1">Create your first CMS page to get started</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/admin/cms/pages/new")}
                  data-testid="button-create-first"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Page
                </Button>
              </div>
            ) : visiblePages.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground" data-testid="text-empty-page-search">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No matching pages</p>
                <p className="text-sm mt-1">Try a different title, slug, or content keyword.</p>
                <Button variant="outline" className="mt-4" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              </div>
            ) : (
              <table className="w-full text-sm" data-testid="table-cms-pages">
                <thead>
                  <tr className="border-b">
                    {renderSortableHeader("title", "Title")}
                    {renderSortableHeader("slug", "Slug", "hidden md:table-cell")}
                    {renderSortableHeader("type", "Type", "hidden lg:table-cell")}
                    {renderSortableHeader("status", "Status")}
                    {renderSortableHeader("updated", "Updated", "hidden md:table-cell")}
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePages.map((page) => {
                    const activeLock = pageLocksById.get(page.id);
                    const isLockedByOther = Boolean(activeLock && activeLock.lockedByUserId !== user?.id);
                    const isOwnedByCurrentUser = Boolean(activeLock && activeLock.lockedByUserId === user?.id);
                    return (
                    <tr
                      key={page.id}
                      className={`border-b last:border-0 ${isLockedByOther ? "bg-muted/10 cursor-not-allowed opacity-80" : "hover:bg-muted/20 cursor-pointer"}`}
                      onClick={() => {
                        if (!isLockedByOther) navigate(getEditorHref(page));
                      }}
                      data-testid={`row-page-${page.id}`}
                    >
                      <td className="py-3 px-2 font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{page.title}</span>
                          {activeLock ? (
                            <Badge variant={isOwnedByCurrentUser ? "default" : "outline"} className="w-fit text-[10px]" data-testid={`badge-lock-${page.id}`}>
                              {isOwnedByCurrentUser ? "You’re editing" : `Being edited by ${activeLock.lockedByName}`}
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground font-mono text-xs hidden md:table-cell">{page.slug}</td>
                      <td className="py-3 px-2 hidden lg:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PAGE_TYPE_COLORS[page.pageType] ?? PAGE_TYPE_COLORS.custom}`}>
                          {page.pageType}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-0.5">
                          <Badge
                            variant={page.status === "published" ? "default" : "outline"}
                            className={`text-xs ${page.status === "published" ? "bg-green-600 hover:bg-green-700" : page.status === "scheduled" ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : ""}`}
                            data-testid={`badge-status-${page.id}`}
                          >
                            {page.status === "scheduled" && <CalendarClock className="h-3 w-3 mr-1" />}
                            {page.status}
                          </Badge>
                          {page.status === "scheduled" && page.scheduledAt && (
                            <span className="text-[10px] text-muted-foreground" data-testid={`text-scheduled-date-${page.id}`}>
                              {format(new Date(page.scheduledAt), "MMM d, h:mm a")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-xs hidden md:table-cell">
                        {page.updatedAt ? format(new Date(page.updatedAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(getEditorHref(page))}
                            disabled={isLockedByOther}
                            data-testid={`button-edit-${page.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {page.status === "published" || page.status === "scheduled" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600"
                            onClick={() => unpublishMutation.mutate(page.id)}
                            disabled={unpublishMutation.isPending || isLockedByOther}
                              data-testid={`button-unpublish-${page.id}`}
                              title={page.status === "scheduled" ? "Cancel schedule" : "Move to draft"}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                            onClick={() => publishMutation.mutate(page.id)}
                            disabled={publishMutation.isPending || isLockedByOther}
                              data-testid={`button-publish-${page.id}`}
                              title="Publish page"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteTarget(page)}
                            disabled={isLockedByOther}
                            data-testid={`button-delete-${page.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminSidebar>
  );
}
