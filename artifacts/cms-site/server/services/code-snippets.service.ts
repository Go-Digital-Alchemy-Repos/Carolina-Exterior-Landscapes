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

export async function getSiteCodeSnippets(): Promise<SiteCodeSnippets> {
  try {
    const settings = await storage.settings.getDecryptedCategory("code_snippets");
    return {
      head: settings.head_snippets || "",
      header: settings.header_snippets || "",
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
