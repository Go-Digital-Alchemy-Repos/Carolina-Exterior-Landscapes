// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { JsonLd } from "./json-ld";

describe("JsonLd", () => {
  let container: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }).React = React;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    document.head.innerHTML = "";
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    root = null;
    container.remove();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("replaces matching prerender schema while preserving prerender-only schema", async () => {
    const prerenderLocalBusiness = document.createElement("script");
    prerenderLocalBusiness.type = "application/ld+json";
    prerenderLocalBusiness.dataset.prerenderJsonLd = "true";
    prerenderLocalBusiness.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://carolinaexteriorlandscapes.com/#localbusiness",
      logo: { "@type": "ImageObject", url: "https://carolinaexteriorlandscapes.com/images/old-logo.svg" },
    });
    document.head.appendChild(prerenderLocalBusiness);

    const prerenderItemList = document.createElement("script");
    prerenderItemList.type = "application/ld+json";
    prerenderItemList.dataset.prerenderJsonLd = "true";
    prerenderItemList.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: [{ "@type": "ListItem", position: 1, url: "https://carolinaexteriorlandscapes.com/service-areas/tega-cay-sc/" }],
    });
    document.head.appendChild(prerenderItemList);

    root = createRoot(container);

    await act(async () => {
      root!.render(
        <JsonLd
          schemas={[
            {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": "https://carolinaexteriorlandscapes.com/#localbusiness",
              logo: { "@type": "ImageObject", url: "https://carolinaexteriorlandscapes.com/images/logo-icon.png" },
            },
          ]}
        />,
      );
    });

    const schemas = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')).map((script) =>
      JSON.parse(script.textContent || "{}"),
    );

    expect(schemas.map((schema) => schema["@type"])).toEqual(["ItemList", "LocalBusiness"]);
    expect(schemas.filter((schema) => schema["@type"] === "LocalBusiness")).toHaveLength(1);
    expect(schemas.find((schema) => schema["@type"] === "LocalBusiness")?.logo.url).toBe("https://carolinaexteriorlandscapes.com/images/logo-icon.png");
    expect(schemas.find((schema) => schema["@type"] === "ItemList")?.itemListElement).toHaveLength(1);
  });
});
