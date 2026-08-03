import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getPaymentsEnv } from "@/lib/config/env";
import { REQUEST_ID_HEADER, readTextBody, resolveRequestId } from "@/lib/observability/http";
import { logger } from "@/lib/observability/logger";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";
import { applyOrderPaymentEvent, type OrderStatus } from "@/lib/payments/orders";

export function mapStripeStatus(eventType: string, paymentStatus?: string | null): OrderStatus | null {
  if (eventType === "checkout.session.completed") {
    return paymentStatus === "paid" || paymentStatus === "no_payment_required" ? "paid" : null;
  }

  if (eventType === "checkout.session.async_payment_succeeded") {
    return "paid";
  }

  if (eventType === "checkout.session.expired") {
    return "cancelled";
  }

  if (eventType === "checkout.session.async_payment_failed" || eventType === "payment_intent.payment_failed") {
    return "failed";
  }

  return null;
}

export function getStripeOrderUpdate(event: Stripe.Event) {
  const paymentStatus = "payment_status" in event.data.object ? event.data.object.payment_status : null;
  const status = mapStripeStatus(event.type, typeof paymentStatus === "string" ? paymentStatus : null);

  if (!status) {
    return null;
  }

  const externalId = "id" in event.data.object ? event.data.object.id : null;
  const orderId =
    "metadata" in event.data.object && typeof event.data.object.metadata?.orderId === "string"
      ? event.data.object.metadata.orderId
      : null;

  return { status, externalId, orderId };
}

export async function POST(request: Request) {
  const rate = await checkDistributedRateLimit({ key: `stripe-webhook:${getClientIp(request.headers)}`, limit: 300, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate);
  const requestId = resolveRequestId(request.headers);
  const env = getPaymentsEnv();

  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(await readTextBody(request, 1_048_576), signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    logger.warn("Rejected Stripe webhook with invalid signature", { requestId });
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  const orderUpdate = getStripeOrderUpdate(event);
  const processing = await applyOrderPaymentEvent({
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    orderId: orderUpdate?.orderId ?? null,
    externalId: orderUpdate?.externalId ?? null,
    status: orderUpdate?.status ?? null
  });

  logger.info("Processed Stripe webhook", {
    eventType: event.type,
    orderId: orderUpdate?.orderId ?? null,
    externalId: orderUpdate?.externalId ?? null,
    duplicate: processing.duplicate,
    requestId
  });

  const response = NextResponse.json({ received: true });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}
