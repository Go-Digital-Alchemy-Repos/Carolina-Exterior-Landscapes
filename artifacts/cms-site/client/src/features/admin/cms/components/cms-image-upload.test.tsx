// @vitest-environment jsdom

import React, { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CmsImageUpload } from "./cms-image-upload";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("./media-picker-dialog", () => ({
  MediaPickerDialog: ({ open, onSelect }: { open: boolean; onSelect: (url: string, asset: unknown) => void }) => open
    ? React.createElement("button", {
        type: "button",
        "data-testid": "choose-new-image",
        onClick: () => onSelect("/uploads/new-cover.webp", { url: "/uploads/new-cover.webp", assetKind: "image" }),
      }, "Choose image")
    : null,
}));

describe("CmsImageUpload", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    root = null;
    (globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }).React = React;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
  });

  it("updates the preview immediately when a library image is selected", async () => {
    const onChange = vi.fn();
    const client = new QueryClient();
    root = createRoot(container);

    await act(async () => {
      root!.render(
        <QueryClientProvider client={client}>
          <CmsImageUpload value="/uploads/old-cover.webp" onChange={onChange} data-testid="cover" />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      (container.querySelector('[data-testid="cover-library"]') as HTMLButtonElement).click();
    });
    await act(async () => {
      (container.querySelector('[data-testid="choose-new-image"]') as HTMLButtonElement).click();
    });

    expect(onChange).toHaveBeenCalledWith("/uploads/new-cover.webp");
    expect((container.querySelector('[data-testid="cover-preview"]') as HTMLImageElement).src).toContain("/uploads/new-cover.webp");
  });
});
