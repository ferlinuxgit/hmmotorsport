import { NextResponse } from "next/server";
import { z } from "zod";

import { accountRouteErrorResponse, authorizeAccountRequest } from "@/lib/auth/api";
import { hasWorkspaceRole } from "@/lib/auth/rbac";
import { getAppEnv } from "@/lib/config/env";
import { isFeatureEnabled } from "@/lib/config/runtime";
import { REQUEST_ID_HEADER, readJsonBody } from "@/lib/observability/http";
import { logger } from "@/lib/observability/logger";
import { getPaymentProvider } from "@/lib/payments";
import { attachCheckoutSession, createDraftOrder, getCheckoutPrice, updateOrderStatusById } from "@/lib/payments/orders";

const internalPathSchema = z.string().startsWith("/").refine((value) => !value.startsWith("//"), {
  message: "Redirect path must be internal"
});

const checkoutSchema = z.object({
  provider: z.enum(["stripe", "paypal"]),
  priceId: z.string().uuid(),
  successPath: internalPathSchema.default("/dashboard"),
  cancelPath: internalPathSchema.default("/")
});

export async function POST(request: Request) {
  const auth = await authorizeAccountRequest(request, { rateLimitKey: "checkout", limit: 30, mutation: true });
  if (!auth.ok) return auth.response;
  const account = auth.actor;
  const requestId = auth.requestId;

  let body: z.infer<typeof checkoutSchema>;

  try {
    body = checkoutSchema.parse(await readJsonBody(request, 4_096));
  } catch (error) {
    return accountRouteErrorResponse(error) ?? NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  const price = await getCheckoutPrice(body.priceId, body.provider);

  if (!price) {
    return NextResponse.json({ error: "Price not found" }, { status: 404 });
  }

  if (price.workspaceId && !(await hasWorkspaceRole(account, price.workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.provider === "paypal" && !(await isFeatureEnabled("commerce.paypal_checkout", { workspaceId: price.workspaceId ?? undefined, subjectId: account.id }))) {
    return NextResponse.json({ error: "PayPal checkout is temporarily disabled" }, { status: 503 });
  }

  const env = getAppEnv();
  const order = await createDraftOrder({
    userId: account.id,
    workspaceId: price.workspaceId,
    priceId: price.priceId,
    provider: body.provider,
    amount: price.amount,
    currency: price.currency
  });
  let session;

  try {
    const paymentProvider = getPaymentProvider(body.provider);
    session = await paymentProvider.createCheckoutSession({
      orderId: order.id,
      amount: price.amount,
      currency: price.currency,
      description: price.productName,
      successUrl: new URL(body.successPath, env.APP_URL).toString(),
      cancelUrl: new URL(body.cancelPath, env.APP_URL).toString(),
      customerEmail: account.email
    });

    await attachCheckoutSession({
      orderId: order.id,
      provider: body.provider,
      externalId: session.sessionId
    });
  } catch (error) {
    await updateOrderStatusById({ orderId: order.id, provider: body.provider, status: "failed" });
    logger.error("Checkout session could not be created", { error, orderId: order.id, provider: body.provider, requestId });
    return NextResponse.json({ error: "Checkout could not be created", orderId: order.id }, { status: 502 });
  }

  logger.info("Checkout session created", {
    orderId: order.id,
    provider: body.provider,
    requestId,
    userId: account.id
  });

  const response = NextResponse.json({ ...session, orderId: order.id });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}
