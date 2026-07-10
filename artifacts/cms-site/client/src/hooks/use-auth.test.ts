import { describe, expect, it } from "vitest";
import type { User } from "@shared/schema";
import { AdminPermission } from "@shared/types";
import { getAdminPermissions } from "./use-auth";

describe("getAdminPermissions", () => {
  it("includes CRM for administrators", () => {
    const permissions = getAdminPermissions({ role: "admin" } as User);

    expect(permissions).toContain(AdminPermission.CRM);
  });

  it("preserves CRM access assigned to editors", () => {
    const permissions = getAdminPermissions({
      role: "editor",
      adminPermissions: [AdminPermission.CRM],
    } as User);

    expect(permissions).toEqual([AdminPermission.CRM]);
  });
});
