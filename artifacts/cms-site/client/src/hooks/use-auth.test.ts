import { describe, expect, it } from "vitest";
import { getAdminPermissions } from "./use-auth";
import { AdminPermission } from "@shared/types";
import type { User } from "@shared/schema";

function user(overrides: Partial<User>): User {
  return {
    id: "user-1",
    email: "admin@example.com",
    password: "hashed",
    firstName: null,
    lastName: null,
    role: "admin",
    adminPermissions: [],
    formNotificationFormIds: [],
    profileImageUrl: null,
    isSuspended: false,
    lastLoginAt: null,
    createdAt: new Date("2026-07-08T00:00:00.000Z"),
    updatedAt: new Date("2026-07-08T00:00:00.000Z"),
    ...overrides,
  };
}

describe("getAdminPermissions", () => {
  it("includes CRM for system admins", () => {
    expect(getAdminPermissions(user({ role: "admin" }))).toEqual([
      AdminPermission.CONTENT,
      AdminPermission.DESIGN,
      AdminPermission.CRM,
    ]);
  });

  it("preserves CRM permission for editors", () => {
    expect(getAdminPermissions(user({ role: "editor", adminPermissions: ["crm"] }))).toEqual([
      AdminPermission.CRM,
    ]);
  });
});
