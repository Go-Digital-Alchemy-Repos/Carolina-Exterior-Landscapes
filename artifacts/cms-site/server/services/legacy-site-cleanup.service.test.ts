import { describe, expect, it } from "vitest";
import { containsLegacySiteContent } from "./legacy-site-content";

describe("containsLegacySiteContent", () => {
  it("identifies content inherited from the previous business site", () => {
    expect(containsLegacySiteContent({ title: "Commercial security camera installation" })).toBe(true);
    expect(containsLegacySiteContent({ url: "/images/cca-hero-homepage.webp" })).toBe(true);
  });

  it("does not flag landscaping content that happens to mention a gate", () => {
    expect(containsLegacySiteContent({ text: "A dumpster enclosure includes a durable access gate." })).toBe(false);
    expect(containsLegacySiteContent({ title: "Commercial Grounds Maintenance" })).toBe(false);
  });
});
