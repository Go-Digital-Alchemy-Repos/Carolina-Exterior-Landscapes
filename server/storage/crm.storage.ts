import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  crmClientNotes,
  crmClientTasks,
  crmClients,
  crmLeadNotes,
  crmLeadTasks,
  crmLeads,
  type CrmClient,
  type CrmClientDetail,
  type CrmLead,
  type CrmLeadDetail,
  type InsertCrmClient,
  type InsertCrmClientNote,
  type InsertCrmClientTask,
  type InsertCrmLead,
  type InsertCrmLeadNote,
  type InsertCrmLeadTask,
} from "@shared/schema";

export interface CrmListFilters {
  query?: string;
  stage?: string;
  status?: string;
}

const like = (value: string) => `%${value.trim()}%`;

export class CrmStorage {
  async listLeads(filters: CrmListFilters = {}) {
    const conditions = [];
    if (filters.stage && filters.stage !== "all") conditions.push(eq(crmLeads.stage, filters.stage as CrmLead["stage"]));
    if (filters.query?.trim()) {
      const q = like(filters.query);
      conditions.push(or(ilike(crmLeads.name, q), ilike(crmLeads.email, q), ilike(crmLeads.phone, q), ilike(crmLeads.company, q), ilike(crmLeads.source, q)));
    }
    return db.select().from(crmLeads).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(crmLeads.updatedAt), desc(crmLeads.createdAt));
  }

  async getLeadById(id: string) {
    const [lead] = await db.select().from(crmLeads).where(eq(crmLeads.id, id));
    return lead;
  }

  async getLeadDetail(id: string): Promise<CrmLeadDetail | undefined> {
    const lead = await this.getLeadById(id);
    if (!lead) return undefined;
    return { ...lead, notes: await this.listNotes(id), tasks: await this.listTasks(id), client: await this.getClientBySourceLeadId(id) ?? null };
  }

  async findDuplicateLead({ email, phone }: { email?: string | null; phone?: string | null }) {
    if (email?.trim()) {
      const [lead] = await db.select().from(crmLeads).where(sql`lower(${crmLeads.email}) = lower(${email.trim()})`).limit(1);
      if (lead) return lead;
    }
    if (phone?.trim()) {
      const [lead] = await db.select().from(crmLeads).where(eq(crmLeads.phone, phone.trim())).limit(1);
      return lead;
    }
    return undefined;
  }

  async createLead(data: InsertCrmLead) {
    const [lead] = await db.insert(crmLeads).values(data).returning();
    return lead;
  }

  async updateLead(id: string, data: Partial<InsertCrmLead>) {
    const [lead] = await db.update(crmLeads).set({ ...data, updatedAt: new Date() }).where(eq(crmLeads.id, id)).returning();
    return lead;
  }

  async listNotes(leadId: string) {
    return db.select().from(crmLeadNotes).where(eq(crmLeadNotes.leadId, leadId)).orderBy(desc(crmLeadNotes.createdAt));
  }

  async createNote(data: InsertCrmLeadNote) {
    const [note] = await db.insert(crmLeadNotes).values(data).returning();
    return note;
  }

  async listTasks(leadId: string) {
    return db.select().from(crmLeadTasks).where(eq(crmLeadTasks.leadId, leadId)).orderBy(asc(crmLeadTasks.completed), asc(crmLeadTasks.dueAt), desc(crmLeadTasks.createdAt));
  }

  async createTask(data: InsertCrmLeadTask) {
    const [task] = await db.insert(crmLeadTasks).values(data).returning();
    return task;
  }

  async updateTask(id: string, data: Partial<InsertCrmLeadTask>) {
    const [task] = await db.update(crmLeadTasks).set({ ...data, updatedAt: new Date() }).where(eq(crmLeadTasks.id, id)).returning();
    return task;
  }

  async listClients(filters: CrmListFilters = {}) {
    const conditions = [];
    if (filters.status && filters.status !== "all") conditions.push(eq(crmClients.status, filters.status as CrmClient["status"]));
    if (filters.query?.trim()) {
      const q = like(filters.query);
      conditions.push(or(
        ilike(crmClients.name, q),
        ilike(crmClients.email, q),
        ilike(crmClients.phone, q),
        ilike(crmClients.company, q),
        ilike(crmClients.primaryEmail, q),
        ilike(crmClients.primaryPhone, q),
        ilike(crmClients.companyName, q),
        ilike(crmClients.website, q),
        ilike(crmClients.city, q),
        ilike(crmClients.region, q),
        ilike(crmClients.source, q),
      ));
    }
    return db.select().from(crmClients).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(crmClients.updatedAt), desc(crmClients.createdAt));
  }

  async getClientById(id: string) {
    const [client] = await db.select().from(crmClients).where(eq(crmClients.id, id));
    return client;
  }

  async getClientBySourceLeadId(sourceLeadId: string) {
    const [client] = await db.select().from(crmClients).where(eq(crmClients.sourceLeadId, sourceLeadId));
    return client;
  }

  async getClientDetail(id: string): Promise<CrmClientDetail | undefined> {
    const client = await this.getClientById(id);
    if (!client) return undefined;
    return {
      ...client,
      notes: await this.listClientNotes(id),
      tasks: await this.listClientTasks(id),
      sourceLead: client.sourceLeadId ? await this.getLeadById(client.sourceLeadId) ?? null : null,
    };
  }

  async createClient(data: InsertCrmClient) {
    const [client] = await db.insert(crmClients).values(data).returning();
    return client;
  }

  async updateClient(id: string, data: Partial<InsertCrmClient>) {
    const [client] = await db.update(crmClients).set({ ...data, updatedAt: new Date() }).where(eq(crmClients.id, id)).returning();
    return client;
  }

  async listClientNotes(clientId: string) {
    return db.select().from(crmClientNotes).where(eq(crmClientNotes.clientId, clientId)).orderBy(desc(crmClientNotes.createdAt));
  }

  async createClientNote(data: InsertCrmClientNote) {
    const [note] = await db.insert(crmClientNotes).values(data).returning();
    return note;
  }

  async listClientTasks(clientId: string) {
    return db.select().from(crmClientTasks).where(eq(crmClientTasks.clientId, clientId)).orderBy(asc(crmClientTasks.completed), asc(crmClientTasks.dueAt), desc(crmClientTasks.createdAt));
  }

  async createClientTask(data: InsertCrmClientTask) {
    const [task] = await db.insert(crmClientTasks).values(data).returning();
    return task;
  }

  async updateClientTask(id: string, data: Partial<InsertCrmClientTask>) {
    const [task] = await db.update(crmClientTasks).set({ ...data, updatedAt: new Date() }).where(eq(crmClientTasks.id, id)).returning();
    return task;
  }
}
