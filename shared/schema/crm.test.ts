import { describe, expect, it } from "vitest";
import { crmClientUpdateSchema } from "./crm";

describe("crmClientUpdateSchema", () => {
  it("validates enums and email/date fields", () => {
    expect(crmClientUpdateSchema.parse({
      status: "active",
      clientType: "business",
      primaryEmail: "client@example.com",
      renewalDate: "2026-08-01",
      internalTags: ["hoa", "maintenance"],
    })).toEqual(expect.objectContaining({
      status: "active",
      clientType: "business",
      primaryEmail: "client@example.com",
      renewalDate: new Date("2026-08-01"),
      internalTags: ["hoa", "maintenance"],
    }));

    expect(() => crmClientUpdateSchema.parse({ status: "paused" })).toThrow();
    expect(() => crmClientUpdateSchema.parse({ primaryEmail: "not-email" })).toThrow();
    expect(() => crmClientUpdateSchema.parse({ renewalDate: "not-a-date" })).toThrow();
  });
});
