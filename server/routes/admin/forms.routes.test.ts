import express from "express";
import type { User } from "@shared/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetFormById = vi.fn();
const mockGetSubmission = vi.fn();
const mockGetFormNotificationUsers = vi.fn();
const mockResendFormSubmissionNotification = vi.fn();

vi.mock("../../storage", () => ({
  storage: {
    forms: {
      getById: mockGetFormById,
      getSubmission: mockGetSubmission,
    },
    users: {
      getFormNotificationUsers: mockGetFormNotificationUsers,
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
    mockGetFormNotificationUsers.mockResolvedValue([
      {
        id: "user-1",
        email: "mike@godigitalalchemy.com",
        firstName: "Mike",
        lastName: "Dickerman",
        role: "admin",
      },
      {
        id: "user-2",
        email: "ian@carolinaexteriorlandscapes.com",
        firstName: "Ian",
        lastName: "McLaughlin",
        role: "admin",
      },
    ]);
    mockResendFormSubmissionNotification.mockResolvedValue(true);
  });

  it("lists only users assigned to notifications for the form", async () => {
    const { default: formsRoutes } = await import("./forms.routes");
    const app = express();
    app.use(express.json());
    app.use("/api/admin", formsRoutes);
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not start");

    try {
      const response = await fetch(
        `http://127.0.0.1:${address.port}/api/admin/forms/form-1/notification-recipients`,
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([
        {
          id: "user-1",
          email: "mike@godigitalalchemy.com",
          firstName: "Mike",
          lastName: "Dickerman",
          role: "admin",
        },
        {
          id: "user-2",
          email: "ian@carolinaexteriorlandscapes.com",
          firstName: "Ian",
          lastName: "McLaughlin",
          role: "admin",
        },
      ]);
      expect(mockGetFormNotificationUsers).toHaveBeenCalledWith("form-1");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("resends only to selected users assigned to the form", async () => {
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
          body: JSON.stringify({ recipientUserIds: ["user-2"] }),
        },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        success: true,
        recipients: ["ian@carolinaexteriorlandscapes.com"],
        message: "Notification accepted for ian@carolinaexteriorlandscapes.com",
      });
      expect(mockResendFormSubmissionNotification).toHaveBeenCalledWith(
        expect.objectContaining({ id: "form-1" }),
        expect.objectContaining({ id: "submission-1" }),
        ["ian@carolinaexteriorlandscapes.com"],
        expect.stringMatching(/^http:\/\/127\.0\.0\.1:/),
      );
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("rejects recipient users who are not assigned to the form", async () => {
    const { default: formsRoutes } = await import("./forms.routes");
    const app = express();
    app.use(express.json());
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
          body: JSON.stringify({ recipientUserIds: ["not-assigned"] }),
        },
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "One or more selected users are not assigned to notifications for this form",
      });
      expect(mockResendFormSubmissionNotification).not.toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
