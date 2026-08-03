import { index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { users, workspaces } from "./core";

export const fileAssets = pgTable(
  "file_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "restrict" }),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    objectKey: varchar("object_key", { length: 700 }).notNull(),
    mimeType: varchar("mime_type", { length: 160 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    checksumSha256: varchar("checksum_sha256", { length: 64 }),
    storageProvider: varchar("storage_provider", { length: 32 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (table) => [
    uniqueIndex("file_assets_object_key_unique").on(table.objectKey),
    index("file_assets_workspace_created_idx").on(table.workspaceId, table.createdAt),
    index("file_assets_uploader_created_idx").on(table.uploadedBy, table.createdAt),
    index("file_assets_status_created_idx").on(table.status, table.createdAt)
  ]
);
