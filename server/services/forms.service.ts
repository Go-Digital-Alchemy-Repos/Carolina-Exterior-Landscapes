import type { CmsForm, CmsFormField, InsertCmsFormSubmission } from "@shared/schema";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { sendContactFormEmail, sendManagedFormSubmissionEmail } from "./email.service";
import { AppError } from "../middleware/error-handler";
import { createCrmLeadFromFormSubmission } from "./crm.service";

const CONTACT_FORM_OWNER_EMAIL = "van@carolinaexteriorlandscapes.com";
const QUOTE_FORM_SLUGS = new Set(["residential-quote", "commercial-quote"]);
const CRM_PIPELINE_FORM_SLUGS = new Set(["contact-form", "residential-quote", "commercial-quote"]);
const MAX_SUBMISSION_BYTES = 64 * 1024;
const MAX_INPUT_FIELDS = 50;
const MAX_STRING_LENGTH = 5_000;
const MAX_ARRAY_ITEMS = 25;
const MAX_LIST_ROWS = 20;
const MAX_LIST_COLUMNS = 20;
const MAX_NOTIFICATION_RECIPIENTS = 10;

function validRecipientEmail(value: unknown): string {
  const email = typeof value === "string" ? value.trim() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

async function configuredFormRecipient(formSlug: string): Promise<string | null> {
  const settings = await storage.settings.getDecryptedCategory("email_notifications");
  const settingValue = formSlug === "contact-form"
    ? settings.contact_form_recipient_email
    : QUOTE_FORM_SLUGS.has(formSlug)
      ? settings.quote_form_recipient_email
      : "";
  return validRecipientEmail(settingValue) || null;
}

function normalizeFormSettings(form: CmsForm) {
  const settings = (
    typeof form.settings === "object" && form.settings ? form.settings : {}
  ) as Record<string, unknown>;
  return {
    submitButtonText:
      typeof settings.submitButtonText === "string" && settings.submitButtonText.trim()
        ? settings.submitButtonText.trim()
        : "Submit",
    successMessage:
      typeof settings.successMessage === "string" && settings.successMessage.trim()
        ? settings.successMessage.trim()
        : "Thanks! Your submission has been received.",
    notifyAdmins: Boolean(settings.notifyAdmins),
    storeAsContactMessage: Boolean(settings.storeAsContactMessage),
    createCrmLead: Boolean(settings.createCrmLead),
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function booleanValue(value: unknown) {
  return value === true || value === "true" || value === "on" || value === 1;
}

function stringArrayValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => stringValue(item)).filter(Boolean);
  const single = stringValue(value);
  return single ? [single] : [];
}

function objectValue(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstStringValue(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const raw = data[key];
    const value = Array.isArray(raw)
      ? raw
          .map((item) => stringValue(item))
          .filter(Boolean)
          .join(", ")
      : stringValue(raw);
    if (value) return value;
  }
  return "";
}

function normalizeUrl(value: string) {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function validateField(field: CmsFormField, raw: unknown) {
  const config = objectValue(field.config);
  const selectionMode = config.selectionMode === "multiple" ? "multiple" : "single";

  if (field.type === "html" || field.type === "section" || field.type === "page") {
    return { value: null };
  }

  if (field.type === "hidden") {
    const value =
      stringValue(raw) || (typeof config.defaultValue === "string" ? config.defaultValue : "");
    if (field.required && !value) return { error: `${field.label} is required` };
    return { value };
  }

  if (field.type === "consent") {
    const checked = booleanValue(raw);
    if (field.required && !checked) return { error: `${field.label} is required` };
    return { value: checked };
  }

  if (
    field.type === "checkbox" ||
    field.type === "multiselect" ||
    (field.type === "image-choice" && selectionMode === "multiple")
  ) {
    if (Array.isArray(raw) && raw.length > MAX_ARRAY_ITEMS) {
      return { error: `${field.label} has too many values` };
    }
    const values = stringArrayValue(raw);
    if (field.required && values.length === 0) return { error: `${field.label} is required` };
    if (Array.isArray(field.options) && field.options.length > 0) {
      const validValues = new Set(field.options.map((option) => option.value));
      if (values.some((value) => !validValues.has(value))) {
        return { error: `${field.label} has an invalid value` };
      }
    }
    return { value: values };
  }

  if (field.type === "select" || field.type === "radio" || field.type === "image-choice") {
    const value = stringValue(raw);
    if (field.required && !value) return { error: `${field.label} is required` };
    if (!value) return { value: "" };
    if (Array.isArray(field.options) && field.options.length > 0) {
      const validValues = new Set(field.options.map((option) => option.value));
      if (!validValues.has(value)) return { error: `${field.label} has an invalid value` };
    }
    return { value };
  }

  if (field.type === "name") {
    if (config.nameFormat === "split") {
      const value = objectValue(raw);
      const firstName = stringValue(value.firstName);
      const lastName = stringValue(value.lastName);
      if (field.required && !firstName && !lastName) return { error: `${field.label} is required` };
      return { value: { firstName, lastName } };
    }
    const fullName = stringValue(
      typeof raw === "object" && raw !== null ? objectValue(raw).fullName : raw,
    );
    if (field.required && !fullName) return { error: `${field.label} is required` };
    return { value: { fullName } };
  }

  if (field.type === "address") {
    const value = objectValue(raw);
    const normalized = {
      street: stringValue(value.street),
      street2: stringValue(value.street2),
      city: stringValue(value.city),
      state: stringValue(value.state),
      postalCode: stringValue(value.postalCode),
      country: stringValue(value.country),
    };
    if (field.required && !Object.values(normalized).some(Boolean)) {
      return { error: `${field.label} is required` };
    }
    return { value: normalized };
  }

  if (field.type === "list") {
    if (Array.isArray(raw) && raw.length > MAX_LIST_ROWS) {
      return { error: `${field.label} has too many rows` };
    }
    if (Array.isArray(raw) && raw.some((row) => Object.keys(objectValue(row)).length > MAX_LIST_COLUMNS)) {
      return { error: `${field.label} has too many columns` };
    }
    const rows = Array.isArray(raw)
      ? raw
          .map((row) => {
            const record = objectValue(row);
            return Object.fromEntries(
              Object.entries(record).map(([key, value]) => [key, stringValue(value).slice(0, MAX_STRING_LENGTH)]),
            );
          })
          .filter((row) => Object.values(row).some(Boolean))
      : [];
    if (field.required && rows.length === 0) return { error: `${field.label} is required` };
    return { value: rows };
  }

  if (field.type === "number") {
    const value = stringValue(raw);
    if (field.required && !value) return { error: `${field.label} is required` };
    if (!value) return { value: "" };
    if (Number.isNaN(Number(value))) return { error: `${field.label} must be a valid number` };
    return { value: Number(value) };
  }

  let value = stringValue(raw);
  if (value.length > MAX_STRING_LENGTH) return { error: `${field.label} is too long` };
  if (field.required && !value) return { error: `${field.label} is required` };
  if (!value) return { value: "" };

  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { error: `${field.label} must be a valid email address` };
  }

  if (field.type === "website") {
    try {
      value = normalizeUrl(value);
      new URL(value);
    } catch {
      return { error: `${field.label} must be a valid URL` };
    }
  }

  return { value };
}

function assertSubmissionShape(value: unknown, depth = 0): void {
  if (depth > 4) throw new AppError("Form submission is too deeply nested", 400);
  if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
    throw new AppError("Form submission contains a value that is too long", 413);
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) throw new AppError("Form submission contains too many values", 413);
    value.forEach((item) => assertSubmissionShape(item, depth + 1));
  } else if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > MAX_INPUT_FIELDS) throw new AppError("Form submission contains too many fields", 413);
    entries.forEach(([, item]) => assertSubmissionShape(item, depth + 1));
  }
}

