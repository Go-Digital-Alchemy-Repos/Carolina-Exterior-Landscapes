import { ALL_BLOCKS, type BuilderContent, type PropDef } from "./block-registry";

const PLAIN_TEXT_FALLBACK_KEYS = new Set([
  "h1",
  "heading",
  "mobileHeading",
  "title",
  "subtitle",
  "eyebrow",
  "badge",
  "label",
  "name",
  "role",
  "ctaText",
  "primaryText",
  "secondaryText",
  "buttonText",
  "linkText",
]);

const RICH_TEXT_FIELD_KEYS = new Set([
  "answer",
  "body",
  "caption",
  "content",
  "description",
  "details",
  "message",
  "quote",
  "sectionDescription",
  "subheading",
  "subtitle",
  "summary",
]);

function decodeBasicEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function stripHtmlForPlainText(value: string) {
  return decodeBasicEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function shouldUseRichTextEditor(propDef: Pick<PropDef, "key" | "type">) {
  if (propDef.type === "richtext") return true;
  if (propDef.type !== "textarea") return false;
  if (propDef.key === "mobileHeading") return false;
  return RICH_TEXT_FIELD_KEYS.has(propDef.key);
}

function shouldNormalizePlainText(propDef?: Pick<PropDef, "key" | "type">, key?: string) {
  if (propDef) {
    if (shouldUseRichTextEditor(propDef)) return false;
    return propDef.type === "text" || propDef.type === "textarea";
  }
  return key ? PLAIN_TEXT_FALLBACK_KEYS.has(key) : false;
}

function normalizeArrayItems(value: unknown, itemSchema?: Omit<PropDef, "itemSchema">[]): unknown {
  if (!Array.isArray(value)) return value;

  const itemPropDefs = new Map((itemSchema ?? []).map((field) => [field.key, field]));
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    return normalizeProps(item as Record<string, unknown>, itemPropDefs);
  });
}

function normalizeProps(
  props: Record<string, unknown>,
  propDefs: Map<string, Omit<PropDef, "itemSchema"> | PropDef>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => {
      const propDef = propDefs.get(key);

      if (propDef?.type === "array-items") {
        return [key, normalizeArrayItems(value, (propDef as PropDef).itemSchema)];
      }

      if (Array.isArray(value)) {
        return [key, normalizeArrayItems(value)];
      }

      if (typeof value === "string" && shouldNormalizePlainText(propDef, key)) {
        return [key, stripHtmlForPlainText(value)];
      }

      return [key, value];
    }),
  );
}

export function normalizeBuilderPlainTextFields(content: BuilderContent): BuilderContent {
  return {
    ...content,
    blocks: (content.blocks ?? []).map((block) => {
      const blockDef = ALL_BLOCKS.find((definition) => definition.type === block.type);
      const propDefs = new Map((blockDef?.propDefs ?? []).map((propDef) => [propDef.key, propDef]));

      return {
        ...block,
        props: normalizeProps(block.props ?? {}, propDefs),
      };
    }),
  };
}
