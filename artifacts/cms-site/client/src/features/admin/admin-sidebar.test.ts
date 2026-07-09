import { describe, expect, it } from "vitest";
import { buildNavGroups } from "./admin-sidebar";
import type { AdminPermission } from "@shared/types";

describe("Admin sidebar navigation", () => {
  it("shows Blog between Pages and Forms for content editors", () => {
    const groups = buildNavGroups(
      { id: "user-1", role: "editor" } as any,
      (permission: AdminPermission) => permission === "content",
    );

    const contentItems = groups.find((group) => group.label === "Content")?.items.map((item) => ({
      title: item.title,
      href: item.href,
    }));

    expect(contentItems).toEqual([
      { title: "CMS Overview", href: "/admin/cms" },
      { title: "Pages", href: "/admin/cms/pages" },
      { title: "Blog", href: "/admin/cms/blog" },
      { title: "Forms", href: "/admin/forms" },
      { title: "Galleries", href: "/admin/cms/galleries" },
      { title: "Media", href: "/admin/cms/media" },
      { title: "Sections", href: "/admin/cms/sections" },
      { title: "SEO", href: "/admin/cms/seo" },
    ]);
  });
});
