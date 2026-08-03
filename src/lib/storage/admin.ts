import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { fileAssets, users, workspaces } from "@/lib/db/schema";

const fileStatusSchema = z.enum(["all", "pending", "uploading", "ready", "deleting", "deleted"]);

export function parseAdminFileQuery(params: URLSearchParams) {
  return z.object({
    q: z.string().trim().max(120).default(""),
    status: fileStatusSchema.default("all"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25)
  }).parse(Object.fromEntries(params));
}

export async function listAdminFiles(query: ReturnType<typeof parseAdminFileQuery>) {
  const filters: SQL[] = [];
  if (query.status !== "all") filters.push(eq(fileAssets.status, query.status));
  if (query.q) {
    const term = `%${query.q}%`;
    const search = or(ilike(fileAssets.originalName, term), ilike(fileAssets.mimeType, term), ilike(users.email, term), ilike(workspaces.name, term));
    if (search) filters.push(search);
  }
  const where = filters.length ? and(...filters) : undefined;
  const db = getDb();
  const base = db.select({
    id: fileAssets.id,
    workspaceId: fileAssets.workspaceId,
    workspaceName: workspaces.name,
    uploadedBy: fileAssets.uploadedBy,
    uploaderEmail: users.email,
    originalName: fileAssets.originalName,
    mimeType: fileAssets.mimeType,
    sizeBytes: fileAssets.sizeBytes,
    storageProvider: fileAssets.storageProvider,
    status: fileAssets.status,
    checksumSha256: fileAssets.checksumSha256,
    createdAt: fileAssets.createdAt
  }).from(fileAssets).leftJoin(users, eq(fileAssets.uploadedBy, users.id)).leftJoin(workspaces, eq(fileAssets.workspaceId, workspaces.id));
  const countBase = db.select({ total: count() }).from(fileAssets).leftJoin(users, eq(fileAssets.uploadedBy, users.id)).leftJoin(workspaces, eq(fileAssets.workspaceId, workspaces.id));
  const [items, totals] = await Promise.all([
    (where ? base.where(where) : base).orderBy(desc(fileAssets.createdAt)).limit(query.pageSize).offset((query.page - 1) * query.pageSize),
    where ? countBase.where(where) : countBase
  ]);
  const total = Number(totals[0]?.total ?? 0);
  return { items, pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.max(1, Math.ceil(total / query.pageSize)) } };
}
