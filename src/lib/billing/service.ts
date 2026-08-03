import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import type { AuthAccount } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { auditLogs, backgroundJobs, entitlements, orders, refunds } from "@/lib/db/schema";
import { jobInsertValues } from "@/lib/jobs/queue";
import { getPaymentProvider } from "@/lib/payments";
import { decimalToMinorUnits, normalizeCurrency } from "@/lib/payments/money";
import { applyOrderPaymentEvent } from "@/lib/payments/orders";

export const refundRequestSchema = z.object({ amount: z.string().trim().regex(/^\d+(?:\.\d{1,3})?$/), reason: z.string().trim().min(3).max(255) });

export class BillingOperationError extends Error {
  constructor(message: string, readonly code: "NOT_FOUND" | "CONFLICT" | "INVALID_AMOUNT", readonly status: 400 | 404 | 409) { super(message); this.name = "BillingOperationError"; }
}

export async function requestRefund(actor: AuthAccount, orderId: string, raw: z.infer<typeof refundRequestSchema>, context: { requestId?: string; clientIp?: string }) {
  const value = refundRequestSchema.parse(raw); const db = getDb(); return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1).for("update");
    if (!order) throw new BillingOperationError("Order not found", "NOT_FOUND", 404);
    if (!order.externalId || !inArrayValue(order.status, ["paid", "refunded_partial"])) throw new BillingOperationError("Only captured orders can be refunded", "CONFLICT", 409);
    const currency = normalizeCurrency(order.currency); let requested: number;
    try { requested = decimalToMinorUnits(value.amount, currency); } catch (error) { throw new BillingOperationError(error instanceof Error ? error.message : "Invalid amount", "INVALID_AMOUNT", 400); }
    if (requested <= 0) throw new BillingOperationError("Refund amount must be greater than zero", "INVALID_AMOUNT", 400);
    const existing = await tx.select({ amount: refunds.amount }).from(refunds).where(and(eq(refunds.orderId, orderId), inArray(refunds.status, ["pending", "processing", "succeeded"])));
    const reserved = existing.reduce((total, item) => total + decimalToMinorUnits(String(item.amount), currency), 0);
    const total = decimalToMinorUnits(String(order.total), currency);
    if (requested + reserved > total) throw new BillingOperationError("Refund amount exceeds the remaining refundable total", "INVALID_AMOUNT", 400);
    const id = randomUUID(); const idempotencyKey = `refund:${id}`;
    const [refund] = await tx.insert(refunds).values({ id, orderId, provider: order.provider, amount: value.amount, currency, reason: value.reason, idempotencyKey, requestedBy: actor.id }).returning();
    await tx.insert(backgroundJobs).values(jobInsertValues({ type: "billing.refund", payload: { refundId: id }, deduplicationKey: idempotencyKey, maxAttempts: 8 }));
    await tx.insert(auditLogs).values({ actorUserId: actor.id, workspaceId: order.workspaceId, action: "billing.refund_requested", entityType: "refund", entityId: id, requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { orderId, amount: value.amount, currency, reason: value.reason } });
    return refund;
  });
}

function inArrayValue<T>(value: T, values: readonly T[]) { return values.includes(value); }

export async function processRefund(payload: Record<string, unknown>) {
  const { refundId } = z.object({ refundId: z.uuid() }).parse(payload); const db = getDb();
  const [record] = await db.select({ refund: refunds, externalId: orders.externalId, orderTotal: orders.total, workspaceId: orders.workspaceId }).from(refunds).innerJoin(orders, eq(refunds.orderId, orders.id)).where(eq(refunds.id, refundId)).limit(1);
  if (!record) throw new BillingOperationError("Refund not found", "NOT_FOUND", 404);
  if (record.refund.status === "succeeded") return;
  if (!record.externalId) throw new BillingOperationError("Order has no provider payment id", "CONFLICT", 409);
  const [claimed] = await db.update(refunds).set({ status: "processing", lastError: null, updatedAt: new Date() }).where(and(eq(refunds.id, refundId), inArray(refunds.status, ["pending", "failed", "processing"]))).returning({ id: refunds.id });
  if (!claimed) throw new BillingOperationError("Refund cannot be processed from its current state", "CONFLICT", 409);
  try {
    const provider = getPaymentProvider(record.refund.provider as "stripe" | "paypal");
    const result = await provider.refundPayment({ externalId: record.externalId, amount: String(record.refund.amount), currency: record.refund.currency, idempotencyKey: record.refund.idempotencyKey });
    if (result.status === "pending") {
      await db.update(refunds).set({ status: "processing", providerRefundId: result.id, updatedAt: new Date() }).where(eq(refunds.id, refundId));
      throw new Error("Provider refund is still pending");
    }
    await db.transaction(async (tx) => {
      const now = new Date();
      await tx.update(refunds).set({ status: "succeeded", providerRefundId: result.id, lastError: null, completedAt: now, updatedAt: now }).where(eq(refunds.id, refundId));
      const succeeded = await tx.select({ amount: refunds.amount }).from(refunds).where(and(eq(refunds.orderId, record.refund.orderId), eq(refunds.status, "succeeded")));
      const refundedMinor = succeeded.reduce((total, item) => total + decimalToMinorUnits(String(item.amount), record.refund.currency), 0);
      const orderMinor = decimalToMinorUnits(String(record.orderTotal), record.refund.currency);
      const full = refundedMinor >= orderMinor;
      await tx.update(orders).set({ status: full ? "refunded" : "refunded_partial", updatedAt: now }).where(eq(orders.id, record.refund.orderId));
      if (full) await tx.update(entitlements).set({ status: "revoked", updatedAt: now, metadata: sql`${entitlements.metadata} || ${JSON.stringify({ revokedBy: "refund", refundId })}::jsonb` }).where(eq(entitlements.sourceOrderId, record.refund.orderId));
      await tx.insert(auditLogs).values({ actorUserId: null, workspaceId: record.workspaceId, action: "billing.refund_succeeded", entityType: "refund", entityId: refundId, metadata: { orderId: record.refund.orderId, providerRefundId: result.id, full } });
    });
  } catch (error) {
    if (!(error instanceof Error && error.message === "Provider refund is still pending")) {
      await db.update(refunds).set({ status: "failed", lastError: (error instanceof Error ? error.message : String(error)).slice(0, 4_000), updatedAt: new Date() }).where(eq(refunds.id, refundId));
    }
    throw error;
  }
}

