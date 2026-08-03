import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { z } from "zod";

import type { AuthAccount } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { auditLogs, orders, prices, products, users, workspaces } from "@/lib/db/schema";
import { decimalToMinorUnits, normalizeCurrency } from "@/lib/payments/money";

const slugSchema = z.string().trim().toLowerCase().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const productCreateSchema = z.object({ name: z.string().trim().min(2).max(255), slug: slugSchema, description: z.string().trim().max(5_000).nullable().optional(), workspaceId: z.uuid().nullable().optional() });
export const productUpdateSchema = z.object({ name: z.string().trim().min(2).max(255).optional(), slug: slugSchema.optional(), description: z.string().trim().max(5_000).nullable().optional(), active: z.boolean().optional(), expectedVersion: z.number().int().positive() }).refine((value) => Object.keys(value).some((key) => key !== "expectedVersion"), { message: "At least one change is required" });
export const priceCreateSchema = z.object({
  provider: z.enum(["stripe", "paypal"]), amount: z.string().trim().regex(/^\d+(?:\.\d{1,3})?$/), currency: z.string().trim().length(3),
  interval: z.null().optional(), externalId: z.string().trim().max(255).nullable().optional()
}).superRefine((value, context) => { try { if (decimalToMinorUnits(value.amount, value.currency) <= 0) context.addIssue({ code: "custom", message: "Amount must be greater than zero", path: ["amount"] }); } catch (error) { context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Invalid amount", path: ["amount"] }); } });
export const priceUpdateSchema = z.object({ active: z.boolean(), expectedVersion: z.number().int().positive() });

export class CommerceOperationError extends Error {
  constructor(message: string, readonly code: "NOT_FOUND" | "CONFLICT", readonly status: 404 | 409) { super(message); this.name = "CommerceOperationError"; }
}

export function parseCommerceQuery(params: URLSearchParams) {
  return z.object({ q: z.string().trim().max(120).default(""), status: z.enum(["all", "active", "inactive"]).default("all"), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25) }).parse(Object.fromEntries(params));
}

export async function listProducts(query: ReturnType<typeof parseCommerceQuery>) {
  const filters: SQL[] = [];
  if (query.status !== "all") filters.push(eq(products.active, query.status === "active"));
  if (query.q) { const search = or(ilike(products.name, `%${query.q}%`), ilike(products.slug, `%${query.q}%`), ilike(workspaces.name, `%${query.q}%`)); if (search) filters.push(search); }
  const where = filters.length ? and(...filters) : undefined; const db = getDb();
  const base = db.select({ id: products.id, workspaceId: products.workspaceId, workspaceName: workspaces.name, slug: products.slug, name: products.name, description: products.description, active: products.active, version: products.version, createdAt: products.createdAt, updatedAt: products.updatedAt }).from(products).leftJoin(workspaces, eq(products.workspaceId, workspaces.id));
  const countBase = db.select({ total: count() }).from(products).leftJoin(workspaces, eq(products.workspaceId, workspaces.id));
  const [items, totals] = await Promise.all([(where ? base.where(where) : base).orderBy(desc(products.updatedAt)).limit(query.pageSize).offset((query.page - 1) * query.pageSize), where ? countBase.where(where) : countBase]);
  const productPrices = items.length ? await db.select().from(prices).where(inArray(prices.productId, items.map((item) => item.id))).orderBy(desc(prices.createdAt)) : [];
  const total = Number(totals[0]?.total ?? 0);
  return { items: items.map((item) => ({ ...item, prices: productPrices.filter((price) => price.productId === item.id) })), pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.max(1, Math.ceil(total / query.pageSize)) } };
}

export async function createProduct(actor: AuthAccount, raw: z.infer<typeof productCreateSchema>, context: { requestId?: string; clientIp?: string }) {
  const value = productCreateSchema.parse(raw); return getDb().transaction(async (tx) => {
    const [existing] = await tx.select({ id: products.id }).from(products).where(eq(products.slug, value.slug)).limit(1); if (existing) throw new CommerceOperationError("Product slug already exists", "CONFLICT", 409);
    if (value.workspaceId) { const [workspace] = await tx.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.id, value.workspaceId)).limit(1); if (!workspace) throw new CommerceOperationError("Workspace not found", "NOT_FOUND", 404); }
    const [product] = await tx.insert(products).values({ ...value, workspaceId: value.workspaceId ?? null }).returning(); if (!product) throw new Error("Could not create product");
    await tx.insert(auditLogs).values({ actorUserId: actor.id, workspaceId: product.workspaceId, action: "commerce.product_created", entityType: "product", entityId: product.id, requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { slug: product.slug } }); return product;
  });
}

