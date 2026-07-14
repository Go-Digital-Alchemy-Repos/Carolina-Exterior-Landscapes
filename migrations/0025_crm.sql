CREATE TABLE IF NOT EXISTS "crm_leads" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "company" text,
  "message" text,
  "stage" text NOT NULL DEFAULT 'new',
  "source" text NOT NULL DEFAULT 'manual',
  "external_id" text,
  "form_submission_id" varchar REFERENCES "cms_form_submissions"("id") ON DELETE SET NULL,
  "form_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "owner_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "next_follow_up_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_crm_leads_stage" ON "crm_leads" ("stage");
CREATE INDEX IF NOT EXISTS "idx_crm_leads_email" ON "crm_leads" ("email");
CREATE INDEX IF NOT EXISTS "idx_crm_leads_phone" ON "crm_leads" ("phone");
CREATE INDEX IF NOT EXISTS "idx_crm_leads_source" ON "crm_leads" ("source");
CREATE INDEX IF NOT EXISTS "idx_crm_leads_created_at" ON "crm_leads" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_crm_leads_owner" ON "crm_leads" ("owner_id");

CREATE TABLE IF NOT EXISTS "crm_clients" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_lead_id" varchar UNIQUE REFERENCES "crm_leads"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "company" text,
  "client_type" text NOT NULL DEFAULT 'individual',
  "primary_email" text,
  "secondary_email" text,
  "primary_phone" text,
  "alternate_phone" text,
  "preferred_contact_method" text NOT NULL DEFAULT 'no_preference',
  "address_line_1" text,
  "address_line_2" text,
  "city" text,
  "region" text,
  "postal_code" text,
  "country" text,
  "company_name" text,
  "legal_name" text,
  "website" text,
  "industry" text,
  "company_size" text,
  "business_type" text,
  "company_phone" text,
  "company_email" text,
  "billing_contact_name" text,
  "billing_email" text,
  "billing_phone" text,
  "account_owner_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "onboarding_status" text NOT NULL DEFAULT 'not_started',
  "service_start_date" timestamp,
  "renewal_date" timestamp,
  "client_since" timestamp,
  "internal_tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "status" text NOT NULL DEFAULT 'onboarding',
  "source" text NOT NULL DEFAULT 'manual',
  "form_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "owner_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "next_follow_up_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_crm_clients_source_lead" ON "crm_clients" ("source_lead_id");
CREATE INDEX IF NOT EXISTS "idx_crm_clients_status" ON "crm_clients" ("status");
CREATE INDEX IF NOT EXISTS "idx_crm_clients_email" ON "crm_clients" ("email");
CREATE INDEX IF NOT EXISTS "idx_crm_clients_phone" ON "crm_clients" ("phone");
CREATE INDEX IF NOT EXISTS "idx_crm_clients_client_type" ON "crm_clients" ("client_type");
CREATE INDEX IF NOT EXISTS "idx_crm_clients_company_name" ON "crm_clients" ("company_name");
CREATE INDEX IF NOT EXISTS "idx_crm_clients_account_owner" ON "crm_clients" ("account_owner_id");
CREATE INDEX IF NOT EXISTS "idx_crm_clients_owner" ON "crm_clients" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_crm_clients_created_at" ON "crm_clients" ("created_at");

CREATE TABLE IF NOT EXISTS "crm_lead_notes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" varchar NOT NULL REFERENCES "crm_leads"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "created_by_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_crm_lead_notes_lead_id" ON "crm_lead_notes" ("lead_id");
CREATE INDEX IF NOT EXISTS "idx_crm_lead_notes_created_at" ON "crm_lead_notes" ("created_at");

CREATE TABLE IF NOT EXISTS "crm_lead_tasks" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" varchar NOT NULL REFERENCES "crm_leads"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "due_at" timestamp,
  "completed" boolean NOT NULL DEFAULT false,
  "assigned_to_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_by_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_crm_lead_tasks_lead_id" ON "crm_lead_tasks" ("lead_id");
CREATE INDEX IF NOT EXISTS "idx_crm_lead_tasks_due_at" ON "crm_lead_tasks" ("due_at");
CREATE INDEX IF NOT EXISTS "idx_crm_lead_tasks_completed" ON "crm_lead_tasks" ("completed");

CREATE TABLE IF NOT EXISTS "crm_client_notes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" varchar NOT NULL REFERENCES "crm_clients"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "created_by_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_crm_client_notes_client_id" ON "crm_client_notes" ("client_id");
CREATE INDEX IF NOT EXISTS "idx_crm_client_notes_created_at" ON "crm_client_notes" ("created_at");

CREATE TABLE IF NOT EXISTS "crm_client_tasks" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" varchar NOT NULL REFERENCES "crm_clients"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "due_at" timestamp,
  "completed" boolean NOT NULL DEFAULT false,
  "assigned_to_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_by_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_crm_client_tasks_client_id" ON "crm_client_tasks" ("client_id");
CREATE INDEX IF NOT EXISTS "idx_crm_client_tasks_due_at" ON "crm_client_tasks" ("due_at");
CREATE INDEX IF NOT EXISTS "idx_crm_client_tasks_completed" ON "crm_client_tasks" ("completed");
