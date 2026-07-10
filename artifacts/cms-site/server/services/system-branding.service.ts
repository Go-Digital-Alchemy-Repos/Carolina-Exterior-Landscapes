import { DEFAULT_BRANDING_VALUES, type BrandingSettingKey } from "@shared/branding-defaults";
import { storage } from "../storage";
import { resetEmailBrandingCache } from "./email.service";
import { containsLegacySiteContent } from "./legacy-site-content";

const LEGACY_VALUE_PATTERNS = [
  /sp\.fa/i,
  /bonded/i,
  /#e8520a/i,
  /#2d5f3f/i,
  /#2c2c2c/i,
];

const BRANDING_DEFAULT_KEYS = Object.keys(DEFAULT_BRANDING_VALUES) as BrandingSettingKey[];
function shouldReplaceBrandingValue(value: string | null | undefined) {
  if (!value?.trim()) return true;
  return containsLegacySiteContent(value) || LEGACY_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

export async function ensureSystemBranding() {
  const existing = await storage.settings.getDecryptedCategory("branding");

  for (const key of BRANDING_DEFAULT_KEYS) {
    if (shouldReplaceBrandingValue(existing[key])) {
      await storage.settings.upsertSetting(key, DEFAULT_BRANDING_VALUES[key], "branding", false);
    }
  }

  storage.settings.invalidateCategory("branding");
  resetEmailBrandingCache();
}
