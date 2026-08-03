CREATE TABLE "file_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"uploaded_by" uuid,
	"original_name" varchar(255) NOT NULL,
	"object_key" varchar(700) NOT NULL,
	"mime_type" varchar(160) NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum_sha256" varchar(64),
	"storage_provider" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "file_assets_object_key_unique" ON "file_assets" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "file_assets_workspace_created_idx" ON "file_assets" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "file_assets_uploader_created_idx" ON "file_assets" USING btree ("uploaded_by","created_at");--> statement-breakpoint
CREATE INDEX "file_assets_status_created_idx" ON "file_assets" USING btree ("status","created_at");