import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const commercialQuotesTable = pgTable("commercial_quotes", {
  id: serial("id").primaryKey(),
  contactName: text("contact_name").notNull(),
  title: text("title"),
  companyName: text("company_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  propertyAddress: text("property_address"),
  propertyType: text("property_type").notNull(),
  numberOfProperties: text("number_of_properties"),
  servicesNeeded: jsonb("services_needed")
    .$type<string[]>()
    .notNull()
    .default([]),
  currentProvider: text("current_provider"),
  bestTimeToReach: text("best_time_to_reach"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommercialQuoteSchema = createInsertSchema(
  commercialQuotesTable,
).omit({ id: true, createdAt: true });

export type InsertCommercialQuote = z.infer<typeof insertCommercialQuoteSchema>;
export type CommercialQuote = typeof commercialQuotesTable.$inferSelect;
