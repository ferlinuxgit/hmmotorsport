import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

test("paid orders grant entitlements while reconciliation and full refunds converge", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_MODE = "external"; process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.RATE_LIMIT_BACKEND = "database"; delete process.env.STRIPE_SECRET_KEY;
  const [{ eq, inArray }, { closeDb, getDb }, schema, orderService, billing, { runJobBatch }] = await Promise.all([
    import("drizzle-orm"), import("../src/lib/db/client"), import("../src/lib/db/schema"), import("../src/lib/payments/orders"), import("../src/lib/billing/service"), import("../src/lib/jobs/runner")
  ]);
  const db = getDb(); const actorId = randomUUID(); const productId = randomUUID(); const priceId = randomUUID(); const paidOrderId = randomUUID(); const reconcileOrderId = randomUUID();
  const actor = { id: actorId, email: `${actorId}@example.test`, name: "Admin", imageUrl: null, role: "admin" as const, emailVerified: true, active: true };
  let refundId: string | undefined; const entitlementIds: string[] = [];
  try {
    await db.insert(schema.users).values({ id: actorId, email: actor.email, role: "admin" });
    await db.insert(schema.products).values({ id: productId, slug: `entitlement-${productId}`, name: "Entitled product" });
    await db.insert(schema.prices).values({ id: priceId, productId, provider: "stripe", amount: "25.00", currency: "EUR", externalId: `price_${priceId}` });
    await db.insert(schema.orders).values([
      { id: paidOrderId, userId: actorId, priceId, provider: "stripe", status: "checkout_pending", total: "25.00", currency: "EUR", externalId: `stripe-dev-${paidOrderId}` },
      { id: reconcileOrderId, userId: actorId, priceId, provider: "stripe", status: "checkout_pending", total: "25.00", currency: "EUR", externalId: `stripe-dev-${reconcileOrderId}`, updatedAt: new Date(Date.now() - 20 * 60_000) }
    ]);
    await orderService.applyOrderPaymentEvent({ provider: "stripe", eventId: `paid-${paidOrderId}`, eventType: "checkout.session.completed", externalId: `stripe-dev-${paidOrderId}`, orderId: paidOrderId, status: "paid" });
    assert.equal(await billing.hasProductEntitlement({ productId, userId: actorId }), true);
    const refund = await billing.requestRefund(actor, paidOrderId, { amount: "25.00", reason: "Integration full refund" }, {}); refundId = refund.id;
    await billing.enqueueOrderReconciliation(actor, reconcileOrderId, {});
    await runJobBatch({ workerId: `billing-test-${actorId}`, batchSize: 100 });
    const persistedOrders = await db.select().from(schema.orders).where(inArray(schema.orders.id, [paidOrderId, reconcileOrderId]));
    assert.equal(persistedOrders.find((item) => item.id === paidOrderId)?.status, "refunded");
    assert.equal(persistedOrders.find((item) => item.id === reconcileOrderId)?.status, "paid");
    const [persistedRefund] = await db.select().from(schema.refunds).where(eq(schema.refunds.id, refund.id)); assert.equal(persistedRefund.status, "succeeded");
    const grants = await db.select().from(schema.entitlements).where(inArray(schema.entitlements.sourceOrderId, [paidOrderId, reconcileOrderId]));
    entitlementIds.push(...grants.map((item) => item.id));
    assert.equal(grants.find((item) => item.sourceOrderId === paidOrderId)?.status, "revoked");
    assert.equal(grants.find((item) => item.sourceOrderId === reconcileOrderId)?.status, "active");
    const auditActions = (await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, actorId))).map((item) => item.action);
    assert.equal(auditActions.includes("billing.refund_requested"), true); assert.equal(auditActions.includes("billing.reconciliation_requested"), true);
  } finally {
    await db.delete(schema.auditLogs).where(inArray(schema.auditLogs.entityId, [paidOrderId, reconcileOrderId, refundId ?? randomUUID(), ...entitlementIds]));
    await db.delete(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, actorId));
    await db.delete(schema.backgroundJobs).where(inArray(schema.backgroundJobs.type, ["billing.refund", "billing.reconcile_order"]));
    await db.delete(schema.paymentEvents).where(inArray(schema.paymentEvents.orderId, [paidOrderId, reconcileOrderId]));
    await db.delete(schema.refunds).where(inArray(schema.refunds.orderId, [paidOrderId, reconcileOrderId]));
    await db.delete(schema.entitlements).where(inArray(schema.entitlements.sourceOrderId, [paidOrderId, reconcileOrderId]));
    await db.delete(schema.orders).where(inArray(schema.orders.id, [paidOrderId, reconcileOrderId]));
    await db.delete(schema.products).where(eq(schema.products.id, productId));
    await db.delete(schema.users).where(eq(schema.users.id, actorId));
    await closeDb();
  }
});
