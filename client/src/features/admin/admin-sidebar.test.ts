import { describe, expect, it } from "vitest";
import { buildNavGroups, getActiveAdminNavItem } from "./admin-sidebar";
import { AdminPermission, type AdminPermission as AdminPermissionType } from "@shared/types";
import type { User } from "@shared/schema";

describe("Admin sidebar navigation", () => {
  it("shows Blog between Pages and Forms for content editors", () => {
    const groups = buildNavGroups(
      { id: "user-1", role: "editor" } as User,
      (permission: AdminPermissionType) => permission === "content",
    );

    const contentItems = groups
      .find((group) => group.label === "Content")
      ?.items.map((item) => ({
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
    const groups = buildNavGroups({ id: "user-1", role: "admin" } as User, () => true);

    const systemItems = groups
      .find((group) => group.label === "System")
      ?.items.map((item) => ({
        title: item.title,
        href: item.href,
      }));

    expect(systemItems).toContainEqual({ title: "System Emails", href: "/admin/system/emails" });
  });

  it("shows the CRM pipeline and clients when CRM access is granted", () => {
    const groups = buildNavGroups(
      { id: "user-1", role: "admin" } as User,
      (permission: AdminPermissionType) => permission === AdminPermission.CRM,
    );

    const crmItems = groups
      .find((group) => group.label === "CRM")
      ?.items.map((item) => ({
        title: item.title,
        href: item.href,
      }));

    expect(crmItems).toEqual([
      { title: "CRM Pipeline", href: "/admin/crm" },
      { title: "Clients", href: "/admin/crm/clients" },
    ]);
  });

  it("uses the most specific permitted item for mobile section titles and active state", () => {
    const groups = buildNavGroups({ id: "user-1", role: "admin" } as User, () => true);

    expect(getActiveAdminNavItem(groups, "/admin/cms/pages/page-123")?.title).toBe("Pages");
    expect(getActiveAdminNavItem(groups, "/admin/crm/clients/client-123")?.title).toBe("Clients");
  });
});
