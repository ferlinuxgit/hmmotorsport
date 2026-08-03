CREATE TABLE "feature_flags" (
	"key" varchar(160) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"rollout_percentage" integer DEFAULT 100 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runtime_settings" (
	"key" varchar(160) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_feature_flag_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flag_key" varchar(160) NOT NULL,
	"workspace_id" uuid NOT NULL,
	"enabled" boolean NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_settings" ADD CONSTRAINT "runtime_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_feature_flag_overrides" ADD CONSTRAINT "workspace_feature_flag_overrides_flag_key_feature_flags_key_fk" FOREIGN KEY ("flag_key") REFERENCES "public"."feature_flags"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_feature_flag_overrides" ADD CONSTRAINT "workspace_feature_flag_overrides_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_feature_flag_overrides" ADD CONSTRAINT "workspace_feature_flag_overrides_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_feature_flag_overrides_unique" ON "workspace_feature_flag_overrides" USING btree ("flag_key","workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_feature_flag_overrides_workspace_idx" ON "workspace_feature_flag_overrides" USING btree ("workspace_id");