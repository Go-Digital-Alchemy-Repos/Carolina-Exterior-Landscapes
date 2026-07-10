import { describe, expect, it } from "vitest";
import { publicationTimestampForTransition } from "./cms-publication-state";

describe("CMS publication state", () => {
  const publishedNow = new Date("2026-09-06T14:30:00.000Z");

  it("stamps the actual time a draft becomes published", () => {
    expect(publicationTimestampForTransition("published", "draft", publishedNow)).toBe(publishedNow);
  });

  it("preserves the original publication timestamp during ordinary published edits", () => {
    expect(publicationTimestampForTransition("published", "published", publishedNow)).toBeUndefined();
  });

  it("clears the timestamp when a published post becomes a draft", () => {
    expect(publicationTimestampForTransition("draft", "published", publishedNow)).toBeNull();
  });
});
