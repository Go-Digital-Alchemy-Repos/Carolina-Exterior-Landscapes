import { Router } from "express";
import { insertCmsFormSchema } from "@shared/schema";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error-handler";
import { storage } from "../../storage";
import { paramString } from "../../utils/params";
import { getBaseUrl } from "../../utils/route-helpers";
import { resendFormSubmissionNotification } from "../../services/forms.service";

const router = Router();
const resendNotificationSchema = z.object({
  recipientUserIds: z.array(z.string().min(1)).min(1).max(10),
});

router.get(
  "/forms",
  asyncHandler(async (_req, res) => {
    res.json(await storage.forms.getAll());
  })
);

router.get(
  "/forms/:id",
  asyncHandler(async (req, res) => {
    const id = paramString(req.params.id);
    const form = await storage.forms.getById(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    res.json(form);
  })
);

router.get(
  "/forms/:id/submissions",
  asyncHandler(async (req, res) => {
    const id = paramString(req.params.id);
    const form = await storage.forms.getById(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    res.json(await storage.forms.getSubmissionsByFormId(id));
  })
);

router.get(
  "/forms/:id/notification-recipients",
  asyncHandler(async (req, res) => {
    const id = paramString(req.params.id);
    const form = await storage.forms.getById(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const users = await storage.users.getFormNotificationUsers(id);
    res.json(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      })),
    );
  }),
);

router.delete(
  "/forms/:id/submissions/:submissionId",
  asyncHandler(async (req, res) => {
    const id = paramString(req.params.id);
    const submissionId = paramString(req.params.submissionId);
    const form = await storage.forms.getById(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const deleted = await storage.forms.deleteSubmission(id, submissionId);
    if (!deleted) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json({ success: true });
  })
);

router.post(
  "/forms/:id/submissions/:submissionId/resend-notification",
  asyncHandler(async (req, res) => {
    const id = paramString(req.params.id);
    const submissionId = paramString(req.params.submissionId);
    const form = await storage.forms.getById(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const submission = await storage.forms.getSubmission(id, submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const parsed = resendNotificationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Select at least one notification recipient",
        errors: parsed.error.flatten(),
      });
    }

    const assignedUsers = await storage.users.getFormNotificationUsers(id);
    const assignedUsersById = new Map(assignedUsers.map((user) => [user.id, user]));
    const requestedUserIds = Array.from(new Set(parsed.data.recipientUserIds));
    const selectedUsers = requestedUserIds
      .map((userId) => assignedUsersById.get(userId))
      .filter((user) => user !== undefined);

    if (selectedUsers.length !== requestedUserIds.length) {
      return res.status(400).json({
        message: "One or more selected users are not assigned to notifications for this form",
      });
    }

    const recipients = selectedUsers.map((user) => user.email);
    const sent = await resendFormSubmissionNotification(
      form,
      submission,
      recipients,
      getBaseUrl(req),
    );
    if (!sent) {
      return res.status(502).json({
        message: "Notification could not be sent. Check the email provider and template settings.",
      });
    }

    res.json({
      success: true,
      recipients,
      message: `Notification accepted for ${recipients.join(", ")}`,
    });
  }),
);

router.post(
  "/forms",
  asyncHandler(async (req, res) => {
    const parsed = insertCmsFormSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid form payload", errors: parsed.error.flatten() });
    }

    const existing = await storage.forms.getBySlug(parsed.data.slug);
    if (existing) {
      return res.status(409).json({ message: "A form with that slug already exists" });
    }

    const form = await storage.forms.create(parsed.data);
    res.status(201).json(form);
  })
);

router.put(
  "/forms/:id",
  asyncHandler(async (req, res) => {
    const parsed = insertCmsFormSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid form payload", errors: parsed.error.flatten() });
    }

    const id = paramString(req.params.id);
    const current = await storage.forms.getById(id);
    if (!current) {
      return res.status(404).json({ message: "Form not found" });
    }

    const conflicting = await storage.forms.getBySlug(parsed.data.slug);
    if (conflicting && conflicting.id !== id) {
      return res.status(409).json({ message: "A form with that slug already exists" });
    }

    const form = await storage.forms.update(id, parsed.data);
    res.json(form);
  })
);

router.delete(
  "/forms/:id",
  asyncHandler(async (req, res) => {
    const id = paramString(req.params.id);
    const existing = await storage.forms.getById(id);
    if (!existing) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (existing.isSystem) {
      return res.status(400).json({ message: "System forms cannot be deleted" });
    }

    const deleted = await storage.forms.delete(id);
    res.json({ success: deleted });
  })
);

export default router;
