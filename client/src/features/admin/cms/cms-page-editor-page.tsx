import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { CmsImageUpload } from "./components/cms-image-upload";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "@/features/admin/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { SeoPreview } from "@/components/shared/seo-preview";
import { StructuredDataStatus } from "@/components/shared/structured-data-status";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { EditorSaveIndicator } from "@/components/shared/editor-save-indicator";
import { EditorLockBanner } from "@/components/shared/editor-lock-banner";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Globe,
  Clock,
  CalendarClock,
  Info,
  Eye,
  EyeOff,
  Layers,
  RotateCcw,
  Loader2,
  LayoutTemplate,
  Check,
  Copy,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CmsPage, CmsPageRevision, CmsSidebar } from "@shared/schema";
import { format } from "date-fns";
import { PageBuilder } from "./builder/page-builder";
import type { BuilderContent } from "./builder/block-registry";
import { normalizeBuilderPlainTextFields } from "./builder/block-content-normalization";
import { reportBuilderRenderError } from "./builder/builder-diagnostics";
import { TemplatePicker } from "./components/template-picker";
import { LandingPageWizard } from "./components/landing-page-wizard";
import { analyzeCmsPageQuality } from "@/lib/cms-page-quality";
import { useEditorLock } from "@/hooks/use-editor-lock";
import { useLockConflictGuard } from "@/hooks/use-lock-conflict-guard";
import { useEditorSaveState } from "@/hooks/use-editor-save-state";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";

const editorSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-/]+$/, "Lowercase letters, numbers, hyphens and slashes only"),
  pageType: z.enum([
    "home",
    "landing",
    "service",
    "service-hub",
    "service-area",
    "location",
    "blog-index",
    "blog-post",
    "custom",
  ]),
  template: z.enum(["full-width", "with-sidebar"]).default("full-width"),
  sidebarId: z.string().default(""),
  status: z.enum(["draft", "published", "scheduled", "archived"]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  ogImageUrl: z.string().optional(),
  canonicalUrl: z
    .string()
    .refine(
      (value) => value === "" || value.startsWith("/") || z.string().url().safeParse(value).success,
      {
        message: "Must be a valid URL or root-relative path",
      },
    )
    .optional(),
  noindex: z.boolean().default(false),
});

type EditorForm = z.infer<typeof editorSchema>;

function normalizeEditorTemplate(template: unknown): EditorForm["template"] {
  return template === "with-sidebar" ? "with-sidebar" : "full-width";
}

function firstValidationMessage(errors: FieldErrors<EditorForm>): string | null {
  const firstError = Object.values(errors)[0];
  const message = firstError?.message;
  return typeof message === "string" ? message : null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const EMPTY_CONTENT: BuilderContent = { blocks: [] };
const LANDSCAPE_SOURCE = "carolina-landscape-v1";

type EditorMode = "page" | "blog";
type BlogMeta = {
  category: "residential" | "commercial";
  date: string;
  excerpt: string;
  readMinutes: number;
  imageUrl: string;
};

function todayInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getContentRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function getLandscapeData(raw: unknown): Record<string, unknown> {
  const content = getContentRecord(raw);
  const landscape = getContentRecord(content.landscape);
  return getContentRecord(landscape.data);
}

function getBlogMetaFromContent(raw: unknown): BlogMeta {
  const data = getLandscapeData(raw);
  const category = data.category === "commercial" ? "commercial" : "residential";
  return {
    category,
    date: typeof data.date === "string" && data.date ? data.date : todayInputDate(),
    excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
    readMinutes:
      typeof data.readMinutes === "number" && Number.isFinite(data.readMinutes)
        ? data.readMinutes
        : 5,
    imageUrl:
      typeof data.imageUrl === "string"
        ? data.imageUrl
        : typeof getContentRecord(data.media).heroImageUrl === "string"
          ? (getContentRecord(data.media).heroImageUrl as string)
          : "",
  };
}

function buildBlogLandscapeContent(
  existingContent: unknown,
  builderContent: BuilderContent,
  formData: EditorForm,
  blogMeta: BlogMeta,
): Record<string, unknown> {
  const existing = getContentRecord(existingContent);
  const landscape = getContentRecord(existing.landscape);
  const existingData = getContentRecord(landscape.data);
  const media = {
    ...getContentRecord(existingData.media),
    ...(blogMeta.imageUrl ? { heroImageUrl: blogMeta.imageUrl, heroImageAlt: formData.title } : {}),
  };

  return {
    ...existing,
    source: LANDSCAPE_SOURCE,
    landscape: {
      ...landscape,
      kind: "blog",
      path: `/blog/${formData.slug}`,
      data: {
        ...existingData,
        slug: formData.slug,
        h1: formData.title,
        titleTag: formData.seoTitle || `${formData.title} | Carolina Exterior Landscapes`,
        metaDescription: formData.seoDescription || blogMeta.excerpt,
        primaryKeyword:
          typeof existingData.primaryKeyword === "string" ? existingData.primaryKeyword : "",
        secondaryKeywords: Array.isArray(existingData.secondaryKeywords)
          ? existingData.secondaryKeywords
          : [],
        schemaType: "BlogPosting",
        wordCountTarget:
          typeof existingData.wordCountTarget === "string" ? existingData.wordCountTarget : "",
        category: blogMeta.category,
        date: blogMeta.date,
        readMinutes: blogMeta.readMinutes,
        excerpt: blogMeta.excerpt,
        image: typeof existingData.image === "string" ? existingData.image : "",
        imageUrl: blogMeta.imageUrl,
        media,
      },
    },
    blocks: builderContent.blocks,
  };
}

function parseBuilderContent(raw: unknown): BuilderContent {
  if (!raw || typeof raw !== "object") return EMPTY_CONTENT;
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.blocks)) {
    return { blocks: obj.blocks as BuilderContent["blocks"] };
  }
  return EMPTY_CONTENT;
}

