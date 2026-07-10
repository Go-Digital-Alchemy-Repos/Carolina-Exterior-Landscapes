// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import type { CmsPage } from "@shared/schema";
import CmsBlogPage from "./cms-blog-page";

const navigateMock = vi.fn();
const useQueryMock = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/admin/cms/blog", navigateMock],
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: (options: unknown) => useQueryMock(options),
    useMutation: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

vi.mock("@/features/admin/admin-sidebar", () => ({
  AdminSidebar: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "admin-sidebar" }, children),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
  queryClient: { invalidateQueries: vi.fn() },
}));

function page(overrides: Partial<CmsPage>): CmsPage {
  return {
    id: overrides.id ?? overrides.slug ?? "page",
    title: overrides.title ?? "Page",
    slug: overrides.slug ?? "page",
    status: overrides.status ?? "published",
    pageType: overrides.pageType ?? "custom",
    template: "full-width",
    sidebarId: null,
    content: overrides.content ?? {},
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    ogImageUrl: null,
    canonicalUrl: null,
    noindex: false,
    createdBy: null,
    updatedBy: null,
    scheduledAt: null,
    publishedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

describe("CMS Blog page", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    navigateMock.mockReset();
    useQueryMock.mockReset();
    root = null;
    (globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }).React = React;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container.remove();
    document.body.innerHTML = "";
  });

  it("shows only blog posts and searches blog content", async () => {
    useQueryMock.mockReturnValue({
      data: [
        page({ id: "about", title: "About", slug: "about", pageType: "custom", content: { blocks: [{ text: "pine straw" }] } }),
        page({
          id: "mulch",
          title: "Mulching Guide",
          slug: "mulching-guide",
          pageType: "blog-post",
          content: {
            landscape: { data: { category: "residential", date: "2026-07-09", imageUrl: "/uploads/mulch.webp", excerpt: "Pine straw and mulch.", readMinutes: 5 } },
          },
        }),
        page({
          id: "contract",
          title: "Commercial Contract",
          slug: "commercial-contract",
          pageType: "blog-post",
          content: {
            landscape: { data: { category: "commercial", date: "2026-07-08", excerpt: "Property manager guide.", readMinutes: 6 } },
          },
        }),
      ],
      isLoading: false,
    });
    root = createRoot(container);

    await act(async () => {
      root!.render(React.createElement(CmsBlogPage));
    });

    expect(container.textContent).toContain("Mulching Guide");
    expect(container.textContent).toContain("Commercial Contract");
    expect(container.textContent).not.toContain("About");
    expect(container.querySelector('[data-testid="image-blog-mulch"]')?.getAttribute("src")).toBe("/uploads/mulch.webp");
    expect(container.querySelector("thead")?.textContent).toContain("Date Published");
    expect(Array.from(container.querySelectorAll('[data-testid^="row-blog-post-"]')).map((row) => row.getAttribute("data-testid"))).toEqual([
      "row-blog-post-mulch",
      "row-blog-post-contract",
    ]);

    const search = container.querySelector('[data-testid="input-search-blog-posts"]') as HTMLInputElement;
    await act(async () => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setValue?.call(search, "pine straw");
      search.dispatchEvent(new Event("input", { bubbles: true }));
      search.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.textContent).toContain("Mulching Guide");
    expect(container.textContent).not.toContain("Commercial Contract");
  });

  it("shows the blog empty state and routes new posts to the blog editor", async () => {
    useQueryMock.mockReturnValue({
      data: [page({ id: "about", title: "About", slug: "about", pageType: "custom" })],
      isLoading: false,
    });
    root = createRoot(container);

    await act(async () => {
      root!.render(React.createElement(CmsBlogPage));
    });

    expect(container.querySelector('[data-testid="text-empty-blog-posts"]')?.textContent).toContain("No blog posts yet");

    const newButton = container.querySelector('[data-testid="button-new-blog-post"]') as HTMLButtonElement;
    await act(async () => {
      newButton.click();
    });

    expect(navigateMock).toHaveBeenCalledWith("/admin/cms/blog/new");
  });
});
