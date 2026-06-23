import { Router, type IRouter } from "express";
import {
  CreateResidentialQuoteBody,
  CreateCommercialQuoteBody,
} from "@workspace/api-zod";
import {
  db,
  residentialQuotesTable,
  commercialQuotesTable,
} from "@workspace/db";
import { logger } from "../lib/logger";
import { sendQuoteNotification } from "../lib/email";

const router: IRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invalidEmail(email: string): boolean {
  return !EMAIL_RE.test(email);
}

router.post("/residential-quotes", async (req, res) => {
  const parsed = CreateResidentialQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Please check the form and try again.",
      details: parsed.error.flatten(),
    });
  }

  if (invalidEmail(parsed.data.email)) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Please enter a valid email address.",
    });
  }

  try {
    const [row] = await db
      .insert(residentialQuotesTable)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        audienceType: parsed.data.audienceType,
        address: parsed.data.address,
        city: parsed.data.city,
        servicesInterested: parsed.data.servicesInterested ?? [],
        message: parsed.data.message,
      })
      .returning({ id: residentialQuotesTable.id });

    await sendQuoteNotification("residential", { id: row.id, ...parsed.data });

    return res.status(201).json({
      id: row.id,
      message:
        "Thank you. Your request has been received and we'll be in touch shortly.",
    });
  } catch (err) {
    logger.error({ err }, "Failed to save residential quote");
    return res.status(500).json({
      error: "InternalError",
      message: "Something went wrong saving your request. Please try again.",
    });
  }
});

router.post("/commercial-quotes", async (req, res) => {
  const parsed = CreateCommercialQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Please check the form and try again.",
      details: parsed.error.flatten(),
    });
  }

  if (invalidEmail(parsed.data.email)) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Please enter a valid email address.",
    });
  }

  try {
    const [row] = await db
      .insert(commercialQuotesTable)
      .values({
        contactName: parsed.data.contactName,
        title: parsed.data.title,
        companyName: parsed.data.companyName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        propertyAddress: parsed.data.propertyAddress,
        propertyType: parsed.data.propertyType,
        numberOfProperties: parsed.data.numberOfProperties,
        servicesNeeded: parsed.data.servicesNeeded ?? [],
        currentProvider: parsed.data.currentProvider,
        bestTimeToReach: parsed.data.bestTimeToReach,
        notes: parsed.data.notes,
      })
      .returning({ id: commercialQuotesTable.id });

    await sendQuoteNotification("commercial", { id: row.id, ...parsed.data });

    return res.status(201).json({
      id: row.id,
      message:
        "Thank you. Your request has been received and our commercial team will follow up shortly.",
    });
  } catch (err) {
    logger.error({ err }, "Failed to save commercial quote");
    return res.status(500).json({
      error: "InternalError",
      message: "Something went wrong saving your request. Please try again.",
    });
  }
});

export default router;
