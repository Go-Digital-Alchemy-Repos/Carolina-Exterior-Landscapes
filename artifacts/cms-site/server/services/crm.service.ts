import { crmLeadInputSchema, type CrmClient, type CrmLead, type InsertCrmLead } from "@shared/schema";
import { storage } from "../storage";

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
  const email = text(data.email) || text(data.contactEmail);

  return {
    name: text(data.name) || text(data.fullName) || text(data.contactName) || objectName || objectFullName || splitName || email || "Website Lead",
    email: email || null,
    phone: text(data.phone) || text(data.tel) || text(data.contactPhone) || null,
    company: text(data.company) || text(data.companyName) || text(data.organization) || null,
    message: text(data.message) || text(data.notes) || text(data.comments) || text(data.details) || null,
  };
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
    return { lead: lead!, duplicate: true };
  }

  const lead = await storage.crm.createLead(parsed);
  return { lead, duplicate: false };
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
  const parsed = crmLeadInputSchema.parse({
    ...inferCrmLeadFromFormData(data),
    source: "website_form",
    formSubmissionId,
    formData: data,
    metadata: { formName },
  });
  const lead = await storage.crm.createLead(parsed);
  return { lead, duplicate: false };
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
