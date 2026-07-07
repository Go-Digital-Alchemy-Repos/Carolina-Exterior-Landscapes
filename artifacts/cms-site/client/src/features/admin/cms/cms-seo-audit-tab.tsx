import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, EyeOff, FileText, ImageOff, Type, AlignLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditItem {
  id: string;
  title: string;
  slug?: string;
  status?: string;
  noindex?: boolean;
  issues: string[];
}

interface AuditData {
  pages: AuditItem[];
}

const ISSUE_META: Record<string, { label: string; icon: React.ElementType }> = {
  missing_seo_title: { label: "No SEO title", icon: Type },
  missing_seo_description: { label: "No meta description", icon: AlignLeft },
  missing_og_image: { label: "No social image", icon: ImageOff },
  noindex: { label: "Noindex", icon: EyeOff },
  not_published: { label: "Not published", icon: AlertTriangle },
};

function IssueBadge({ issue }: { issue: string }) {
  const meta = ISSUE_META[issue] ?? { label: issue, icon: AlertTriangle };
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export function CmsSeoAuditTab() {
  const { data, isLoading, error } = useQuery<AuditData>({
    queryKey: ["/api/admin/cms/seo-audit"],
    staleTime: 2 * 60 * 1000,
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

  return (
    <div className="mt-5 space-y-5">
      <Card>
        <CardContent className="flex items-center gap-3 pt-4 pb-4">
          <div className="rounded-md bg-violet-100 p-2 text-violet-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">CMS Pages</p>
            <p className="text-lg font-semibold leading-tight">{data.pages.length}</p>
          </div>
          {totalIssues > 0 ? (
            <Badge variant="secondary" className="ml-auto bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {totalIssues} issue{totalIssues !== 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
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
            <CardDescription className="text-xs">Click Edit to resolve CMS page SEO issues.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {itemsWithIssues.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 border-b py-3 last:border-0">
                <div className="min-w-0 flex-1">
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
                <Link href={`/admin/cms/pages/${item.id}`}>
                  <Button size="sm" variant="outline" className="h-7 px-3 text-xs">
                    Edit
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
