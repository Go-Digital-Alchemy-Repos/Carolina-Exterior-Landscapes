// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot, type Root } from "react-dom/client";
import { Footer } from "./footer";

describe("Footer", () => {
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

  it("shows the landscape business contact and service-area details", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    client.setQueryData(["/api/cms/menus"], {});
    root = createRoot(container);

    await act(async () => {
      root!.render(
        <QueryClientProvider client={client}>
          <Footer />
        </QueryClientProvider>,
      );
    });

    const footer = container.querySelector('[data-testid="footer"]') as HTMLElement | null;
    const phone = footer?.querySelector('a[href="tel:+17049755867"]') as HTMLAnchorElement | null;
    const email = footer?.querySelector('a[href="mailto:info@carolinaexteriorlandscapes.com"]') as HTMLAnchorElement | null;

    expect(footer?.textContent).toContain("Lawn care, landscaping, hardscape, and mulching services");
    expect(footer?.textContent).toContain("Serving Waxhaw, Union County, and the Greater Charlotte Area");
    expect(phone?.textContent).toContain("(704) 975-5867");
    expect(email?.textContent).toContain("info@carolinaexteriorlandscapes.com");
  });
});
