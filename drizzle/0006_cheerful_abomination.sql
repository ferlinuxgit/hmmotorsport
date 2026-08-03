CREATE TABLE "workspace_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"membership_role" varchar(64) DEFAULT 'member' NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"invited_by" uuid,
	"accepted_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" varchar(32) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"template" varchar(120) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'queued' NOT NULL,
	"provider" varchar(64),
	"external_id" varchar(255),
	"last_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_invitations_workspace_idx" ON "workspace_invitations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_invitations_email_idx" ON "workspace_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "workspace_invitations_status_expires_idx" ON "workspace_invitations" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX "notifications_template_idx" ON "notifications" USING btree ("template");