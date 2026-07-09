interface PublicHtmlSnapshot {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl?: string | null;
  robots?: string | null;
  bodyHtml: string;
  jsonLd: Array<Record<string, unknown>>;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function serializeJsonForHtml(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function getPublicHtmlSnapshot(_pathname: string): PublicHtmlSnapshot | null {
  return null;
}

export function injectPublicHtmlSnapshot(template: string, snapshot: PublicHtmlSnapshot | null) {
  const normalizedTemplate = template
    .replace(/\s*<meta name="description"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta property="og:title"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta property="og:description"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta property="og:image"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta property="og:url"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta name="twitter:card"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta name="twitter:title"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta name="twitter:description"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta name="twitter:image"[^>]*>\s*/i, "\n")
    .replace(/\s*<meta name="robots"[^>]*>\s*/i, "\n")
    .replace(/\s*<link rel="canonical"[^>]*>\s*/i, "\n");

  if (!snapshot) {
    return normalizedTemplate.replace("<!--APP_DYNAMIC_HEAD-->", "").replace("<!--APP_PRERENDER_CONTENT-->", "");
  }

  const headParts = [
    `<meta name="description" content="${escapeHtml(snapshot.description)}" />`,
    `<meta property="og:title" content="${escapeHtml(snapshot.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(snapshot.ogDescription)}" />`,
    `<meta property="og:url" content="${escapeHtml(snapshot.canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(snapshot.ogImageUrl || "")}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(snapshot.ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(snapshot.ogDescription)}" />`,
    snapshot.ogImageUrl ? `<meta name="twitter:image" content="${escapeHtml(snapshot.ogImageUrl)}" />` : "",
    `<link rel="canonical" href="${escapeHtml(snapshot.canonicalUrl)}" />`,
    snapshot.robots ? `<meta name="robots" content="${escapeHtml(snapshot.robots)}" />` : "",
    ...snapshot.jsonLd.map(
      (schema) =>
        `<script type="application/ld+json" data-prerender-json-ld="true">${serializeJsonForHtml(schema)}</script>`,
    ),
  ].filter(Boolean);

  return normalizedTemplate
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(snapshot.title)}</title>`)
    .replace("<!--APP_DYNAMIC_HEAD-->", () => headParts.join("\n"))
    .replace("<!--APP_PRERENDER_CONTENT-->", () => `<div id="seo-prerender" hidden aria-hidden="true">${snapshot.bodyHtml}</div>`);
}

export function getPrerenderedPublicPaths() {
  return [];
}

export function getPrerenderedPublicFilePath(_distPublicPath: string, _publicPath: string) {
  return null;
}

export async function writePublicHtmlSnapshots() {
  return [];
}
