import { createBlock, type BlockInstance } from "./block-registry";

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  blocks: BlockInstance[];
}

function block(type: string, props: Record<string, unknown> = {}) {
  const instance = createBlock(type);
  return {
    ...instance,
    props: {
      ...instance.props,
      ...props,
    },
  };
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "blank",
    name: "Blank Page",
    description: "Start with an empty page.",
    blocks: [],
  },
  {
    id: "basic",
    name: "Basic Page",
    description: "A simple page with a hero and editable rich text.",
    blocks: [
      block("hero", {
        heading: "Page heading",
        subheading: "Add supporting copy for this page.",
      }),
      block("rich-text", {
        content: "<p>Add your page content here.</p>",
      }),
    ],
  },
  {
    id: "landing",
    name: "Landing Page",
    description: "A generic page with hero, cards, and a call to action.",
    blocks: [
      block("hero", {
        heading: "Landing page heading",
        subheading: "Add concise supporting copy.",
      }),
      block("cards-grid", {
        title: "Highlights",
        cards: [
          { title: "Highlight one", description: "Describe this highlight." },
          { title: "Highlight two", description: "Describe this highlight." },
          { title: "Highlight three", description: "Describe this highlight." },
        ],
      }),
      block("cta", {
        heading: "Next step",
        subheading: "Invite visitors to continue.",
      }),
    ],
  },
  {
    id: "contact-form",
    name: "Form Page",
    description: "A simple page with a managed form embed.",
    blocks: [
      block("hero", {
        heading: "Get in touch",
        subheading: "Use the form below to send a message.",
      }),
      block("form-embed", {
        formSlug: "contact-form",
      }),
    ],
  },
];

export function getPageTemplate(id: string) {
  return PAGE_TEMPLATES.find((template) => template.id === id);
}
