import { Router } from "express";
import { z } from "zod";
import { crmClientUpdateSchema, crmLeadInputSchema, crmLeadUpdateSchema } from "@shared/schema";
import { asyncHandler } from "../../middleware/error-handler";
import { storage } from "../../storage";
import { createOrUpdateCrmLead, ensureClientForWonLead } from "../../services/crm.service";
import { paramString } from "../../utils/params";
import { notFound } from "../../utils/route-helpers";

const router = Router();

const noteSchema = z.object({ body: z.string().trim().min(1) });
const taskSchema = z.object({
  title: z.string().trim().min(1),
  dueAt: z.union([z.string(), z.date()]).optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});
const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  dueAt: z.union([z.string(), z.date()]).optional().nullable(),
  completed: z.boolean().optional(),
  assignedToId: z.string().optional().nullable(),
});

function parseDate(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

router.get("/clients", asyncHandler(async (req, res) => {
  res.json(await storage.crm.listClients({ query: String(req.query.q ?? ""), status: String(req.query.status ?? "all") }));
}));

router.get("/clients/:id", asyncHandler(async (req, res) => {
  const client = await storage.crm.getClientDetail(paramString(req.params.id));
  if (!client) return notFound(res, "Client");
  res.json(client);
}));

router.patch("/clients/:id", asyncHandler(async (req, res) => {
  const data = crmClientUpdateSchema.parse(req.body);
  const client = await storage.crm.updateClient(paramString(req.params.id), data);
  if (!client) return notFound(res, "Client");
  res.json(client);
}));

router.post("/clients/:id/notes", asyncHandler(async (req, res) => {
  const { body } = noteSchema.parse(req.body);
  const client = await storage.crm.getClientById(paramString(req.params.id));
  if (!client) return notFound(res, "Client");
  res.status(201).json(await storage.crm.createClientNote({ clientId: client.id, body, createdById: req.user?.id }));
}));

router.post("/clients/:id/tasks", asyncHandler(async (req, res) => {
  const data = taskSchema.parse(req.body);
  const client = await storage.crm.getClientById(paramString(req.params.id));
  if (!client) return notFound(res, "Client");
  res.status(201).json(await storage.crm.createClientTask({
    clientId: client.id,
    title: data.title,
    dueAt: parseDate(data.dueAt),
    assignedToId: data.assignedToId || req.user?.id,
    createdById: req.user?.id,
  }));
}));

router.patch("/clients/tasks/:taskId", asyncHandler(async (req, res) => {
  const data = taskUpdateSchema.parse(req.body);
  const task = await storage.crm.updateClientTask(paramString(req.params.taskId), {
    ...data,
    dueAt: data.dueAt === undefined ? undefined : parseDate(data.dueAt),
  });
  if (!task) return notFound(res, "Client task");
  res.json(task);
}));

router.get("/", asyncHandler(async (req, res) => {
  res.json(await storage.crm.listLeads({ query: String(req.query.q ?? ""), stage: String(req.query.stage ?? "all") }));
}));

router.post("/", asyncHandler(async (req, res) => {
  const data = crmLeadInputSchema.parse({ ...req.body, source: req.body?.source || "manual" });
  const result = await createOrUpdateCrmLead(data, req.user?.id);
  res.status(result.duplicate ? 200 : 201).json(result);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const lead = await storage.crm.getLeadDetail(paramString(req.params.id));
  if (!lead) return notFound(res, "Lead");
  res.json(lead);
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const id = paramString(req.params.id);
  const data = crmLeadUpdateSchema.parse(req.body);
  const lead = await storage.crm.updateLead(id, data);
  if (!lead) return notFound(res, "Lead");
  const client = data.stage === "won" ? await ensureClientForWonLead(lead, req.user?.id) : undefined;
  res.json({ ...lead, client });
}));

router.post("/:id/notes", asyncHandler(async (req, res) => {
  const { body } = noteSchema.parse(req.body);
  const lead = await storage.crm.getLeadById(paramString(req.params.id));
  if (!lead) return notFound(res, "Lead");
  res.status(201).json(await storage.crm.createNote({ leadId: lead.id, body, createdById: req.user?.id }));
}));

router.post("/:id/tasks", asyncHandler(async (req, res) => {
  const data = taskSchema.parse(req.body);
  const lead = await storage.crm.getLeadById(paramString(req.params.id));
  if (!lead) return notFound(res, "Lead");
  res.status(201).json(await storage.crm.createTask({
    leadId: lead.id,
    title: data.title,
    dueAt: parseDate(data.dueAt),
    assignedToId: data.assignedToId || req.user?.id,
    createdById: req.user?.id,
  }));
}));

router.patch("/tasks/:taskId", asyncHandler(async (req, res) => {
  const data = taskUpdateSchema.parse(req.body);
  const task = await storage.crm.updateTask(paramString(req.params.taskId), {
    ...data,
    dueAt: data.dueAt === undefined ? undefined : parseDate(data.dueAt),
  });
  if (!task) return notFound(res, "Lead task");
  res.json(task);
}));

export default router;
