import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  imageUrl: text("image_url"),
  emailVerified: boolean("email_verified").notNull().default(false),
  role: varchar("role", { length: 64 }).notNull().default("user"),
  active: boolean("active").notNull().default(true),
  lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
  },
  (table) => [index("sessions_user_idx").on(table.userId)]
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("accounts_provider_account_unique").on(table.providerId, table.accountId),
    index("accounts_user_idx").on(table.userId)
  ]
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("verifications_identifier_value_unique").on(table.identifier, table.value)]
);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    membershipRole: varchar("membership_role", { length: 64 }).notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("workspace_members_workspace_user_unique").on(table.workspaceId, table.userId),
    index("workspace_members_user_idx").on(table.userId)
  ]
);

export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    membershipRole: varchar("membership_role", { length: 64 }).notNull().default("member"),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
    acceptedBy: uuid("accepted_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("workspace_invitations_workspace_idx").on(table.workspaceId),
    index("workspace_invitations_email_idx").on(table.email),
    index("workspace_invitations_status_expires_idx").on(table.status, table.expiresAt)
  ]
);

export const contentPages = pgTable("content_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary"),
  body: text("body").notNull().default(""),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: varchar("seo_description", { length: 320 }),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  version: integer("version").notNull().default(1),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventName: varchar("event_name", { length: 120 }).notNull(),
    sessionId: varchar("session_id", { length: 160 }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    path: varchar("path", { length: 500 }).notNull(),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    properties: jsonb("properties").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("analytics_events_created_at_idx").on(table.createdAt),
    index("analytics_events_event_name_idx").on(table.eventName),
    index("analytics_events_path_idx").on(table.path),
    index("analytics_events_session_idx").on(table.sessionId),
    index("analytics_events_user_idx").on(table.userId)
  ]
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    key: varchar("key", { length: 255 }).primaryKey(),
    count: integer("count").notNull(),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("rate_limit_buckets_reset_at_idx").on(table.resetAt)]
);
