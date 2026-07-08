ALTER TABLE "cms_media"
  ADD COLUMN IF NOT EXISTS "variants" jsonb;
