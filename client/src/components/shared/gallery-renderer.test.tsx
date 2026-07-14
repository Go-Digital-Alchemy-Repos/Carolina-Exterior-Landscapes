// @vitest-environment jsdom

import React, { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { GalleryRenderer } from "./gallery-renderer";
import { DEFAULT_GALLERY_SETTINGS, type CmsGalleryWithItems } from "@shared/schema";

function gallery(layout: CmsGalleryWithItems["layout"] = "grid"): CmsGalleryWithItems {
  const now = new Date("2026-07-07T12:00:00.000Z");
  return {
    id: "gallery-1",
    title: "Landscape Gallery",
    slug: "landscape-gallery",
    description: "Outdoor work",
    status: "published",
    layout,
    settings: DEFAULT_GALLERY_SETTINGS,
    createdBy: null,
    updatedBy: null,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    items: [
      {
        id: "item-1",
        galleryId: "gallery-1",
        mediaId: null,
        imageUrl: "/images/one.jpg",
        alt: "First lawn",
        title: "Front Lawn",
        caption: "Fresh cut",
        linkUrl: null,
        ctaText: null,
        tags: [],
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "item-2",
        galleryId: "gallery-1",
        mediaId: null,
        imageUrl: "/images/two.jpg",
        alt: "Second lawn",
        title: "Back Yard",
        caption: "Mulch bed",
        linkUrl: null,
        ctaText: null,
        tags: [],
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

describe("GalleryRenderer", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;
  let queryClient: QueryClient;

  beforeEach(() => {
    (globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }).React = React;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    root = null;
    queryClient.clear();
    container.remove();
    document.body.innerHTML = "";
  });

  function render(ui: React.ReactNode) {
    return act(async () => {
      root!.render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
    });
  }

  it("shows the preview empty state when no gallery is selected", async () => {
    await render(<GalleryRenderer preview />);

    expect(container.querySelector('[data-testid="gallery-empty-preview"]')?.textContent).toContain(
      "Select a published gallery to render images here.",
    );
  });

  it("uses layout overrides instead of the saved gallery layout", async () => {
    await render(<GalleryRenderer gallery={gallery("grid")} overrides={{ layout: "slider" }} />);

    expect(container.querySelector('[data-testid="gallery-renderer"]')?.getAttribute("data-gallery-layout")).toBe("slider");
  });

  it("supports lightbox keyboard close, next, and previous", async () => {
    await render(<GalleryRenderer gallery={gallery("grid")} />);

    const firstImageButton = container.querySelector("figure button") as HTMLButtonElement;
    await act(async () => {
      firstImageButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.querySelector('[data-testid="gallery-lightbox"] img')?.getAttribute("src")).toBe("/images/one.jpg");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });
    expect(document.body.querySelector('[data-testid="gallery-lightbox"] img')?.getAttribute("src")).toBe("/images/two.jpg");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    });
    expect(document.body.querySelector('[data-testid="gallery-lightbox"] img')?.getAttribute("src")).toBe("/images/one.jpg");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(document.body.querySelector('[data-testid="gallery-lightbox"]')).toBeNull();
  });
});
