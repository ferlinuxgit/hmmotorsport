ALTER TABLE "workspaces" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
INSERT INTO "workspace_members" ("workspace_id", "user_id", "membership_role")
SELECT "id", "owner_id", 'owner' FROM "workspaces"
ON CONFLICT ("workspace_id", "user_id") DO UPDATE SET "membership_role" = 'owner';