export async function enqueueOrderReconciliation(actor: AuthAccount | null, orderId: string, context: { requestId?: string; clientIp?: string } = {}) {
  const db = getDb(); return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1); if (!order) throw new BillingOperationError("Order not found", "NOT_FOUND", 404); if (!order.externalId) throw new BillingOperationError("Order has no provider payment id", "CONFLICT", 409);
    const hour = new Date().toISOString().slice(0, 13); const [job] = await tx.insert(backgroundJobs).values(jobInsertValues({ type: "billing.reconcile_order", payload: { orderId }, deduplicationKey: `reconcile:${orderId}:${hour}`, maxAttempts: 5 })).onConflictDoNothing().returning();
    if (actor) await tx.insert(auditLogs).values({ actorUserId: actor.id, workspaceId: order.workspaceId, action: "billing.reconciliation_requested", entityType: "order", entityId: orderId, requestId: context.requestId?.slice(0, 128), ipAddress: context.clientIp?.slice(0, 64), metadata: { jobId: job?.id ?? null } });
    return { job: job ?? null, deduplicated: !job };
  });
}

export async function reconcileOrder(payload: Record<string, unknown>) {
  const { orderId } = z.object({ orderId: z.uuid() }).parse(payload); const [order] = await getDb().select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new BillingOperationError("Order not found", "NOT_FOUND", 404); if (!order.externalId) throw new BillingOperationError("Order has no provider payment id", "CONFLICT", 409); if (inArrayValue(order.status, ["paid", "refunded", "refunded_partial"])) return;
  const status = await getPaymentProvider(order.provider as "stripe" | "paypal").getPaymentStatus(order.externalId);
  await applyOrderPaymentEvent({ provider: order.provider as "stripe" | "paypal", eventId: `reconciliation:${order.id}:${status}`, eventType: "internal.reconciliation", externalId: order.externalId, orderId: order.id, status });
}

export async function enqueuePendingOrderReconciliations() {
  const pending = await getDb().select({ id: orders.id }).from(orders).where(and(inArray(orders.status, ["draft", "checkout_pending", "failed"]), lt(orders.updatedAt, new Date(Date.now() - 10 * 60_000)))).orderBy(orders.updatedAt).limit(100);
  for (const order of pending) await enqueueOrderReconciliation(null, order.id);
  return { enqueued: pending.length };
}

export async function hasProductEntitlement(input: { productId: string; userId?: string; workspaceId?: string }) {
  if (Boolean(input.userId) === Boolean(input.workspaceId)) throw new Error("Exactly one entitlement subject is required");
  const subject = input.workspaceId ? eq(entitlements.workspaceId, input.workspaceId) : eq(entitlements.userId, input.userId!);
  const [record] = await getDb().select({ id: entitlements.id }).from(entitlements).where(and(eq(entitlements.key, `product:${input.productId}`), eq(entitlements.status, "active"), subject, sql`(${entitlements.expiresAt} is null or ${entitlements.expiresAt} > now())`)).limit(1);
  return Boolean(record);
}

export async function listBillingOperations() {
  const db = getDb(); const [refundItems, entitlementItems] = await Promise.all([
    db.select().from(refunds).orderBy(desc(refunds.createdAt)).limit(100),
    db.select().from(entitlements).orderBy(desc(entitlements.createdAt)).limit(100)
  ]); return { refunds: refundItems, entitlements: entitlementItems };
}
