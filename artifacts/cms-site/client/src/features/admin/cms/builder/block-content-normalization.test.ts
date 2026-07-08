import { describe, expect, it } from "vitest";
import { normalizeBuilderPlainTextFields, stripHtmlForPlainText } from "./block-content-normalization";
import type { BuilderContent } from "./block-registry";

describe("block content normalization", () => {
  it("strips HTML tags from plain hero text fields while preserving rich supporting copy", () => {
    const content: BuilderContent = {
      blocks: [
        {
          id: "home-hero",
          type: "hero",
          props: {
            h1: "<p>Low Voltage Security Solutions</p>",
            heading: "<p>Main Heading</p>",
            mobileHeading: "<p>Mobile Heading</p>",
            subheading: "<p>Supporting copy</p>",
          },
        },
      ],
    };

    expect(normalizeBuilderPlainTextFields(content).blocks[0].props).toMatchObject({
      h1: "Low Voltage Security Solutions",
      heading: "Main Heading",
      mobileHeading: "Mobile Heading",
      subheading: "<p>Supporting copy</p>",
    });
  });

  it("preserves explicit rich text content", () => {
    const content: BuilderContent = {
      blocks: [
        {
          id: "body-copy",
          type: "rich-text",
          props: {
            content: "<p>Keep <strong>formatted</strong> body copy.</p>",
          },
        },
      ],
    };

    expect(normalizeBuilderPlainTextFields(content).blocks[0].props.content).toBe(
      "<p>Keep <strong>formatted</strong> body copy.</p>",
    );
  });

  it("normalizes plain text inside array item schemas while preserving rich descriptions", () => {
    const content: BuilderContent = {
      blocks: [
        {
          id: "service-cards",
          type: "cards-grid",
          props: {
            cards: [{ title: "<p>Cameras</p>", description: "<p>Security camera installs</p>" }],
          },
        },
      ],
    };

    expect(normalizeBuilderPlainTextFields(content).blocks[0].props.cards).toEqual([
      { title: "Cameras", description: "<p>Security camera installs</p>" },
    ]);
  });

  it("decodes simple entities while stripping tags", () => {
    expect(stripHtmlForPlainText("<p>Security &amp; Automation&nbsp;Services</p>")).toBe(
      "Security & Automation Services",
    );
  });
});
