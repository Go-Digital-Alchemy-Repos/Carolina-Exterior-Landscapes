import { logger } from "../utils/logger";
import { ensureSystemCmsSections } from "./system-cms-sections.service";
import { ensureSystemDocs } from "./system-docs.service";
import { ensureSystemEmailTemplates } from "./system-email-templates.service";
import { ensureSystemForms } from "./system-forms.service";
import { ensureSystemCmsMedia } from "./system-cms-media.service";
import { ensureLandscapeCmsContent } from "./landscape-cms-content.service";
import { ensureSystemBranding } from "./system-branding.service";

export async function runSystemBootstrap() {
  logger.app.info("Running system bootstrap");

  await ensureLandscapeCmsContent();
  await ensureSystemBranding();
  await ensureSystemCmsMedia();
  await ensureSystemCmsSections();
  await ensureSystemForms();
  await ensureSystemDocs({ refreshExisting: false });
  await ensureSystemEmailTemplates(false);

  logger.app.info("System bootstrap complete");
}
