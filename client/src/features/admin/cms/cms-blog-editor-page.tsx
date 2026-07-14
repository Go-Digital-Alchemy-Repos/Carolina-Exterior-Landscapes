import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { ImagePositionPicker } from "@/features/admin/cms/components/image-position-picker";
import { CmsRichTextEditor } from "@/features/admin/cms/builder/cms-rich-text-editor";
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
import type { CmsPage } from "@shared/schema";

type BlogCategory = "residential" | "commercial";
type BlogBlock = { type: "h2" | "h3" | "p" | "li"; text: string };
type BlogFaqItem = { question: string; answer: string };
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
    date: "",
    readMinutes: 3,
    excerpt: "",
    body: "",
    faqTitle: "Frequently Asked Questions",
    faqDescription: "",
    faqItems: [],
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
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function positionValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : 50;
}

function dateTimeLocalValue(value: Date | string | null | undefined) {
  if (!value) return "";
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
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
  return blocks
    .map((block) => {
      const item = getObject(block);
      const text = typeof item.text === "string" ? escapeHtml(item.text.trim()) : "";
      if (!text) return "";
      if (item.type === "h2") return `<h2>${text}</h2>`;
      if (item.type === "h3") return `<h3>${text}</h3>`;
      if (item.type === "li") return `<ul><li>${text}</li></ul>`;
      return `<p>${text}</p>`;
    })
    .filter(Boolean)
    .join("");
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

function faqItemsFrom(value: unknown): BlogFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const item = getObject(entry);
    return {
      question: typeof item.question === "string" ? item.question : "",
      answer: typeof item.answer === "string" ? item.answer : "",
    };
  });
}

