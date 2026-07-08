import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler";
import * as r2Service from "../services/r2.service";
import { resolveBestR2CmsImageKey } from "../services/cms-image-variants.service";

const router = Router();

function getKeyParam(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join("/");
  }

  return typeof value === "string" ? value : "";
}

router.get(
  "/{*key}",
  asyncHandler(async (req, res) => {
    const key = getKeyParam(req.params.key);
    if (!key || key.includes("..")) {
      return res.status(404).send("Not found");
    }

    res.vary("Accept");
    const preferredKey = resolveBestR2CmsImageKey(key, req.headers.accept);
    let downloaded = await r2Service.downloadFile(preferredKey);
    if (!downloaded && preferredKey !== key) {
      downloaded = await r2Service.downloadFile(key);
    }
    if (!downloaded) {
      return res.status(404).send("Not found");
    }

    res.setHeader("Content-Type", downloaded.contentType || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(downloaded.buffer);
  }),
);

export default router;
