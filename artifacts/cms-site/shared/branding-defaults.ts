export const DEFAULT_BRANDING_VALUES = {
  frontend_logo_url: "/images/header-logo-horizontal.svg",
  footer_logo_url: "/images/footer-logo-horizontal.svg",
  favicon_url: "/images/symbol.svg",
  company_name: "Carolina Exterior Landscapes",
  company_address: "Waxhaw, NC 28173",
  company_phone_numbers: "(704) 975-5867",
  company_email: "info@carolinaexteriorlandscapes.com",
  company_hours: "Monday - Friday, 8:00 AM - 5:00 PM",
  company_license: "",
  company_licensing: "Locally owned, licensed, and insured",
  company_credentials: "Lawn care, landscaping, and hardscape",
  company_google_business_url: "",
  brand_primary_color: "#53823C",
  brand_secondary_color: "#103F27",
  brand_tertiary_color: "#F2B326",
  brand_quaternary_color: "#054F79",
  eyebrow_background_color: "#53823C",
  eyebrow_text_color: "#ffffff",
  text_h1_color: "#103F27",
  text_h2_color: "#103F27",
  text_h3_h6_color: "#103F27",
  text_body_color: "#545454",
  text_heading_subtext_color: "#545454",
  text_supporting_copy_color: "#545454",
  text_helper_text_color: "#545454",
  text_meta_color: "#545454",
  text_link_color: "#53823C",
  text_link_hover_color: "#103F27",
  text_inverse_color: "#FFFFFF",
  text_primary_foreground_color: "#FFFFFF",
  text_secondary_foreground_color: "#FFFFFF",
  text_tertiary_foreground_color: "#103F27",
} as const;

export type BrandingSettingKey = keyof typeof DEFAULT_BRANDING_VALUES;

export function defaultBrandingValue(key: BrandingSettingKey): string {
  return DEFAULT_BRANDING_VALUES[key];
}
