import { sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { users, workspaces } from "./core";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("products_workspace_idx").on(table.workspaceId)]
);

export const prices = pgTable(
  "prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 64 }).notNull(),
    amount: numeric("amount", { precision: 13, scale: 3 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    interval: varchar("interval", { length: 32 }),
    externalId: varchar("external_id", { length: 255 }),
    active: boolean("active").notNull().default(true),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("prices_product_idx").on(table.productId),
    uniqueIndex("prices_provider_external_unique").on(table.provider, table.externalId)
  ]
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    priceId: uuid("price_id").references(() => prices.id, { onDelete: "restrict" }),
    provider: varchar("provider", { length: 64 }).notNull(),
    status: varchar("status", { length: 64 }).notNull().default("draft"),
    total: numeric("total", { precision: 13, scale: 3 }).notNull().default("0"),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    externalId: varchar("external_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("orders_user_idx").on(table.userId),
    index("orders_workspace_idx").on(table.workspaceId),
    index("orders_price_idx").on(table.priceId),
    uniqueIndex("orders_provider_external_unique").on(table.provider, table.externalId)
  ]
);

export const entitlements = pgTable(
  "entitlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 160 }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    sourceOrderId: uuid("source_order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("entitlements_source_order_unique").on(table.sourceOrderId),
    index("entitlements_user_key_idx").on(table.userId, table.key, table.status),
    index("entitlements_workspace_key_idx").on(table.workspaceId, table.key, table.status),
    check("entitlements_exactly_one_subject_check", sql`((${table.userId} is not null)::int + (${table.workspaceId} is not null)::int) = 1`)
  ]
);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
    provider: varchar("provider", { length: 64 }).notNull(),
    amount: numeric("amount", { precision: 13, scale: 3 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    reason: varchar("reason", { length: 255 }),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    providerRefundId: varchar("provider_refund_id", { length: 255 }),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    requestedBy: uuid("requested_by").references(() => users.id, { onDelete: "set null" }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true })
  },
  (table) => [
    uniqueIndex("refunds_idempotency_unique").on(table.idempotencyKey),
    index("refunds_order_status_idx").on(table.orderId, table.status),
    index("refunds_status_created_idx").on(table.status, table.createdAt)
  ]
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: varchar("provider", { length: 64 }).notNull(),
    eventId: varchar("event_id", { length: 255 }).notNull(),
    eventType: varchar("event_type", { length: 160 }).notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    externalId: varchar("external_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("payment_events_provider_event_unique").on(table.provider, table.eventId),
    index("payment_events_order_idx").on(table.orderId),
    index("payment_events_created_at_idx").on(table.createdAt)
  ]
);
