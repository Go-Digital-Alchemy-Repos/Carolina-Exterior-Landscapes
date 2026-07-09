// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { Layout } from "./Layout";

describe("landscape Layout", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }).React = React;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal("scrollTo", vi.fn());
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    container.remove();
    vi.unstubAllGlobals();
  });

  it("keeps a desktop service menu open when a pointer enters and clicks its trigger", async () => {
    root = createRoot(container);
    await act(async () => {
      root!.render(<Layout><div>Content</div></Layout>);
    });

    const trigger = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Residential"));
    expect(trigger).toBeTruthy();

    await act(async () => {
      trigger!.parentElement!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      trigger!.click();
    });

    expect(trigger!.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector("#residential-menu")?.className).toContain("visible");
  });
});
