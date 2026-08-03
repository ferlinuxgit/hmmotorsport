import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

test("content and commerce backoffice mutations are versioned, usable and audited", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_MODE = "external";
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const [{ eq }, { closeDb, getDb }, schema, content, commerce, payments] = await Promise.all([
    import("drizzle-orm"), import("../src/lib/db/client"), import("../src/lib/db/schema"), import("../src/lib/content/admin"), import("../src/lib/commerce/admin"), import("../src/lib/payments/orders")
  ]);
  const db = getDb(); const actorId = randomUUID(); const actor = { id: actorId, email: `${actorId}@example.test`, name: "Admin", imageUrl: null, role: "admin" as const, emailVerified: true, active: true };
  let pageId: string | undefined; let productId: string | undefined; let priceId: string | undefined;
  try {
    await db.insert(schema.users).values({ id: actorId, email: actor.email, role: "admin" });
    const page = await content.createContentPage(actor, { title: "Integration page", slug: `page-${actorId}`, summary: null, body: "Safe content" }, {}); pageId = page.id;
    const published = await content.updateContentPage(actor, page.id, { status: "published", seoTitle: "Public title", expectedVersion: 1 }, {});
    assert.equal(published.status, "published"); assert.equal(published.version, 2); assert.ok(published.publishedAt);
    assert.equal((await content.getPublishedContentPage(page.slug))?.id, page.id);
    await assert.rejects(() => content.updateContentPage(actor, page.id, { title: "Stale", expectedVersion: 1 }, {}), /changed since/i);

    const product = await commerce.createProduct(actor, { name: "Integration product", slug: `product-${actorId}`, description: null, workspaceId: null }, {}); productId = product.id;
    const price = await commerce.createPrice(actor, product.id, { provider: "stripe", amount: "29.90", currency: "eur", interval: null, externalId: `price_${actorId}` }, {}); priceId = price.id;
    assert.equal((await payments.getCheckoutPrice(price.id, "stripe"))?.currency, "EUR");
    const disabled = await commerce.updatePrice(actor, price.id, { active: false, expectedVersion: 1 }, {}); assert.equal(disabled.version, 2);
    assert.equal(await payments.getCheckoutPrice(price.id, "stripe"), null);
    const updatedProduct = await commerce.updateProduct(actor, product.id, { active: false, expectedVersion: 1 }, {}); assert.equal(updatedProduct.version, 2);
    const audits = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, actorId));
    assert.deepEqual(audits.map((item) => item.action).sort(), ["commerce.price_created", "commerce.price_updated", "commerce.product_created", "commerce.product_updated", "content.page_created", "content.page_updated"]);
  } finally {
    await db.delete(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, actorId));
    if (productId) await db.delete(schema.products).where(eq(schema.products.id, productId));
    if (pageId) await db.delete(schema.contentPages).where(eq(schema.contentPages.id, pageId));
    await db.delete(schema.users).where(eq(schema.users.id, actorId));
    await closeDb();
  }
});
