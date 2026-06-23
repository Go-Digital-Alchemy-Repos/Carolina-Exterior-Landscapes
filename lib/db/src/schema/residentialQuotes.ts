import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const residentialQuotesTable = pgTable("residential_quotes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  audienceType: text("audience_type").notNull(),
  address: text("address"),
  city: text("city"),
  servicesInterested: jsonb("services_interested")
    .$type<string[]>()
    .notNull()
    .default([]),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResidentialQuoteSchema = createInsertSchema(
  residentialQuotesTable,
).omit({ id: true, createdAt: true });

export type InsertResidentialQuote = z.infer<
  typeof insertResidentialQuoteSchema
>;
export type ResidentialQuote = typeof residentialQuotesTable.$inferSelect;
