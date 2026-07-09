ALTER TABLE "seo_settings" ADD COLUMN IF NOT EXISTS "custom_head_tags" text;
--> statement-breakpoint
ALTER TABLE "seo_settings" ADD COLUMN IF NOT EXISTS "custom_body_start_tags" text;
--> statement-breakpoint
ALTER TABLE "seo_settings" ADD COLUMN IF NOT EXISTS "custom_body_end_tags" text;
