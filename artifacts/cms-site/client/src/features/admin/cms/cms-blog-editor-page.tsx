import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Eye, FileText, Globe, Image as ImageIcon, Loader2, Save, Search } from "lucide-react";
import { AdminSidebar } from "@/features/admin/admin-sidebar";
import { CmsImageUpload } from "@/features/admin/cms/components/cms-image-upload";
import { ImagePositionPicker } from "@/features/admin/cms/components/image-position-picker";
import { CmsRichTextEditor } from "@/features/admin/cms/builder/cms-rich-text-editor";
import { EditorLockBanner } from "@/components/shared/editor-lock-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEditorLock } from "@/hooks/use-editor-lock";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CmsPage } from "@shared/schema";

type BlogCategory = "residential" | "commercial";
type BlogBlock = { type: "h2" | "h3" | "p" | "li"; text: string };
type BlogDraft = {
  title: string;
  slug: string;
  authorName: string;
  category: BlogCategory;
  tags: string;
  date: string;
  readMinutes: number;
  excerpt: string;
  body: string;
  heroEyebrow: string;
  heroHeading: string;
  heroSubheading: string;
  imageUrl: string;
  imagePositionX: number;
  imagePositionY: number;
  staticImage: string;
  status: "draft" | "published" | "scheduled";
  scheduledAt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  noindex: boolean;
};

const DEFAULT_AUTHOR = "Carolina Exterior Landscapes Team";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s/-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/(^[-/]+|[-/]+$)/g, "");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyDraft(): BlogDraft {
  return {
    title: "",
    slug: "",
    authorName: DEFAULT_AUTHOR,
    category: "residential",
    tags: "",
    date: "",
    readMinutes: 3,
    excerpt: "",
    body: "",
    heroEyebrow: "Landscape Journal",
    heroHeading: "",
    heroSubheading: "",
    imageUrl: "",
    imagePositionX: 50,
    imagePositionY: 50,
    staticImage: "",
    status: "draft",
    scheduledAt: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    noindex: false,
  };
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function positionValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
}

function dateTimeLocalValue(value: Date | string | null | undefined) {
  if (!value) return "";
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

function blocksToBody(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .map((block) => {
      const item = getObject(block);
      const text = typeof item.text === "string" ? item.text.trim() : "";
      if (!text) return "";
      if (item.type === "h2") return `## ${text}`;
      if (item.type === "h3") return `### ${text}`;
      if (item.type === "li") return `- ${text}`;
      return text;
    })
    .filter(Boolean)
    .join("\n\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function blocksToHtml(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return blocks.map((block) => {
    const item = getObject(block);
    const text = typeof item.text === "string" ? escapeHtml(item.text.trim()) : "";
    if (!text) return "";
    if (item.type === "h2") return `<h2>${text}</h2>`;
    if (item.type === "h3") return `<h3>${text}</h3>`;
    if (item.type === "li") return `<ul><li>${text}</li></ul>`;
    return `<p>${text}</p>`;
  }).filter(Boolean).join("");
}

function legacyBodyToHtml(bodyText: string, blocks: unknown) {
  if (bodyText.trim()) return blocksToHtml(bodyToBlocks(bodyText));
  return blocksToHtml(blocks);
}

function htmlToPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/h[1-6]>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function bodyToBlocks(body: string): BlogBlock[] {
  return body
    .split(/\n{2,}/)
    .flatMap((section) => section.split("\n").map((line) => line.trim()).filter(Boolean))
    .map((line) => {
      if (line.startsWith("### ")) return { type: "h3" as const, text: line.slice(4).trim() };
      if (line.startsWith("## ")) return { type: "h2" as const, text: line.slice(3).trim() };
      if (line.startsWith("- ")) return { type: "li" as const, text: line.slice(2).trim() };
      return { type: "p" as const, text: line };
    })
    .filter((block) => block.text);
}

