import { boolean, index, numeric, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
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
    uniqueIndex("orders_provider_external_unique").on(table.provider, table.externalId)
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
