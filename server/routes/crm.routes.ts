import { Router } from "express";
import { crmLeadInputSchema } from "@shared/schema";
import { asyncHandler } from "../middleware/error-handler";
import { storage } from "../storage";
import { createOrUpdateCrmLead } from "../services/crm.service";

const router = Router();

async function getCrmApiKey() {
  const settings = await storage.settings.getDecryptedCategory("crm");
  return settings.crm_api_key || process.env.CRM_API_KEY || "";
}

router.post("/leads", asyncHandler(async (req, res) => {
  const expected = await getCrmApiKey();
  if (!expected || req.header("X-CRM-API-Key") !== expected) {
    res.status(401).json({ message: "Invalid CRM API key" });
    return;
  }

  const data = crmLeadInputSchema.parse({ ...req.body, source: req.body?.source || "api" });
  const result = await createOrUpdateCrmLead(data);
  res.status(result.duplicate ? 200 : 201).json({ id: result.lead.id, duplicate: result.duplicate });
}));

export default router;
