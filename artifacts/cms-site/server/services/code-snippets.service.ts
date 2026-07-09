import { storage } from "../storage/index";
import { logger } from "../utils/logger";

export interface SiteCodeSnippets {
  head: string;
  header: string;
  footer: string;
}

const EMPTY_SNIPPETS: SiteCodeSnippets = {
  head: "",
  header: "",
  footer: "",
};

function joinSnippets(...snippets: Array<string | null | undefined>) {
  return snippets.map((snippet) => snippet?.trim()).filter(Boolean).join("\n");
}

function extractHeadOnlyTagsFromBodyStart(snippet: string) {
  const promoted: string[] = [];
  const body = snippet.replace(/<meta\b[^>]*name=["']google-site-verification["'][^>]*\/?>/gi, (match) => {
    promoted.push(match);
    return "";
  });

  return {
    head: promoted.join("\n"),
    body: body.trim(),
  };
}

export async function getSiteCodeSnippets(): Promise<SiteCodeSnippets> {
  try {
    const [settings, seoSettings] = await Promise.all([
      storage.settings.getDecryptedCategory("code_snippets"),
      storage.seoSettings.get().catch(() => undefined),
    ]);
    const bodyStart = extractHeadOnlyTagsFromBodyStart(settings.header_snippets || "");
    return {
      head: joinSnippets(settings.head_snippets, seoSettings?.customHeadTags, bodyStart.head),
      header: bodyStart.body,
      footer: settings.footer_snippets || "",
    };
  } catch (err) {
    logger.app.warn("Failed to load site code snippets", {
      error: err instanceof Error ? err.message : String(err),
    });
    return EMPTY_SNIPPETS;
  }
}

function insertBeforeClosingTag(html: string, closingTag: string, snippet: string) {
  if (!snippet.trim()) return html;
  const index = html.toLowerCase().lastIndexOf(closingTag);
  if (index === -1) return `${html}\n${snippet}`;
  return `${html.slice(0, index)}${snippet}\n${html.slice(index)}`;
}

function insertAfterOpeningBody(html: string, snippet: string) {
  if (!snippet.trim()) return html;
  const match = html.match(/<body\b[^>]*>/i);
  if (!match || match.index === undefined) return `${snippet}\n${html}`;
  const insertAt = match.index + match[0].length;
  return `${html.slice(0, insertAt)}\n${snippet}${html.slice(insertAt)}`;
}

export function injectSiteCodeSnippets(html: string, snippets: SiteCodeSnippets) {
  let output = html;
  const hasHeadPlaceholder = output.includes("<!--APP_DYNAMIC_HEAD-->");
  if (hasHeadPlaceholder) {
    output = output.replace("<!--APP_DYNAMIC_HEAD-->", `<!--APP_DYNAMIC_HEAD-->\n${snippets.head}`);
  } else {
    output = insertBeforeClosingTag(output, "</head>", snippets.head);
  }
  output = insertAfterOpeningBody(output, snippets.header);
  output = insertBeforeClosingTag(output, "</body>", snippets.footer);
  return output;
}
