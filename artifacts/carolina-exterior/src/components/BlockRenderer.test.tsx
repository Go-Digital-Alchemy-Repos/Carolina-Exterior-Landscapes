import { describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import type { ReactNode } from "react";
import { BlockRenderer } from "@/components/BlockRenderer";
import { getAllPages, getLocations, getBlogPosts, type Block } from "@/content";

// The FAQ accordion (Radix) unmounts collapsed answer panels from the DOM, so
// a plain render would hide that copy from textContent even though it is
// preserved. We swap the accordion primitives for transparent pass-throughs so
// every piece of copy BlockRenderer emits is visible to the assertions below.
// BlockRenderer's own grouping/ordering logic — the part that could actually
// drop or reorder copy — still runs unmodified.
vi.mock("@/components/ui/accordion", () => {
  const passthrough = ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Accordion: passthrough,
    AccordionItem: passthrough,
    AccordionTrigger: passthrough,
    AccordionContent: passthrough,
  };
});

afterEach(cleanup);

// Collapse both the source copy and the rendered text down to lowercase
// alphanumerics. This makes the check robust to markup boundaries and to the
// "Title: text" / "Title — text" splitting that the card and step layouts
// perform (the separator punctuation is dropped, but every word must survive).
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function assertAllCopyInOrder(name: string, blocks: Block[]) {
  const { container } = render(<BlockRenderer blocks={blocks} />);
  const haystack = normalize(container.textContent ?? "");

  let cursor = 0;
  blocks.forEach((block, index) => {
    const needle = normalize(block.text);
    expect(
      needle.length,
      `${name}: block ${index} ("${block.text.slice(0, 60)}…") is empty`,
    ).toBeGreaterThan(0);

    const at = haystack.indexOf(needle, cursor);
    if (at === -1) {
      const droppedEntirely = haystack.indexOf(needle) === -1;
      expect.fail(
        `${name}: block ${index} (${block.type}) ${
          droppedEntirely ? "is missing from" : "is out of order in"
        } the rendered output: "${block.text.slice(0, 100)}…"`,
      );
    }
    cursor = at + needle.length;
  });
}

describe("BlockRenderer never drops or reorders copy", () => {
  for (const page of getAllPages()) {
    it(`page: ${page.slug}`, () => {
      assertAllCopyInOrder(`page ${page.slug}`, page.blocks);
    });
  }

  for (const location of getLocations()) {
    it(`location: ${location.slug}`, () => {
      assertAllCopyInOrder(`location ${location.slug}`, location.blocks);
    });
  }

  for (const post of getBlogPosts()) {
    it(`blog post: ${post.slug}`, () => {
      assertAllCopyInOrder(`blog post ${post.slug}`, post.blocks);
    });
  }
});
