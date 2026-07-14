import { and, eq, inArray, ne } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { orders, paymentEvents, prices, products } from "@/lib/db/schema";
import type { PaymentProviderKey } from "@/lib/modules/contracts";
import { normalizeCurrency } from "@/lib/payments/money";

export type OrderStatus = "draft" | "checkout_pending" | "paid" | "cancelled" | "failed";

export async function getCheckoutPrice(priceId: string, provider: PaymentProviderKey) {
  const db = getDb();

  const [record] = await db
    .select({
      priceId: prices.id,
      provider: prices.provider,
      amount: prices.amount,
      currency: prices.currency,
      productName: products.name,
      productActive: products.active,
      workspaceId: products.workspaceId
    })
    .from(prices)
    .innerJoin(products, eq(prices.productId, products.id))
    .where(and(eq(prices.id, priceId), eq(prices.provider, provider)))
    .limit(1);

  if (!record || !record.productActive) {
    return null;
  }

  return {
    ...record,
    amount: String(record.amount),
    currency: normalizeCurrency(record.currency)
  };
}

export async function createDraftOrder(input: {
  userId: string;
  workspaceId: string | null;
  provider: PaymentProviderKey;
  amount: string;
  currency: string;
}) {
  const db = getDb();
  const [order] = await db
    .insert(orders)
    .values({
      userId: input.userId,
      workspaceId: input.workspaceId,
      provider: input.provider,
      status: "draft",
      total: input.amount,
      currency: normalizeCurrency(input.currency),
      updatedAt: new Date()
    })
    .returning({
      id: orders.id,
      provider: orders.provider,
      status: orders.status,
      total: orders.total,
      currency: orders.currency
    });

  return order;
}

export async function attachCheckoutSession(input: {
  orderId: string;
  provider: PaymentProviderKey;
  externalId: string;
}) {
  const db = getDb();
  await db
    .update(orders)
    .set({
      externalId: input.externalId,
      status: "checkout_pending",
      updatedAt: new Date()
    })
    .where(and(eq(orders.id, input.orderId), eq(orders.provider, input.provider)));
}

export async function updateOrderStatusByExternalId(input: {
  provider: PaymentProviderKey;
  externalId: string;
  status: OrderStatus;
}) {
  const db = getDb();
  const [order] = await db
    .update(orders)
    .set({
      status: input.status,
      updatedAt: new Date()
    })
    .where(and(eq(orders.provider, input.provider), eq(orders.externalId, input.externalId)))
    .returning({ id: orders.id, status: orders.status });

  return order ?? null;
}

export async function updateOrderStatusById(input: {
  orderId: string;
  provider: PaymentProviderKey;
  status: OrderStatus;
}) {
  const db = getDb();
  const [order] = await db
    .update(orders)
    .set({
      status: input.status,
      updatedAt: new Date()
    })
    .where(and(eq(orders.id, input.orderId), eq(orders.provider, input.provider)))
    .returning({ id: orders.id, status: orders.status });

  return order ?? null;
}

export async function applyOrderPaymentEvent(input: {
  provider: PaymentProviderKey;
  eventId: string;
  eventType: string;
  externalId: string | null;
  orderId: string | null;
  status: OrderStatus | null;
}) {
  return getDb().transaction(async (tx) => {
    const [event] = await tx
      .insert(paymentEvents)
      .values({
        provider: input.provider,
        eventId: input.eventId,
        eventType: input.eventType,
        externalId: input.externalId,
        orderId: input.orderId
      })
      .onConflictDoNothing({ target: [paymentEvents.provider, paymentEvents.eventId] })
      .returning({ id: paymentEvents.id });

    if (!event) {
      return { duplicate: true, order: null };
    }

    if (!input.status || (!input.orderId && !input.externalId)) {
      return { duplicate: false, order: null };
    }

    const identity = input.orderId ? eq(orders.id, input.orderId) : eq(orders.externalId, input.externalId!);
    const transition =
      input.status === "paid"
        ? and(identity, inArray(orders.status, ["draft", "checkout_pending", "failed"]))
        : and(identity, ne(orders.status, "paid"));
    const [order] = await tx
      .update(orders)
      .set({ status: input.status, updatedAt: new Date() })
      .where(and(eq(orders.provider, input.provider), transition))
      .returning({ id: orders.id, status: orders.status });

    if (order) {
      await tx.update(paymentEvents).set({ orderId: order.id }).where(eq(paymentEvents.id, event.id));
    }

    return { duplicate: false, order: order ?? null };
  });
}
