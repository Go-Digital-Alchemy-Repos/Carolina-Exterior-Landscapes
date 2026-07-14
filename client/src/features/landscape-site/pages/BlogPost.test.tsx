// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import BlogPost from "./BlogPost";

vi.mock("wouter", () => ({
  useParams: () => ({ slug: "aeration-guide" }),
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/features/landscape-site/content", () => ({
  getBlogPost: () => ({
    slug: "aeration-guide",
    h1: "Aeration Guide",
    titleTag: "Aeration Guide",
    metaDescription: "Aeration guidance.",
    primaryKeyword: "aeration",
    secondaryKeywords: [],
    schemaType: "BlogPosting",
    wordCountTarget: "",
    category: "residential",
    date: "2026-07-10",
    readMinutes: 5,
    excerpt: "A useful guide.",
    image: "",
    blocks: [
      { type: "h2", text: "Main content" },
      { type: "p", text: "Article copy." },
      { type: "h2", text: "Frequently Asked Questions" },
      { type: "p", text: "Local answers." },
      { type: "h3", text: "When should I aerate?" },
      { type: "p", text: "Aerate in early fall." },
      { type: "h2", text: "Schedule Aeration" },
      { type: "p", text: "Contact our team." },
    ],
  }),
  getBlogPosts: () => [],
  getBlogImage: () => undefined,
}));

vi.mock("@/features/landscape-site/use-landscape-cms", () => ({
  useLandscapeCmsBlogPost: (_slug: string, fallback: unknown) => fallback,
  useLandscapeCmsBlogPosts: (fallback: unknown) => fallback,
}));

vi.mock("@/features/landscape-site/components/BlockRenderer", () => ({
  BlockRenderer: ({ blocks }: { blocks: Array<{ text: string }> }) =>
    React.createElement(
      "div",
      { "data-testid": "article-blocks" },
      blocks.map((block) => block.text).join(" | "),
    ),
}));

vi.mock("@/features/landscape-site/components/Seo", () => ({
  Seo: ({ jsonLd }: { jsonLd: unknown }) =>
    React.createElement(
      "script",
      { type: "application/ld+json", "data-testid": "seo-jsonld" },
      JSON.stringify(jsonLd),
    ),
}));

describe("Blog post FAQ", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    root = null;
    (
      globalThis as typeof globalThis & { React?: typeof React; IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).React = React;
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
    document.body.innerHTML = "";
  });

  it("moves a legacy FAQ to the bottom accordion and emits FAQPage JSON-LD", async () => {
    root = createRoot(container);
    await act(async () => root!.render(React.createElement(BlogPost)));

    const article = container.querySelector('[data-testid="article-blocks"]') as HTMLElement;
    const faq = container.querySelector('[data-testid="blog-faq-section"]') as HTMLElement;
    const schema = JSON.parse(
      container.querySelector('[data-testid="seo-jsonld"]')?.textContent || "[]",
    ) as Array<Record<string, unknown>>;

    expect(article.textContent).toContain("Schedule Aeration");
    expect(article.textContent).not.toContain("Frequently Asked Questions");
    expect(faq.textContent).toContain("When should I aerate?");
    expect(article.compareDocumentPosition(faq)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(schema.map((item) => item["@type"])).toEqual(["BlogPosting", "FAQPage"]);
  });
});
