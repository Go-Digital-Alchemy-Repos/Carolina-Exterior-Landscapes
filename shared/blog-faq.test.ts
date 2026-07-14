import { describe, expect, it } from "vitest";
import { normalizeBlogFaq, splitBlogFaqBlocks, type BlogContentBlock } from "./blog-faq";

describe("blog FAQ data", () => {
  it("extracts a legacy FAQ section and leaves later article content in place", () => {
    const blocks: BlogContentBlock[] = [
      { type: "h2", text: "Lawn preparation" },
      { type: "p", text: "Prepare the lawn first." },
      { type: "h2", text: "Frequently Asked Questions" },
      { type: "p", text: "Helpful answers for local homeowners." },
      { type: "h3", text: "When should I aerate?" },
      { type: "p", text: "Aerate tall fescue in early fall." },
      { type: "h3", text: "When will seed germinate?" },
      { type: "p", text: "Most seed germinates within 10 to 14 days." },
      { type: "h2", text: "Schedule Aeration" },
      { type: "p", text: "Contact our team." },
    ];

    const result = splitBlogFaqBlocks(blocks);

    expect(result.faq).toEqual({
      title: "Frequently Asked Questions",
      description: "Helpful answers for local homeowners.",
      items: [
        { question: "When should I aerate?", answer: "Aerate tall fescue in early fall." },
        {
          question: "When will seed germinate?",
          answer: "Most seed germinates within 10 to 14 days.",
        },
      ],
    });
    expect(result.blocks.map((block) => block.text)).toEqual([
      "Lawn preparation",
      "Prepare the lawn first.",
      "Schedule Aeration",
      "Contact our team.",
    ]);
  });

  it("only exposes complete question and answer pairs publicly", () => {
    expect(
      normalizeBlogFaq({
        title: "Questions",
        description: "Sub-text",
        items: [
          { question: "Complete?", answer: "Yes." },
          { question: "Missing answer?", answer: "" },
        ],
      }),
    ).toEqual({
      title: "Questions",
      description: "Sub-text",
      items: [{ question: "Complete?", answer: "Yes." }],
    });
  });
});
