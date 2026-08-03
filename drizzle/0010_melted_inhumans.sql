CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(160) NOT NULL,
	"user_id" uuid,
	"workspace_id" uuid,
	"source_order_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entitlements_exactly_one_subject_check" CHECK ((("entitlements"."user_id" is not null)::int + ("entitlements"."workspace_id" is not null)::int) = 1)
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" varchar(64) NOT NULL,
	"amount" numeric(13, 3) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"reason" varchar(255),
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"provider_refund_id" varchar(255),
	"idempotency_key" varchar(255) NOT NULL,
	"requested_by" uuid,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "price_id" uuid;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_source_order_id_orders_id_fk" FOREIGN KEY ("source_order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "entitlements_source_order_unique" ON "entitlements" USING btree ("source_order_id");--> statement-breakpoint
CREATE INDEX "entitlements_user_key_idx" ON "entitlements" USING btree ("user_id","key","status");--> statement-breakpoint
CREATE INDEX "entitlements_workspace_key_idx" ON "entitlements" USING btree ("workspace_id","key","status");--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_idempotency_unique" ON "refunds" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "refunds_order_status_idx" ON "refunds" USING btree ("order_id","status");--> statement-breakpoint
CREATE INDEX "refunds_status_created_idx" ON "refunds" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_price_id_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."prices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_price_idx" ON "orders" USING btree ("price_id");