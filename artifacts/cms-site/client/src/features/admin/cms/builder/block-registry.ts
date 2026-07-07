export type PropType =
  | "text"
  | "textarea"
  | "richtext"
  | "image-url"
  | "url"
  | "page-select"
  | "select"
  | "form-select"
  | "boolean"
  | "number"
  | "color"
  | "array-items";

export interface PropDef {
  key: string;
  label: string;
  type: PropType;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  itemSchema?: Omit<PropDef, "itemSchema">[];
}

export type BlockCategory = "layout" | "hero" | "content" | "media" | "conversion" | "dynamic" | "testimonials";

export interface BlockDef {
  type: string;
  label: string;
  iconName: string;
  description: string;
  category: BlockCategory;
  defaultProps: Record<string, unknown>;
  propDefs: PropDef[];
  isDynamic?: boolean;
}

export interface BlockInstance {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

export interface BuilderContent {
  blocks: BlockInstance[];
}

const ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const COLUMNS_OPTIONS = [
  { label: "2 columns", value: "2" },
  { label: "3 columns", value: "3" },
  { label: "4 columns", value: "4" },
];

export const ALL_BLOCKS: BlockDef[] = [
  {
    type: "hero",
    label: "Hero",
    iconName: "PanelTop",
    description: "Page hero with heading, supporting copy, and optional image",
    category: "hero",
    defaultProps: {
      eyebrow: "",
      heading: "Page heading",
      mobileHeading: "",
      subheading: "",
      ctaText: "",
      ctaLink: "",
      backgroundImageUrl: "",
      backgroundPositionX: 50,
      backgroundPositionY: 50,
      backgroundImageOpacity: 100,
      overlayColor: "#000000",
      overlayOpacity: 30,
      gradientEnabled: true,
      gradientColor: "#102234",
      gradientOpacity: 75,
      gradientHeight: 40,
      alignment: "center",
    },
    propDefs: [
      { key: "eyebrow", label: "Eyebrow", type: "text", placeholder: "Optional intro label" },
      { key: "heading", label: "Heading", type: "text", placeholder: "Page heading" },
      { key: "mobileHeading", label: "Mobile Heading", type: "textarea", placeholder: "Optional mobile-only heading", helpText: "Shown only on screens 640px wide and below. Use line breaks to control mobile wrapping." },
      { key: "subheading", label: "Subheading", type: "textarea", placeholder: "Supporting copy" },
      { key: "ctaText", label: "Button Text", type: "text", placeholder: "Learn more" },
      { key: "ctaLink", label: "Button Link", type: "url", placeholder: "/page" },
      { key: "backgroundImageUrl", label: "Background Image", type: "image-url" },
      { key: "backgroundPositionX", label: "Background Focal X", type: "number", min: 0, max: 100 },
      { key: "backgroundPositionY", label: "Background Focal Y", type: "number", min: 0, max: 100 },
      { key: "backgroundImageOpacity", label: "Image Visibility", type: "number", min: 0, max: 100, helpText: "0 hides the photo; 100 shows the photo at full strength." },
      { key: "overlayColor", label: "Overlay Color", type: "color" },
      { key: "overlayOpacity", label: "Dark Overlay Strength", type: "number", min: 0, max: 100, helpText: "0 adds no dark tint; 100 fully covers the image with the overlay color." },
      { key: "gradientEnabled", label: "Bottom Gradient", type: "boolean" },
      { key: "gradientColor", label: "Gradient Color", type: "color" },
      { key: "gradientOpacity", label: "Gradient Strength", type: "number", min: 0, max: 100 },
      { key: "gradientHeight", label: "Gradient Height", type: "number", min: 0, max: 100 },
      { key: "alignment", label: "Alignment", type: "select", options: ALIGN_OPTIONS },
    ],
  },
  {
    type: "section-header",
    label: "Section Header",
    iconName: "Heading2",
    description: "Eyebrow, heading, and supporting text",
    category: "content",
    defaultProps: { eyebrow: "", title: "Section heading", subtitle: "", alignment: "center" },
    propDefs: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text", placeholder: "Section heading" },
      { key: "subtitle", label: "Subtitle", type: "textarea", placeholder: "Supporting copy" },
      { key: "alignment", label: "Alignment", type: "select", options: ALIGN_OPTIONS },
    ],
  },
  {
    type: "rich-text",
    label: "Rich Text",
    iconName: "Text",
    description: "Formatted text content",
    category: "content",
    defaultProps: { content: "<p>Add your content here.</p>", alignment: "left" },
    propDefs: [
      { key: "content", label: "Content", type: "richtext" },
      { key: "alignment", label: "Alignment", type: "select", options: ALIGN_OPTIONS },
    ],
  },
  {
    type: "text-image",
    label: "Text + Image",
    iconName: "Image",
    description: "Text alongside an image",
    category: "media",
    defaultProps: {
      heading: "Feature heading",
      body: "Add supporting copy.",
      imageUrl: "",
      imageAlt: "",
      imagePositionX: 50,
      imagePositionY: 50,
      imagePosition: "right",
    },
    propDefs: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
      { key: "imageUrl", label: "Image", type: "image-url" },
      { key: "imageAlt", label: "Image Alt Text", type: "text" },
      { key: "imagePositionX", label: "Image Focal X", type: "number", min: 0, max: 100 },
      { key: "imagePositionY", label: "Image Focal Y", type: "number", min: 0, max: 100 },
      {
        key: "imagePosition",
        label: "Image Position",
        type: "select",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
    ],
  },
  {
    type: "cards-grid",
    label: "Cards Grid",
    iconName: "LayoutGrid",
    description: "A grid of reusable content cards",
    category: "content",
    defaultProps: {
      title: "Cards heading",
      subtitle: "",
      columns: "3",
      cards: [
        { title: "Card title", description: "Card description" },
      ],
    },
    propDefs: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "columns", label: "Columns", type: "select", options: COLUMNS_OPTIONS },
      {
        key: "cards",
        label: "Cards",
        type: "array-items",
        itemSchema: [
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "icon", label: "Icon", type: "text" },
          { key: "linkText", label: "Link Text", type: "text" },
          { key: "linkPath", label: "Link Path", type: "url" },
          { key: "imageUrl", label: "Image", type: "image-url" },
          { key: "imagePositionX", label: "Image Focal X", type: "number", min: 0, max: 100 },
          { key: "imagePositionY", label: "Image Focal Y", type: "number", min: 0, max: 100 },
          { key: "link", label: "Link", type: "url" },
        ],
      },
    ],
  },
  {
    type: "testimonials",
    label: "Testimonials",
    iconName: "Star",
    description: "Customer review cards with optional Google styling",
    category: "testimonials",
    defaultProps: {
      eyebrow: "Google Reviews",
      title: "Latest Google Reviews",
      subtitle: "",
      variant: "google-carousel",
      ctaText: "Read Reviews on Google",
      ctaLink: "",
      items: [],
    },
    propDefs: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      {
        key: "variant",
        label: "Variant",
        type: "select",
        options: [
          { label: "Google reviews", value: "google-carousel" },
          { label: "Standard", value: "standard" },
        ],
      },
      { key: "ctaText", label: "CTA Text", type: "text" },
      { key: "ctaLink", label: "CTA Link", type: "url" },
      {
        key: "items",
        label: "Review Items",
        type: "array-items",
        itemSchema: [
          { key: "quote", label: "Quote", type: "textarea" },
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Role", type: "text" },
          { key: "location", label: "Location", type: "text" },
          { key: "date", label: "Date", type: "text" },
          { key: "rating", label: "Rating", type: "number", min: 1, max: 5 },
        ],
      },
    ],
  },
  {
    type: "review-widget",
    label: "Review Widget",
    iconName: "Star",
    description: "Placeholder for the Google reviews widget",
    category: "dynamic",
    isDynamic: true,
    defaultProps: {
      placeholder: true,
      message: "Google reviews will display here once the review widget is configured.",
    },
    propDefs: [
      { key: "message", label: "Placeholder Message", type: "textarea" },
    ],
  },
  {
    type: "contact-nap",
    label: "Contact Details",
    iconName: "MapPin",
    description: "Business name, address, phone, email, hours, and credentials",
    category: "content",
    defaultProps: {
      content: {
        name: "Carolina Exterior Landscapes",
        street: "",
        cityStateZip: "Monroe, NC 28110",
        phone: { display: "(704) 975-5867", href: "tel:+17049755867" },
        email: { display: "info@carolinaexteriorlandscapes.com", href: "mailto:info@carolinaexteriorlandscapes.com" },
        hours: "Monday – Friday, 8:00 AM – 5:00 PM",
        license: "",
        licensing: "Locally owned, licensed, and insured",
        credential: "Lawn care, landscaping, hardscape, and drainage",
      },
      background: "white",
    },
    propDefs: [
      { key: "background", label: "Background", type: "text" },
    ],
  },
  {
    type: "map-embed",
    label: "Map Embed",
    iconName: "MapPinned",
    description: "Embedded map for a business address",
    category: "media",
    defaultProps: {
      address: "Monroe, NC 28110",
    },
    propDefs: [
      { key: "address", label: "Address", type: "text" },
    ],
  },
  {
    type: "trust-bar",
    label: "Trust Bar",
    iconName: "ShieldCheck",
    description: "Compact trust signals with icons and labels",
    category: "content",
    defaultProps: {
      items: [
        { icon: "Shield", label: "Family Owned and Operated", sublabel: "" },
        { icon: "Award", label: "Licensed Contractor", sublabel: "" },
      ],
    },
    propDefs: [
      {
        key: "items",
        label: "Items",
        type: "array-items",
        itemSchema: [
          { key: "icon", label: "Icon", type: "text" },
          { key: "label", label: "Label", type: "text" },
          { key: "sublabel", label: "Sublabel", type: "text" },
        ],
      },
    ],
  },
  {
    type: "areas-grid",
    label: "Areas Grid",
    iconName: "MapPin",
    description: "Linked service-area city grid",
    category: "content",
    defaultProps: {
      items: [
        { label: "Monroe, NC", path: "/service-areas/monroe-nc/" },
        { label: "Waxhaw, NC", path: "/service-areas/waxhaw-nc/" },
      ],
    },
    propDefs: [
      {
        key: "items",
        label: "Areas",
        type: "array-items",
        itemSchema: [
          { key: "label", label: "Label", type: "text" },
          { key: "path", label: "Path", type: "url" },
        ],
      },
    ],
  },
  {
    type: "cta",
    label: "Call To Action",
    iconName: "MousePointerClick",
    description: "Simple call-to-action section",
    category: "conversion",
    defaultProps: { heading: "Ready to get started?", subheading: "", primaryText: "", primaryLink: "" },
    propDefs: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "subheading", label: "Subheading", type: "textarea" },
      { key: "primaryText", label: "Button Text", type: "text" },
      { key: "primaryLink", label: "Button Link", type: "url" },
    ],
  },
  {
    type: "faq",
    label: "FAQ",
    iconName: "CircleHelp",
    description: "Question and answer list",
    category: "content",
    defaultProps: {
      items: [
        { question: "Question?", answer: "Answer." },
      ],
    },
    propDefs: [
      {
        key: "items",
        label: "Items",
        type: "array-items",
        itemSchema: [
          { key: "question", label: "Question", type: "text" },
          { key: "answer", label: "Answer", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "form-embed",
    label: "Form Embed",
    iconName: "FileText",
    description: "Embed a generic managed form",
    category: "dynamic",
    isDynamic: true,
    defaultProps: { formSlug: "contact-form" },
    propDefs: [{ key: "formSlug", label: "Assigned Form", type: "form-select" }],
  },
];

export function normalizeBlockType(type: string): string {
  return type;
}

export function getBlockDef(type: string): BlockDef | undefined {
  return ALL_BLOCKS.find((block) => block.type === normalizeBlockType(type));
}

export function isDynamicBlock(type: string): boolean {
  return getBlockDef(type)?.isDynamic === true;
}

export function createBlock(type: string): BlockInstance {
  const def = getBlockDef(type);
  if (!def) throw new Error(`Unknown block type: ${type}`);
  return {
    id: crypto.randomUUID(),
    type,
    props: { ...def.defaultProps },
  };
}
