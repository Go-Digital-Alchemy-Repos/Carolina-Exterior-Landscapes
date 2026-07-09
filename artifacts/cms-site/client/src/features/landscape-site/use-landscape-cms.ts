import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { BlogPost, LocationContent, PageContent } from "@/features/landscape-site/content";

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

export function useLandscapeCmsData<T>(slug: string, fallback: T): T {
  const { data } = useQuery({
    queryKey: ["/api/cms/pages/by-slug", slug, "landscape"],
    queryFn: () => fetchCmsLandscapePage<T>(slug),
    enabled: Boolean(slug),
    retry: false,
    staleTime: 60_000,
  });

  return data?.content.landscape?.data ?? fallback;
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
      .map((page) => page.content.landscape.data)
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
      .map((page) => page.content.landscape.data)
      .sort((a, b) => a.city.localeCompare(b.city));
    return cmsLocations.length > 0 ? cmsLocations : fallback;
  }, [data, fallback]);
}