function extractLegacyFaqFromHtml(bodyHtml: string): {
  bodyHtml: string;
  faq: { title: string; description: string; items: BlogFaqItem[] } | null;
} {
  const headingPattern = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let faqHeading: RegExpExecArray | null = null;
  let headingMatch: RegExpExecArray | null;

  while ((headingMatch = headingPattern.exec(bodyHtml))) {
    if (/\bfaq\b|frequently asked/i.test(htmlToPlainText(headingMatch[1]))) {
      faqHeading = headingMatch;
      break;
    }
  }

  if (!faqHeading || faqHeading.index === undefined) return { bodyHtml, faq: null };

  const nextHeading = headingPattern.exec(bodyHtml);
  const sectionEnd = nextHeading?.index ?? bodyHtml.length;
  const sectionStart = faqHeading.index + faqHeading[0].length;
  const sectionHtml = bodyHtml.slice(sectionStart, sectionEnd);
  const questionPattern = /<h3\b[^>]*>([\s\S]*?)<\/h3>/gi;
  const questions = Array.from(sectionHtml.matchAll(questionPattern));
  if (questions.length === 0) return { bodyHtml, faq: null };

  const items = questions
    .map((question, index) => {
      const answerStart = (question.index ?? 0) + question[0].length;
      const answerEnd = questions[index + 1]?.index ?? sectionHtml.length;
      return {
        question: htmlToPlainText(question[1]),
        answer: sectionHtml.slice(answerStart, answerEnd).trim(),
      };
    })
    .filter((item) => item.question && htmlToPlainText(item.answer));

  if (items.length !== questions.length) return { bodyHtml, faq: null };

  return {
    bodyHtml: `${bodyHtml.slice(0, faqHeading.index)}${bodyHtml.slice(sectionEnd)}`.trim(),
    faq: {
      title: htmlToPlainText(faqHeading[1]) || "Frequently Asked Questions",
      description: sectionHtml.slice(0, questions[0].index ?? 0).trim(),
      items,
    },
  };
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

export function draftFromPage(page: CmsPage): BlogDraft {
  const content = getObject(page.content);
  const landscape = getObject(content.landscape);
  const data = getObject(landscape.data);
  const blog = getObject(content.blog);
  const builderBlocks = Array.isArray(content.blocks) ? content.blocks : [];
  const heroBlock = builderBlocks.map(getObject).find((block) => block.type === "hero");
  const heroProps = getObject(heroBlock?.props);
  const faqBlock = builderBlocks.map(getObject).find((block) => block.type === "faq");
  const faqProps = getObject(faqBlock?.props);
  const category = data.category === "commercial" ? "commercial" : "residential";
  const bodyText = typeof blog.bodyText === "string" ? blog.bodyText : "";
  const bodyHtml =
    typeof blog.bodyHtml === "string" ? blog.bodyHtml : legacyBodyToHtml(bodyText, data.blocks);
  const legacyFaq = extractLegacyFaqFromHtml(bodyHtml);
  const savedFaq = getObject(blog.faq);
  const hasSavedFaq = Boolean(blog.faq && typeof blog.faq === "object" && !Array.isArray(blog.faq));
  const faqSource = hasSavedFaq ? savedFaq : faqBlock ? faqProps : getObject(legacyFaq.faq);

  return {
    title: page.title || (typeof data.h1 === "string" ? data.h1 : ""),
    slug: page.slug || (typeof data.slug === "string" ? data.slug : ""),
    authorName: typeof blog.authorName === "string" ? blog.authorName : DEFAULT_AUTHOR,
    category,
    tags: Array.isArray(blog.tags)
      ? blog.tags.filter((tag): tag is string => typeof tag === "string").join(", ")
      : "",
    date: page.publishedAt
      ? format(new Date(page.publishedAt), "yyyy-MM-dd")
      : typeof data.date === "string"
        ? data.date
        : todayIso(),
    readMinutes: typeof data.readMinutes === "number" ? data.readMinutes : 3,
    excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
    body: legacyFaq.bodyHtml,
    faqTitle: typeof faqSource.title === "string" ? faqSource.title : "Frequently Asked Questions",
    faqDescription:
      typeof faqSource.description === "string"
        ? faqSource.description
        : typeof faqSource.subtext === "string"
          ? faqSource.subtext
          : "",
    faqItems: faqItemsFrom(faqSource.items),
    heroEyebrow: typeof heroProps.eyebrow === "string" ? heroProps.eyebrow : "Landscape Journal",
    heroHeading: typeof heroProps.heading === "string" ? heroProps.heading : page.title,
    heroSubheading:
      typeof heroProps.subheading === "string"
        ? heroProps.subheading
        : typeof data.excerpt === "string"
          ? `<p>${escapeHtml(data.excerpt)}</p>`
          : "",
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    imagePositionX: positionValue(data.imagePositionX),
    imagePositionY: positionValue(data.imagePositionY),
    staticImage: typeof data.image === "string" ? data.image : "",
    status:
      page.status === "published"
        ? "published"
        : page.status === "scheduled"
          ? "scheduled"
          : "draft",
    scheduledAt: dateTimeLocalValue(page.scheduledAt),
    seoTitle: page.seoTitle || (typeof data.titleTag === "string" ? data.titleTag : ""),
    seoDescription:
      page.seoDescription || (typeof data.metaDescription === "string" ? data.metaDescription : ""),
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
  const tags = draft.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const existingContent = getObject(currentContent);
  const existingBuilderBlocks = Array.isArray(existingContent.blocks) ? existingContent.blocks : [];
  const existingHero = existingBuilderBlocks.map(getObject).find((block) => block.type === "hero");
  const existingFaq = existingBuilderBlocks.map(getObject).find((block) => block.type === "faq");
  const preservedCtas = existingBuilderBlocks
    .map(getObject)
    .filter((block) => block.type === "cta");
  const faqItems = draft.faqItems.map((item) => ({
    question: item.question.trim(),
    answer: item.answer.trim(),
  }));
  const completeFaqItems = faqItems.filter((item) => item.question && htmlToPlainText(item.answer));
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
    ...(completeFaqItems.length > 0
      ? [
          {
            ...existingFaq,
            id: typeof existingFaq?.id === "string" ? existingFaq.id : `${slug}-faq`,
            type: "faq",
            props: {
              ...getObject(existingFaq?.props),
              title: draft.faqTitle.trim() || "Frequently Asked Questions",
              subtext: draft.faqDescription,
              items: completeFaqItems,
            },
          },
        ]
      : []),
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
        faq: { title: draft.faqTitle, description: draft.faqDescription, items: faqItems },
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

  const payload = useMemo(
    () => ({
      ...buildPagePayload(draft, page?.content),
      status: draft.status === "scheduled" ? "draft" : draft.status,
    }),
    [draft, page?.content],
  );
  const canSave = payload.title.trim().length > 0 && payload.slug.trim().length > 0 && !isReadOnly;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = isNew
        ? await apiRequest("POST", "/api/admin/cms/pages", payload)
        : await apiRequest("PUT", `/api/admin/cms/pages/${params.id}`, payload);
      let savedPage = (await response.json()) as CmsPage;

      if (draft.status === "scheduled") {
        const scheduledAt = new Date(draft.scheduledAt);
        if (
          !draft.scheduledAt ||
          Number.isNaN(scheduledAt.getTime()) ||
          scheduledAt <= new Date()
        ) {
          throw new Error("Choose a valid future publication date and time.");
        }
        const scheduledResponse = await apiRequest(
          "POST",
          `/api/admin/cms/pages/${savedPage.id}/schedule`,
          {
            scheduledAt: scheduledAt.toISOString(),
          },
        );
        savedPage = (await scheduledResponse.json()) as CmsPage;
      } else if (draft.status === "published" && publishDateEdited && draft.date) {
        const publicationResponse = await apiRequest(
          "PUT",
          `/api/admin/cms/pages/${savedPage.id}/publication-date`,
          {
            publishedAt: `${draft.date}T12:00:00.000Z`,
          },
        );
        savedPage = (await publicationResponse.json()) as CmsPage;
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
        date: savedPage.publishedAt
          ? format(new Date(savedPage.publishedAt), "yyyy-MM-dd")
          : current.date,
        scheduledAt: dateTimeLocalValue(savedPage.scheduledAt),
      }));
      toast({
        title:
          draft.status === "published"
            ? "Blog post published"
            : draft.status === "scheduled"
              ? "Blog post scheduled"
              : "Blog post saved",
      });
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

  const addFaqItem = () =>
    setDraft((current) => ({
      ...current,
      faqItems: [...current.faqItems, { question: "", answer: "" }],
    }));

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
      heroHeading:
        !current.heroHeading || current.heroHeading === current.title ? title : current.heroHeading,
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
          <div className="hidden space-y-2 sm:block">
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
                {draft.status === "published"
                  ? "Published"
                  : draft.status === "scheduled"
                    ? "Scheduled"
                    : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Simple article editor. Saved content is the same structured CMS data the website
              renders.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
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
            {draft.status === "scheduled" ? (
              <div className="ml-auto grid max-w-xs gap-1.5">
                <Label htmlFor="blog-scheduled-at" className="text-xs">
                  Publish On
                </Label>
                <Input
                  id="blog-scheduled-at"
                  type="datetime-local"
                  value={draft.scheduledAt}
                  min={dateTimeLocalValue(new Date())}
                  onChange={(event) => updateDraft("scheduledAt", event.target.value)}
                  disabled={isReadOnly}
                  data-testid="input-blog-scheduled-at"
                />
              </div>
            ) : null}
          </div>
        </div>

        <Tabs defaultValue="content">
          <TabsList className="flex h-auto w-full justify-start overflow-x-auto sm:w-auto">
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

          <TabsContent value="content" className="space-y-6">
            <CollapsibleEditorCard title="Hero Content" contentClassName="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="blog-hero-eyebrow">Eyebrow</Label>
                <Input
                  id="blog-hero-eyebrow"
                  value={draft.heroEyebrow}
                  onChange={(event) => updateDraft("heroEyebrow", event.target.value)}
                  disabled={isReadOnly}
                  data-testid="input-blog-hero-eyebrow"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="blog-hero-heading">Heading</Label>
                <Input
                  id="blog-hero-heading"
                  value={draft.heroHeading}
                  onChange={(event) => updateDraft("heroHeading", event.target.value)}
                  disabled={isReadOnly}
                  data-testid="input-blog-hero-heading"
                />
              </div>
              <div className="grid gap-2">
                <Label>Supporting Copy</Label>
                <CmsRichTextEditor
                  value={draft.heroSubheading}
                  onChange={(heroSubheading) => updateDraft("heroSubheading", heroSubheading)}
                  disabled={isReadOnly}
                  placeholder="Add supporting copy beneath the hero heading..."
                  data-testid="editor-blog-hero-subheading"
                />
              </div>
            </CollapsibleEditorCard>

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
                    max={todayIso()}
                    onChange={(event) => {
                      updateDraft("date", event.target.value);
                      setPublishDateEdited(true);
                    }}
                    disabled={isReadOnly}
                  />
                  <p className="text-xs text-muted-foreground">
                    {page?.publishedAt
                      ? "Defaults to the actual go-live date. Change it here when the public date needs correction."
                      : "Set automatically when first published unless you enter a date."}
                  </p>
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
                <Label>Body Content</Label>
                <div className="[&_.ProseMirror]:min-h-[420px]">
                  <CmsRichTextEditor
                    value={draft.body}
                    onChange={(body) => updateDraft("body", body)}
                    disabled={isReadOnly}
                    placeholder="Write the article content..."
                    data-testid="editor-blog-body"
                  />
                </div>
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
                <Label>Description</Label>
                <CmsRichTextEditor
                  value={draft.faqDescription}
                  onChange={(faqDescription) => updateDraft("faqDescription", faqDescription)}
                  disabled={isReadOnly}
                  placeholder="Optional supporting text shown below the FAQ title..."
                  data-testid="editor-blog-faq-description"
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
                      <Label>Answer</Label>
                      <CmsRichTextEditor
                        value={item.answer}
                        onChange={(answer) => updateFaqItem(index, "answer", answer)}
                        disabled={isReadOnly}
                        placeholder="Answer the question..."
                        data-testid={`editor-blog-faq-answer-${index}`}
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
                  Complete question-and-answer pairs render as a bottom-of-post accordion and are
                  included in FAQPage structured data.
                </p>
              </div>
            </CollapsibleEditorCard>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <CollapsibleEditorCard title="Cover Image">
              <CmsImageUpload
                value={draft.imageUrl}
                onChange={(imageUrl) =>
                  setDraft((current) => ({
                    ...current,
                    imageUrl,
                    imagePositionX: imageUrl === current.imageUrl ? current.imagePositionX : 50,
                    imagePositionY: imageUrl === current.imageUrl ? current.imagePositionY : 50,
                  }))
                }
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

        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur sm:hidden">
          {draft.status === "scheduled" ? (
            <Input
              aria-label="Publish on"
              type="datetime-local"
              value={draft.scheduledAt}
              min={dateTimeLocalValue(new Date())}
              onChange={(event) => updateDraft("scheduledAt", event.target.value)}
              disabled={isReadOnly}
              className="mb-2"
            />
          ) : null}
          <div className="mx-auto flex max-w-5xl items-center gap-2">
            <Select
              value={draft.status}
              onValueChange={(value) => updateDraft("status", value as BlogDraft["status"])}
              disabled={isReadOnly}
            >
              <SelectTrigger className="min-w-0 flex-1" aria-label="Post status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(`/blog/${payload.slug}`, "_blank")}
              disabled={!payload.slug}
              aria-label="View live"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!canSave || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>
    </AdminSidebar>
  );
}
