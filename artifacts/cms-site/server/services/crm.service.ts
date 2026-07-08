import { crmLeadInputSchema, type CrmClient, type CrmLead, type InsertCrmLead } from "@shared/schema";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { sendCrmLeadNotificationEmail } from "./email.service";

export const DEFAULT_CRM_LEAD_NOTIFICATION_EMAIL = "van@carolinaexteriorlandscapes.com";
export const CRM_SETTINGS_CATEGORY = "crm";
export const CRM_LEAD_NOTIFICATION_EMAIL_KEY = "crm_lead_notification_email";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function object(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function nullish(value: unknown) {
  const normalized = text(value);
  return normalized || null;
}

export function inferCrmLeadFromFormData(data: Record<string, unknown>) {
  const nameObject = object(data.name);
  const objectName = [text(nameObject.firstName), text(nameObject.lastName)].filter(Boolean).join(" ");
  const fullNameObject = object(data.fullName);
  const objectFullName = [text(fullNameObject.firstName), text(fullNameObject.lastName)].filter(Boolean).join(" ") || text(fullNameObject.fullName);
  const splitName = [text(data.firstName), text(data.lastName)].filter(Boolean).join(" ");
  const messageParts = [
    text(data.message),
    text(data.comments),
    text(data.details),
    text(data.notes),
    text(data.projectDetails),
  ].filter(Boolean);
  const email = text(data.email);

  return {
    name: text(data.name) || text(data.fullName) || text(data.contactName) || objectName || objectFullName || splitName || email || "Website Lead",
    email: email || null,
    phone: text(data.phone) || text(data.tel) || null,
    company: text(data.company) || text(data.companyName) || text(data.organization) || null,
    message: messageParts.join("\n\n") || null,
  };
}

function parseNotificationEmails(value: string | null | undefined): string[] {
  return (value || DEFAULT_CRM_LEAD_NOTIFICATION_EMAIL)
    .split(/[,\n;]/)
    .map((email) => email.trim())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

export async function getCrmSettings() {
  const settings = await storage.settings.getDecryptedCategory(CRM_SETTINGS_CATEGORY);
  return {
    leadNotificationEmail: settings[CRM_LEAD_NOTIFICATION_EMAIL_KEY] || DEFAULT_CRM_LEAD_NOTIFICATION_EMAIL,
  };
}

export async function updateCrmSettings(input: { leadNotificationEmail: string }) {
  const value = input.leadNotificationEmail.trim();
  const emails = parseNotificationEmails(value);
  if (value && emails.length === 0) {
    throw new Error("Enter at least one valid CRM lead notification email address.");
  }
  await storage.settings.upsertSetting(
    CRM_LEAD_NOTIFICATION_EMAIL_KEY,
    value || DEFAULT_CRM_LEAD_NOTIFICATION_EMAIL,
    CRM_SETTINGS_CATEGORY,
    false,
  );
  storage.settings.invalidateCategory(CRM_SETTINGS_CATEGORY);
  return getCrmSettings();
}

async function notifyCrmLeadCreatedOrUpdated(lead: CrmLead, duplicate: boolean) {
  if (lead.source === "manual") return;

  try {
    const settings = await getCrmSettings();
    const recipients = parseNotificationEmails(settings.leadNotificationEmail);
    if (recipients.length === 0) return;
    const baseUrl = (process.env.APP_URL || "https://carolinaexteriorlandscapes.com").replace(/\/$/, "");
    await sendCrmLeadNotificationEmail(recipients, lead, `${baseUrl}/admin/crm`, duplicate);
  } catch (err) {
    logger.email.warn("Failed to send CRM lead notification", {
      leadId: lead.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function createOrUpdateCrmLead(input: Partial<InsertCrmLead>, createdById?: string) {
  const parsed = crmLeadInputSchema.parse({
    ...input,
    name: text(input.name) || "Website Lead",
    email: nullish(input.email),
    phone: nullish(input.phone),
    company: nullish(input.company),
    message: nullish(input.message),
    externalId: nullish(input.externalId),
    ownerId: nullish(input.ownerId),
    formSubmissionId: nullish(input.formSubmissionId),
    source: text(input.source) || "manual",
    formData: object(input.formData),
    metadata: object(input.metadata),
  });

  const duplicate = await storage.crm.findDuplicateLead({ email: parsed.email, phone: parsed.phone });
  if (duplicate) {
    const lead = await storage.crm.updateLead(duplicate.id, {
      name: parsed.name || duplicate.name,
      email: parsed.email ?? duplicate.email,
      phone: parsed.phone ?? duplicate.phone,
      company: parsed.company ?? duplicate.company,
      message: parsed.message ?? duplicate.message,
      source: parsed.source || duplicate.source,
      externalId: parsed.externalId ?? duplicate.externalId,
      formSubmissionId: parsed.formSubmissionId ?? duplicate.formSubmissionId,
      formData: { ...(duplicate.formData ?? {}), ...(parsed.formData ?? {}) },
      metadata: { ...(duplicate.metadata ?? {}), ...(parsed.metadata ?? {}) },
      ownerId: parsed.ownerId ?? duplicate.ownerId,
      nextFollowUpAt: parsed.nextFollowUpAt ?? duplicate.nextFollowUpAt,
    });
    await storage.crm.createNote({
      leadId: duplicate.id,
      body: `Duplicate lead received from ${parsed.source}. Existing lead was updated.`,
      createdById,
    });
    const result = { lead: lead!, duplicate: true };
    void notifyCrmLeadCreatedOrUpdated(result.lead, result.duplicate);
    return result;
  }

  const lead = await storage.crm.createLead(parsed);
  const result = { lead, duplicate: false };
  void notifyCrmLeadCreatedOrUpdated(result.lead, result.duplicate);
  return result;
}

export async function createCrmLeadFromFormSubmission({
  formName,
  formSubmissionId,
  data,
}: {
  formName: string;
  formSubmissionId: string;
  data: Record<string, unknown>;
}) {
  return createOrUpdateCrmLead({
    ...inferCrmLeadFromFormData(data),
    source: "website_form",
    formSubmissionId,
    formData: data,
    metadata: { formName },
  });
}

export async function ensureClientForWonLead(lead: CrmLead, createdById?: string): Promise<CrmClient> {
  const existing = await storage.crm.getClientBySourceLeadId(lead.id);
  if (existing) return existing;

  const now = new Date();
  const client = await storage.crm.createClient({
    sourceLeadId: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    clientType: lead.company ? "business" : "individual",
    primaryEmail: lead.email,
    primaryPhone: lead.phone,
    preferredContactMethod: lead.email ? "email" : lead.phone ? "phone" : "no_preference",
    companyName: lead.company,
    onboardingStatus: "not_started",
    clientSince: now,
    status: "onboarding",
    source: lead.source,
    formData: lead.formData ?? {},
    metadata: { ...(lead.metadata ?? {}), convertedFromLeadId: lead.id, convertedAt: now.toISOString() },
    ownerId: lead.ownerId,
    nextFollowUpAt: lead.nextFollowUpAt,
  });

  await storage.crm.createNote({ leadId: lead.id, body: "Lead converted to client after moving to Won.", createdById });
  await storage.crm.createClientNote({ clientId: client.id, body: "Client created from won lead.", createdById });
  return client;
}
