CREATE TABLE IF NOT EXISTS "cms_galleries" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "layout" text DEFAULT 'grid' NOT NULL,
  "settings" jsonb DEFAULT '{"columnsDesktop":3,"columnsTablet":2,"columnsMobile":1,"spacing":"md","imageRatio":"4/3","cropMode":"cover","borderRadius":"md","transitionEffect":"none","arrowIconColor":"#ffffff","arrowBackgroundColor":"#6b7280","showTitle":true,"showCaptions":true,"captionPosition":"below","lightbox":true,"hoverEffect":"zoom","maxImages":0,"customClassName":""}'::jsonb NOT NULL,
  "created_by" varchar,
  "updated_by" varchar,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "cms_gallery_items" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "gallery_id" varchar NOT NULL,
  "media_id" varchar,
  "image_url" text NOT NULL,
  "alt" text,
  "title" text,
  "caption" text,
  "link_url" text,
  "cta_text" text,
  "tags" text[] DEFAULT ARRAY[]::text[],
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "cms_galleries" ADD CONSTRAINT "cms_galleries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "cms_galleries" ADD CONSTRAINT "cms_galleries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "cms_gallery_items" ADD CONSTRAINT "cms_gallery_items_gallery_id_cms_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "cms_galleries"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "cms_gallery_items" ADD CONSTRAINT "cms_gallery_items_media_id_cms_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "cms_media"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_cms_galleries_slug" ON "cms_galleries" ("slug");
CREATE INDEX IF NOT EXISTS "idx_cms_galleries_status" ON "cms_galleries" ("status");
CREATE INDEX IF NOT EXISTS "idx_cms_galleries_updated_at" ON "cms_galleries" ("updated_at");
CREATE INDEX IF NOT EXISTS "idx_cms_gallery_items_gallery_id" ON "cms_gallery_items" ("gallery_id");
CREATE INDEX IF NOT EXISTS "idx_cms_gallery_items_media_id" ON "cms_gallery_items" ("media_id");
CREATE INDEX IF NOT EXISTS "idx_cms_gallery_items_sort_order" ON "cms_gallery_items" ("sort_order");
