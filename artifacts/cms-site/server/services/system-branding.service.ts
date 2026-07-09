import { DEFAULT_BRANDING_VALUES, type BrandingSettingKey } from "@shared/branding-defaults";
import { storage } from "../storage";
import { resetEmailBrandingCache } from "./email.service";

const LEGACY_VALUE_PATTERNS = [
  /carolina custom automation/i,
  /ccasecure/i,
  /cca-/i,
  /sp\.fa/i,
  /low voltage/i,
  /control4/i,
  /bonded/i,
  /#e8520a/i,
  /#2d5f3f/i,
  /#2c2c2c/i,
];

const BRANDING_DEFAULT_KEYS = Object.keys(DEFAULT_BRANDING_VALUES) as BrandingSettingKey[];
const PROJECT_BRANDING_KEYS: BrandingSettingKey[] = [
  "frontend_logo_url",
  "footer_logo_url",
  "favicon_url",
  "company_name",
  "company_address",
  "company_phone_numbers",
  "company_email",
  "company_hours",
  "company_license",
  "company_licensing",
  "company_credentials",
  "brand_primary_color",
  "brand_secondary_color",
  "brand_tertiary_color",
  "brand_quaternary_color",
  "eyebrow_background_color",
  "eyebrow_text_color",
  "text_h1_color",
  "text_h2_color",
  "text_h3_h6_color",
  "text_body_color",
  "text_heading_subtext_color",
  "text_supporting_copy_color",
  "text_helper_text_color",
  "text_meta_color",
  "text_link_color",
  "text_link_hover_color",
  "text_inverse_color",
  "text_primary_foreground_color",
  "text_secondary_foreground_color",
  "text_tertiary_foreground_color",
];

function shouldReplaceBrandingValue(value: string | null | undefined) {
  if (!value?.trim()) return true;
  return LEGACY_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

export async function ensureSystemBranding() {
  const existing = await storage.settings.getDecryptedCategory("branding");

  for (const key of BRANDING_DEFAULT_KEYS) {
    if (PROJECT_BRANDING_KEYS.includes(key) || shouldReplaceBrandingValue(existing[key])) {
      await storage.settings.upsertSetting(key, DEFAULT_BRANDING_VALUES[key], "branding", false);
    }
  }

  storage.settings.invalidateCategory("branding");
  resetEmailBrandingCache();
}
