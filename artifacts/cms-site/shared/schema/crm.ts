import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { cmsFormSubmissions } from "./forms";
import { users } from "./users";

export const CRM_LEAD_STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
export const CRM_CLIENT_STATUSES = ["onboarding", "active", "inactive"] as const;
export const CRM_CLIENT_TYPES = ["individual", "business"] as const;
export const CRM_CONTACT_METHODS = ["email", "phone", "text", "no_preference"] as const;
export const CRM_ONBOARDING_STATUSES = ["not_started", "in_progress", "complete"] as const;

export type CrmLeadStage = (typeof CRM_LEAD_STAGES)[number];
export type CrmClientStatus = (typeof CRM_CLIENT_STATUSES)[number];
export type CrmClientType = (typeof CRM_CLIENT_TYPES)[number];
export type CrmContactMethod = (typeof CRM_CONTACT_METHODS)[number];
export type CrmOnboardingStatus = (typeof CRM_ONBOARDING_STATUSES)[number];

export const crmLeads = pgTable("crm_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  message: text("message"),
  stage: text("stage").$type<CrmLeadStage>().default("new").notNull(),
  source: text("source").default("manual").notNull(),
  externalId: text("external_id"),
  formSubmissionId: varchar("form_submission_id").references(() => cmsFormSubmissions.id, { onDelete: "set null" }),
  formData: jsonb("form_data").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "set null" }),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_crm_leads_stage").on(table.stage),
  index("idx_crm_leads_email").on(table.email),
  index("idx_crm_leads_phone").on(table.phone),
  index("idx_crm_leads_source").on(table.source),
  index("idx_crm_leads_created_at").on(table.createdAt),
  index("idx_crm_leads_owner").on(table.ownerId),
]);

export const crmClients = pgTable("crm_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceLeadId: varchar("source_lead_id").references(() => crmLeads.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  clientType: text("client_type").$type<CrmClientType>().default("individual").notNull(),
  primaryEmail: text("primary_email"),
  secondaryEmail: text("secondary_email"),
  primaryPhone: text("primary_phone"),
  alternatePhone: text("alternate_phone"),
  preferredContactMethod: text("preferred_contact_method").$type<CrmContactMethod>().default("no_preference").notNull(),
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  city: text("city"),
  region: text("region"),
  postalCode: text("postal_code"),
  country: text("country"),
  companyName: text("company_name"),
  legalName: text("legal_name"),
  website: text("website"),
  industry: text("industry"),
  companySize: text("company_size"),
  businessType: text("business_type"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  billingContactName: text("billing_contact_name"),
  billingEmail: text("billing_email"),
  billingPhone: text("billing_phone"),
  accountOwnerId: varchar("account_owner_id").references(() => users.id, { onDelete: "set null" }),
  onboardingStatus: text("onboarding_status").$type<CrmOnboardingStatus>().default("not_started").notNull(),
  serviceStartDate: timestamp("service_start_date"),
  renewalDate: timestamp("renewal_date"),
  clientSince: timestamp("client_since"),
  internalTags: jsonb("internal_tags").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  status: text("status").$type<CrmClientStatus>().default("onboarding").notNull(),
  source: text("source").default("manual").notNull(),
  formData: jsonb("form_data").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "set null" }),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_crm_clients_source_lead_unique").on(table.sourceLeadId),
  index("idx_crm_clients_source_lead").on(table.sourceLeadId),
  index("idx_crm_clients_status").on(table.status),
  index("idx_crm_clients_email").on(table.email),
  index("idx_crm_clients_phone").on(table.phone),
  index("idx_crm_clients_client_type").on(table.clientType),
  index("idx_crm_clients_company_name").on(table.companyName),
  index("idx_crm_clients_account_owner").on(table.accountOwnerId),
  index("idx_crm_clients_owner").on(table.ownerId),
  index("idx_crm_clients_created_at").on(table.createdAt),
]);

export const crmLeadNotes = pgTable("crm_lead_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => crmLeads.id, { onDelete: "cascade" }).notNull(),
  body: text("body").notNull(),
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_crm_lead_notes_lead_id").on(table.leadId),
  index("idx_crm_lead_notes_created_at").on(table.createdAt),
]);

export const crmLeadTasks = pgTable("crm_lead_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => crmLeads.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  dueAt: timestamp("due_at"),
  completed: boolean("completed").default(false).notNull(),
  assignedToId: varchar("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_crm_lead_tasks_lead_id").on(table.leadId),
  index("idx_crm_lead_tasks_due_at").on(table.dueAt),
  index("idx_crm_lead_tasks_completed").on(table.completed),
]);

