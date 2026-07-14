import type { SeoSettings } from "@shared/schema";

export interface RobotsTxtPayload {
  generatedContent: string;
  effectiveContent: string;
  customContent: string | null;
}

export function buildDefaultRobotsTxt(seoSettings?: SeoSettings | null) {
  const siteUrl = seoSettings?.siteUrl?.replace(/\/$/, "") || "";
  const noindexAll = seoSettings?.defaultRobotsNoindex ?? false;

  const lines: string[] = [];
  lines.push("User-agent: *");
  if (noindexAll) {
    lines.push("Disallow: /");
  } else {
    lines.push("Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference");
    lines.push("Allow: /");
    lines.push("Disallow: /admin");
    lines.push("Disallow: /api");
    lines.push("");
    lines.push("User-agent: OAI-SearchBot");
    lines.push("Allow: /");
    lines.push("Disallow: /admin");
    lines.push("Disallow: /api");
    lines.push("");
    lines.push("User-agent: PerplexityBot");
    lines.push("Allow: /");
    lines.push("Disallow: /admin");
    lines.push("Disallow: /api");
    if (siteUrl) {
      lines.push("");
      lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function buildRobotsTxtPayload(seoSettings?: SeoSettings | null): RobotsTxtPayload {
  const generatedContent = buildDefaultRobotsTxt(seoSettings);
  const customContent = seoSettings?.customRobotsTxt?.trim() ? seoSettings.customRobotsTxt : null;
  const discoveryLines = [
        "User-agent: *",
        "Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference",
        "Disallow: /admin",
        "Disallow: /api",
        "",
        "User-agent: OAI-SearchBot",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /api",
        "",
        "User-agent: PerplexityBot",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /api",
      ];
  if (seoSettings?.siteUrl) {
    discoveryLines.push("", `Sitemap: ${seoSettings.siteUrl.replace(/\/$/, "")}/sitemap.xml`);
  }
  const discoveryDirectives = seoSettings?.defaultRobotsNoindex
    ? ""
    : discoveryLines.join("\n");

  return {
    generatedContent,
    effectiveContent: customContent
      ? `${customContent.trim()}\n\n${discoveryDirectives}\n`
      : generatedContent,
    customContent,
  };
}
