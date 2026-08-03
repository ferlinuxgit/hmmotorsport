import { NextResponse } from "next/server";

import { getPaymentsEnv } from "@/lib/config/env";
import { REQUEST_ID_HEADER, readJsonBody, resolveRequestId } from "@/lib/observability/http";
import { logger } from "@/lib/observability/logger";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";
import { applyOrderPaymentEvent, type OrderStatus } from "@/lib/payments/orders";
import { PaypalPaymentProvider, getPaypalBaseUrl, paypalFetch } from "@/lib/payments/providers/paypal";

const paypalProvider = new PaypalPaymentProvider();

async function getPaypalAccessToken() {
  const env = getPaymentsEnv();

  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    return null;
  }

  const response = await paypalFetch(`${getPaypalBaseUrl(env.PAYPAL_ENVIRONMENT)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function verifyPaypalWebhook(request: Request, eventBody: unknown) {
  const env = getPaymentsEnv();

  if (!env.PAYPAL_WEBHOOK_ID) {
    return false;
  }

  const token = await getPaypalAccessToken();

  if (!token) {
    return false;
  }

  const response = await paypalFetch(`${getPaypalBaseUrl(env.PAYPAL_ENVIRONMENT)}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      auth_algo: request.headers.get("paypal-auth-algo"),
      cert_url: request.headers.get("paypal-cert-url"),
      transmission_id: request.headers.get("paypal-transmission-id"),
      transmission_sig: request.headers.get("paypal-transmission-sig"),
      transmission_time: request.headers.get("paypal-transmission-time"),
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: eventBody
    })
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

export function mapPaypalStatus(eventType: string): OrderStatus | null {
  if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
    return "paid";
  }

  if (eventType === "CHECKOUT.ORDER.VOIDED") {
    return "cancelled";
  }

  if (eventType === "PAYMENT.CAPTURE.DENIED") {
    return "failed";
  }

  return null;
}

export function getPaypalExternalId(eventBody: {
  resource?: { id?: string; supplementary_data?: { related_ids?: { order_id?: string } } };
}) {
  return eventBody.resource?.supplementary_data?.related_ids?.order_id ?? eventBody.resource?.id ?? null;
}

export function getPaypalInternalOrderId(eventBody: {
  resource?: { purchase_units?: Array<{ custom_id?: string }> };
}) {
  const orderId = eventBody.resource?.purchase_units?.find((unit) => unit.custom_id)?.custom_id;
  return orderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)
    ? orderId
    : null;
}

export async function POST(request: Request) {
  const rate = await checkDistributedRateLimit({ key: `paypal-webhook:${getClientIp(request.headers)}`, limit: 300, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate);
  const requestId = resolveRequestId(request.headers);
  let eventBody: {
    id?: string;
    event_type?: string;
    resource?: {
      id?: string;
      purchase_units?: Array<{ custom_id?: string }>;
      supplementary_data?: { related_ids?: { order_id?: string } };
    };
  };

  try {
    eventBody = (await readJsonBody(request, 1_048_576)) as typeof eventBody;
  } catch {
    return NextResponse.json({ error: "Invalid PayPal webhook payload" }, { status: 400 });
  }

  if (!eventBody.id || !eventBody.event_type) {
    return NextResponse.json({ error: "Invalid PayPal webhook event" }, { status: 400 });
  }

  const verified = await verifyPaypalWebhook(request, eventBody);

  if (!verified) {
    logger.warn("Rejected PayPal webhook with invalid signature", { requestId });
    return NextResponse.json({ error: "Invalid PayPal webhook signature" }, { status: 400 });
  }

  let status = mapPaypalStatus(eventBody.event_type);
  const externalId = getPaypalExternalId(eventBody);
  const orderId = getPaypalInternalOrderId(eventBody);

  if (eventBody.event_type === "CHECKOUT.ORDER.APPROVED" && eventBody.resource?.id) {
    const capture = await paypalProvider.captureOrder(eventBody.resource.id);

    if (capture.status === "COMPLETED") {
      status = "paid";
    }
  }

  const processing = await applyOrderPaymentEvent({
    provider: "paypal",
    eventId: eventBody.id,
    eventType: eventBody.event_type,
    externalId,
    orderId,
    status
  });

  logger.info("Processed PayPal webhook", {
    eventType: eventBody.event_type ?? "unknown",
    externalId,
    orderId,
    duplicate: processing.duplicate,
    requestId,
    status
  });

  const response = NextResponse.json({ received: true });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}
