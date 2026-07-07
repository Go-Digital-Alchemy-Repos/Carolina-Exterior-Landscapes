// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { MediaPickerDialog } from "./media-picker-dialog";
import type { CmsMediaLibraryAsset } from "@shared/schema";

const now = new Date("2026-07-07T12:00:00.000Z");
const assets: CmsMediaLibraryAsset[] = [
  {
    id: "image-1",
    filename: "front-lawn.jpg",
    originalName: "Front Lawn.jpg",
    title: "Front Lawn",
    url: "/uploads/front-lawn.jpg",
    mimeType: "image/jpeg",
    fileSize: 1200,
    r2Key: null,
    alt: "Front lawn",
    caption: "",
    description: "",
    seoTitle: null,
    seoDescription: null,
    ogTitle: null,
    ogDescription: null,
    uploadedBy: null,
    createdAt: now,
    assetKind: "image",
    usageCount: 0,
    usageRefs: [],
  },
  {
    id: "doc-1",
    filename: "proposal.pdf",
    originalName: "Proposal.pdf",
    title: "Proposal",
    url: "/uploads/proposal.pdf",
    mimeType: "application/pdf",
    fileSize: 2000,
    r2Key: null,
    alt: "",
    caption: "",
    description: "",
    seoTitle: null,
    seoDescription: null,
    ogTitle: null,
    ogDescription: null,
    uploadedBy: null,
    createdAt: now,
    assetKind: "document",
    usageCount: 0,
    usageRefs: [],
  },
];

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: assets, isLoading: false }),
}));

describe("MediaPickerDialog", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }).React = React;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    root = null;
    container.remove();
    document.body.innerHTML = "";
  });

  it("filters to images and supports multi-select add", async () => {
    const onSelectMany = vi.fn();

    await act(async () => {
      root!.render(
        <MediaPickerDialog
          open
          multiple
          typeFilter="images"
          onOpenChange={() => undefined}
          onSelect={() => undefined}
          onSelectMany={onSelectMany}
        />,
      );
    });

    expect(document.body.querySelector('[data-testid="media-asset-image-1"]')).not.toBeNull();
    expect(document.body.querySelector('[data-testid="media-asset-doc-1"]')).toBeNull();

    await act(async () => {
      document.body.querySelector<HTMLButtonElement>('[data-testid="media-asset-image-1"]')?.click();
    });
    await act(async () => {
      Array.from(document.body.querySelectorAll("button"))
        .find((button) => button.textContent === "Add 1 Image")
        ?.click();
    });

    expect(onSelectMany).toHaveBeenCalledWith([assets[0]]);
  });
});
