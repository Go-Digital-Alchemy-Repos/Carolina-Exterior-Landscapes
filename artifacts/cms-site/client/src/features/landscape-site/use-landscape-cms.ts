import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Block, BlogPost, LocationContent, PageContent } from "@/features/landscape-site/content/base";

type LandscapeKind = "page" | "location" | "blog" | "virtual";

type CmsLandscapePayload<T> = {
  kind: LandscapeKind;
  path: string;
  data: T;
};

type CmsLandscapePage<T = unknown> = {
  id: string;
  title: string;
  slug: string;
  status: string;
  pageType: string;
  content: {
    source?: string;
    blocks?: Array<{ id: string; type: string; props?: Record<string, unknown> }>;
    landscape?: CmsLandscapePayload<T>;
  };
};

const LANDSCAPE_SOURCE = "carolina-landscape-v1";

function hasLandscapeKind<T>(page: CmsLandscapePage, kind: LandscapeKind): page is CmsLandscapePage<T> & {
  content: { landscape: CmsLandscapePayload<T> };
} {
  return page.content?.landscape?.kind === kind;
}

async function fetchCmsLandscapePage<T>(slug: string): Promise<CmsLandscapePage<T> | null> {
  const response = await fetch(`/api/cms/pages/by-slug/${encodeURIComponent(slug)}`, {
    credentials: "include",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Unable to load CMS page: ${slug}`);
  const page = (await response.json()) as CmsLandscapePage<T>;
  if (page.content?.source !== LANDSCAPE_SOURCE || !page.content.landscape) return null;
  return page;
}

async function fetchCmsLandscapePages(): Promise<CmsLandscapePage[]> {
  const response = await fetch("/api/cms/landscape/pages", { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load CMS landscape pages");
  return (await response.json()) as CmsLandscapePage[];
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function stripHtml(value: unknown): string {
  return text(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h2|h3|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function richTextToLandscapeBlocks(html: unknown): Block[] {
  const source = text(html);
  const blocks: Block[] = [];
  const pattern = /<(h2|h3|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    const content = stripHtml(match[2]);
    if (!content) continue;
    blocks.push({ type: match[1] as Block["type"], text: content });
  }
  if (blocks.length === 0) {
    const content = stripHtml(source);
    if (content) blocks.push({ type: "p", text: content });
  }
  return blocks;
}

function builderBlocksToLandscapeBlocks(blocks: NonNullable<CmsLandscapePage["content"]["blocks"]>): Block[] {
  return blocks.flatMap((block): Block[] => {
    const props = block.props ?? {};
    if (block.type === "hero" || block.type === "form-embed") return [];
    if (block.type === "section-header") {
      return [
        text(props.title) || text(props.heading) ? { type: "h2", text: text(props.title) || text(props.heading) } : null,
        text(props.subtitle) ? { type: "p", text: stripHtml(props.subtitle) } : null,
      ].filter(Boolean) as Block[];
    }
    if (block.type === "rich-text") {
      return richTextToLandscapeBlocks(props.content);
    }
    if (block.type === "text-image") {
      return [
        text(props.heading) ? { type: "h2", text: text(props.heading) } : null,
        text(props.body) ? { type: "p", text: stripHtml(props.body) } : null,
      ].filter(Boolean) as Block[];
    }
    if (block.type === "cards-grid") {
      const cards = Array.isArray(props.cards) ? props.cards as Array<Record<string, unknown>> : [];
      return [
        text(props.title) ? { type: "h2", text: text(props.title) } : null,
        text(props.subtitle) ? { type: "p", text: stripHtml(props.subtitle) } : null,
        ...cards.flatMap((card): Block[] => [
          text(card.title) ? { type: "h3", text: text(card.title) } : null,
          text(card.description) ? { type: "p", text: stripHtml(card.description) } : null,
        ].filter(Boolean) as Block[]),
      ].filter(Boolean) as Block[];
    }
    if (block.type === "faq") {
      const items = Array.isArray(props.items) ? props.items as Array<Record<string, unknown>> : [];
      return [
        { type: "h2", text: "Frequently Asked Questions" },
        ...items.flatMap((item): Block[] => [
          text(item.question) ? { type: "h3", text: text(item.question) } : null,
          text(item.answer) ? { type: "p", text: stripHtml(item.answer) } : null,
        ].filter(Boolean) as Block[]),
      ];
    }
    if (block.type === "cta") {
      return [
        text(props.heading) ? { type: "h2", text: text(props.heading) } : null,
        text(props.subheading) ? { type: "p", text: stripHtml(props.subheading) } : null,
      ].filter(Boolean) as Block[];
    }
    return [];
  });
}

function mergeBuilderBlocksIntoLandscapeData<T>(page: CmsLandscapePage<T>): T {
  const data = page.content.landscape!.data as Record<string, unknown>;
  const blocks = page.content.blocks ?? [];
  if (blocks.length === 0) return page.content.landscape!.data;

  const hero = blocks.find((block) => block.type === "hero");
  const heroProps = hero?.props ?? {};
  const bodyBlocks = builderBlocksToLandscapeBlocks(blocks);
  const media = { ...((data.media && typeof data.media === "object") ? data.media as Record<string, unknown> : {}) };
  if (text(heroProps.backgroundImageUrl)) media.heroImageUrl = text(heroProps.backgroundImageUrl);
  if (text(heroProps.backgroundImageAlt)) media.heroImageAlt = text(heroProps.backgroundImageAlt);

  return {
    ...data,
    h1: text(heroProps.heading, text(data.h1, page.title)),
    metaDescription: stripHtml(heroProps.subheading) || text(data.metaDescription),
    blocks: bodyBlocks.length > 0 ? bodyBlocks : data.blocks,
    media,
  } as T;
}

export function useLandscapeCmsData<T>(slug: string, fallback: T): T {
  const { data } = useQuery({
    queryKey: ["/api/cms/pages/by-slug", slug, "landscape"],
    queryFn: () => fetchCmsLandscapePage<T>(slug),
    enabled: Boolean(slug),
    retry: false,
    staleTime: 60_000,
  });

  return data?.content.landscape ? mergeBuilderBlocksIntoLandscapeData<T>(data) : fallback;
}

export function useLandscapeCmsPage(slug: string, fallback: PageContent | undefined): PageContent | undefined {
  return useLandscapeCmsData<PageContent | undefined>(slug, fallback);
}

export function useLandscapeCmsLocation(slug: string, fallback: LocationContent | undefined): LocationContent | undefined {
  return useLandscapeCmsData<LocationContent | undefined>(slug, fallback);
}

export function useLandscapeCmsBlogPost(slug: string, fallback: BlogPost | undefined): BlogPost | undefined {
  return useLandscapeCmsData<BlogPost | undefined>(slug, fallback);
}

export function useLandscapeCmsBlogPosts(fallback: BlogPost[]): BlogPost[] {
  const { data } = useQuery({
    queryKey: ["/api/cms/landscape/pages", "blog"],
    queryFn: fetchCmsLandscapePages,
    retry: false,
    staleTime: 60_000,
  });

  return useMemo(() => {
    const cmsPosts = (data ?? [])
      .filter((page): page is CmsLandscapePage<BlogPost> & { content: { landscape: CmsLandscapePayload<BlogPost> } } =>
        hasLandscapeKind<BlogPost>(page, "blog"),
      )
      .map((page) => mergeBuilderBlocksIntoLandscapeData<BlogPost>(page))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return cmsPosts.length > 0 ? cmsPosts : fallback;
  }, [data, fallback]);
}

export function useLandscapeCmsLocations(fallback: LocationContent[]): LocationContent[] {
  const { data } = useQuery({
    queryKey: ["/api/cms/landscape/pages", "locations"],
    queryFn: fetchCmsLandscapePages,
    retry: false,
    staleTime: 60_000,
  });

  return useMemo(() => {
    const cmsLocations = (data ?? [])
      .filter((page): page is CmsLandscapePage<LocationContent> & { content: { landscape: CmsLandscapePayload<LocationContent> } } =>
        hasLandscapeKind<LocationContent>(page, "location"),
      )
      .map((page) => mergeBuilderBlocksIntoLandscapeData<LocationContent>(page))
      .sort((a, b) => a.city.localeCompare(b.city));
    return cmsLocations.length > 0 ? cmsLocations : fallback;
  }, [data, fallback]);
}