export async function updateProduct(actor: AuthAccount, id: string, raw: z.infer<typeof productUpdateSchema>, context: { requestId?: string; clientIp?: string }) {
  const value = productUpdateSchema.parse(raw); const { expectedVersion, ...changes } = value; return getDb().transaction(async (tx) => {
    const [current] = await tx.select().from(products).where(eq(products.id, id)).limit(1).for("update"); if (!current) throw new CommerceOperationError("Product not found", "NOT_FOUND", 404); if (current.version !== expectedVersion) throw new CommerceOperationError("Product changed since it was loaded", "CONFLICT", 409);
    if (changes.slug && changes.slug !== current.slug) { const [existing] = await tx.select({ id: products.id }).from(products).where(eq(products.slug, changes.slug)).limit(1); if (existing) throw new CommerceOperationError("Product slug already exists", "CONFLICT", 409); }
    const [product] = await tx.update(products).set({ ...changes, version: current.version + 1, updatedAt: new Date() }).where(and(eq(products.id, id), eq(products.version, expectedVersion))).returning(); if (!product) throw new CommerceOperationError("Product changed since it was loaded", "CONFLICT", 409);
    await tx.insert(auditLogs).values({ actorUserId: actor.id, workspaceId: current.workspaceId, action: "commerce.product_updated", entityType: "product", entityId: id, requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { changedFields: Object.keys(changes), version: product.version } }); return product;
  });
}

export async function createPrice(actor: AuthAccount, productId: string, raw: z.infer<typeof priceCreateSchema>, context: { requestId?: string; clientIp?: string }) {
  const value = priceCreateSchema.parse(raw); const currency = normalizeCurrency(value.currency); return getDb().transaction(async (tx) => {
    const [product] = await tx.select().from(products).where(eq(products.id, productId)).limit(1); if (!product) throw new CommerceOperationError("Product not found", "NOT_FOUND", 404);
    const [price] = await tx.insert(prices).values({ productId, provider: value.provider, amount: value.amount, currency, interval: null, externalId: value.externalId || null }).returning(); if (!price) throw new Error("Could not create price");
    await tx.insert(auditLogs).values({ actorUserId: actor.id, workspaceId: product.workspaceId, action: "commerce.price_created", entityType: "price", entityId: price.id, requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { productId, provider: price.provider, amount: String(price.amount), currency } }); return price;
  });
}

export async function updatePrice(actor: AuthAccount, id: string, raw: z.infer<typeof priceUpdateSchema>, context: { requestId?: string; clientIp?: string }) {
  const value = priceUpdateSchema.parse(raw); return getDb().transaction(async (tx) => {
    const [current] = await tx.select({ price: prices, workspaceId: products.workspaceId }).from(prices).innerJoin(products, eq(prices.productId, products.id)).where(eq(prices.id, id)).limit(1).for("update"); if (!current) throw new CommerceOperationError("Price not found", "NOT_FOUND", 404); if (current.price.version !== value.expectedVersion) throw new CommerceOperationError("Price changed since it was loaded", "CONFLICT", 409);
    const [price] = await tx.update(prices).set({ active: value.active, version: current.price.version + 1, updatedAt: new Date() }).where(and(eq(prices.id, id), eq(prices.version, value.expectedVersion))).returning(); if (!price) throw new CommerceOperationError("Price changed since it was loaded", "CONFLICT", 409);
    await tx.insert(auditLogs).values({ actorUserId: actor.id, workspaceId: current.workspaceId, action: "commerce.price_updated", entityType: "price", entityId: id, requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { active: price.active, version: price.version } }); return price;
  });
}

export function parseOrderQuery(params: URLSearchParams) { return z.object({ q: z.string().trim().max(120).default(""), status: z.enum(["all", "draft", "checkout_pending", "paid", "refunded_partial", "refunded", "cancelled", "failed"]).default("all"), provider: z.enum(["all", "stripe", "paypal"]).default("all"), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25) }).parse(Object.fromEntries(params)); }
export async function listOrders(query: ReturnType<typeof parseOrderQuery>) {
  const filters: SQL[] = []; if (query.status !== "all") filters.push(eq(orders.status, query.status)); if (query.provider !== "all") filters.push(eq(orders.provider, query.provider)); if (query.q) { const search = or(ilike(users.email, `%${query.q}%`), ilike(orders.externalId, `%${query.q}%`)); if (search) filters.push(search); } const where = filters.length ? and(...filters) : undefined; const db = getDb();
  const base = db.select({ id: orders.id, userEmail: users.email, workspaceName: workspaces.name, provider: orders.provider, status: orders.status, total: orders.total, currency: orders.currency, externalId: orders.externalId, createdAt: orders.createdAt, updatedAt: orders.updatedAt }).from(orders).leftJoin(users, eq(orders.userId, users.id)).leftJoin(workspaces, eq(orders.workspaceId, workspaces.id)); const countBase = db.select({ total: count() }).from(orders).leftJoin(users, eq(orders.userId, users.id));
  const [items, totals] = await Promise.all([(where ? base.where(where) : base).orderBy(desc(orders.createdAt)).limit(query.pageSize).offset((query.page - 1) * query.pageSize), where ? countBase.where(where) : countBase]); const total = Number(totals[0]?.total ?? 0); return { items, pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.max(1, Math.ceil(total / query.pageSize)) } };
}
