import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Copy, Eye, EyeOff, Images, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminSidebar } from "@/features/admin/admin-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CmsGalleryListItem } from "@shared/schema";

export default function CmsGalleriesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("updated");
  const query = useMemo(
    () => new URLSearchParams({ search, status, sort }).toString(),
    [search, status, sort],
  );
  const { data: galleries = [], isLoading } = useQuery<CmsGalleryListItem[]>({
    queryKey: [`/api/admin/cms/galleries?${query}`],
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      predicate: (query) => String(query.queryKey[0]).startsWith("/api/admin/cms/galleries"),
    });
  const publish = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/cms/galleries/${id}/publish`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Gallery published" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });
  const unpublish = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/cms/galleries/${id}/unpublish`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Gallery moved to draft" });
    },
    onError: () => toast({ title: "Failed to unpublish gallery", variant: "destructive" }),
  });
  const duplicate = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/cms/galleries/${id}/duplicate`);
      return response.json() as Promise<CmsGalleryListItem>;
    },
    onSuccess: (gallery) => {
      invalidate();
      navigate(`/admin/cms/galleries/${gallery.id}`);
    },
    onError: () => toast({ title: "Failed to duplicate gallery", variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/cms/galleries/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Gallery deleted" });
    },
    onError: () => toast({ title: "Failed to delete gallery", variant: "destructive" }),
  });

  return (
    <AdminSidebar>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Galleries</h1>
            <p className="mt-1 text-muted-foreground">
              Create reusable photo galleries for pages and blog posts.
            </p>
          </div>
          <Button
            onClick={() => navigate("/admin/cms/galleries/new")}
            data-testid="button-new-gallery"
          >
            <Plus className="h-4 w-4" />
            New Gallery
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_190px]">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search galleries"
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Recently updated</SelectItem>
                  <SelectItem value="created">Recently created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : galleries.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Images className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p className="font-medium">No galleries yet</p>
                <p className="mt-1 text-sm">
                  Create your first gallery to reuse it across the site.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {galleries.map((gallery) => (
                    <article
                      key={gallery.id}
                      className="rounded-xl border bg-background p-4 shadow-sm"
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => navigate(`/admin/cms/galleries/${gallery.id}`)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="font-semibold">{gallery.title}</h2>
                            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                              /{gallery.slug}
                            </p>
                          </div>
                          <Badge
                            variant={gallery.status === "published" ? "default" : "outline"}
                            className={gallery.status === "published" ? "bg-green-600" : ""}
                          >
                            {gallery.status}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {gallery.imageCount} image{gallery.imageCount === 1 ? "" : "s"} · Updated{" "}
                          {gallery.updatedAt
                            ? format(new Date(gallery.updatedAt), "MMM d, yyyy")
                            : "—"}
                        </p>
                      </button>
                      <div className="mt-4 grid grid-cols-4 gap-2 border-t pt-3">
                        <Button
                          variant="outline"
                          className="min-h-11"
                          onClick={() => navigate(`/admin/cms/galleries/${gallery.id}`)}
                          aria-label={`Edit ${gallery.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {gallery.status === "published" ? (
                          <Button
                            variant="outline"
                            className="min-h-11 text-amber-600"
                            onClick={() => unpublish.mutate(gallery.id)}
                            aria-label={`Move ${gallery.title} to draft`}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="min-h-11 text-green-600"
                            onClick={() => publish.mutate(gallery.id)}
                            aria-label={`Publish ${gallery.title}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="min-h-11"
                          onClick={() => duplicate.mutate(gallery.id)}
                          aria-label={`Duplicate ${gallery.title}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="min-h-11 text-destructive"
                          onClick={() =>
                            window.confirm("Delete this gallery?") && remove.mutate(gallery.id)
                          }
                          aria-label={`Delete ${gallery.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
                <table className="hidden w-full text-sm md:table">
                  <thead>
                    <tr className="border-b">
                      <th className="px-2 py-3 text-left font-medium text-muted-foreground">
                        Title
                      </th>
                      <th className="hidden px-2 py-3 text-left font-medium text-muted-foreground md:table-cell">
                        Slug
                      </th>
                      <th className="px-2 py-3 text-left font-medium text-muted-foreground">
                        Images
                      </th>
                      <th className="px-2 py-3 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="hidden px-2 py-3 text-left font-medium text-muted-foreground md:table-cell">
                        Updated
                      </th>
                      <th className="px-2 py-3 text-right font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {galleries.map((gallery) => (
                      <tr
                        key={gallery.id}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                        onClick={() => navigate(`/admin/cms/galleries/${gallery.id}`)}
                      >
                        <td className="px-2 py-3 font-medium">{gallery.title}</td>
                        <td className="hidden px-2 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                          {gallery.slug}
                        </td>
                        <td className="px-2 py-3">{gallery.imageCount}</td>
                        <td className="px-2 py-3">
                          <Badge
                            variant={gallery.status === "published" ? "default" : "outline"}
                            className={
                              gallery.status === "published"
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            }
                          >
                            {gallery.status}
                          </Badge>
                        </td>
                        <td className="hidden px-2 py-3 text-xs text-muted-foreground md:table-cell">
                          {gallery.updatedAt
                            ? format(new Date(gallery.updatedAt), "MMM d, yyyy")
                            : "-"}
                        </td>
                        <td className="px-2 py-3">
                          <div
                            className="flex justify-end gap-1"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/admin/cms/galleries/${gallery.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {gallery.status === "published" ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-amber-600"
                                onClick={() => unpublish.mutate(gallery.id)}
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600"
                                onClick={() => publish.mutate(gallery.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicate.mutate(gallery.id)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() =>
                                window.confirm("Delete this gallery?") && remove.mutate(gallery.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
}