export function draftFromPage(page: CmsPage): BlogDraft {
  const content = getObject(page.content);
  const landscape = getObject(content.landscape);
  const data = getObject(landscape.data);
  const blog = getObject(content.blog);
  const builderBlocks = Array.isArray(content.blocks) ? content.blocks : [];
  const heroBlock = builderBlocks.map(getObject).find((block) => block.type === "hero");
  const heroProps = getObject(heroBlock?.props);
  const category = data.category === "commercial" ? "commercial" : "residential";
  const bodyText = typeof blog.bodyText === "string" ? blog.bodyText : "";
  const bodyHtml = typeof blog.bodyHtml === "string"
    ? blog.bodyHtml
    : legacyBodyToHtml(bodyText, data.blocks);

  return {
    title: page.title || (typeof data.h1 === "string" ? data.h1 : ""),
    slug: page.slug || (typeof data.slug === "string" ? data.slug : ""),
    authorName: typeof blog.authorName === "string" ? blog.authorName : DEFAULT_AUTHOR,
    category,
    tags: Array.isArray(blog.tags) ? blog.tags.filter((tag): tag is string => typeof tag === "string").join(", ") : "",
    date: page.publishedAt
      ? format(new Date(page.publishedAt), "yyyy-MM-dd")
      : typeof data.date === "string" ? data.date : todayIso(),
    readMinutes: typeof data.readMinutes === "number" ? data.readMinutes : 3,
    excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
    body: bodyHtml,
    heroEyebrow: typeof heroProps.eyebrow === "string" ? heroProps.eyebrow : "Landscape Journal",
    heroHeading: typeof heroProps.heading === "string" ? heroProps.heading : page.title,
    heroSubheading: typeof heroProps.subheading === "string" ? heroProps.subheading : (typeof data.excerpt === "string" ? `<p>${escapeHtml(data.excerpt)}</p>` : ""),
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    imagePositionX: positionValue(data.imagePositionX),
    imagePositionY: positionValue(data.imagePositionY),
    staticImage: typeof data.image === "string" ? data.image : "",
    status: page.status === "published" ? "published" : page.status === "scheduled" ? "scheduled" : "draft",
    scheduledAt: dateTimeLocalValue(page.scheduledAt),
    seoTitle: page.seoTitle || (typeof data.titleTag === "string" ? data.titleTag : ""),
    seoDescription: page.seoDescription || (typeof data.metaDescription === "string" ? data.metaDescription : ""),
    seoKeywords: page.seoKeywords || "",
    noindex: Boolean(page.noindex),
  };
}

export function buildPagePayload(draft: BlogDraft, currentContent?: unknown) {
  const slug = normalizeSlug(draft.slug || draft.title);
  const title = draft.title.trim();
  const excerpt = draft.excerpt.trim();
  const seoTitle = draft.seoTitle.trim() || `${title} | Carolina Exterior Landscapes`;
  const seoDescription = draft.seoDescription.trim() || excerpt;
  const tags = draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  const existingContent = getObject(currentContent);
  const existingBuilderBlocks = Array.isArray(existingContent.blocks) ? existingContent.blocks : [];
  const existingHero = existingBuilderBlocks.map(getObject).find((block) => block.type === "hero");
  const preservedCtas = existingBuilderBlocks.map(getObject).filter((block) => block.type === "cta");
  const builderBlocks = [
    {
      ...existingHero,
      id: typeof existingHero?.id === "string" ? existingHero.id : `${slug}-hero`,
      type: "hero",
      props: {
        ...getObject(existingHero?.props),
        eyebrow: draft.heroEyebrow.trim(),
        heading: draft.heroHeading.trim() || title,
        subheading: draft.heroSubheading,
        backgroundImageUrl: draft.imageUrl,
        backgroundPositionX: draft.imagePositionX,
        backgroundPositionY: draft.imagePositionY,
        ctaText: "",
        ctaLink: "",
      },
    },
    {
      id: `${slug}-article-content`,
      type: "rich-text",
      props: {
        content: draft.body,
        alignment: "left",
        background: "white",
      },
    },
    ...preservedCtas,
  ];

  return {
    title,
    slug,
    status: draft.status,
    pageType: "blog-post",
    template: "full-width",
    sidebarId: null,
    content: {
      source: "carolina-landscape-v1",
      landscape: {
        kind: "blog",
        path: `/blog/${slug}`,
        data: {
          slug,
          h1: title,
          titleTag: seoTitle,
          metaDescription: seoDescription,
          primaryKeyword: "",
          secondaryKeywords: tags,
          schemaType: "BlogPosting",
          wordCountTarget: "",
          bodyHtml: draft.body,
          category: draft.category,
          date: draft.date,
          readMinutes: Math.max(1, Number(draft.readMinutes) || 1),
          excerpt,
          image: draft.imageUrl ? "" : draft.staticImage,
          imageUrl: draft.imageUrl,
          imagePositionX: draft.imagePositionX,
          imagePositionY: draft.imagePositionY,
        },
      },
      blog: {
        authorName: draft.authorName.trim() || DEFAULT_AUTHOR,
        tags,
        bodyHtml: draft.body,
        bodyText: htmlToPlainText(draft.body),
      },
      blocks: builderBlocks,
    },
    seoTitle,
    seoDescription,
    seoKeywords: draft.seoKeywords,
    ogImageUrl: draft.imageUrl || null,
    canonicalUrl: `/blog/${slug}`,
    noindex: draft.noindex,
  };
}

