import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const backgroundJobs = pgTable(
  "background_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 120 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    priority: integer("priority").notNull().default(100),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: varchar("locked_by", { length: 120 }),
    deduplicationKey: varchar("deduplication_key", { length: 255 }),
    lastError: text("last_error"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("background_jobs_queue_idx").on(table.status, table.runAt, table.priority),
    index("background_jobs_locked_idx").on(table.status, table.lockedAt),
    index("background_jobs_type_idx").on(table.type),
    uniqueIndex("background_jobs_deduplication_unique").on(table.deduplicationKey)
  ]
);

export const backgroundJobAttempts = pgTable(
  "background_job_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id").notNull().references(() => backgroundJobs.id, { onDelete: "cascade" }),
    attempt: integer("attempt").notNull(),
    workerId: varchar("worker_id", { length: 120 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("running"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true })
  },
  (table) => [
    uniqueIndex("background_job_attempts_job_attempt_unique").on(table.jobId, table.attempt),
    index("background_job_attempts_job_idx").on(table.jobId),
    index("background_job_attempts_started_idx").on(table.startedAt)
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    channel: varchar("channel", { length: 32 }).notNull(),
    recipient: varchar("recipient", { length: 255 }).notNull(),
    template: varchar("template", { length: 120 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    provider: varchar("provider", { length: 64 }),
    externalId: varchar("external_id", { length: 255 }),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("notifications_status_idx").on(table.status, table.createdAt),
    index("notifications_recipient_idx").on(table.recipient),
    index("notifications_template_idx").on(table.template)
  ]
);