function validateSubmissionData(form: CmsForm, data: unknown) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new AppError("Form submission must be an object", 400);
  }

  const input = data as Record<string, unknown>;
  if (Object.keys(input).length > MAX_INPUT_FIELDS || Buffer.byteLength(JSON.stringify(input), "utf8") > MAX_SUBMISSION_BYTES) {
    throw new AppError("Form submission is too large", 413);
  }
  assertSubmissionShape(input);
  const validated: Record<string, unknown> = {};

  for (const field of Array.isArray(form.fields) ? form.fields : []) {
    const result = validateField(field, input[field.key]);
    if (result.error) throw new AppError(result.error, 400);
    validated[field.key] = result.value ?? "";
  }

  return validated;
}

async function handleContactFormEffects(
  form: CmsForm,
  data: Record<string, unknown>,
  baseUrl?: string,
) {
  const settings = normalizeFormSettings(form);
  if (!settings.storeAsContactMessage) return;

  const name = firstStringValue(data, ["name", "fullName", "contactName"]);
  const email = firstStringValue(data, ["email", "senderEmail", "contactEmail"]);
  const phone = firstStringValue(data, ["phone", "contactPhone", "primaryPhone"]);
  const service = firstStringValue(data, ["service", "servicesInterested", "servicesNeeded"]);
  const city = stringValue(data.city);
  const legacySubject = stringValue(data.subject);
  const subject =
    legacySubject || [service, city].filter(Boolean).join(" - ") || "Contact form submission";
  const message = legacySubject ? stringValue(data.message) : buildSubmissionSummary(form, data);
  if (!name || !email || !subject || !message) return;

  await storage.contacts.createMessage({ name, email, subject, message });
  if (!settings.notifyAdmins) return;

  const configuredRecipient = await configuredFormRecipient(form.slug);
  const assignedEmails = configuredRecipient
    ? []
    : (await storage.users.getFormNotificationUsers(form.id))
        .map((user) => user.email)
        .filter(Boolean);
  const recipientEmails =
    configuredRecipient
      ? [configuredRecipient]
      : assignedEmails.length > 0
      ? assignedEmails
      : form.slug === "contact-form"
        ? [CONTACT_FORM_OWNER_EMAIL]
        : [];
  const adminEmails =
    recipientEmails.length > 0
      ? recipientEmails
      : (await storage.users.getUsersByRole("admin"))
          .filter((admin) => !admin.isSuspended)
          .map((admin) => admin.email)
          .filter(Boolean);
  const boundedAdminEmails = Array.from(new Set(adminEmails)).slice(0, MAX_NOTIFICATION_RECIPIENTS);
  if (boundedAdminEmails.length === 0) return;

  sendContactFormEmail(
    boundedAdminEmails,
    name,
    email,
    message,
    `${baseUrl ?? process.env.APP_URL ?? ""}/admin/forms`,
    {
      formName: form.name,
      phone,
      subject,
      sourcePage: stringValue(data.sourcePage) || form.slug,
    },
  ).catch((err) => {
    logger.email.warn("Failed to send contact form notification", {
      formSlug: form.slug,
      error: err instanceof Error ? err.message : String(err),
    });
  });
}

function formatSubmissionValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value))
    return (
      value
        .map(formatSubmissionValue)
        .filter((item) => item !== "-")
        .join(", ") || "-"
    );
  if (typeof value === "object") {
    const normalized = Object.values(objectValue(value))
      .map((item) => stringValue(item))
      .filter(Boolean);
    return normalized.length > 0 ? normalized.join(", ") : "-";
  }
  return String(value);
}

function buildSubmissionSummary(form: CmsForm, data: Record<string, unknown>) {
  return (Array.isArray(form.fields) ? form.fields : [])
    .filter((field) => !["hidden", "html", "section", "page"].includes(field.type))
    .map((field) => `${field.label}: ${formatSubmissionValue(data[field.key])}`)
    .join("\n");
}

async function notifyAssignedUsers(form: CmsForm, data: Record<string, unknown>, baseUrl?: string) {
  const settings = normalizeFormSettings(form);
  if (!settings.notifyAdmins || settings.storeAsContactMessage) return;

  const recipients = await storage.users.getFormNotificationUsers(form.id);
  const recipientEmails = Array.from(new Set(recipients.map((user) => user.email).filter(Boolean)))
    .slice(0, MAX_NOTIFICATION_RECIPIENTS);
  if (recipientEmails.length === 0) return;

  sendManagedFormSubmissionEmail(
    recipientEmails,
    form.name,
    buildSubmissionSummary(form, data),
    `${baseUrl ?? process.env.APP_URL ?? ""}/admin/forms`,
    {
      senderName: firstStringValue(data, ["name", "fullName", "contactName"]),
      senderEmail: firstStringValue(data, ["email", "senderEmail", "contactEmail"]),
      senderPhone: firstStringValue(data, ["phone", "contactPhone", "primaryPhone"]),
      subject: stringValue(data.subject) || "Form submission",
      sourcePage: stringValue(data.sourcePage) || form.slug,
    },
  ).catch((err) => {
    logger.email.warn("Failed to send managed form notification", {
      formSlug: form.slug,
      error: err instanceof Error ? err.message : String(err),
    });
  });
}

async function handleCrmLeadEffect(
  form: CmsForm,
  data: Record<string, unknown>,
  formSubmissionId: string,
  clientIp?: string,
) {
  const settings = normalizeFormSettings(form);
  if (!settings.createCrmLead && !CRM_PIPELINE_FORM_SLUGS.has(form.slug)) return;

  try {
    await createCrmLeadFromFormSubmission({
      formName: form.name,
      formSubmissionId,
      data,
      ...(clientIp ? { clientIp } : {}),
    });
  } catch (err) {
    logger.app.warn("Failed to create CRM lead from managed form submission", {
      formSlug: form.slug,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function submitManagedFormBySlug(
  slug: string,
  data: unknown,
  options: { baseUrl?: string; source?: string; clientIp?: string } = {},
) {
  const form = await storage.forms.getPublicBySlug(slug);
  if (!form) throw new AppError("Form not found", 404);

  const validated = validateSubmissionData(form, data);
  const submissionPayload: InsertCmsFormSubmission = {
    formId: form.id,
    data: validated,
    source: options.source ?? null,
  };

  const submission = await storage.forms.createSubmission(submissionPayload);
  await handleContactFormEffects(form, validated, options.baseUrl);
  await notifyAssignedUsers(form, validated, options.baseUrl);
  await handleCrmLeadEffect(form, validated, submission.id, options.clientIp);

  return {
    form,
    submission,
    successMessage: normalizeFormSettings(form).successMessage,
  };
}
