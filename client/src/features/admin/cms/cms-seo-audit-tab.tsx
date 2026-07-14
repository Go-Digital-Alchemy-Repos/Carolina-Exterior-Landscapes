import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, FileText, ImageOff, Loader2, Type, AlignLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AuditItem {
  id: string;
  title: string;
  slug?: string;
  pageType?: string;
  status?: string;
  noindex?: boolean;
  issues: string[];
}

interface AuditData {
  pages: AuditItem[];
}

type IssueMeta = {
  label: string;
  icon: React.ElementType;
  severity: "error" | "warning";
  impact: string;
  fix: string;
};

const ISSUE_META: Record<string, IssueMeta> = {
  missing_seo_title: {
    label: "Missing SEO title",
    icon: Type,
    severity: "warning",
    impact: "Search results may fall back to the page title instead of a tuned title.",
    fix: "Open the page editor, fill in SEO Title, and save.",
  },
  missing_seo_description: {
    label: "Missing meta description",
    icon: AlignLeft,
    severity: "warning",
    impact: "Search engines and social previews may generate their own snippet.",
    fix: "Add a concise SEO Description, ideally around 140-160 characters.",
  },
  missing_og_image: {
    label: "Missing social image",
    icon: ImageOff,
    severity: "warning",
    impact: "Shared links may show no image or use an unpredictable fallback.",
    fix: "Upload or choose an Open Graph image. Recommended size is 1200x630.",
  },
  noindex: {
    label: "Noindex enabled",
    icon: EyeOff,
    severity: "error",
    impact: "This page tells search engines not to index it.",
    fix: "Turn off noindex in the page SEO settings unless this page should stay private.",
  },
  not_published: {
    label: "Not published",
    icon: AlertTriangle,
    severity: "error",
    impact: "This page is not visible on the live website and is excluded from the sitemap.",
    fix: "Publish the page if it should be live, or archive/delete it if it is not needed.",
  },
};

function IssueBadge({ issue }: { issue: string }) {
  const meta = ISSUE_META[issue] ?? {
    label: issue,
    icon: AlertTriangle,
    severity: "warning" as const,
    impact: "This audit check needs review.",
    fix: "Open the editor and review the page SEO settings.",
  };
  const Icon = meta.icon;
  return (
    <span className={meta.severity === "error"
      ? "inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : "inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function getEditHref(item: AuditItem) {
  return item.pageType === "blog-post" ? `/admin/cms/blog/${item.id}` : `/admin/cms/pages/${item.id}`;
}

function getPublicHref(item: AuditItem) {
  if (!item.slug) return "/";
  if (item.pageType === "blog-post") return `/blog/${item.slug}`;
  return `/${item.slug}`;
}

export function CmsSeoAuditTab() {
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery<AuditData>({
    queryKey: ["/api/admin/cms/seo-audit"],
    staleTime: 2 * 60 * 1000,
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/cms/pages/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/seo-audit"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/blog-posts"] });
      toast({ title: "Page published" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to publish page", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="mt-5 space-y-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="mt-5">
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          Failed to load audit data.
        </CardContent>
      </Card>
    );
  }

  const itemsWithIssues = data.pages.filter((page) => page.issues.length > 0);
  const totalIssues = data.pages.reduce((sum, page) => sum + page.issues.length, 0);
  const blockingIssues = data.pages.reduce(
    (sum, page) => sum + page.issues.filter((issue) => ISSUE_META[issue]?.severity === "error").length,
    0,
  );
  const warningIssues = Math.max(0, totalIssues - blockingIssues);

  return (
    <div className="mt-5 space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="rounded-md bg-violet-100 p-2 text-violet-600">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CMS Pages</p>
              <p className="text-lg font-semibold leading-tight">{data.pages.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="rounded-md bg-red-100 p-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Blocking Issues</p>
              <p className="text-lg font-semibold leading-tight">{blockingIssues}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="rounded-md bg-amber-100 p-2 text-amber-600">
              <ImageOff className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Warnings</p>
              <p className="text-lg font-semibold leading-tight">{warningIssues}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Audit coverage</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Checks publication status, noindex, SEO title, meta description, and social image fields.
            </p>
          </div>
          {totalIssues > 0 ? (
            <Badge variant="secondary" className="w-fit bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {totalIssues} issue{totalIssues !== 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge variant="secondary" className="w-fit bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              All clear
            </Badge>
          )}
        </CardContent>
      </Card>

      {itemsWithIssues.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium">No SEO issues found</p>
            <p className="mt-1 text-xs text-muted-foreground">All audited CMS pages have the expected SEO fields.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">
                {itemsWithIssues.length} page{itemsWithIssues.length !== 1 ? "s" : ""} with SEO issues
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Review each issue below, then publish or edit the page to resolve it.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {itemsWithIssues.map((item) => (
              <div key={item.id} className="border-b py-4 last:border-0" data-testid={`seo-audit-item-${item.id}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">{item.title}</span>
                        {item.slug ? <span className="truncate font-mono text-xs text-muted-foreground">/{item.slug}</span> : null}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.issues.map((issue) => (
                          <IssueBadge key={issue} issue={issue} />
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {item.issues.includes("not_published") ? (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 px-3 text-xs"
                          onClick={() => publishMutation.mutate(item.id)}
                          disabled={publishMutation.isPending}
                          data-testid={`button-publish-audit-${item.id}`}
                        >
                          {publishMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                          Publish
                        </Button>
                      ) : null}
                      <Link href={getEditHref(item)}>
                        <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                          Edit SEO
                        </Button>
                      </Link>
                      {item.status === "published" ? (
                        <a href={getPublicHref(item)} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="h-8 px-3 text-xs">
                            View
                          </Button>
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {item.issues.map((issue) => {
                      const meta = ISSUE_META[issue] ?? {
                        label: issue,
                        icon: AlertTriangle,
                        severity: "warning" as const,
                        impact: "This audit check needs review.",
                        fix: "Open the editor and review the page SEO settings.",
                      };
                      const Icon = meta.icon;
                      return (
                        <div key={issue} className="rounded-md border bg-muted/20 p-3">
                          <div className="flex items-start gap-2">
                            <Icon className={meta.severity === "error" ? "mt-0.5 h-4 w-4 text-red-500" : "mt-0.5 h-4 w-4 text-amber-500"} />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{meta.label}</p>
                              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Impact:</span> {meta.impact}</p>
                              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Fix:</span> {meta.fix}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
