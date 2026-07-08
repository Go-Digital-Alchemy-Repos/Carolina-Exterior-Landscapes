import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "Website <noreply@example.com>";

let transporter: nodemailer.Transporter | null = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

interface MailgunConfig {
  apiKey: string;
  domain: string;
  fromAddress: string;
}

let cachedMailgunConfig: MailgunConfig | null = null;
let mailgunConfigFetched = false;
let cachedEmailLogoUrl: string | null = null;
let emailBrandingFetched = false;

export function resetMailgunConfig(): void {
  cachedMailgunConfig = null;
  mailgunConfigFetched = false;
}

export function resetEmailBrandingCache(): void {
  cachedEmailLogoUrl = null;
  emailBrandingFetched = false;
}

async function getMailgunConfig(): Promise<MailgunConfig | null> {
  if (mailgunConfigFetched) return cachedMailgunConfig;

  try {
    const { storage } = await import("../storage/index");
    const settings = await storage.settings.getDecryptedCategory("mailgun");
    const apiKey = settings.mailgun_api_key;
    const domain = settings.mailgun_domain;
    const fromAddress = settings.mailgun_from_address || SMTP_FROM;
    if (apiKey && domain) cachedMailgunConfig = { apiKey, domain, fromAddress };
  } catch (err) {
    logger.email.warn("Failed to load Mailgun configuration", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  mailgunConfigFetched = true;
  return cachedMailgunConfig;
}

function resolveAbsoluteAssetUrl(url: string | null | undefined) {
  const value = typeof url === "string" ? url.trim() : "";
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const appUrl = (process.env.APP_URL || "").trim().replace(/\/$/, "");
  if (!appUrl || !value.startsWith("/")) return value;
  return `${appUrl}${value}`;
}

async function getEmailLogoUrl(): Promise<string | null> {
  if (emailBrandingFetched) return cachedEmailLogoUrl;

  try {
    const { storage } = await import("../storage/index");
    const branding = await storage.settings.getDecryptedCategory("branding");
    cachedEmailLogoUrl = resolveAbsoluteAssetUrl(branding.frontend_logo_url);
  } catch (err) {
    logger.email.warn("Failed to load branding for email shell", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  emailBrandingFetched = true;
  return cachedEmailLogoUrl;
}

async function sendViaMailgun(to: string, subject: string, html: string): Promise<boolean> {
  const config = await getMailgunConfig();
  if (!config) return false;

  try {
    const FormData = (await import("form-data")).default;
    const Mailgun = (await import("mailgun.js")).default;
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: "api", key: config.apiKey });
    await mg.messages.create(config.domain, {
      from: config.fromAddress,
      to: [to],
      subject,
      html,
    });
    logger.email.info("Sent via Mailgun", { to, subject });
    return true;
  } catch (err) {
    logger.email.error("Mailgun send failed", err, { to, subject });
    return false;
  }
}

async function sendViaSmtp(to: string, subject: string, html: string): Promise<boolean> {
  if (!transporter) return false;
  try {
    await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
    logger.email.info("Sent via SMTP", { to, subject });
    return true;
  } catch (err) {
    logger.email.error("SMTP send failed", err, { to, subject });
    return false;
  }
}

function baseTemplate(title: string, body: string, logoUrl?: string | null): string {
  const logoMarkup = logoUrl
    ? `<img src="${logoUrl}" alt="Website" style="display:block;max-width:220px;max-height:52px;height:auto;width:auto;margin:0 auto;" />`
    : `<div style="color:#1f2937;font-size:22px;font-weight:600;text-align:center;">Website</div>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#f9fafb;padding:22px 32px;border-bottom:1px solid #e5e7eb;">${logoMarkup}</td></tr>
        <tr><td style="padding:32px;">
          ${title ? `<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">${title}</h2>` : ""}
          ${body}
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#6b7280;font-size:13px;">This is an automated website administration message.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function renderEmailShell(title: string, body: string): Promise<string> {
  return baseTemplate(title, body, await getEmailLogoUrl());
}

export function renderTemplate(template: string, vars: Record<string, string | null>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
  }
  return result;
}

async function getTemplateHtml(
  slug: string,
  vars: Record<string, string | null>,
  fallbackTitle: string,
  fallbackBody: string,
): Promise<{ subject: string; html: string; isActive: boolean }> {
  try {
    const { storage } = await import("../storage/index");
    const template = await storage.emailTemplates.getTemplate(slug);
    if (template) {
      return {
        subject: renderTemplate(template.subject, vars),
        html: await renderEmailShell("", renderTemplate(template.htmlBody, vars)),
        isActive: template.isActive,
      };
    }
  } catch (err) {
    logger.email.warn("Failed to load email template, using fallback", {
      slug,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return {
    subject: fallbackTitle,
    html: await renderEmailShell(fallbackTitle, fallbackBody),
    isActive: true,
  };
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const { recordEmailOutcome } = await import("../utils/metrics");
  const mailgunSent = await sendViaMailgun(to, subject, html);
  if (mailgunSent) {
    recordEmailOutcome(true);
    return true;
  }

  const smtpSent = await sendViaSmtp(to, subject, html);
  if (smtpSent) {
    recordEmailOutcome(true);
    return true;
  }

  recordEmailOutcome(false);
  logger.email.warn("No email provider configured", { to, subject });
  return false;
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string | null,
  resetUrl: string,
): Promise<boolean> {
  const vars = { firstName: firstName || "there", resetUrl };
  const template = await getTemplateHtml(
    "password-reset",
    vars,
    "Reset your password",
    `<p>Hi ${vars.firstName},</p><p>Use this link to reset your password:</p><p><a href="${resetUrl}">Reset password</a></p>`,
  );
  if (!template.isActive) return false;
  return sendEmail(email, template.subject, template.html);
}

export async function sendWelcomeEmail(
  email: string,
  firstName: string | null,
  loginUrl: string,
  tempPassword?: string,
): Promise<boolean> {
  const vars = {
    firstName: firstName || "there",
    loginUrl,
    tempPassword: tempPassword || "",
  };
  const template = await getTemplateHtml(
    "welcome-admin-user",
    vars,
    "Your website admin account is ready",
    `<p>Hi ${vars.firstName},</p><p>An admin account has been created for you.</p><p><a href="${loginUrl}">Sign in</a></p>${
      tempPassword ? `<p>Temporary password: <strong>${tempPassword}</strong></p>` : ""
    }`,
  );
  if (!template.isActive) return false;
  return sendEmail(email, template.subject, template.html);
}

export async function sendContactFormEmail(
  to: string[],
  name: string,
  email: string,
  message: string,
  adminUrl: string,
): Promise<void> {
  const html = await renderEmailShell(
    "New contact form submission",
    `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>${message}</p><p><a href="${adminUrl}">View submissions</a></p>`,
  );
  await Promise.all(to.map((recipient) => sendEmail(recipient, `New contact form submission from ${name}`, html)));
}

export async function sendManagedFormSubmissionEmail(
  to: string[],
  formName: string,
  submissionSummary: string,
  adminUrl: string,
): Promise<void> {
  const html = await renderEmailShell(
    "New form submission",
    `<p>A new submission was received for <strong>${formName}</strong>.</p><pre style="white-space:pre-wrap;font-family:inherit;">${submissionSummary}</pre><p><a href="${adminUrl}">View submissions</a></p>`,
  );
  await Promise.all(to.map((recipient) => sendEmail(recipient, `New form submission: ${formName}`, html)));
}

export async function sendCrmLeadNotificationEmail(
  to: string[],
  lead: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    message?: string | null;
    source?: string | null;
  },
  adminUrl: string,
  duplicate = false,
): Promise<void> {
  const html = await renderEmailShell(
    duplicate ? "CRM lead updated" : "New CRM lead",
    `<p>A ${duplicate ? "duplicate website lead updated an existing CRM lead" : "new lead was added to the CRM"}.</p>
    <p><strong>Name:</strong> ${lead.name}</p>
    <p><strong>Email:</strong> ${lead.email || "-"}</p>
    <p><strong>Phone:</strong> ${lead.phone || "-"}</p>
    <p><strong>Company:</strong> ${lead.company || "-"}</p>
    <p><strong>Source:</strong> ${lead.source || "-"}</p>
    <p><strong>Message:</strong><br>${lead.message || "-"}</p>
    <p><a href="${adminUrl}">View lead in CRM</a></p>`,
  );
  await Promise.all(to.map((recipient) => sendEmail(recipient, `${duplicate ? "Updated" : "New"} CRM lead: ${lead.name}`, html)));
}

export async function testMailgunConnection(): Promise<{ success: boolean; message: string }> {
  const config = await getMailgunConfig();
  if (!config) return { success: false, message: "Mailgun is not configured" };
  try {
    const FormData = (await import("form-data")).default;
    const Mailgun = (await import("mailgun.js")).default;
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: "api", key: config.apiKey });
    await mg.domains.get(config.domain);
    return { success: true, message: "Mailgun connection successful" };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Mailgun connection failed" };
  }
}
