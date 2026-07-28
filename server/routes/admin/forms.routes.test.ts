import express from "express";
import type { User } from "@shared/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetFormById = vi.fn();
const mockGetSubmission = vi.fn();
const mockResendFormSubmissionNotification = vi.fn();

vi.mock("../../storage", () => ({
  storage: {
    forms: {
      getById: mockGetFormById,
      getSubmission: mockGetSubmission,
    },
  },
}));

vi.mock("../../services/forms.service", () => ({
  resendFormSubmissionNotification: mockResendFormSubmissionNotification,
}));

describe("admin form notification routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFormById.mockResolvedValue({
      id: "form-1",
      name: "Residential Quote Form",
      slug: "residential-quote",
    });
    mockGetSubmission.mockResolvedValue({
      id: "submission-1",
      formId: "form-1",
      data: { name: "Jane Homeowner", email: "jane@example.com" },
    });
    mockResendFormSubmissionNotification.mockResolvedValue(true);
  });

  it("resends only to the signed-in user's email address", async () => {
    const { default: formsRoutes } = await import("./forms.routes");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = {
        id: "admin-1",
        email: "signed-in-admin@example.com",
        role: "admin",
      } as User;
      next();
    });
    app.use("/api/admin", formsRoutes);
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not start");

    try {
      const response = await fetch(
        `http://127.0.0.1:${address.port}/api/admin/forms/form-1/submissions/submission-1/resend-notification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipient: "someone-else@example.com" }),
        },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        success: true,
        recipient: "signed-in-admin@example.com",
        message: "Notification sent to signed-in-admin@example.com",
      });
      expect(mockResendFormSubmissionNotification).toHaveBeenCalledWith(
        expect.objectContaining({ id: "form-1" }),
        expect.objectContaining({ id: "submission-1" }),
        "signed-in-admin@example.com",
        expect.stringMatching(/^http:\/\/127\.0\.0\.1:/),
      );
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
