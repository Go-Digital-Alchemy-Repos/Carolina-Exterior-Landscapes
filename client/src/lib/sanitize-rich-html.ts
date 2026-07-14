const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "del",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const BLOCKED_TAGS = new Set([
  "base",
  "button",
  "embed",
  "form",
  "iframe",
  "input",
  "link",
  "math",
  "meta",
  "object",
  "option",
  "script",
  "select",
  "style",
  "svg",
  "template",
  "textarea",
]);

const GLOBAL_ATTRIBUTES = new Set(["class", "title"]);
const TAG_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "rel", "target"]),
  img: new Set(["alt", "decoding", "height", "loading", "src", "width"]),
  ol: new Set(["start"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"]),
};

function isSafeUrl(value: string): boolean {
  const normalized = Array.from(value.trim())
    .filter((character) => character.charCodeAt(0) > 0x20)
    .join("");
  if (!normalized) return false;
  if (normalized.startsWith("#") || normalized.startsWith("/") || normalized.startsWith("./") || normalized.startsWith("../")) {
    return !normalized.startsWith("//");
  }

  try {
    const protocol = new URL(normalized, "https://sanitizer.invalid").protocol;
    return protocol === "http:" || protocol === "https:" || protocol === "mailto:" || protocol === "tel:";
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanElement(element: Element): void {
  const tag = element.tagName.toLowerCase();

  if (BLOCKED_TAGS.has(tag)) {
    element.remove();
    return;
  }

  if (!ALLOWED_TAGS.has(tag)) {
    element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase();
    const allowed = GLOBAL_ATTRIBUTES.has(name) || TAG_ATTRIBUTES[tag]?.has(name);
    if (!allowed || name.startsWith("on")) {
      element.removeAttribute(attribute.name);
    }
  }

  if (tag === "a") {
    const href = element.getAttribute("href");
    if (href && !isSafeUrl(href)) element.removeAttribute("href");

    const target = element.getAttribute("target");
    if (target !== "_blank" && target !== "_self") element.removeAttribute("target");
    if (target === "_blank") element.setAttribute("rel", "noopener noreferrer");
  }

  if (tag === "img") {
    const src = element.getAttribute("src");
    if (!src || !isSafeUrl(src)) {
      element.remove();
      return;
    }
    if (!element.hasAttribute("alt")) element.setAttribute("alt", "");
  }

  for (const child of Array.from(element.children)) cleanElement(child);
}

export function sanitizeRichHtml(value: string): string {
  if (!value) return "";
  if (typeof DOMParser === "undefined") return escapeHtml(value);

  const document = new DOMParser().parseFromString(value, "text/html");
  for (const child of Array.from(document.body.children)) cleanElement(child);
  return document.body.innerHTML;
}
