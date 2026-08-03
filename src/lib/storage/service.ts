import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { hasWorkspaceRole } from "@/lib/auth/rbac";
import type { AuthAccount } from "@/lib/auth/server";
import { getStorageEnv } from "@/lib/config/env";
import { getRuntimeSetting } from "@/lib/config/runtime";
import { getDb } from "@/lib/db/client";
import { auditLogs, fileAssets } from "@/lib/db/schema";
import { getStorageProvider } from "@/lib/storage/provider";

export const createFileSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().toLowerCase().min(3).max(160),
  sizeBytes: z.number().int().positive(),
  workspaceId: z.uuid().nullable().optional()
});

export class StorageOperationError extends Error {
  constructor(message: string, readonly code: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "INVALID_FILE", readonly status: 400 | 403 | 404 | 409) {
    super(message);
    this.name = "StorageOperationError";
  }
}

export function sanitizeFilename(value: string) {
  const normalized = value.replaceAll("\\", "/").split("/").at(-1)?.replace(/[\u0000-\u001f\u007f]/g, "").trim() ?? "";
  if (!normalized || normalized === "." || normalized === "..") throw new StorageOperationError("Invalid filename", "INVALID_FILE", 400);
  return normalized.slice(0, 255);
}

export function getAllowedMimeTypes() {
  return new Set(getStorageEnv().STORAGE_ALLOWED_MIME_TYPES.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function objectKey(account: AuthAccount, workspaceId: string | null, filename: string) {
  const extension = filename.toLowerCase().match(/\.[a-z0-9]{1,10}$/)?.[0] ?? "";
  return `${workspaceId ? `workspaces/${workspaceId}` : `users/${account.id}`}/${randomUUID()}${extension}`;
}

async function assertWorkspaceAccess(account: AuthAccount, workspaceId: string | null, role: "member" | "admin" = "member") {
  if (workspaceId && !(await hasWorkspaceRole(account, workspaceId, role))) {
    throw new StorageOperationError("Workspace access denied", "FORBIDDEN", 403);
  }
}

async function getAsset(id: string) {
  const [asset] = await getDb().select().from(fileAssets).where(and(eq(fileAssets.id, id), ne(fileAssets.status, "deleted"))).limit(1);
  if (!asset) throw new StorageOperationError("File not found", "NOT_FOUND", 404);
  return asset;
}

async function assertReadAccess(account: AuthAccount, asset: Awaited<ReturnType<typeof getAsset>>) {
  if (account.role === "admin") return;
  if (asset.workspaceId) return assertWorkspaceAccess(account, asset.workspaceId);
  if (asset.uploadedBy !== account.id) throw new StorageOperationError("File access denied", "FORBIDDEN", 403);
}

async function assertManageAccess(account: AuthAccount, asset: Awaited<ReturnType<typeof getAsset>>) {
  if (account.role === "admin" || asset.uploadedBy === account.id) {
    if (asset.workspaceId && account.role !== "admin") await assertWorkspaceAccess(account, asset.workspaceId);
    return;
  }
  if (asset.workspaceId) return assertWorkspaceAccess(account, asset.workspaceId, "admin");
  throw new StorageOperationError("File access denied", "FORBIDDEN", 403);
}

export async function createFileAsset(account: AuthAccount, raw: z.input<typeof createFileSchema>, context: { requestId?: string; clientIp?: string }) {
  if (!(await getRuntimeSetting("storage.uploads_enabled"))) {
    throw new StorageOperationError("New uploads are temporarily disabled", "FORBIDDEN", 403);
  }
  const value = createFileSchema.parse(raw);
  const env = getStorageEnv();
  if (value.sizeBytes > env.STORAGE_MAX_FILE_BYTES) throw new StorageOperationError("File is too large", "INVALID_FILE", 400);
  if (!getAllowedMimeTypes().has(value.mimeType)) throw new StorageOperationError("File type is not allowed", "INVALID_FILE", 400);
  const filename = sanitizeFilename(value.filename);
  const workspaceId = value.workspaceId ?? null;
  await assertWorkspaceAccess(account, workspaceId);
  return getDb().transaction(async (tx) => {
    const [asset] = await tx.insert(fileAssets).values({
      workspaceId,
      uploadedBy: account.id,
      originalName: filename,
      objectKey: objectKey(account, workspaceId, filename),
      mimeType: value.mimeType,
      sizeBytes: value.sizeBytes,
      storageProvider: env.STORAGE_PROVIDER
    }).returning();
    if (!asset) throw new Error("Could not create file asset");
    await tx.insert(auditLogs).values({
      actorUserId: account.id,
      workspaceId,
      action: "file.created",
      entityType: "file_asset",
      entityId: asset.id,
      requestId: context.requestId?.slice(0, 128),
      ipAddress: context.clientIp?.slice(0, 64),
      metadata: { filename, mimeType: value.mimeType, sizeBytes: value.sizeBytes }
    });
    return asset;
  });
}

export async function storeFileBytes(account: AuthAccount, id: string, bytes: Uint8Array, mimeType: string, context: { requestId?: string; clientIp?: string }) {
  const asset = await getAsset(id);
  await assertManageAccess(account, asset);
  if (asset.status !== "pending") throw new StorageOperationError("File upload is no longer pending", "CONFLICT", 409);
  if (bytes.byteLength !== asset.sizeBytes) throw new StorageOperationError("Uploaded size does not match declared size", "INVALID_FILE", 400);
  if (mimeType.toLowerCase() !== asset.mimeType) throw new StorageOperationError("Uploaded content type does not match declared type", "INVALID_FILE", 400);
  const [claimed] = await getDb().update(fileAssets).set({ status: "uploading", updatedAt: new Date() })
    .where(and(eq(fileAssets.id, asset.id), eq(fileAssets.status, "pending"))).returning({ id: fileAssets.id });
  if (!claimed) throw new StorageOperationError("File upload is no longer pending", "CONFLICT", 409);
  const provider = getStorageProvider(asset.storageProvider);
  try {
    await provider.put(asset.objectKey, bytes, asset.mimeType);
  } catch (error) {
    await getDb().update(fileAssets).set({ status: "pending", updatedAt: new Date() })
      .where(and(eq(fileAssets.id, asset.id), eq(fileAssets.status, "uploading")));
    throw error;
  }
  const checksum = createHash("sha256").update(bytes).digest("hex");
  return getDb().transaction(async (tx) => {
    const [updated] = await tx.update(fileAssets).set({ status: "ready", checksumSha256: checksum, updatedAt: new Date() })
      .where(and(eq(fileAssets.id, asset.id), eq(fileAssets.status, "uploading"))).returning();
    if (!updated) {
      throw new StorageOperationError("File upload could not be finalized", "CONFLICT", 409);
    }
    await tx.insert(auditLogs).values({
      actorUserId: account.id, workspaceId: asset.workspaceId, action: "file.uploaded", entityType: "file_asset", entityId: asset.id,
      requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { checksumSha256: checksum }
    });
    return updated;
  });
}

export async function readFileAsset(account: AuthAccount, id: string) {
  const asset = await getAsset(id);
  await assertReadAccess(account, asset);
  if (asset.status !== "ready") throw new StorageOperationError("File is not ready", "CONFLICT", 409);
  const bytes = await getStorageProvider(asset.storageProvider).get(asset.objectKey);
  return { asset, bytes };
}

export async function deleteFileAsset(account: AuthAccount, id: string, context: { requestId?: string; clientIp?: string }) {
  const asset = await getAsset(id);
  await assertManageAccess(account, asset);
  if (asset.status === "uploading" || asset.status === "deleting") throw new StorageOperationError("File is busy", "CONFLICT", 409);
  const [claimed] = await getDb().update(fileAssets).set({ status: "deleting", updatedAt: new Date() })
    .where(and(eq(fileAssets.id, id), eq(fileAssets.status, asset.status))).returning({ id: fileAssets.id });
  if (!claimed) throw new StorageOperationError("File is busy", "CONFLICT", 409);
  try {
    await getStorageProvider(asset.storageProvider).delete(asset.objectKey);
  } catch (error) {
    await getDb().update(fileAssets).set({ status: asset.status, updatedAt: new Date() })
      .where(and(eq(fileAssets.id, id), eq(fileAssets.status, "deleting")));
    throw error;
  }
  return getDb().transaction(async (tx) => {
    const now = new Date();
    const [deleted] = await tx.update(fileAssets).set({ status: "deleted", deletedAt: now, updatedAt: now }).where(eq(fileAssets.id, id)).returning();
    await tx.insert(auditLogs).values({
      actorUserId: account.id, workspaceId: asset.workspaceId, action: "file.deleted", entityType: "file_asset", entityId: id,
      requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { filename: asset.originalName }
    });
    return deleted;
  });
}

export async function listWorkspaceFiles(account: AuthAccount, workspaceId: string) {
  await assertWorkspaceAccess(account, workspaceId);
  return getDb().select().from(fileAssets).where(and(eq(fileAssets.workspaceId, workspaceId), ne(fileAssets.status, "deleted"))).orderBy(desc(fileAssets.createdAt)).limit(100);
}

export async function listOwnFiles(account: AuthAccount) {
  return getDb().select().from(fileAssets).where(and(eq(fileAssets.uploadedBy, account.id), ne(fileAssets.status, "deleted"))).orderBy(desc(fileAssets.createdAt)).limit(100);
}