export const crmClientNotes = pgTable("crm_client_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => crmClients.id, { onDelete: "cascade" }).notNull(),
  body: text("body").notNull(),
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_crm_client_notes_client_id").on(table.clientId),
  index("idx_crm_client_notes_created_at").on(table.createdAt),
]);

export const crmClientTasks = pgTable("crm_client_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => crmClients.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  dueAt: timestamp("due_at"),
  completed: boolean("completed").default(false).notNull(),
  assignedToId: varchar("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_crm_client_tasks_client_id").on(table.clientId),
  index("idx_crm_client_tasks_due_at").on(table.dueAt),
  index("idx_crm_client_tasks_completed").on(table.completed),
]);

const emptyToNull = z.string().trim().optional().nullable().transform((value) => value || null);
const emailField = z.string().trim().email().or(z.literal("")).optional().nullable().transform((value) => value || null);
const urlField = z.string().trim().url().or(z.literal("")).optional().nullable().transform((value) => value || null);
const optionalDate = z.union([z.string(), z.date()]).optional().nullable().transform((value, ctx) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
    return z.NEVER;
  }
  return date;
});

export const crmLeadInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: emailField,
  phone: emptyToNull,
  company: emptyToNull,
  message: emptyToNull,
  stage: z.enum(CRM_LEAD_STAGES).optional().default("new"),
  source: z.string().trim().optional().default("manual"),
  externalId: emptyToNull,
  formSubmissionId: emptyToNull,
  formData: z.record(z.unknown()).optional().default({}),
  metadata: z.record(z.unknown()).optional().default({}),
  ownerId: emptyToNull,
  nextFollowUpAt: optionalDate,
});

export const crmLeadUpdateSchema = crmLeadInputSchema.partial().extend({
  stage: z.enum(CRM_LEAD_STAGES).optional(),
});

export const crmClientUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: emailField,
  phone: emptyToNull,
  company: emptyToNull,
  clientType: z.enum(CRM_CLIENT_TYPES).optional(),
  primaryEmail: emailField,
  secondaryEmail: emailField,
  primaryPhone: emptyToNull,
  alternatePhone: emptyToNull,
  preferredContactMethod: z.enum(CRM_CONTACT_METHODS).optional(),
  addressLine1: emptyToNull,
  addressLine2: emptyToNull,
  city: emptyToNull,
  region: emptyToNull,
  postalCode: emptyToNull,
  country: emptyToNull,
  companyName: emptyToNull,
  legalName: emptyToNull,
  website: urlField,
  industry: emptyToNull,
  companySize: emptyToNull,
  businessType: emptyToNull,
  companyPhone: emptyToNull,
  companyEmail: emailField,
  billingContactName: emptyToNull,
  billingEmail: emailField,
  billingPhone: emptyToNull,
  accountOwnerId: emptyToNull,
  onboardingStatus: z.enum(CRM_ONBOARDING_STATUSES).optional(),
  serviceStartDate: optionalDate,
  renewalDate: optionalDate,
  clientSince: optionalDate,
  internalTags: z.array(z.string()).optional(),
  status: z.enum(CRM_CLIENT_STATUSES).optional(),
  source: z.string().trim().optional(),
  formData: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  ownerId: emptyToNull,
  nextFollowUpAt: optionalDate,
}).partial();

export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;
export type CrmClient = typeof crmClients.$inferSelect;
export type InsertCrmClient = typeof crmClients.$inferInsert;
export type CrmLeadNote = typeof crmLeadNotes.$inferSelect;
export type InsertCrmLeadNote = typeof crmLeadNotes.$inferInsert;
export type CrmLeadTask = typeof crmLeadTasks.$inferSelect;
export type InsertCrmLeadTask = typeof crmLeadTasks.$inferInsert;
export type CrmClientNote = typeof crmClientNotes.$inferSelect;
export type InsertCrmClientNote = typeof crmClientNotes.$inferInsert;
export type CrmClientTask = typeof crmClientTasks.$inferSelect;
export type InsertCrmClientTask = typeof crmClientTasks.$inferInsert;

export interface CrmLeadDetail extends CrmLead {
  notes: CrmLeadNote[];
  tasks: CrmLeadTask[];
  client?: CrmClient | null;
}

export interface CrmClientDetail extends CrmClient {
  notes: CrmClientNote[];
  tasks: CrmClientTask[];
  sourceLead?: CrmLead | null;
}
