import { describe, expect, it } from "vitest";
import { buildNavGroups } from "./admin-sidebar";
import type { AdminPermission } from "@shared/types";
import type { User } from "@shared/schema";

describe("Admin sidebar navigation", () => {
  it("shows Blog between Pages and Forms for content editors", () => {
    const groups = buildNavGroups(
      { id: "user-1", role: "editor" } as User,
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

  it("shows system emails in the admin-only system group", () => {
    const groups = buildNavGroups(
      { id: "user-1", role: "admin" } as User,
      () => true,
    );

    const systemItems = groups.find((group) => group.label === "System")?.items.map((item) => ({
      title: item.title,
      href: item.href,
    }));

    expect(systemItems).toContainEqual({ title: "System Emails", href: "/admin/system/emails" });
  });
});
