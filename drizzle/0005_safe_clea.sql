CREATE TABLE "background_job_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"attempt" integer NOT NULL,
	"worker_id" varchar(120) NOT NULL,
	"status" varchar(32) DEFAULT 'running' NOT NULL,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "background_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(120) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'queued' NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" varchar(120),
	"deduplication_key" varchar(255),
	"last_error" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "background_job_attempts" ADD CONSTRAINT "background_job_attempts_job_id_background_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."background_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "background_job_attempts_job_attempt_unique" ON "background_job_attempts" USING btree ("job_id","attempt");--> statement-breakpoint
CREATE INDEX "background_job_attempts_job_idx" ON "background_job_attempts" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "background_job_attempts_started_idx" ON "background_job_attempts" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "background_jobs_queue_idx" ON "background_jobs" USING btree ("status","run_at","priority");--> statement-breakpoint
CREATE INDEX "background_jobs_locked_idx" ON "background_jobs" USING btree ("status","locked_at");--> statement-breakpoint
CREATE INDEX "background_jobs_type_idx" ON "background_jobs" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "background_jobs_deduplication_unique" ON "background_jobs" USING btree ("deduplication_key");