export default function CmsBlogEditorPage() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNew = !params.id || params.id === "new";
  const [draft, setDraft] = useState<BlogDraft>(() => emptyDraft());
  const [slugEdited, setSlugEdited] = useState(false);
  const [hasLoadedPage, setHasLoadedPage] = useState(false);
  const [publishDateEdited, setPublishDateEdited] = useState(false);

  const { data: page, isLoading } = useQuery<CmsPage>({
    queryKey: [`/api/admin/cms/pages/${params.id}`],
    enabled: !isNew,
  });

  useEffect(() => {
    if (page && !hasLoadedPage) {
      setDraft(draftFromPage(page));
      setSlugEdited(true);
      setHasLoadedPage(true);
    }
  }, [hasLoadedPage, page]);

  const editorLock = useEditorLock({
    resourceType: "cms_page",
    resourceId: page?.id,
    enabled: !isNew && Boolean(page?.id),
  });
  const isReadOnly = editorLock.hasLocking && editorLock.isReadOnly;

  const payload = useMemo(() => ({
    ...buildPagePayload(draft, page?.content),
    status: draft.status === "scheduled" ? "draft" : draft.status,
  }), [draft, page?.content]);
  const canSave = payload.title.trim().length > 0 && payload.slug.trim().length > 0 && !isReadOnly;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = isNew
        ? await apiRequest("POST", "/api/admin/cms/pages", payload)
        : await apiRequest("PUT", `/api/admin/cms/pages/${params.id}`, payload);
      let savedPage = await response.json() as CmsPage;

      if (draft.status === "scheduled") {
        const scheduledAt = new Date(draft.scheduledAt);
        if (!draft.scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
          throw new Error("Choose a valid future publication date and time.");
        }
        const scheduledResponse = await apiRequest("POST", `/api/admin/cms/pages/${savedPage.id}/schedule`, {
          scheduledAt: scheduledAt.toISOString(),
        });
        savedPage = await scheduledResponse.json() as CmsPage;
      } else if (draft.status === "published" && publishDateEdited && draft.date) {
        const publicationResponse = await apiRequest("PUT", `/api/admin/cms/pages/${savedPage.id}/publication-date`, {
          publishedAt: `${draft.date}T12:00:00.000Z`,
        });
        savedPage = await publicationResponse.json() as CmsPage;
      }

      return savedPage;
    },
    onSuccess: (savedPage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/blog-posts"] });
      if (!isNew) queryClient.setQueryData([`/api/admin/cms/pages/${params.id}`], savedPage);
      setPublishDateEdited(false);
      setDraft((current) => ({
        ...current,
        date: savedPage.publishedAt ? format(new Date(savedPage.publishedAt), "yyyy-MM-dd") : current.date,
        scheduledAt: dateTimeLocalValue(savedPage.scheduledAt),
      }));
      toast({ title: draft.status === "published" ? "Blog post published" : draft.status === "scheduled" ? "Blog post scheduled" : "Blog post saved" });
      if (isNew) navigate(`/admin/cms/blog/${savedPage.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save blog post", description: error.message, variant: "destructive" });
    },
  });

  const updateDraft = <K extends keyof BlogDraft>(key: K, value: BlogDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleTitleChange = (title: string) => {
    setDraft((current) => ({
      ...current,
      title,
      slug: slugEdited ? current.slug : normalizeSlug(title),
      heroHeading: !current.heroHeading || current.heroHeading === current.title ? title : current.heroHeading,
    }));
  };

  if (isLoading) {
    return (
      <AdminSidebar>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        {editorLock.summary ? (
          <EditorLockBanner
            variant={editorLock.summary.variant}
            title={editorLock.summary.title}
            description={editorLock.summary.description}
            isLoading={editorLock.isLoading}
            onRefresh={editorLock.refresh}
          />
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/admin/cms/blog")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Blog
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-heading font-semibold">{draft.title || "New Blog Post"}</h1>
              <Badge variant={draft.status === "published" ? "default" : "outline"}>
                {draft.status === "published" ? "Published" : draft.status === "scheduled" ? "Scheduled" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Simple article editor. Saved content is the same structured CMS data the website renders.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(`/blog/${payload.slug}`, "_blank")} disabled={!payload.slug}>
              <Eye className="mr-2 h-4 w-4" />
              View Live
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!canSave || saveMutation.isPending} data-testid="button-save-blog-post">
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Post
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content">
          <TabsList>
            <TabsTrigger value="content"><FileText className="mr-2 h-4 w-4" />Content</TabsTrigger>
            <TabsTrigger value="media"><ImageIcon className="mr-2 h-4 w-4" />Image</TabsTrigger>
            <TabsTrigger value="seo"><Search className="mr-2 h-4 w-4" />SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Content</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="blog-hero-eyebrow">Eyebrow</Label>
                  <Input id="blog-hero-eyebrow" value={draft.heroEyebrow} onChange={(event) => updateDraft("heroEyebrow", event.target.value)} disabled={isReadOnly} data-testid="input-blog-hero-eyebrow" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="blog-hero-heading">Heading</Label>
                  <Input id="blog-hero-heading" value={draft.heroHeading} onChange={(event) => updateDraft("heroHeading", event.target.value)} disabled={isReadOnly} data-testid="input-blog-hero-heading" />
                </div>
                <div className="grid gap-2">
                  <Label>Supporting Copy</Label>
                  <CmsRichTextEditor value={draft.heroSubheading} onChange={(heroSubheading) => updateDraft("heroSubheading", heroSubheading)} readOnly={isReadOnly} placeholder="Add supporting copy beneath the hero heading..." data-testid="editor-blog-hero-subheading" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="blog-title">Title</Label>
                  <Input id="blog-title" value={draft.title} onChange={(event) => handleTitleChange(event.target.value)} disabled={isReadOnly} data-testid="input-blog-title" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="blog-slug">URL Slug</Label>
                  <Input
                    id="blog-slug"
                    value={draft.slug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      updateDraft("slug", normalizeSlug(event.target.value));
                    }}
                    disabled={isReadOnly}
                    data-testid="input-blog-slug"
                  />
                  <p className="text-xs text-muted-foreground">Public URL: /blog/{payload.slug || "new-post"}</p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="blog-author">Author Name</Label>
                    <Input id="blog-author" value={draft.authorName} onChange={(event) => updateDraft("authorName", event.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="blog-date">Published Date</Label>
                    <Input
                      id="blog-date"
                      type="date"
                      value={draft.date}
                      max={todayIso()}
                      onChange={(event) => {
                        updateDraft("date", event.target.value);
                        setPublishDateEdited(true);
                      }}
                      disabled={isReadOnly}
                    />
                    <p className="text-xs text-muted-foreground">
                      {page?.publishedAt ? "Defaults to the actual go-live date. Change it here when the public date needs correction." : "Set automatically when first published unless you enter a date."}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={draft.category} onValueChange={(value) => updateDraft("category", value as BlogCategory)} disabled={isReadOnly}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="blog-read-minutes">Read Minutes</Label>
                    <Input id="blog-read-minutes" type="number" min={1} value={draft.readMinutes} onChange={(event) => updateDraft("readMinutes", Number(event.target.value))} disabled={isReadOnly} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="blog-tags">Tags</Label>
                  <Input id="blog-tags" value={draft.tags} onChange={(event) => updateDraft("tags", event.target.value)} placeholder="mulch, lawn care, seasonal tips" disabled={isReadOnly} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="blog-excerpt">Excerpt</Label>
                  <Textarea id="blog-excerpt" value={draft.excerpt} onChange={(event) => updateDraft("excerpt", event.target.value)} className="min-h-24" disabled={isReadOnly} data-testid="textarea-blog-excerpt" />
                </div>
                <div className="grid gap-2">
                  <Label>Body Content</Label>
                  <div className="[&_.ProseMirror]:min-h-[420px]">
                    <CmsRichTextEditor value={draft.body} onChange={(body) => updateDraft("body", body)} readOnly={isReadOnly} placeholder="Write the article content..." data-testid="editor-blog-body" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publication</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Post Status</Label>
                  <Select value={draft.status} onValueChange={(value) => updateDraft("status", value as BlogDraft["status"])} disabled={isReadOnly}>
                    <SelectTrigger data-testid="select-blog-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Choose Draft to unpublish a live post.</p>
                </div>
                {draft.status === "scheduled" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="blog-scheduled-at">Publish On</Label>
                    <Input id="blog-scheduled-at" type="datetime-local" value={draft.scheduledAt} min={dateTimeLocalValue(new Date())} onChange={(event) => updateDraft("scheduledAt", event.target.value)} disabled={isReadOnly} data-testid="input-blog-scheduled-at" />
                    <p className="text-xs text-muted-foreground">The post remains unavailable until this date and time.</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
              </CardHeader>
              <CardContent>
                <CmsImageUpload
                  value={draft.imageUrl}
                  onChange={(imageUrl) => setDraft((current) => ({
                    ...current,
                    imageUrl,
                    imagePositionX: imageUrl === current.imageUrl ? current.imagePositionX : 50,
                    imagePositionY: imageUrl === current.imageUrl ? current.imagePositionY : 50,
                  }))}
                  helpText="Displayed at the top of the article and on blog cards."
                  data-testid="upload-blog-cover"
                />
                {draft.imageUrl ? (
                  <div className="mt-5">
                    <ImagePositionPicker
                      imageUrl={draft.imageUrl}
                      positionX={draft.imagePositionX}
                      positionY={draft.imagePositionY}
                      onPositionChange={(imagePositionX, imagePositionY) => {
                        setDraft((current) => ({ ...current, imagePositionX, imagePositionY }));
                      }}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Metadata</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="blog-seo-title">SEO Title</Label>
                  <Input id="blog-seo-title" value={draft.seoTitle} onChange={(event) => updateDraft("seoTitle", event.target.value)} disabled={isReadOnly} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="blog-seo-description">SEO Description</Label>
                  <Textarea id="blog-seo-description" value={draft.seoDescription} onChange={(event) => updateDraft("seoDescription", event.target.value)} className="min-h-28" disabled={isReadOnly} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="blog-seo-keywords">SEO Keywords</Label>
                  <Input id="blog-seo-keywords" value={draft.seoKeywords} onChange={(event) => updateDraft("seoKeywords", event.target.value)} disabled={isReadOnly} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="blog-noindex" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Allow search indexing
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">Turn off only for drafts or private articles.</p>
                  </div>
                  <Switch id="blog-noindex" checked={!draft.noindex} onCheckedChange={(checked) => updateDraft("noindex", !checked)} disabled={isReadOnly} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminSidebar>
  );
}
