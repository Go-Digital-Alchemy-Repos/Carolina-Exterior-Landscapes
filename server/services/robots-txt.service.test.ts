import { describe, expect, it } from "vitest";
import { buildDefaultRobotsTxt, buildRobotsTxtPayload } from "./robots-txt.service";

const settings = {
  siteUrl: "https://carolinaexteriorlandscapes.com/",
  defaultRobotsNoindex: false,
  customRobotsTxt: null,
} as any;

describe("robots.txt generation", () => {
  it("allows search and answer crawlers without allowing training use", () => {
    const content = buildDefaultRobotsTxt(settings);
    expect(content).toContain("Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference");
    expect(content).toContain("User-agent: OAI-SearchBot\nAllow: /");
    expect(content).toContain("User-agent: PerplexityBot\nAllow: /");
    expect(content).toContain("Disallow: /admin");
    expect(content).toContain("Sitemap: https://carolinaexteriorlandscapes.com/sitemap.xml");
  });

  it("adds required discovery directives after legacy custom content", () => {
    const payload = buildRobotsTxtPayload({
      ...settings,
      customRobotsTxt: "User-agent: *\nDisallow: /wp-admin/",
    });
    expect(payload.effectiveContent).toContain("Disallow: /wp-admin/");
    expect(payload.effectiveContent).toContain("User-agent: OAI-SearchBot");
    expect(payload.effectiveContent).toContain("ai-input=yes");
    expect(payload.effectiveContent).toContain("Disallow: /api\n\nUser-agent: OAI-SearchBot");
    expect(payload.effectiveContent).toContain("Disallow: /api\n\nUser-agent: PerplexityBot");
  });

  it("does not append allow rules when the site-wide noindex switch is enabled", () => {
    const payload = buildRobotsTxtPayload({
      ...settings,
      defaultRobotsNoindex: true,
      customRobotsTxt: null,
    });
    expect(payload.effectiveContent).toBe("User-agent: *\nDisallow: /\n");
  });
});
