import { cmsFormFieldSchema, type CmsFormField, type CmsFormSettings, type InsertCmsForm } from "@shared/schema";
import { z } from "zod";
import { storage } from "../storage";
import { logger } from "../utils/logger";

type CmsFormFieldInput = z.input<typeof cmsFormFieldSchema>;

function field(
  id: string,
  key: string,
  label: string,
  type: CmsFormField["type"],
  options: Partial<CmsFormFieldInput> = {},
): CmsFormField {
  return cmsFormFieldSchema.parse({
    id,
    key,
    label,
    type,
    placeholder: "",
    helpText: "",
    required: false,
    width: "full",
    options: [],
    config: {},
    ...options,
  });
}

function settings(overrides: Partial<CmsFormSettings>): CmsFormSettings {
  return {
    submitButtonText: "Submit",
    successMessage: "Thanks! Your submission has been received.",
    successRedirect: "",
    notifyAdmins: false,
    storeAsContactMessage: false,
    ...overrides,
  };
}

function choice(label: string) {
  return { label, value: label };
}

const RESIDENTIAL_QUOTE_FIELDS = [
  field("full-name", "name", "Full Name", "text", { placeholder: "Your full name", required: true, width: "half" }),
  field("phone", "phone", "Phone Number", "tel", { placeholder: "(704) 975-5867", required: true, width: "half" }),
  field("email", "email", "Email Address", "email", { placeholder: "you@example.com", required: true }),
  field("address", "address", "Street Address", "text", { placeholder: "123 Main St", width: "half" }),
  field("city", "city", "City", "text", { placeholder: "Monroe", width: "half" }),
  field("services-interested", "servicesInterested", "Services Needed", "multiselect", {
    options: [
      choice("Lawn Maintenance (Annual Contract)"),
      choice("Landscaping Design & Installation"),
      choice("Hardscape (Patios, Walkways, Walls)"),
      choice("Mulching & Planting"),
      choice("Drainage Solutions"),
      choice("Aeration & Overseeding"),
      choice("Sod Installation"),
      choice("Other / Not Sure"),
    ],
    config: { selectionMode: "multiple", choiceLayout: "grid" },
  }),
  field("message", "message", "Project Details / Message", "textarea", {
    placeholder: "Tell us a bit about your property and what you're looking for.",
  }),
];

const COMMERCIAL_QUOTE_FIELDS = [
  field("contact-name", "contactName", "Contact Name", "text", { placeholder: "Your full name", required: true, width: "half" }),
  field("title", "title", "Title / Role", "text", { placeholder: "Property Manager", width: "half" }),
  field("company-name", "companyName", "Company / HOA Name", "text", { placeholder: "Acme Properties", required: true }),
  field("email", "email", "Email Address", "email", { placeholder: "you@example.com", required: true, width: "half" }),
  field("phone", "phone", "Phone Number", "tel", { placeholder: "(704) 975-5867", required: true, width: "half" }),
  field("property-address", "propertyAddress", "Primary Property Address", "text", { placeholder: "123 Main St, Monroe NC" }),
  field("property-type", "propertyType", "Property Type", "select", {
    required: true,
    options: [
      choice("Office"),
      choice("Retail"),
      choice("HOA"),
      choice("Industrial"),
      choice("Multi-family"),
      choice("Other"),
    ],
  }),
  field("number-of-properties", "numberOfProperties", "Number of Properties", "number", { placeholder: "1", width: "half" }),
  field("current-provider", "currentProvider", "Current Landscaping Provider", "text", { placeholder: "If any", width: "half" }),
  field("best-time-to-reach", "bestTimeToReach", "Best Time to Reach You", "text", { placeholder: "Weekday mornings" }),
  field("services-needed", "servicesNeeded", "Services Needed", "multiselect", {
    options: [
      choice("Grounds Maintenance"),
      choice("Commercial Landscaping"),
      choice("Commercial Hardscape"),
      choice("Drainage & Site Work"),
      choice("HOA Community Services"),
      choice("Seasonal Color Program"),
      choice("Snow & Ice (Inquire)"),
      choice("Other / Not Sure"),
    ],
    config: { selectionMode: "multiple", choiceLayout: "grid" },
  }),
  field("notes", "notes", "Additional Notes", "textarea", {
    placeholder: "Current challenges, scope of work, timeline, or budget notes.",
  }),
];

