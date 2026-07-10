import { logger } from "../utils/logger";
import { ensureSystemCmsSections } from "./system-cms-sections.service";
import { ensureSystemDocs } from "./system-docs.service";
import { ensureSystemEmailTemplates } from "./system-email-templates.service";
import { ensureSystemForms } from "./system-forms.service";
import { ensureLandscapeCmsContent } from "./landscape-cms-content.service";
import { ensureSystemBranding } from "./system-branding.service";
import { populateCmsSeoMetadata } from "./cms-seo-metadata-populator.service";
import { removeLegacySiteContent } from "./legacy-site-cleanup.service";

export async function runSystemBootstrap() {
  logger.app.info("Running system bootstrap");

  try {
    await removeLegacySiteContent();
  } catch (error) {
    logger.cms.error("Legacy content cleanup failed; continuing system bootstrap", error);
  }
  await ensureLandscapeCmsContent();
  await ensureSystemBranding();
  await populateCmsSeoMetadata();
  await ensureSystemCmsSections();
  await ensureSystemForms();
  await ensureSystemDocs({ refreshExisting: false });
  await ensureSystemEmailTemplates(false);

  logger.app.info("System bootstrap complete");
}
