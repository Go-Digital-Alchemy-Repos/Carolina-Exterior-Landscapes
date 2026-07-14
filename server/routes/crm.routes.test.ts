import express from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetDecryptedCategory = vi.fn();
const mockCreateOrUpdateCrmLead = vi.fn();

vi.mock("../storage", () => ({
  storage: {
    settings: {
      getDecryptedCategory: mockGetDecryptedCategory,
    },
  },
}));

vi.mock("../services/crm.service", () => ({
  createOrUpdateCrmLead: mockCreateOrUpdateCrmLead,
}));

describe("public CRM routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDecryptedCategory.mockResolvedValue({ crm_api_key: "secret" });
    mockCreateOrUpdateCrmLead.mockResolvedValue({ lead: { id: "lead-1" }, duplicate: false });
  });

  it("rejects invalid CRM API keys", async () => {
    const { default: crmRoutes } = await import("./crm.routes");
    const app = express();
    app.use(express.json());
    app.use("/api/crm", crmRoutes);
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not start");

    const res = await fetch(`http://127.0.0.1:${address.port}/api/crm/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CRM-API-Key": "wrong" },
      body: JSON.stringify({ name: "Jane" }),
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Invalid CRM API key" });
    expect(mockCreateOrUpdateCrmLead).not.toHaveBeenCalled();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
