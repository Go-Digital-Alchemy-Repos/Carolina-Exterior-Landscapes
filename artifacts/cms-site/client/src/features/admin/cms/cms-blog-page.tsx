import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarClock, Eye, EyeOff, Newspaper, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AdminSidebar } from "@/features/admin/admin-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CmsPage } from "@shared/schema";
import { filterAndSortCmsBlogPosts, getCmsBlogPostMetadata, type CmsPageSort } from "./cms-pages-list-utils";

export default function CmsBlogPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<CmsPageSort>("updated-desc");

  const { data: pages = [], isLoading } = useQuery<CmsPage[]>({
    queryKey: ["/api/admin/cms/pages"],
  });

  const posts = useMemo(() => filterAndSortCmsBlogPosts(pages, search, sort), [pages, search, sort]);
  const totalPosts = useMemo(() => pages.filter((page) => page.pageType === "blog-post").length, [pages]);

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/cms/pages/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      toast({ title: "Blog post published" });
    },
    onError: () => toast({ title: "Failed to publish blog post", variant: "destructive" }),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/cms/pages/${id}/unpublish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      toast({ title: "Blog post moved to draft" });
    },
    onError: () => toast({ title: "Failed to unpublish blog post", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/cms/pages/${id}?force=true`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      toast({ title: "Blog post deleted" });
    },
    onError: () => toast({ title: "Failed to delete blog post", variant: "destructive" }),
  });

  return (
    <AdminSidebar>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-semibold" data-testid="text-cms-blog-title">Blog</h1>
            <p className="mt-1 text-muted-foreground">Create and manage website blog posts.</p>
          </div>
          <Button onClick={() => navigate("/admin/cms/blog/new")} data-testid="button-new-blog-post">
            <Plus className="h-4 w-4 mr-2" />
            New Blog Post
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            {totalPosts > 0 ? (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search blog posts"
                    className="pl-9"
                    data-testid="input-search-blog-posts"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[170px_220px] lg:flex lg:items-center">
                  <div className="text-sm text-muted-foreground" data-testid="text-blog-result-count">
                    {posts.length} of {totalPosts} post{totalPosts === 1 ? "" : "s"}
                  </div>
                  <Select value={sort} onValueChange={(value) => setSort(value as CmsPageSort)}>
                    <SelectTrigger data-testid="select-sort-blog-posts">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated-desc">Recently updated</SelectItem>
                      <SelectItem value="updated-asc">Oldest updated</SelectItem>
                      <SelectItem value="created-desc">Recently created</SelectItem>
                      <SelectItem value="created-asc">Oldest created</SelectItem>
                      <SelectItem value="title-asc">Title A-Z</SelectItem>
                      <SelectItem value="title-desc">Title Z-A</SelectItem>
                      <SelectItem value="status-asc">Status: Published first</SelectItem>
                      <SelectItem value="status-desc">Status: Archived first</SelectItem>
                      <SelectItem value="slug-asc">Slug A-Z</SelectItem>
                      <SelectItem value="slug-desc">Slug Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {isLoading ? (
              <div className="space-y-3 pt-6">
                {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
              </div>
            ) : totalPosts === 0 ? (
              <div className="py-16 text-center text-muted-foreground" data-testid="text-empty-blog-posts">
                <Newspaper className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p className="font-medium">No blog posts yet</p>
                <p className="mt-1 text-sm">Create your first article for the website blog.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/cms/blog/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Blog Post
                </Button>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground" data-testid="text-empty-blog-search">
                <Search className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p className="font-medium">No matching blog posts</p>
                <p className="mt-1 text-sm">Try a different title, slug, or content keyword.</p>
                <Button variant="outline" className="mt-4" onClick={() => setSearch("")}>Clear search</Button>
              </div>
            ) : (
              <table className="w-full text-sm" data-testid="table-cms-blog-posts">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-3 text-left font-medium text-muted-foreground">Title</th>
                    <th className="hidden px-2 py-3 text-left font-medium text-muted-foreground md:table-cell">Slug</th>
                    <th className="px-2 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="hidden px-2 py-3 text-left font-medium text-muted-foreground md:table-cell">Published Date</th>
                    <th className="px-2 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="hidden px-2 py-3 text-left font-medium text-muted-foreground lg:table-cell">Updated</th>
                    <th className="px-2 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => {
                    const meta = getCmsBlogPostMetadata(post);
                    return (
                      <tr key={post.id} className="cursor-pointer border-b last:border-0 hover:bg-muted/30" onClick={() => navigate(`/admin/cms/blog/${post.id}`)} data-testid={`row-blog-post-${post.id}`}>
                        <td className="px-2 py-3 font-medium">{post.title}</td>
                        <td className="hidden px-2 py-3 font-mono text-xs text-muted-foreground md:table-cell">{post.slug}</td>
                        <td className="px-2 py-3">
                          <Badge variant={meta.category === "commercial" ? "secondary" : "outline"} className="capitalize">
                            {meta.category}
                          </Badge>
                        </td>
                        <td className="hidden px-2 py-3 text-xs text-muted-foreground md:table-cell">
                          {meta.publishedDate ? format(new Date(meta.publishedDate), "MMM d, yyyy") : "—"}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              variant={post.status === "published" ? "default" : "outline"}
                              className={post.status === "published" ? "bg-green-600 hover:bg-green-700" : post.status === "scheduled" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                            >
                              {post.status === "scheduled" && <CalendarClock className="h-3 w-3 mr-1" />}
                              {post.status}
                            </Badge>
                            {post.status === "scheduled" && post.scheduledAt ? (
                              <span className="text-[10px] text-muted-foreground">{format(new Date(post.scheduledAt), "MMM d, h:mm a")}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="hidden px-2 py-3 text-xs text-muted-foreground lg:table-cell">
                          {post.updatedAt ? format(new Date(post.updatedAt), "MMM d, yyyy") : "—"}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/cms/blog/${post.id}`)} data-testid={`button-edit-blog-${post.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {post.status === "published" || post.status === "scheduled" ? (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => unpublishMutation.mutate(post.id)} data-testid={`button-unpublish-blog-${post.id}`}>
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => publishMutation.mutate(post.id)} data-testid={`button-publish-blog-${post.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => window.confirm(`Delete "${post.title}"?`) && deleteMutation.mutate(post.id)}
                              data-testid={`button-delete-blog-${post.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
}
