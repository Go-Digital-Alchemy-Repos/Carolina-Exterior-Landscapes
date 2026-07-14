import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { AdminSidebar } from "@/features/admin/admin-sidebar";
import { CmsImageUpload } from "@/features/admin/cms/components/cms-image-upload";
import { EditorLockBanner } from "@/components/shared/editor-lock-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEditorLock } from "@/hooks/use-editor-lock";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { splitBlogFaqBlocks, type BlogFaqItem } from "@shared/blog-faq";
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
  faqTitle: string;
  faqDescription: string;
  faqItems: BlogFaqItem[];
  imageUrl: string;
  staticImage: string;
  status: "draft" | "published";
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  noindex: boolean;
};

const DEFAULT_AUTHOR = "Carolina Exterior Team";

function CollapsibleEditorCard({
  title,
  children,
  contentClassName,
}: {
  title: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <Card>
        <CardHeader className="p-0">
          <CollapsibleTrigger
            className="flex w-full items-center justify-between gap-4 rounded-t-xl p-6 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            data-testid={`button-toggle-${title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <CardTitle>{title}</CardTitle>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className={contentClassName}>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

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
    date: todayIso(),
    readMinutes: 3,
    excerpt: "",
    body: "",
    faqTitle: "Frequently Asked Questions",
    faqDescription: "",
    faqItems: [],
    imageUrl: "",
    staticImage: "",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    noindex: false,
  };
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

function bodyToBlocks(body: string): BlogBlock[] {
  return body
    .split(/\n{2,}/)
    .flatMap((section) =>
      section
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .map((line) => {
      if (line.startsWith("### ")) return { type: "h3" as const, text: line.slice(4).trim() };
      if (line.startsWith("## ")) return { type: "h2" as const, text: line.slice(3).trim() };
      if (line.startsWith("- ")) return { type: "li" as const, text: line.slice(2).trim() };
      return { type: "p" as const, text: line };
    })
    .filter((block) => block.text);
}

function draftFromPage(page: CmsPage): BlogDraft {
  const content = getObject(page.content);
  const landscape = getObject(content.landscape);
  const data = getObject(landscape.data);
  const blog = getObject(content.blog);
  const category = data.category === "commercial" ? "commercial" : "residential";
  const bodyText = typeof blog.bodyText === "string" ? blog.bodyText : blocksToBody(data.blocks);
  const splitBody = splitBlogFaqBlocks(bodyToBlocks(bodyText));
  const hasExplicitFaq = Boolean(
    data.faq && typeof data.faq === "object" && !Array.isArray(data.faq),
  );
  const explicitFaq = getObject(data.faq);
  const explicitItems = Array.isArray(explicitFaq.items)
    ? explicitFaq.items.map((value) => {
        const item = getObject(value);
        return {
          question: typeof item.question === "string" ? item.question : "",
          answer: typeof item.answer === "string" ? item.answer : "",
        };
      })
    : [];
  const faqTitle = hasExplicitFaq
    ? typeof explicitFaq.title === "string"
      ? explicitFaq.title
      : "Frequently Asked Questions"
    : splitBody.faq?.title || "Frequently Asked Questions";
  const faqDescription = hasExplicitFaq
    ? typeof explicitFaq.description === "string"
      ? explicitFaq.description
      : ""
    : splitBody.faq?.description || "";
  const faqItems = hasExplicitFaq ? explicitItems : splitBody.faq?.items || [];

  return {
    title: page.title || (typeof data.h1 === "string" ? data.h1 : ""),
    slug: page.slug || (typeof data.slug === "string" ? data.slug : ""),
    authorName: typeof blog.authorName === "string" ? blog.authorName : DEFAULT_AUTHOR,
    category,
    tags: Array.isArray(blog.tags)
      ? blog.tags.filter((tag): tag is string => typeof tag === "string").join(", ")
      : "",
    date: typeof data.date === "string" ? data.date : todayIso(),
    readMinutes: typeof data.readMinutes === "number" ? data.readMinutes : 3,
    excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
    body: splitBody.faq ? blocksToBody(splitBody.blocks) : bodyText,
    faqTitle,
    faqDescription,
    faqItems,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    staticImage: typeof data.image === "string" ? data.image : "",
    status: page.status === "published" ? "published" : "draft",
    seoTitle: page.seoTitle || (typeof data.titleTag === "string" ? data.titleTag : ""),
    seoDescription:
      page.seoDescription || (typeof data.metaDescription === "string" ? data.metaDescription : ""),
    seoKeywords: page.seoKeywords || "",
    noindex: Boolean(page.noindex),
  };
}

function buildPagePayload(draft: BlogDraft) {
  const slug = normalizeSlug(draft.slug || draft.title);
  const title = draft.title.trim();
  const excerpt = draft.excerpt.trim();
  const seoTitle = draft.seoTitle.trim() || `${title} | Carolina Exterior`;
  const seoDescription = draft.seoDescription.trim() || excerpt;
  const tags = draft.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const blocks = bodyToBlocks(draft.body);
  const faq = {
    title: draft.faqTitle.trim() || "Frequently Asked Questions",
    description: draft.faqDescription.trim(),
    items: draft.faqItems.map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    })),
  };

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
          blocks,
          faq,
          category: draft.category,
          date: draft.date,
          readMinutes: Math.max(1, Number(draft.readMinutes) || 1),
          excerpt,
          image: draft.imageUrl ? "" : draft.staticImage,
          imageUrl: draft.imageUrl,
        },
      },
      blog: {
        authorName: draft.authorName.trim() || DEFAULT_AUTHOR,
        tags,
        bodyText: draft.body,
      },
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

  const payload = useMemo(() => buildPagePayload(draft), [draft]);
  const canSave = payload.title.trim().length > 0 && payload.slug.trim().length > 0 && !isReadOnly;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = isNew
        ? await apiRequest("POST", "/api/admin/cms/pages", payload)
        : await apiRequest("PUT", `/api/admin/cms/pages/${params.id}`, payload);
      return response.json() as Promise<CmsPage>;
    },
    onSuccess: (savedPage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/blog-posts"] });
      toast({ title: draft.status === "published" ? "Blog post published" : "Blog post saved" });
      if (isNew) navigate(`/admin/cms/blog/${savedPage.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save blog post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDraft = <K extends keyof BlogDraft>(key: K, value: BlogDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const addFaqItem = () => {
    setDraft((current) => ({
      ...current,
      faqItems: [...current.faqItems, { question: "", answer: "" }],
    }));
  };

  const updateFaqItem = (index: number, key: keyof BlogFaqItem, value: string) => {
    setDraft((current) => ({
      ...current,
      faqItems: current.faqItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const removeFaqItem = (index: number) => {
    setDraft((current) => ({
      ...current,
      faqItems: current.faqItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleTitleChange = (title: string) => {
    setDraft((current) => ({
      ...current,
      title,
      slug: slugEdited ? current.slug : normalizeSlug(title),
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
      <div className="mx-auto max-w-5xl space-y-6 p-4 pb-28 sm:p-6 sm:pb-6">
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
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2"
              onClick={() => navigate("/admin/cms/blog")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Blog
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-heading font-semibold">
                {draft.title || "New Blog Post"}
              </h1>
              <Badge variant={draft.status === "published" ? "default" : "outline"}>
                {draft.status === "published" ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Simple article editor. Saved content is the same structured CMS data the website
              renders.
            </p>
          </div>
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <Label htmlFor="blog-status" className="sr-only">
              Post Status
            </Label>
            <Select
              value={draft.status}
              onValueChange={(value) => updateDraft("status", value as BlogDraft["status"])}
              disabled={isReadOnly}
            >
              <SelectTrigger
                id="blog-status"
                className="w-[145px]"
                data-testid="select-blog-status"
              >
                <SelectValue aria-label="Post Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => window.open(`/blog/${payload.slug}`, "_blank")}
              disabled={!payload.slug}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Live
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!canSave || saveMutation.isPending}
              data-testid="button-save-blog-post"
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Post
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content" className="min-w-0">
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <TabsList className="w-max min-w-full justify-start sm:min-w-0">
              <TabsTrigger value="content">
                <FileText className="mr-2 h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="media">
                <ImageIcon className="mr-2 h-4 w-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="seo">
                <Search className="mr-2 h-4 w-4" />
                SEO
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="content" className="space-y-6">
            <CollapsibleEditorCard title="Post Details" contentClassName="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="blog-title">Title</Label>
                <Input
                  id="blog-title"
                  value={draft.title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  disabled={isReadOnly}
                  data-testid="input-blog-title"
                />
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
                <p className="text-xs text-muted-foreground">
                  Public URL: /blog/{payload.slug || "new-post"}
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="blog-author">Author Name</Label>
                  <Input
                    id="blog-author"
                    value={draft.authorName}
                    onChange={(event) => updateDraft("authorName", event.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="blog-date">Published Date</Label>
                  <Input
                    id="blog-date"
                    type="date"
                    value={draft.date}
                    onChange={(event) => updateDraft("date", event.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={draft.category}
                    onValueChange={(value) => updateDraft("category", value as BlogCategory)}
                    disabled={isReadOnly}
                  >
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
                  <Input
                    id="blog-read-minutes"
                    type="number"
                    min={1}
                    value={draft.readMinutes}
                    onChange={(event) => updateDraft("readMinutes", Number(event.target.value))}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="blog-tags">Tags</Label>
                <Input
                  id="blog-tags"
                  value={draft.tags}
                  onChange={(event) => updateDraft("tags", event.target.value)}
                  placeholder="mulch, lawn care, seasonal tips"
                  disabled={isReadOnly}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="blog-excerpt">Excerpt</Label>
                <Textarea
                  id="blog-excerpt"
                  value={draft.excerpt}
                  onChange={(event) => updateDraft("excerpt", event.target.value)}
                  className="min-h-24"
                  disabled={isReadOnly}
                  data-testid="textarea-blog-excerpt"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="blog-body">Body Content</Label>
                <Textarea
                  id="blog-body"
                  value={draft.body}
                  onChange={(event) => updateDraft("body", event.target.value)}
                  className="min-h-[420px] font-mono text-sm leading-6"
                  disabled={isReadOnly}
                  data-testid="textarea-blog-body"
                />
                <p className="text-xs text-muted-foreground">
                  Use blank lines between paragraphs. Optional headings: ## Heading or ### Heading.
                </p>
              </div>
            </CollapsibleEditorCard>

            <CollapsibleEditorCard title="FAQ" contentClassName="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="blog-faq-title">Title</Label>
                <Input
                  id="blog-faq-title"
                  value={draft.faqTitle}
                  onChange={(event) => updateDraft("faqTitle", event.target.value)}
                  placeholder="Frequently Asked Questions"
                  disabled={isReadOnly}
                  data-testid="input-blog-faq-title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="blog-faq-description">Description</Label>
                <Textarea
                  id="blog-faq-description"
                  value={draft.faqDescription}
                  onChange={(event) => updateDraft("faqDescription", event.target.value)}
                  placeholder="Optional supporting text shown below the FAQ title."
                  className="min-h-20"
                  disabled={isReadOnly}
                  data-testid="textarea-blog-faq-description"
                />
              </div>

              <div className="grid gap-4">
                {draft.faqItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                    No questions yet. Add a question to include an FAQ section at the bottom of this
                    post.
                  </div>
                ) : null}

                {draft.faqItems.map((item, index) => (
                  <div key={index} className="grid gap-4 rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Question {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFaqItem(index)}
                        disabled={isReadOnly}
                        aria-label={`Remove question ${index + 1}`}
                        data-testid={`button-remove-blog-faq-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`blog-faq-question-${index}`}>Question</Label>
                      <Input
                        id={`blog-faq-question-${index}`}
                        value={item.question}
                        onChange={(event) => updateFaqItem(index, "question", event.target.value)}
                        disabled={isReadOnly}
                        data-testid={`input-blog-faq-question-${index}`}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`blog-faq-answer-${index}`}>Answer</Label>
                      <Textarea
                        id={`blog-faq-answer-${index}`}
                        value={item.answer}
                        onChange={(event) => updateFaqItem(index, "answer", event.target.value)}
                        className="min-h-28"
                        disabled={isReadOnly}
                        data-testid={`textarea-blog-faq-answer-${index}`}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addFaqItem}
                  disabled={isReadOnly}
                  data-testid="button-add-blog-faq"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
                <p className="text-xs text-muted-foreground">
                  Complete question-and-answer pairs are rendered as an accordion and included in
                  FAQPage structured data.
                </p>
              </div>
            </CollapsibleEditorCard>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <CollapsibleEditorCard title="Cover Image">
              <CmsImageUpload
                value={draft.imageUrl}
                onChange={(url) => updateDraft("imageUrl", url)}
                helpText="Displayed at the top of the article and on blog cards."
                data-testid="upload-blog-cover"
              />
            </CollapsibleEditorCard>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <CollapsibleEditorCard title="Search Metadata" contentClassName="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="blog-seo-title">SEO Title</Label>
                <Input
                  id="blog-seo-title"
                  value={draft.seoTitle}
                  onChange={(event) => updateDraft("seoTitle", event.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="blog-seo-description">SEO Description</Label>
                <Textarea
                  id="blog-seo-description"
                  value={draft.seoDescription}
                  onChange={(event) => updateDraft("seoDescription", event.target.value)}
                  className="min-h-28"
                  disabled={isReadOnly}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="blog-seo-keywords">SEO Keywords</Label>
                <Input
                  id="blog-seo-keywords"
                  value={draft.seoKeywords}
                  onChange={(event) => updateDraft("seoKeywords", event.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="blog-noindex" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Allow search indexing
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Turn off only for drafts or private articles.
                  </p>
                </div>
                <Switch
                  id="blog-noindex"
                  checked={!draft.noindex}
                  onCheckedChange={(checked) => updateDraft("noindex", !checked)}
                  disabled={isReadOnly}
                />
              </div>
            </CollapsibleEditorCard>
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Label htmlFor="mobile-blog-status" className="sr-only">
            Post status
          </Label>
          <Select
            value={draft.status}
            onValueChange={(value) => updateDraft("status", value as BlogDraft["status"])}
            disabled={isReadOnly}
          >
            <SelectTrigger
              id="mobile-blog-status"
              className="h-11 w-[112px] shrink-0"
              data-testid="select-mobile-blog-status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => window.open(`/blog/${payload.slug}`, "_blank")}
            disabled={!payload.slug}
            aria-label="View live blog post"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            className="h-11 min-w-0 flex-1"
            onClick={() => saveMutation.mutate()}
            disabled={!canSave || saveMutation.isPending}
            data-testid="button-mobile-save-blog-post"
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saveMutation.isPending ? "Saving…" : "Save Post"}
          </Button>
        </div>
      </div>
    </AdminSidebar>
  );
}
