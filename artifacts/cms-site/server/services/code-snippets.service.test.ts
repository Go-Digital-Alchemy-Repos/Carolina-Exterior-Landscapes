import { describe, expect, it, vi } from "vitest";

vi.mock("../storage/index", () => ({
  storage: {
    settings: {
      getDecryptedCategory: vi.fn(),
    },
    seoSettings: {
      get: vi.fn(),
    },
  },
}));

vi.mock("../utils/logger", () => ({
  logger: {
    app: {
      warn: vi.fn(),
    },
  },
}));

describe("code snippets injection", () => {
  it("injects head, header, and footer snippets into app html", async () => {
    const { injectSiteCodeSnippets } = await import("./code-snippets.service");
    const html = `<!doctype html>
<html>
  <head><!--APP_DYNAMIC_HEAD--></head>
  <body><div id="root"></div></body>
</html>`;

    const result = injectSiteCodeSnippets(html, {
      head: '<meta name="google-site-verification" content="abc" />',
      header: '<noscript id="tag-manager"></noscript>',
      footer: '<script src="https://example.com/widget.js"></script>',
    });

    expect(result).toContain('<!--APP_DYNAMIC_HEAD-->\n<meta name="google-site-verification" content="abc" />');
    expect(result).toContain('<body>\n<noscript id="tag-manager"></noscript><div id="root"></div>');
    expect(result).toContain('<script src="https://example.com/widget.js"></script>\n</body>');
  });

  it("promotes Search Console verification meta tags from body-start snippets into the head", async () => {
    const { storage } = await import("../storage/index");
    const { getSiteCodeSnippets } = await import("./code-snippets.service");
    vi.mocked(storage.settings.getDecryptedCategory).mockResolvedValue({
      head_snippets: "",
      header_snippets: '<meta name="google-site-verification" content="abc" />\n<noscript id="tag-manager"></noscript>',
      footer_snippets: "",
    });
    vi.mocked(storage.seoSettings.get).mockResolvedValue(undefined);

    const snippets = await getSiteCodeSnippets();

    expect(snippets.head).toContain('name="google-site-verification"');
    expect(snippets.header).not.toContain("google-site-verification");
    expect(snippets.header).toContain('<noscript id="tag-manager"></noscript>');
  });
});
