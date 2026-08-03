import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { z } from "zod";

import type { AuthAccount } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { auditLogs, contentPages } from "@/lib/db/schema";

const slugSchema = z.string().trim().toLowerCase().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const pageStatusSchema = z.enum(["draft", "published", "archived"]);

export const contentPageCreateSchema = z.object({
  title: z.string().trim().min(2).max(255),
  slug: slugSchema,
  summary: z.string().trim().max(1_000).nullable().optional(),
  body: z.string().max(200_000).default("")
});

export const contentPageUpdateSchema = z.object({
  title: z.string().trim().min(2).max(255).optional(),
  slug: slugSchema.optional(),
  summary: z.string().trim().max(1_000).nullable().optional(),
  body: z.string().max(200_000).optional(),
  seoTitle: z.string().trim().max(255).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
  status: pageStatusSchema.optional(),
  expectedVersion: z.number().int().positive()
}).refine((value) => Object.keys(value).some((key) => key !== "expectedVersion"), { message: "At least one change is required" });

export class ContentOperationError extends Error {
  constructor(message: string, readonly code: "NOT_FOUND" | "CONFLICT", readonly status: 404 | 409) {
    super(message);
    this.name = "ContentOperationError";
  }
}

export function parseContentPageQuery(params: URLSearchParams) {
  return z.object({
    q: z.string().trim().max(120).default(""),
    status: z.enum(["all", "draft", "published", "archived"]).default("all"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25)
  }).parse(Object.fromEntries(params));
}

export async function listContentPages(query: ReturnType<typeof parseContentPageQuery>) {
  const filters: SQL[] = [];
  if (query.status !== "all") filters.push(eq(contentPages.status, query.status));
  if (query.q) {
    const search = or(ilike(contentPages.title, `%${query.q}%`), ilike(contentPages.slug, `%${query.q}%`));
    if (search) filters.push(search);
  }
  const where = filters.length ? and(...filters) : undefined;
  const db = getDb();
  const base = db.select().from(contentPages);
  const countBase = db.select({ total: count() }).from(contentPages);
  const [items, totals] = await Promise.all([
    (where ? base.where(where) : base).orderBy(desc(contentPages.updatedAt)).limit(query.pageSize).offset((query.page - 1) * query.pageSize),
    where ? countBase.where(where) : countBase
  ]);
  const total = Number(totals[0]?.total ?? 0);
  return { items, pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.max(1, Math.ceil(total / query.pageSize)) } };
}

export async function getContentPage(id: string) {
  const [page] = await getDb().select().from(contentPages).where(eq(contentPages.id, id)).limit(1);
  if (!page) throw new ContentOperationError("Content page not found", "NOT_FOUND", 404);
  return page;
}

export async function getPublishedContentPage(slug: string) {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return null;
  const [page] = await getDb().select().from(contentPages).where(and(eq(contentPages.slug, parsed.data), eq(contentPages.status, "published"))).limit(1);
  return page ?? null;
}

export async function createContentPage(actor: AuthAccount, input: z.infer<typeof contentPageCreateSchema>, context: { requestId?: string; clientIp?: string }) {
  const value = contentPageCreateSchema.parse(input);
  return getDb().transaction(async (tx) => {
    const [existing] = await tx.select({ id: contentPages.id }).from(contentPages).where(eq(contentPages.slug, value.slug)).limit(1);
    if (existing) throw new ContentOperationError("Content slug already exists", "CONFLICT", 409);
    const [page] = await tx.insert(contentPages).values(value).returning();
    if (!page) throw new Error("Could not create content page");
    await tx.insert(auditLogs).values({ actorUserId: actor.id, action: "content.page_created", entityType: "content_page", entityId: page.id, requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { slug: page.slug } });
    return page;
  });
}

export async function updateContentPage(actor: AuthAccount, id: string, input: z.infer<typeof contentPageUpdateSchema>, context: { requestId?: string; clientIp?: string }) {
  const value = contentPageUpdateSchema.parse(input);
  const { expectedVersion, ...changes } = value;
  return getDb().transaction(async (tx) => {
    const [current] = await tx.select().from(contentPages).where(eq(contentPages.id, id)).limit(1).for("update");
    if (!current) throw new ContentOperationError("Content page not found", "NOT_FOUND", 404);
    if (current.version !== expectedVersion) throw new ContentOperationError("Content page changed since it was loaded", "CONFLICT", 409);
    if (changes.slug && changes.slug !== current.slug) {
      const [existing] = await tx.select({ id: contentPages.id }).from(contentPages).where(eq(contentPages.slug, changes.slug)).limit(1);
      if (existing) throw new ContentOperationError("Content slug already exists", "CONFLICT", 409);
    }
    const publishedAt = changes.status === "published" && current.status !== "published" ? new Date() : changes.status && changes.status !== "published" ? null : current.publishedAt;
    const [page] = await tx.update(contentPages).set({ ...changes, publishedAt, version: current.version + 1, updatedAt: new Date() }).where(and(eq(contentPages.id, id), eq(contentPages.version, expectedVersion))).returning();
    if (!page) throw new ContentOperationError("Content page changed since it was loaded", "CONFLICT", 409);
    await tx.insert(auditLogs).values({ actorUserId: actor.id, action: "content.page_updated", entityType: "content_page", entityId: id, requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { changedFields: Object.keys(changes), previousStatus: current.status, status: page.status, version: page.version } });
    return page;
  });
}
