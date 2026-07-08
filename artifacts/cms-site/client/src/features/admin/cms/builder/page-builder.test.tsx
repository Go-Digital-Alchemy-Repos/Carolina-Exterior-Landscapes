// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { PageBuilder } from "./page-builder";
import { fixtureWithBrokenPreview, mixedBuilderFixture } from "./page-builder-test-fixtures";
import type { BuilderContent } from "./block-registry";

vi.mock("./page-builder-preview", () => ({
  FrontendPreviewDialog: () => null,
}));

vi.mock("./block-renderer", () => ({
  BlockRenderer: ({ block }: { block: { id: string; type: string } }) => {
    if (block.id === "broken-preview-block") {
      throw new Error("Broken preview");
    }

    return React.createElement(
      "div",
      { "data-testid": `mock-block-preview-${block.id}` },
      `Preview:${block.type}`,
    );
  },
}));

describe("PageBuilder", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    (globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }).React = React;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    (globalThis as typeof globalThis & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    root = null;
    vi.restoreAllMocks();
    container.remove();
    document.body.innerHTML = "";
  });

  it("renders an empty builder without crashing", async () => {
    root = createRoot(container);

    await act(async () => {
      root!.render(
        React.createElement(PageBuilder, {
          content: { blocks: [] },
          onChange: vi.fn(),
        }),
      );
    });

    expect(container.textContent).toContain("Visual Builder");
    expect(container.textContent).toContain("0 block");
  });

  it("renders a realistic mixed block fixture with retained CMS blocks", async () => {
    root = createRoot(container);

    await act(async () => {
      root!.render(
        React.createElement(PageBuilder, {
          content: mixedBuilderFixture,
          onChange: vi.fn(),
        }),
      );
    });

    expect(container.textContent).toContain("5 block");
    expect(container.textContent).toContain("Hero");
    expect(container.textContent).toContain("Call To Action");
    expect(container.textContent).toContain("Cards Grid");
    expect(container.textContent).toContain("FAQ");
    expect(container.textContent).toContain("Form Embed");
    expect(container.querySelector('[data-testid="mock-block-preview-cta-block"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="mock-block-preview-cards-block"]')).not.toBeNull();
  });

  it("isolates a single broken preview while leaving the rest of the builder interactive", async () => {
    root = createRoot(container);

    await act(async () => {
      root!.render(
        React.createElement(PageBuilder, {
          content: fixtureWithBrokenPreview,
          onChange: vi.fn(),
        }),
      );
    });

    expect(container.textContent).toContain("This block preview could not be rendered in the builder.");
    expect(container.textContent).toContain("Block ID: broken-preview-block");
    expect(container.textContent).toContain("Type: legacy-preview");
    expect(container.querySelector('[data-testid="mock-block-preview-hero-block"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="select-canvas-block-broken-preview-block"]')).not.toBeNull();
  });

  it("drops a reusable section into an exact canvas position", async () => {
    root = createRoot(container);
    const onChange = vi.fn();
    const content: BuilderContent = {
      blocks: [
        { id: "first-block", type: "section-header", props: { heading: "First" } },
        { id: "second-block", type: "section-header", props: { heading: "Second" } },
      ],
    };
    const sectionBlocks = [
      { id: "section-block", type: "rich-text", props: { content: "Reusable copy" } },
    ];

    await act(async () => {
      root!.render(
        React.createElement(PageBuilder, {
          content,
          onChange,
        }),
      );
    });

    const dropZone = container.querySelector('[data-testid="canvas-insert-dropzone-1"]') as HTMLElement | null;
    expect(dropZone).not.toBeNull();

    const dataTransfer = {
      dropEffect: "copy",
      getData: (type: string) =>
        type === "application/x-page-builder-insert"
          ? JSON.stringify({ kind: "section", sectionId: "saved-section", blocks: sectionBlocks })
          : "",
      setData: vi.fn(),
      effectAllowed: "copy",
    };
    const dropEvent = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, "dataTransfer", { value: dataTransfer });

    await act(async () => {
      dropZone!.dispatchEvent(dropEvent);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].blocks.map((block: { id: string }) => block.id)).toEqual([
      "first-block",
      "section-block",
      "second-block",
    ]);
  });

  it("accepts a reusable section drop on an empty canvas", async () => {
    root = createRoot(container);
    const onChange = vi.fn();
    const sectionBlocks = [
      { id: "empty-section-block", type: "rich-text", props: { content: "Start here" } },
    ];

    await act(async () => {
      root!.render(
        React.createElement(PageBuilder, {
          content: { blocks: [] },
          onChange,
        }),
      );
    });

    const dropZone = container.querySelector('[data-testid="canvas-empty-dropzone"]') as HTMLElement | null;
    expect(dropZone).not.toBeNull();

    const dataTransfer = {
      dropEffect: "copy",
      getData: (type: string) =>
        type === "application/x-page-builder-insert"
          ? JSON.stringify({ kind: "section", sectionId: "saved-section", blocks: sectionBlocks })
          : "",
      setData: vi.fn(),
      effectAllowed: "copy",
    };
    const dropEvent = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, "dataTransfer", { value: dataTransfer });

    await act(async () => {
      dropZone!.dispatchEvent(dropEvent);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].blocks.map((block: { id: string }) => block.id)).toEqual([
      "empty-section-block",
    ]);
  });
});
