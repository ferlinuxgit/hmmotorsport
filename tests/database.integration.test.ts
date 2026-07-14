import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

test("PostgreSQL rate limiting and payment events are atomic", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_MODE = "external";
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.RATE_LIMIT_BACKEND = "database";
  process.env.TRUST_PROXY_HEADERS = "true";

  const [{ eq }, { closeDb, getDb }, schema, { checkDistributedRateLimit }, { applyOrderPaymentEvent }] = await Promise.all([
    import("drizzle-orm"),
    import("../src/lib/db/client"),
    import("../src/lib/db/schema"),
    import("../src/lib/observability/rate-limit"),
    import("../src/lib/payments/orders")
  ]);

  const db = getDb();
  const userId = randomUUID();
  const eventId = `evt_${randomUUID()}`;
  const rateKey = `integration:${randomUUID()}`;

  try {
    const firstLimit = await checkDistributedRateLimit({ key: rateKey, limit: 1, windowMs: 60_000 });
    const secondLimit = await checkDistributedRateLimit({ key: rateKey, limit: 1, windowMs: 60_000 });
    assert.equal(firstLimit.allowed, true);
    assert.equal(secondLimit.allowed, false);

    await db.insert(schema.users).values({ id: userId, email: `${userId}@example.test`, name: "Integration" });
    const [order] = await db
      .insert(schema.orders)
      .values({ userId, provider: "stripe", status: "checkout_pending", total: "19.000", currency: "USD" })
      .returning({ id: schema.orders.id });

    const firstEvent = await applyOrderPaymentEvent({
      provider: "stripe",
      eventId,
      eventType: "checkout.session.completed",
      externalId: "cs_integration",
      orderId: order.id,
      status: "paid"
    });
    const duplicateEvent = await applyOrderPaymentEvent({
      provider: "stripe",
      eventId,
      eventType: "checkout.session.completed",
      externalId: "cs_integration",
      orderId: order.id,
      status: "paid"
    });
    const [persistedOrder] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, order.id));

    assert.equal(firstEvent.duplicate, false);
    assert.equal(duplicateEvent.duplicate, true);
    assert.equal(persistedOrder.status, "paid");
  } finally {
    await db.delete(schema.paymentEvents).where(eq(schema.paymentEvents.eventId, eventId));
    await db.delete(schema.orders).where(eq(schema.orders.userId, userId));
    await db.delete(schema.users).where(eq(schema.users.id, userId));
    await db.delete(schema.rateLimitBuckets).where(eq(schema.rateLimitBuckets.key, rateKey));
    await closeDb();
  }
});
