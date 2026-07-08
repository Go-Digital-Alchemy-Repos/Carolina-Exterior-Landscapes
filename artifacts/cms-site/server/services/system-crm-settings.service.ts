import { storage } from "../storage";
import {
  CRM_LEAD_NOTIFICATION_EMAIL_KEY,
  CRM_SETTINGS_CATEGORY,
  DEFAULT_CRM_LEAD_NOTIFICATION_EMAIL,
} from "./crm.service";

export async function ensureSystemCrmSettings() {
  const settings = await storage.settings.getDecryptedCategory(CRM_SETTINGS_CATEGORY);
  if (!settings[CRM_LEAD_NOTIFICATION_EMAIL_KEY]) {
    await storage.settings.upsertSetting(
      CRM_LEAD_NOTIFICATION_EMAIL_KEY,
      DEFAULT_CRM_LEAD_NOTIFICATION_EMAIL,
      CRM_SETTINGS_CATEGORY,
      false,
    );
  }
}
