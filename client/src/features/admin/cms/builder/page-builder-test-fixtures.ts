import type { BuilderContent } from "./block-registry";

export const mixedBuilderFixture: BuilderContent = {
  blocks: [
    {
      id: "hero-block",
      type: "hero",
      props: {
        heading: "Build A Flexible Website",
        subheading: "<p>Generic website content managed through the CMS.</p>",
        layout: "stacked",
      },
    },
    {
      id: "cta-block",
      type: "cta",
      props: {
        heading: "Get In Touch",
        body: "<p>Add a focused call to action for this page.</p>",
        primaryText: "Contact Us",
      },
    },
    {
      id: "cards-block",
      type: "cards-grid",
      props: {
        items: [
          { title: "CMS Pages", body: "Create and publish structured content." },
          { title: "Forms", body: "Collect generic submissions." },
        ],
      },
    },
    {
      id: "faq-block",
      type: "faq",
      props: {
        heading: "Common Questions",
        items: [
          { question: "How do I edit content?", answer: "<p>Use the CMS page editor.</p>" },
        ],
      },
    },
    {
      id: "form-block",
      type: "form-embed",
      props: {
        formSlug: "contact-form",
      },
    },
  ],
};

export const fixtureWithBrokenPreview: BuilderContent = {
  blocks: [
    ...mixedBuilderFixture.blocks,
    {
      id: "broken-preview-block",
      type: "legacy-preview",
      props: {
        heading: "Legacy Preview",
      },
    },
  ],
};
