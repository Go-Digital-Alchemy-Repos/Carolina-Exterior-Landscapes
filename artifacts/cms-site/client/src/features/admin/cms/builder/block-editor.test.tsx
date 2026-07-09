// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ALL_BLOCKS } from "@/features/admin/cms/builder/block-registry";
import { ResilientBlockEditor } from "@/features/admin/cms/builder/block-editor";

describe("ResilientBlockEditor", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
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
    container.remove();
    document.body.innerHTML = "";
  });

  it("renders every registered block definition without crashing the inspector", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    root = createRoot(container);

    for (const blockDef of ALL_BLOCKS) {
      await act(async () => {
        root!.render(
          React.createElement(
            QueryClientProvider,
            { client },
            React.createElement(ResilientBlockEditor, {
              blockDef,
              blockType: blockDef.type,
              props: { ...blockDef.defaultProps },
              onChange: vi.fn(),
            }),
          ),
        );
      });

      expect(container.textContent?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("shows hero background image controls in the Media tab", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const heroDef = ALL_BLOCKS.find((blockDef) => blockDef.type === "hero");
    expect(heroDef).toBeTruthy();
    root = createRoot(container);

    await act(async () => {
      root!.render(
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(ResilientBlockEditor, {
            blockDef: heroDef!,
            blockType: "hero",
            props: {
              ...heroDef!.defaultProps,
              backgroundImageUrl: "/images/hero.webp",
            },
            onChange: vi.fn(),
          }),
        ),
      );
    });

    expect(container.textContent).toContain("Media");
    expect(Array.from(container.querySelectorAll('[role="tab"]')).map((tab) => tab.textContent).slice(0, 4)).toEqual([
      "Content",
      "Media",
      "Settings",
      "Layout",
    ]);

    expect(heroDef?.propDefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "backgroundPositionX", label: "Background Focal X" }),
        expect.objectContaining({ key: "backgroundPositionY", label: "Background Focal Y" }),
        expect.objectContaining({ key: "backgroundImageOpacity", label: "Image Visibility" }),
      ])
    );
  });

  it("exposes hero overlay and gradient controls as settings", async () => {
    const heroDef = ALL_BLOCKS.find((blockDef) => blockDef.type === "hero");
    expect(heroDef?.propDefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "overlayColor", label: "Overlay Color", type: "color" }),
        expect.objectContaining({ key: "overlayOpacity", label: "Dark Overlay Strength", type: "number" }),
        expect.objectContaining({ key: "gradientEnabled", label: "Bottom Gradient", type: "boolean" }),
        expect.objectContaining({ key: "gradientColor", label: "Gradient Color", type: "color" }),
        expect.objectContaining({ key: "gradientOpacity", label: "Gradient Strength", type: "number" }),
        expect.objectContaining({ key: "gradientHeight", label: "Gradient Height", type: "number" }),
        expect.objectContaining({ key: "heroHeightPx", label: "Custom Hero Height (px)", type: "number" }),
      ])
    );
  });

  it("edits hero subheading as rich text", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const heroDef = ALL_BLOCKS.find((blockDef) => blockDef.type === "hero");
    expect(heroDef).toBeTruthy();
    root = createRoot(container);

    await act(async () => {
      root!.render(
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(ResilientBlockEditor, {
            blockDef: heroDef!,
            blockType: "hero",
            props: {
              ...heroDef!.defaultProps,
              subheading: "<p>Supporting copy</p>",
            },
            onChange: vi.fn(),
          }),
        ),
      );
    });

    expect(container.querySelector('[data-testid="prop-richtext-subheading"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="prop-textarea-subheading"]')).toBeNull();
    expect(container.querySelector('[data-testid="prop-richtext-subheading-content"]')?.textContent).toContain("Supporting copy");
  });

  it("exposes hero mobile heading as a plain textarea", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const heroDef = ALL_BLOCKS.find((blockDef) => blockDef.type === "hero");
    expect(heroDef).toBeTruthy();
    root = createRoot(container);

    await act(async () => {
      root!.render(
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(ResilientBlockEditor, {
            blockDef: heroDef!,
            blockType: "hero",
            props: {
              ...heroDef!.defaultProps,
              mobileHeading: "<p>Fire Alarm</p><p>Installation Charlotte</p>",
            },
            onChange: vi.fn(),
          }),
        ),
      );
    });

    expect(heroDef?.defaultProps).toMatchObject({ mobileHeading: "" });
    expect(heroDef?.propDefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "mobileHeading", label: "Mobile Heading", type: "textarea" }),
      ]),
    );
    expect(container.querySelector('[data-testid="prop-richtext-mobileHeading"]')).toBeNull();
    expect(container.querySelector('[data-testid="prop-textarea-mobileHeading"]')).toBeTruthy();
    expect((container.querySelector('[data-testid="prop-textarea-mobileHeading"]') as HTMLTextAreaElement | null)?.value).toBe(
      "Fire Alarm\nInstallation Charlotte",
    );
  });

  it("preserves spaces while editing the hero mobile heading", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const heroDef = ALL_BLOCKS.find((blockDef) => blockDef.type === "hero");
    const onChange = vi.fn();
    expect(heroDef).toBeTruthy();
    root = createRoot(container);

    await act(async () => {
      root!.render(
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(ResilientBlockEditor, {
            blockDef: heroDef!,
            blockType: "hero",
            props: {
              ...heroDef!.defaultProps,
              mobileHeading: "Fire Alarm ",
            },
            onChange,
          }),
        ),
      );
    });

    expect((container.querySelector('[data-testid="prop-textarea-mobileHeading"]') as HTMLTextAreaElement | null)?.value).toBe(
      "Fire Alarm ",
    );
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ mobileHeading: "Fire Alarm" }));
  });

  it("exposes focal point controls for non-hero images", () => {
    const textImageDef = ALL_BLOCKS.find((blockDef) => blockDef.type === "text-image");
    const cardsGridDef = ALL_BLOCKS.find((blockDef) => blockDef.type === "cards-grid");

    expect(textImageDef?.defaultProps).toMatchObject({
      imagePositionX: 50,
      imagePositionY: 50,
    });
    expect(textImageDef?.propDefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "imagePositionX", label: "Image Focal X" }),
        expect.objectContaining({ key: "imagePositionY", label: "Image Focal Y" }),
      ]),
    );
    expect(cardsGridDef?.propDefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "cards",
          itemSchema: expect.arrayContaining([
            expect.objectContaining({ key: "imagePositionX", label: "Image Focal X" }),
            expect.objectContaining({ key: "imagePositionY", label: "Image Focal Y" }),
          ]),
        }),
      ]),
    );
  });
});
