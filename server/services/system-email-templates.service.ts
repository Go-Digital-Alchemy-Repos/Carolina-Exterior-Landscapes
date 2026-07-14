import { storage } from "../storage";

const SYSTEM_TEMPLATES = [
  {
    slug: "password-reset",
    name: "Password Reset",
    subject: "Reset your password",
    description: "Sent when an admin user requests a password reset.",
    variables: ["firstName", "resetUrl"],
    htmlBody: `<p>Hi {{firstName}},</p><p>Use the link below to reset your password.</p><p><a href="{{resetUrl}}">Reset password</a></p>`,
  },
  {
    slug: "welcome-admin-user",
    name: "Admin User Welcome",
    subject: "Your website admin account is ready",
    description: "Sent when an admin creates a backend user account.",
    variables: ["firstName", "loginUrl", "tempPassword"],
    htmlBody: `<p>Hi {{firstName}},</p><p>An admin account has been created for you.</p><p><a href="{{loginUrl}}">Sign in</a></p><p>{{tempPassword}}</p>`,
  },
  {
    slug: "website-form-submission",
    name: "Website Form Submission",
    subject: "New {{formName}} submission from {{senderName}}",
    description: "Sent to admins when a website contact or quote form is submitted.",
    variables: ["formName", "senderName", "senderEmail", "senderPhone", "subject", "submissionSummary", "sourcePage", "adminUrl"],
    htmlBody: `<p>A new <strong>{{formName}}</strong> submission was received.</p><p><strong>Name:</strong> {{senderName}}<br><strong>Email:</strong> {{senderEmail}}<br><strong>Phone:</strong> {{senderPhone}}</p><p><strong>Subject:</strong> {{subject}}</p><pre style="white-space:pre-wrap;font-family:inherit;">{{submissionSummary}}</pre><p><strong>Source:</strong> {{sourcePage}}</p><p><a href="{{adminUrl}}">View submissions</a></p>`,
  },
];

export async function ensureSystemEmailTemplates(refreshExisting = false) {
  let total = 0;
  for (const template of SYSTEM_TEMPLATES) {
    const existing = await storage.emailTemplates.getTemplate(template.slug);
    if (existing) {
      if (refreshExisting) {
        await storage.emailTemplates.upsertTemplate({ ...template, isActive: true });
        total += 1;
      }
      continue;
    }
    await storage.emailTemplates.upsertTemplate({
      ...template,
      isActive: true,
    });
    total += 1;
  }
  return { total };
}
