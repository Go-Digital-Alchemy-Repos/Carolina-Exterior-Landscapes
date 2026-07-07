// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot, type Root } from "react-dom/client";
import { Navbar } from "./navbar";

describe("Navbar", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }).React = React;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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

  it("constrains the mobile menu to vertical scrolling without horizontal drift", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    client.setQueryData(["/api/cms/menus"], {
      main_navigation: {
        items: [
          {
            id: "services",
            label: "Very Long Mobile Navigation Label That Should Wrap Instead Of Widening The Menu",
            url: "/services/",
            children: [
              {
                id: "child",
                label: "Another Very Long Child Navigation Label That Should Stay Inside The Viewport",
                url: "/child/",
                children: [],
              },
            ],
          },
        ],
      },
    });

    root = createRoot(container);

    await act(async () => {
      root!.render(
        <QueryClientProvider client={client}>
          <Navbar />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      (container.querySelector('button[aria-label="Open menu"]') as HTMLButtonElement).click();
    });

    const mobileNav = container.querySelector('nav[aria-label="Mobile navigation"]');
    const mobilePanel = mobileNav?.parentElement;
    const links = Array.from(mobileNav?.querySelectorAll("a") ?? []);

    expect(mobilePanel?.className).toContain("max-h-[calc(100dvh-4.5rem)]");
    expect(mobilePanel?.className).toContain("overflow-y-auto");
    expect(mobilePanel?.className).toContain("overflow-x-hidden");
    expect(mobileNav?.className).toContain("overflow-x-hidden");
    expect(links[0]?.className).toContain("break-words");
    expect(links[1]?.className).toContain("break-words");
  });
});
