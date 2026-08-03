ALTER TABLE "prices" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "prices" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "prices" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "content_pages" ADD COLUMN "seo_title" varchar(255);--> statement-breakpoint
ALTER TABLE "content_pages" ADD COLUMN "seo_description" varchar(320);--> statement-breakpoint
ALTER TABLE "content_pages" ADD COLUMN "status" varchar(32) DEFAULT 'draft' NOT NULL;--> statement-breakpoint
UPDATE "content_pages" SET "status" = 'published' WHERE "published_at" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "content_pages" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "content_pages" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
