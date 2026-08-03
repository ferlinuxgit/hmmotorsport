import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { users, workspaces } from "./core";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
    action: varchar("action", { length: 160 }).notNull(),
    entityType: varchar("entity_type", { length: 120 }).notNull(),
    entityId: varchar("entity_id", { length: 255 }),
    requestId: varchar("request_id", { length: 128 }),
    ipAddress: varchar("ip_address", { length: 64 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorUserId),
    index("audit_logs_workspace_idx").on(table.workspaceId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt)
  ]
);
