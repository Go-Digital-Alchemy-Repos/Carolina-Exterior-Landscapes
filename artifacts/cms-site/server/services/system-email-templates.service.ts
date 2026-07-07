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
];

export async function ensureSystemEmailTemplates(refreshExisting = false) {
  let total = 0;
  for (const template of SYSTEM_TEMPLATES) {
    const existing = await storage.emailTemplates.getTemplate(template.slug);
    if (existing) {
      if (refreshExisting) {
        await storage.emailTemplates.updateTemplate(template.slug, {
          subject: template.subject,
          htmlBody: template.htmlBody,
          isActive: true,
        });
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
