import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler";
import { submitManagedFormBySlug } from "../services/forms.service";
import { guestMessageLimiter } from "../middleware/security";
import { getBaseUrl } from "../utils/route-helpers";

const router = Router();

router.post(
  "/",
  guestMessageLimiter,
  asyncHandler(async (req, res) => {
    const baseUrl = getBaseUrl(req);
    const result = await submitManagedFormBySlug("contact-form", req.body, {
      baseUrl,
      source: "contact-route",
      clientIp: req.ip,
    });
    res.status(201).json({ message: result.successMessage });
  }),
);

export default router;
