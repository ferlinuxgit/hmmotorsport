import { boolean, index, integer, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { users, workspaces } from "./core";

export const runtimeSettings = pgTable("runtime_settings", {
  key: varchar("key", { length: 160 }).primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  version: integer("version").notNull().default(1),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const featureFlags = pgTable("feature_flags", {
  key: varchar("key", { length: 160 }).primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  rolloutPercentage: integer("rollout_percentage").notNull().default(100),
  version: integer("version").notNull().default(1),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const workspaceFeatureFlagOverrides = pgTable(
  "workspace_feature_flag_overrides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    flagKey: varchar("flag_key", { length: 160 }).notNull().references(() => featureFlags.key, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull(),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("workspace_feature_flag_overrides_unique").on(table.flagKey, table.workspaceId),
    index("workspace_feature_flag_overrides_workspace_idx").on(table.workspaceId)
  ]
);