const SYSTEM_FORMS: InsertCmsForm[] = [
  {
    name: "Residential Quote Form",
    slug: "residential-quote",
    description: "Request a residential landscaping, lawn maintenance, hardscape, or drainage estimate.",
    kind: "contact",
    isSystem: true,
    isActive: true,
    fields: RESIDENTIAL_QUOTE_FIELDS,
    settings: settings({
      submitButtonText: "Request Quote",
      successMessage: "Thank you! We have received your request and will be in touch shortly to schedule your consultation.",
      successRedirect: "/thank-you/",
      notifyAdmins: true,
      storeAsContactMessage: true,
    }),
  },
  {
    name: "Commercial Quote Form",
    slug: "commercial-quote",
    description: "Request a commercial landscaping, grounds maintenance, HOA, hardscape, or drainage proposal.",
    kind: "contact",
    isSystem: true,
    isActive: true,
    fields: COMMERCIAL_QUOTE_FIELDS,
    settings: settings({
      submitButtonText: "Request Proposal",
      successMessage: "Thank you! Our commercial team has received your request and will contact you shortly.",
      successRedirect: "/thank-you/",
      notifyAdmins: true,
      storeAsContactMessage: true,
    }),
  },
];

function isStarterContactForm(fields: CmsFormField[]) {
  const keys = fields.map((fieldItem) => fieldItem.key).sort();
  return JSON.stringify(keys) === JSON.stringify(["email", "message", "name", "subject"]);
}

function isSystemCcaContactForm(fields: CmsFormField[]) {
  const keys = fields.map((fieldItem) => fieldItem.key).sort();
  return JSON.stringify(keys) === JSON.stringify(["city", "email", "fullName", "message", "phone", "propertyType", "service"]);
}

function isLandscapeResidentialQuoteForm(fields: CmsFormField[]) {
  const keys = fields.map((fieldItem) => fieldItem.key).sort();
  return JSON.stringify(keys) === JSON.stringify(["address", "city", "email", "message", "name", "phone", "servicesInterested"]);
}

function isLandscapeCommercialQuoteForm(fields: CmsFormField[]) {
  const keys = fields.map((fieldItem) => fieldItem.key).sort();
  return JSON.stringify(keys) === JSON.stringify([
    "bestTimeToReach",
    "companyName",
    "contactName",
    "currentProvider",
    "email",
    "notes",
    "numberOfProperties",
    "phone",
    "propertyAddress",
    "propertyType",
    "servicesNeeded",
    "title",
  ]);
}

export async function ensureSystemForms() {
  logger.app.info("Ensuring generic system forms");

  for (const systemForm of SYSTEM_FORMS) {
    const existing = await storage.forms.getBySlug(systemForm.slug);
    if (existing) {
      const existingSettings = typeof existing.settings === "object" && existing.settings ? { ...(existing.settings as Record<string, unknown>) } : {};
      delete existingSettings.mailchimpEnabled;
      delete existingSettings.mailchimpTag;
      delete existingSettings.createCrmLead;
      const useSystemFields =
        !Array.isArray(existing.fields) ||
        existing.fields.length === 0 ||
        isStarterContactForm(existing.fields) ||
        isSystemCcaContactForm(existing.fields) ||
        isLandscapeResidentialQuoteForm(existing.fields) ||
        isLandscapeCommercialQuoteForm(existing.fields);
      const settingsData = useSystemFields ? systemForm.settings : { ...systemForm.settings, ...existingSettings };

      await storage.forms.update(existing.id, {
        name: existing.name || systemForm.name,
        description: existing.description ?? systemForm.description ?? "",
        kind: "contact",
        isSystem: true,
        isActive: existing.isActive ?? true,
        fields: useSystemFields ? systemForm.fields : existing.fields,
        settings: settingsData,
      });
      continue;
    }

    await storage.forms.create(systemForm);
  }

  logger.app.info("Generic system forms ensured");
}
