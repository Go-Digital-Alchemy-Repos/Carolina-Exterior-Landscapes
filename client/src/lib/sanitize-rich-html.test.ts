// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { sanitizeRichHtml } from "./sanitize-rich-html";

describe("sanitizeRichHtml", () => {
  it("removes executable markup and unsafe URLs", () => {
    const result = sanitizeRichHtml(
      '<p onclick="alert(1)">Hello<script>alert(1)</script><a href="javascript:alert(1)" onmouseover="alert(1)">link</a><iframe src="https://example.com"></iframe></p>',
    );

    expect(result).toBe("<p>Hello<a>link</a></p>");
  });

  it("preserves safe rich content and secures new-window links", () => {
    const result = sanitizeRichHtml(
      '<h2 class="title">Heading</h2><p><strong>Text</strong> <a href="https://example.com" target="_blank">visit</a></p><img src="/uploads/photo.webp" width="640">',
    );

    expect(result).toContain('<h2 class="title">Heading</h2>');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank" rel="noopener noreferrer"');
    expect(result).toContain('src="/uploads/photo.webp"');
    expect(result).toContain('alt=""');
  });
});