function mergeBuilderContentForSave(
  existingContent: unknown,
  builderContent: BuilderContent,
): BuilderContent | Record<string, unknown> {
  if (!existingContent || typeof existingContent !== "object") return builderContent;
  const existing = existingContent as Record<string, unknown>;
  if (existing.source !== "carolina-landscape-v1" && !existing.landscape) return builderContent;
  return {
    ...existing,
    blocks: builderContent.blocks,
  };
}

export default function CmsPageEditorPage({ mode = "page" }: { mode?: EditorMode }) {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const isNew = !id || id === "new";
  const isBlogMode = mode === "blog";
  const collectionPath = isBlogMode ? "/admin/cms/blog" : "/admin/cms/pages";
  const contentLabel = isBlogMode ? "Blog Post" : "Page";
  const contentLabelLower = isBlogMode ? "blog post" : "page";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const titleRef = useRef<string>("");
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slugManuallyEdited = useRef(false);
  const [builderContent, setBuilderContent] = useState<BuilderContent>(EMPTY_CONTENT);
  const [savedBuilderSnapshot, setSavedBuilderSnapshot] = useState(() =>
    JSON.stringify(EMPTY_CONTENT),
  );
  const [activeTab, setActiveTab] = useState("builder");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(isNew);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [blogMeta, setBlogMeta] = useState<BlogMeta>(() => getBlogMetaFromContent(null));
  const [savedBlogMetaSnapshot, setSavedBlogMetaSnapshot] = useState(() =>
    JSON.stringify(getBlogMetaFromContent(null)),
  );

  const { data: page, isLoading: pageLoading } = useQuery<CmsPage>({
    queryKey: ["/api/admin/cms/pages", id],
    queryFn: () =>
      fetch(`/api/admin/cms/pages/${id}`, { credentials: "include" }).then((r) => r.json()),
    enabled: !isNew,
  });

  const { data: revisions = [] } = useQuery<CmsPageRevision[]>({
    queryKey: ["/api/admin/cms/pages", id, "revisions"],
    queryFn: () =>
      fetch(`/api/admin/cms/pages/${id}/revisions`, { credentials: "include" }).then((r) =>
        r.json(),
      ),
    enabled: !isNew,
  });

  const { data: sidebars = [] } = useQuery<CmsSidebar[]>({
    queryKey: ["/api/admin/cms/sidebars"],
  });

  const editorLock = useEditorLock({
    resourceType: "cms_page",
    resourceId: isNew ? null : (page?.id ?? id ?? null),
    enabled: !isNew,
  });

  const form = useForm<EditorForm>({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      title: "",
      slug: "",
      pageType: isBlogMode ? "blog-post" : "custom",
      template: "full-width",
      sidebarId: "",
      status: "draft",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      ogImageUrl: "",
      canonicalUrl: "",
      noindex: false,
    },
  });

  useEffect(() => {
    if (page) {
      form.reset({
        title: page.title,
        slug: page.slug,
        pageType: (page.pageType as EditorForm["pageType"]) ?? "custom",
        template: normalizeEditorTemplate(page.template),
        sidebarId: page.sidebarId ?? "",
        status: (page.status as EditorForm["status"]) ?? "draft",
        seoTitle: page.seoTitle ?? "",
        seoDescription: page.seoDescription ?? "",
        seoKeywords: page.seoKeywords ?? "",
        ogImageUrl: page.ogImageUrl ?? "",
        canonicalUrl: page.canonicalUrl ?? "",
        noindex: page.noindex ?? false,
      });
      const parsedContent = parseBuilderContent(page.content);
      setBuilderContent(parsedContent);
      setSavedBuilderSnapshot(JSON.stringify(parsedContent));
      if (isBlogMode || page.pageType === "blog-post") {
        const nextBlogMeta = getBlogMetaFromContent(page.content);
        setBlogMeta(nextBlogMeta);
        setSavedBlogMetaSnapshot(JSON.stringify(nextBlogMeta));
      }
    }
  }, [page, form, isBlogMode]);

  useLockConflictGuard({
    active: !isNew,
    resourceId: isNew ? null : (page?.id ?? id ?? null),
    resourceLabel: contentLabelLower,
    editorLock,
    onConflict: () => navigate(collectionPath),
  });

  const watchTitle = form.watch("title");
  const watchSlug = form.watch("slug");
  const watchSeoTitle = form.watch("seoTitle");
  const watchSeoDescription = form.watch("seoDescription");
  const watchOgImageUrl = form.watch("ogImageUrl");
  const watchNoindex = form.watch("noindex");
  const watchStatus = form.watch("status");
  const watchTemplate = form.watch("template");
  const watchSidebarId = form.watch("sidebarId");
  const hasFaqBlocks = (builderContent?.blocks ?? []).some((b: any) => b.type === "faq");

  useEffect(() => {
    if (isNew && !slugManuallyEdited.current && watchTitle !== titleRef.current) {
      titleRef.current = watchTitle;
      form.setValue("slug", slugify(watchTitle), { shouldValidate: false });
    }
  }, [watchTitle, isNew, form]);

  const handleBuilderChange = useCallback((content: BuilderContent) => {
    setBuilderContent(content);
  }, []);

  const applySavedState = useCallback(
    (data: EditorForm, content: BuilderContent) => {
      form.reset(data);
      setBuilderContent(content);
      setSavedBuilderSnapshot(JSON.stringify(content));
    },
    [form],
  );

  const createMutation = useMutation({
    mutationFn: (data: EditorForm & { content: unknown }) =>
      apiRequest("POST", "/api/admin/cms/pages", data),
    onSuccess: async (res, variables) => {
      const created: CmsPage = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/pages/by-slug", variables.slug] });
      if (variables.pageType === "blog-post")
        queryClient.invalidateQueries({ queryKey: ["/api/cms/blog-posts"] });
      toast({ title: `${contentLabel} created successfully` });
      setDraftPreviewUrl("");
      applySavedState(
        {
          title: variables.title,
          slug: variables.slug,
          pageType: variables.pageType,
          template: variables.template,
          sidebarId: variables.sidebarId ?? "",
          status: variables.status,
          seoTitle: variables.seoTitle ?? "",
          seoDescription: variables.seoDescription ?? "",
          seoKeywords: variables.seoKeywords ?? "",
          ogImageUrl: variables.ogImageUrl ?? "",
          canonicalUrl: variables.canonicalUrl ?? "",
          noindex: variables.noindex ?? false,
        },
        parseBuilderContent(variables.content),
      );
      setSavedBlogMetaSnapshot(JSON.stringify(getBlogMetaFromContent(variables.content)));
      saveState.markSaved();
      navTimerRef.current = setTimeout(() => navigate(`${collectionPath}/${created.id}`), 1500);
    },
    onError: (err: Error) => {
      toast({
        title: err.message || `Failed to create ${contentLabelLower}`,
        variant: "destructive",
      });
      saveState.markError();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditorForm & { content: unknown }) =>
      apiRequest("PUT", `/api/admin/cms/pages/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages", id, "revisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/pages/by-slug", variables.slug] });
      if (variables.pageType === "blog-post")
        queryClient.invalidateQueries({ queryKey: ["/api/cms/blog-posts"] });
      toast({ title: `${contentLabel} saved` });
      setDraftPreviewUrl("");
      applySavedState(
        {
          title: variables.title,
          slug: variables.slug,
          pageType: variables.pageType,
          template: variables.template,
          sidebarId: variables.sidebarId ?? "",
          status: variables.status,
          seoTitle: variables.seoTitle ?? "",
          seoDescription: variables.seoDescription ?? "",
          seoKeywords: variables.seoKeywords ?? "",
          ogImageUrl: variables.ogImageUrl ?? "",
          canonicalUrl: variables.canonicalUrl ?? "",
          noindex: variables.noindex ?? false,
        },
        parseBuilderContent(variables.content),
      );
      setSavedBlogMetaSnapshot(JSON.stringify(getBlogMetaFromContent(variables.content)));
      saveState.markSaved();
    },
    onError: (err: Error) => {
      toast({ title: err.message || "Failed to save page", variant: "destructive" });
      saveState.markError();
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/cms/pages/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages", id] });
      queryClient.invalidateQueries({
        queryKey: ["/api/cms/pages/by-slug", form.getValues("slug")],
      });
      if (form.getValues("pageType") === "blog-post")
        queryClient.invalidateQueries({ queryKey: ["/api/cms/blog-posts"] });
      toast({ title: `${contentLabel} published` });
    },
    onError: () => toast({ title: "Failed to publish page", variant: "destructive" }),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/cms/pages/${id}/unpublish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages", id] });
      queryClient.invalidateQueries({
        queryKey: ["/api/cms/pages/by-slug", form.getValues("slug")],
      });
      if (form.getValues("pageType") === "blog-post")
        queryClient.invalidateQueries({ queryKey: ["/api/cms/blog-posts"] });
      toast({ title: `${contentLabel} unpublished — reverted to draft` });
    },
    onError: () => toast({ title: "Failed to unpublish page", variant: "destructive" }),
  });

  const [scheduleDate, setScheduleDate] = useState("");
  const [schedulePopoverOpen, setSchedulePopoverOpen] = useState(false);
  const [mobileScheduleOpen, setMobileScheduleOpen] = useState(false);
  const [draftPreviewUrl, setDraftPreviewUrl] = useState("");

  const scheduleMutation = useMutation({
    mutationFn: (scheduledAt: string) =>
      apiRequest("POST", `/api/admin/cms/pages/${id}/schedule`, { scheduledAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages", id] });
      setSchedulePopoverOpen(false);
      setScheduleDate("");
      toast({ title: `${contentLabel} scheduled for publishing` });
    },
    onError: () => toast({ title: "Failed to schedule page", variant: "destructive" }),
  });

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const restoreMutation = useMutation({
    mutationFn: (revisionId: string) =>
      apiRequest("POST", `/api/admin/cms/pages/${id}/revisions/${revisionId}/restore`),
    onSuccess: async (res) => {
      const restored = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages", id, "revisions"] });
      setBuilderContent(parseBuilderContent(restored?.content));
      form.setValue("title", restored?.title ?? form.getValues("title"));
      setRestoringId(null);
      toast({ title: "Revision restored successfully" });
    },
    onError: () => {
      setRestoringId(null);
      toast({ title: "Failed to restore revision", variant: "destructive" });
    },
  });

  const previewLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", `/api/admin/cms/pages/${id}/preview-link`);
      return response.json() as Promise<{
        previewUrl: string;
        previewPath: string;
        expiresInHours: number;
      }>;
    },
    onSuccess: (result) => {
      setDraftPreviewUrl(result.previewUrl);
      toast({
        title: "Draft preview link ready",
        description: `This preview link is ready to use and will expire in ${result.expiresInHours} hours.`,
      });
    },
    onError: () => {
      toast({ title: "Could not generate preview link", variant: "destructive" });
    },
  });

  const openDraftPreview = async () => {
    try {
      const result = draftPreviewUrl
        ? { previewUrl: draftPreviewUrl }
        : await previewLinkMutation.mutateAsync();
      window.open(result.previewUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: "Could not open draft preview", variant: "destructive" });
    }
  };

  const copyDraftPreview = async () => {
    try {
      const result = draftPreviewUrl
        ? { previewUrl: draftPreviewUrl }
        : await previewLinkMutation.mutateAsync();
      await navigator.clipboard.writeText(result.previewUrl);
      toast({ title: "Draft preview link copied" });
    } catch {
      toast({ title: "Could not copy preview link", variant: "destructive" });
    }
  };

  const onSave = () => {
    form.handleSubmit(
      (formData) => {
        const normalizedContent = normalizeBuilderPlainTextFields(builderContent);
        const payload = {
          ...formData,
          pageType: isBlogMode ? ("blog-post" as const) : formData.pageType,
          template: normalizeEditorTemplate(formData.template),
          sidebarId: formData.template === "with-sidebar" ? formData.sidebarId || "" : "",
          content: isBlogMode
            ? buildBlogLandscapeContent(
                page?.content,
                normalizedContent,
                { ...formData, pageType: "blog-post" },
                blogMeta,
              )
            : mergeBuilderContentForSave(page?.content, normalizedContent),
        };
        if (isNew) {
          createMutation.mutate(payload);
        } else {
          updateMutation.mutate(payload);
        }
      },
      (errors) => {
        toast({
          title: `${contentLabel} could not be saved`,
          description:
            firstValidationMessage(errors) ?? "Review the highlighted fields and try again.",
          variant: "destructive",
        });
        saveState.markError();
      },
    )();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const builderDirty = useMemo(
    () => JSON.stringify(builderContent) !== savedBuilderSnapshot,
    [builderContent, savedBuilderSnapshot],
  );
  const blogMetaDirty = isBlogMode && JSON.stringify(blogMeta) !== savedBlogMetaSnapshot;
  const saveState = useEditorSaveState({
    isDirty: form.formState.isDirty || builderDirty || blogMetaDirty,
    isSaving: isPending,
  });
  const unsavedChangesGuard = useUnsavedChangesGuard({
    isDirty: form.formState.isDirty || builderDirty || blogMetaDirty,
    message: `You have unsaved changes to this ${contentLabelLower}. Leave without saving?`,
  });

  const confirmPageStatusAction = useCallback(
    (actionLabel: string, onProceed: () => void) =>
      unsavedChangesGuard.confirmIfDirty(
        onProceed,
        `You have unsaved changes to this ${contentLabelLower}. ${actionLabel} will use the last saved version, not your in-progress edits. Continue?`,
      ),
    [unsavedChangesGuard],
  );

  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  const qualityIssues = useMemo(
    () =>
      analyzeCmsPageQuality({
        title: form.getValues("title"),
        slug: form.getValues("slug"),
        status: watchStatus,
        template: watchTemplate,
        sidebarId: watchSidebarId,
        seoTitle: watchSeoTitle,
        seoDescription: watchSeoDescription,
        ogImageUrl: watchOgImageUrl,
        noindex: watchNoindex,
        blocks: builderContent.blocks,
      }),
    [
      builderContent.blocks,
      form,
      watchSidebarId,
      watchSlug,
      watchTitle,
      watchNoindex,
      watchOgImageUrl,
      watchSeoDescription,
      watchSeoTitle,
      watchStatus,
      watchTemplate,
    ],
  );

  const qualitySummary = useMemo(() => {
    const errors = qualityIssues.filter((issue) => issue.severity === "error").length;
    const warnings = qualityIssues.filter((issue) => issue.severity === "warning").length;
    const info = qualityIssues.filter((issue) => issue.severity === "info").length;
    return { errors, warnings, info };
  }, [qualityIssues]);

  if (!isNew && pageLoading) {
    return (
      <AdminSidebar>
        <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div
        className={cn(
          "mx-auto space-y-4 p-4 pb-28 sm:p-6 sm:pb-28 md:pb-6",
          activeTab === "builder" ? "max-w-[1800px]" : "max-w-6xl",
        )}
      >
        {editorLock.summary ? (
          <EditorLockBanner
            variant={editorLock.summary.variant}
            title={editorLock.summary.title}
            description={editorLock.summary.description}
            isLoading={editorLock.isLoading}
            onRefresh={editorLock.acquire}
          />
        ) : null}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                unsavedChangesGuard.confirmDiscardChanges(() => navigate(collectionPath))
              }
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1
                className="truncate text-xl font-heading font-semibold"
                data-testid="text-editor-title"
              >
                {isNew ? `Create ${contentLabel}` : form.watch("title") || `Edit ${contentLabel}`}
              </h1>
              {!isNew && page && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Last saved{" "}
                  {page.updatedAt
                    ? format(new Date(page.updatedAt), "MMM d, yyyy 'at' h:mm a")
                    : "—"}
                </p>
              )}
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {!isNew && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyDraftPreview()}
                  disabled={previewLinkMutation.isPending}
                  data-testid="button-copy-draft-preview"
                >
                  {previewLinkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1.5" />
                  )}
                  Copy Preview Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDraftPreview()}
                  disabled={previewLinkMutation.isPending}
                  data-testid="button-open-draft-preview"
                >
                  {previewLinkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                  )}
                  Draft Preview
                </Button>
              </>
            )}
            {qualityIssues.length > 0 ? (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-800"
                data-testid="badge-quality-issues"
              >
                <AlertTriangle className="mr-1 h-3 w-3" />
                {qualitySummary.errors + qualitySummary.warnings} quality issue
                {qualitySummary.errors + qualitySummary.warnings === 1 ? "" : "s"}
              </Badge>
            ) : (
              <Badge className="bg-emerald-600 text-white" data-testid="badge-quality-ready">
                <Check className="mr-1 h-3 w-3" />
                Ready to publish
              </Badge>
            )}
            <EditorSaveIndicator state={saveState.state} />
            {isNew && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTemplatePickerOpen(true)}
                data-testid="button-reopen-templates"
              >
                <LayoutTemplate className="h-4 w-4 mr-1.5" />
                Templates
              </Button>
            )}
            {!isNew && page?.status === "published" && (
              <>
                <Badge className="bg-green-600 text-white" data-testid="badge-published">
                  <Globe className="h-3 w-3 mr-1" />
                  Published
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    confirmPageStatusAction("Unpublishing", () => unpublishMutation.mutate())
                  }
                  disabled={unpublishMutation.isPending || editorLock.isReadOnly}
                  data-testid="button-unpublish"
                >
                  {unpublishMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-1.5" />
                  )}
                  Unpublish
                </Button>
              </>
            )}
            {!isNew && page?.status === "scheduled" && (
              <>
                <Badge className="bg-blue-600 text-white" data-testid="badge-scheduled">
                  <CalendarClock className="h-3 w-3 mr-1" />
                  Scheduled
                  {page.scheduledAt && (
                    <span className="ml-1 font-normal">
                      {format(new Date(page.scheduledAt), "MMM d, h:mm a")}
                    </span>
                  )}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    confirmPageStatusAction("Canceling this schedule", () =>
                      unpublishMutation.mutate(),
                    )
                  }
                  disabled={unpublishMutation.isPending || editorLock.isReadOnly}
                  data-testid="button-cancel-schedule"
                >
                  {unpublishMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-1.5" />
                  )}
                  Cancel Schedule
                </Button>
              </>
            )}
            {!isNew && page?.status !== "published" && page?.status !== "scheduled" && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    confirmPageStatusAction("Publishing", () => publishMutation.mutate())
                  }
                  disabled={publishMutation.isPending || editorLock.isReadOnly}
                  data-testid="button-publish"
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Publish
                </Button>
                <Popover open={schedulePopoverOpen} onOpenChange={setSchedulePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-open-schedule">
                      <CalendarClock className="h-4 w-4 mr-1.5" />
                      Schedule
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="end">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Schedule Publishing</p>
                      <p className="text-xs text-muted-foreground">
                        Choose a future date and time for this {contentLabelLower} to go live
                        automatically.
                      </p>
                      <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        data-testid="input-schedule-date"
                      />
                      <Button
                        className="w-full"
                        size="sm"
                        disabled={
                          !scheduleDate || scheduleMutation.isPending || editorLock.isReadOnly
                        }
                        onClick={() =>
                          confirmPageStatusAction("Scheduling this page", () =>
                            scheduleMutation.mutate(new Date(scheduleDate).toISOString()),
                          )
                        }
                        data-testid="button-confirm-schedule"
                      >
                        {scheduleMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <CalendarClock className="h-4 w-4 mr-1.5" />
                        )}
                        Confirm Schedule
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}
            <Button
              onClick={onSave}
              disabled={isPending || editorLock.isReadOnly}
              data-testid="button-save"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save {contentLabel}
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
          <div className="-mx-4 mb-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
            <TabsList className="w-max min-w-full justify-start md:min-w-0">
              <TabsTrigger value="builder" data-testid="tab-builder">
                <Layers className="h-4 w-4 mr-1.5" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">
                {contentLabel} Settings
              </TabsTrigger>
              <TabsTrigger value="seo" data-testid="tab-seo">
                <Globe className="h-4 w-4 mr-1.5" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="quality" data-testid="tab-quality">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Quality
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="builder" className="mt-0">
            <div
              className={cn(
                editorLock.hasLocking &&
                  editorLock.isReadOnly &&
                  "pointer-events-none select-none opacity-70",
              )}
            >
              <div className="mb-4 rounded-md border bg-card p-4">
                <label
                  htmlFor="builder-page-title"
                  className="text-xs font-medium text-muted-foreground"
                >
                  {contentLabel} Title
                </label>
                <Input
                  id="builder-page-title"
                  value={watchTitle}
                  onChange={(event) =>
                    form.setValue("title", event.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  placeholder={`${contentLabel} title`}
                  className="mt-2 max-w-2xl"
                  data-testid="input-builder-page-title"
                />
              </div>
              <ErrorBoundary
                name="page-builder-shell"
                onError={(error, errorInfo) =>
                  reportBuilderRenderError({
                    surface: "page-builder-shell",
                    error,
                    errorInfo,
                    context: {
                      pageId: page?.id ?? id ?? null,
                      slug: page?.slug ?? form.getValues("slug") ?? null,
                      title: page?.title ?? form.getValues("title") ?? null,
                    },
                  })
                }
                fallback={
                  <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/80 p-6 text-left dark:border-amber-700 dark:bg-amber-950/20">
                    <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      The visual page builder hit a rendering problem.
                    </h3>
                    <p className="mt-2 text-sm text-amber-800/90 dark:text-amber-300/90">
                      The page content is still loaded, but one builder surface failed to render.
                      Reload after deploying this patch. If a single section preview is the issue,
                      the builder will now isolate that section instead of blanking the whole
                      editor.
                    </p>
                  </div>
                }
              >
                <PageBuilder content={builderContent} onChange={handleBuilderChange} />
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div
              className={cn(
                "grid grid-cols-1 lg:grid-cols-3 gap-6",
                editorLock.hasLocking &&
                  editorLock.isReadOnly &&
                  "pointer-events-none select-none opacity-70",
              )}
            >
              <div className="lg:col-span-2">
                <Form {...form}>
                  <form className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">{contentLabel} Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{contentLabel} Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={`${contentLabel} title`}
                                  {...field}
                                  data-testid="input-title"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Slug</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="page-slug"
                                  {...field}
                                  onChange={(e) => {
                                    slugManuallyEdited.current = true;
                                    field.onChange(e);
                                  }}
                                  className="font-mono text-sm"
                                  data-testid="input-slug"
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Lowercase letters, numbers, and hyphens. Used in the URL.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="pageType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Page Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={isBlogMode}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid="select-page-type">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="home">Home</SelectItem>
                                    <SelectItem value="landing">Landing</SelectItem>
                                    <SelectItem value="service">Service</SelectItem>
                                    <SelectItem value="service-hub">Service Hub</SelectItem>
                                    <SelectItem value="service-area">Service Areas Hub</SelectItem>
                                    <SelectItem value="location">Location</SelectItem>
                                    <SelectItem value="blog-index">Blog Index</SelectItem>
                                    <SelectItem value="blog-post">Blog Post</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                                {isBlogMode ? (
                                  <FormDescription className="text-xs">
                                    Blog editor routes always save as Blog Post.
                                  </FormDescription>
                                ) : null}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="template"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Layout Template</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-page-template">
                                      <SelectValue placeholder="Select layout" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="full-width">Full Width</SelectItem>
                                    <SelectItem value="with-sidebar">Right Sidebar</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-xs">
                                  The sidebar appears on the right below the hero section.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        {watchTemplate === "with-sidebar" && (
                          <FormField
                            control={form.control}
                            name="sidebarId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assigned Sidebar</FormLabel>
                                <Select
                                  onValueChange={(value) =>
                                    field.onChange(value === "none" ? "" : value)
                                  }
                                  value={field.value || "none"}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid="select-page-sidebar">
                                      <SelectValue placeholder="Select sidebar" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">No sidebar selected</SelectItem>
                                    {sidebars.map((sidebar) => (
                                      <SelectItem key={sidebar.id} value={sidebar.id}>
                                        {sidebar.name}
                                        {sidebar.isDefault ? " (Default)" : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-xs">
                                  Manage reusable sidebars in Sidebars & Widgets.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-status">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    {field.value === "scheduled" && (
                                      <SelectItem value="scheduled" disabled>
                                        Scheduled
                                      </SelectItem>
                                    )}
                                    <SelectItem value="archived">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {isBlogMode ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Blog Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <FormLabel>Category</FormLabel>
                              <Select
                                value={blogMeta.category}
                                onValueChange={(value) =>
                                  setBlogMeta((current) => ({
                                    ...current,
                                    category: value === "commercial" ? "commercial" : "residential",
                                  }))
                                }
                              >
                                <SelectTrigger data-testid="select-blog-category">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="residential">Residential</SelectItem>
                                  <SelectItem value="commercial">Commercial</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <FormLabel htmlFor="blog-published-date">Published Date</FormLabel>
                              <Input
                                id="blog-published-date"
                                type="date"
                                value={blogMeta.date}
                                onChange={(event) =>
                                  setBlogMeta((current) => ({
                                    ...current,
                                    date: event.target.value,
                                  }))
                                }
                                data-testid="input-blog-date"
                              />
                            </div>
                            <div className="space-y-2">
                              <FormLabel htmlFor="blog-read-minutes">Read Minutes</FormLabel>
                              <Input
                                id="blog-read-minutes"
                                type="number"
                                min={1}
                                max={60}
                                value={blogMeta.readMinutes}
                                onChange={(event) =>
                                  setBlogMeta((current) => ({
                                    ...current,
                                    readMinutes: Math.max(1, Number(event.target.value) || 1),
                                  }))
                                }
                                data-testid="input-blog-read-minutes"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <FormLabel htmlFor="blog-excerpt">Excerpt</FormLabel>
                            <Textarea
                              id="blog-excerpt"
                              value={blogMeta.excerpt}
                              onChange={(event) =>
                                setBlogMeta((current) => ({
                                  ...current,
                                  excerpt: event.target.value,
                                }))
                              }
                              placeholder="Short summary shown on the blog index."
                              data-testid="textarea-blog-excerpt"
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel>Featured Image</FormLabel>
                            <CmsImageUpload
                              value={blogMeta.imageUrl}
                              onChange={(imageUrl) =>
                                setBlogMeta((current) => ({ ...current, imageUrl }))
                              }
                              helpText="Shown on the blog index and at the top of the article."
                              data-testid="blog-featured-image-upload"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                  </form>
                </Form>
              </div>

              {!isNew && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Revision History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {revisions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No revisions yet</p>
                      ) : (
                        <div className="space-y-2" data-testid="list-revisions">
                          {revisions.slice(0, 8).map((rev, idx) => (
                            <div
                              key={rev.id}
                              className="text-xs border-b last:border-0 pb-2 last:pb-0"
                              data-testid={`item-revision-${rev.id}`}
                            >
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <div>
                                  <span className="font-medium">
                                    {idx === 0 ? "Current" : `v${revisions.length - idx}`}
                                  </span>
                                  <span className="text-muted-foreground ml-1.5">
                                    {rev.createdAt
                                      ? format(new Date(rev.createdAt), "MMM d 'at' h:mm a")
                                      : "—"}
                                  </span>
                                </div>
                                {idx > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                                    disabled={restoringId === rev.id || restoreMutation.isPending}
                                    onClick={() => {
                                      setRestoringId(rev.id);
                                      restoreMutation.mutate(rev.id);
                                    }}
                                    data-testid={`button-restore-revision-${rev.id}`}
                                  >
                                    {restoringId === rev.id ? (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-2.5 w-2.5" />
                                    )}
                                    <span className="ml-1">Restore</span>
                                  </Button>
                                )}
                              </div>
                              {rev.changeNote && (
                                <p className="text-muted-foreground italic mt-0.5">
                                  {rev.changeNote}
                                </p>
                              )}
                            </div>
                          ))}
                          {revisions.length > 8 && (
                            <p className="text-xs text-muted-foreground">
                              +{revisions.length - 8} older revisions
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <p>Each save creates a revision snapshot for future rollback support.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="seo" className="mt-0">
            <div
              className={cn(
                "max-w-2xl space-y-5",
                editorLock.hasLocking &&
                  editorLock.isReadOnly &&
                  "pointer-events-none select-none opacity-70",
              )}
            >
              <Form {...form}>
                <form className="space-y-5">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        Search Engine
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="seoTitle"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>
                                SEO Title{" "}
                                <span className="text-muted-foreground font-normal text-xs">
                                  (optional)
                                </span>
                              </FormLabel>
                              {(field.value ?? "").length > 0 && (
                                <span
                                  className={`text-xs ${(field.value ?? "").length > 60 ? "text-amber-500" : (field.value ?? "").length < 20 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`}
                                >
                                  {(field.value ?? "").length}/60
                                </span>
                              )}
                            </div>
                            <FormControl>
                              <Input
                                placeholder="Overrides page title in search results"
                                {...field}
                                data-testid="input-seo-title"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              If blank, the page title is used. Aim for 30–60 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="seoDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Meta Description
                              <span
                                className={`ml-2 text-xs font-normal ${(field.value ?? "").length > 130 ? "text-amber-500" : "text-muted-foreground"}`}
                              >
                                ({(field.value ?? "").length}/160)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description for search engine results (max 160 chars)"
                                rows={3}
                                {...field}
                                data-testid="textarea-seo-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="seoKeywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Keywords{" "}
                              <span className="text-muted-foreground font-normal text-xs">
                                (optional)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="comma, separated, keywords"
                                {...field}
                                data-testid="input-seo-keywords"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="canonicalUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Canonical URL{" "}
                              <span className="text-muted-foreground font-normal text-xs">
                                (optional)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/page"
                                autoPrependHttps
                                {...field}
                                data-testid="input-canonical-url"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Override the canonical link tag. Leave blank to auto-generate from the
                              page slug.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="noindex"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                              <div>
                                <FormLabel className="text-sm font-medium cursor-pointer">
                                  Hide from search engines
                                </FormLabel>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Sets noindex,nofollow. Use for private or staging pages.
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-noindex"
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        Social / Open Graph
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="ogImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Open Graph Image{" "}
                              <span className="text-muted-foreground font-normal text-xs">
                                (optional)
                              </span>
                            </FormLabel>
                            <CmsImageUpload
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              helpText="Recommended: 1200 × 630 px. Shown when the page is shared on social media. Falls back to global default OG image."
                              data-testid="og-image-upload"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </form>
              </Form>

              <SeoPreview
                title={watchSeoTitle || watchTitle || ""}
                description={watchSeoDescription || ""}
                url={`${typeof window !== "undefined" ? window.location.origin : ""}/${watchSlug || ""}`}
                ogImage={watchOgImageUrl || ""}
                source="page"
                data-testid="seo-preview-panel"
              />

              <StructuredDataStatus
                fields={{
                  hasTitle: !!(watchSeoTitle || watchTitle),
                  hasDescription: !!watchSeoDescription,
                  hasImage: !!watchOgImageUrl,
                  noindex: !!watchNoindex,
                  isPublished: watchStatus === "published",
                  hasFaqBlocks,
                }}
                data-testid="structured-data-status"
              />
            </div>
          </TabsContent>

          <TabsContent value="quality" className="mt-0">
            <div
              className={cn(
                "grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]",
                editorLock.hasLocking &&
                  editorLock.isReadOnly &&
                  "pointer-events-none select-none opacity-70",
              )}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Publication Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {qualityIssues.length === 0 ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                      <div className="flex items-center gap-2 font-medium">
                        <Check className="h-4 w-4" />
                        This page looks ready for publishing
                      </div>
                      <p className="mt-2 text-sm">
                        We did not detect any obvious content, SEO, or structural issues in the
                        current draft.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3" data-testid="list-page-quality-issues">
                      {qualityIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className={cn(
                            "rounded-xl border p-4",
                            issue.severity === "error" && "border-red-200 bg-red-50",
                            issue.severity === "warning" && "border-amber-200 bg-amber-50",
                            issue.severity === "info" && "border-blue-200 bg-blue-50",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-sm">{issue.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {issue.description}
                              </p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {issue.severity}
                            </Badge>
                          </div>
                          <div className="mt-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setActiveTab(issue.tab)}
                            >
                              Open{" "}
                              {issue.tab === "builder"
                                ? "Builder"
                                : issue.tab === "seo"
                                  ? "SEO"
                                  : "Settings"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Preview & Readiness</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-lg font-semibold">{qualitySummary.errors}</p>
                        <p className="text-xs text-muted-foreground">Errors</p>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-lg font-semibold">{qualitySummary.warnings}</p>
                        <p className="text-xs text-muted-foreground">Warnings</p>
                      </div>
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-lg font-semibold">{qualitySummary.info}</p>
                        <p className="text-xs text-muted-foreground">Notes</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        type="button"
                        className="w-full"
                        variant="outline"
                        onClick={() => openDraftPreview()}
                        disabled={previewLinkMutation.isPending || isNew}
                      >
                        {previewLinkMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="mr-2 h-4 w-4" />
                        )}
                        Open Draft Preview
                      </Button>
                      <Button
                        type="button"
                        className="w-full"
                        variant="outline"
                        onClick={() => copyDraftPreview()}
                        disabled={previewLinkMutation.isPending || isNew}
                      >
                        {previewLinkMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Copy Draft Preview Link
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Preview links open the real frontend renderer with the current saved draft, so
                      editors can review layout and content before publishing.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Badge
            variant={page?.status === "published" ? "default" : "secondary"}
            className="h-9 shrink-0 capitalize"
          >
            {isNew ? "Unsaved" : (page?.status ?? "Draft")}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => openDraftPreview()}
            disabled={isNew || previewLinkMutation.isPending}
            aria-label="Preview draft"
            data-testid="button-mobile-preview"
          >
            {previewLinkMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            className="h-11 min-w-0 flex-1"
            onClick={onSave}
            disabled={isPending || editorLock.isReadOnly}
            data-testid="button-mobile-save"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isPending ? "Saving…" : `Save ${contentLabel}`}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                aria-label="More page actions"
                data-testid="button-mobile-page-actions"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-64">
              <DropdownMenuLabel>{contentLabel} actions</DropdownMenuLabel>
              {!isNew ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => copyDraftPreview()}
                    disabled={previewLinkMutation.isPending}
                  >
                    <Copy /> Copy preview link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : (
                <DropdownMenuItem onSelect={() => setTemplatePickerOpen(true)}>
                  <LayoutTemplate /> Choose template
                </DropdownMenuItem>
              )}
              {!isNew && page?.status !== "published" && page?.status !== "scheduled" ? (
                <>
                  <DropdownMenuItem
                    onSelect={() =>
                      confirmPageStatusAction("Publishing", () => publishMutation.mutate())
                    }
                    disabled={publishMutation.isPending || editorLock.isReadOnly}
                  >
                    <Globe /> Publish now
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setMobileScheduleOpen(true)}
                    disabled={editorLock.isReadOnly}
                  >
                    <CalendarClock /> Schedule publishing
                  </DropdownMenuItem>
                </>
              ) : null}
              {!isNew && page?.status === "published" ? (
                <DropdownMenuItem
                  onSelect={() =>
                    confirmPageStatusAction("Unpublishing", () => unpublishMutation.mutate())
                  }
                  disabled={unpublishMutation.isPending || editorLock.isReadOnly}
                >
                  <EyeOff /> Move to draft
                </DropdownMenuItem>
              ) : null}
              {!isNew && page?.status === "scheduled" ? (
                <DropdownMenuItem
                  onSelect={() =>
                    confirmPageStatusAction("Canceling this schedule", () =>
                      unpublishMutation.mutate(),
                    )
                  }
                  disabled={unpublishMutation.isPending || editorLock.isReadOnly}
                >
                  <EyeOff /> Cancel schedule
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setActiveTab("quality")}>
                <Sparkles /> Review quality checks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={mobileScheduleOpen} onOpenChange={setMobileScheduleOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule publishing</DialogTitle>
            <DialogDescription>
              Choose a future date and time for this {contentLabelLower} to go live.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(event) => setScheduleDate(event.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              data-testid="input-mobile-schedule-date"
            />
            <Button
              className="h-11 w-full"
              disabled={!scheduleDate || scheduleMutation.isPending || editorLock.isReadOnly}
              onClick={() =>
                confirmPageStatusAction("Scheduling this page", () => {
                  scheduleMutation.mutate(new Date(scheduleDate).toISOString());
                  setMobileScheduleOpen(false);
                })
              }
              data-testid="button-mobile-confirm-schedule"
            >
              {scheduleMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CalendarClock className="mr-2 h-4 w-4" />
              )}
              Confirm schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isNew && (
        <>
          <TemplatePicker
            open={templatePickerOpen}
            onClose={() => setTemplatePickerOpen(false)}
            onSelect={(content, templateName) => {
              setBuilderContent(content);
              setTemplatePickerOpen(false);
              if (templateName !== "Blank Page") {
                toast({ title: `Template "${templateName}" applied` });
              }
            }}
            onOpenWizard={() => setWizardOpen(true)}
          />
          <LandingPageWizard
            open={wizardOpen}
            onClose={() => setWizardOpen(false)}
            onCreate={(content, title) => {
              setBuilderContent(content);
              form.setValue("title", title);
              form.setValue("pageType", "landing");
              if (!slugManuallyEdited.current) {
                form.setValue("slug", slugify(title));
              }
              setWizardOpen(false);
              toast({ title: "Landing page generated — customize it below" });
            }}
          />
        </>
      )}
    </AdminSidebar>
  );
}
