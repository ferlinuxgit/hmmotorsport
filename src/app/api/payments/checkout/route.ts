import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAccount } from "@/lib/auth/server";
import { hasWorkspaceRole } from "@/lib/auth/rbac";
import { getAppEnv } from "@/lib/config/env";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/observability/http";
import { logger } from "@/lib/observability/logger";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";
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
  const requestId = resolveRequestId(request.headers);
  const rateLimit = await checkDistributedRateLimit({
    key: `checkout:${getClientIp(request.headers)}`,
    limit: 30,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  const account = await getCurrentAccount();

  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof checkoutSchema>;

  try {
    body = checkoutSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  const price = await getCheckoutPrice(body.priceId, body.provider);

  if (!price) {
    return NextResponse.json({ error: "Price not found" }, { status: 404 });
  }

  if (price.workspaceId && !(await hasWorkspaceRole(account, price.workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const env = getAppEnv();
  const order = await createDraftOrder({
    userId: account.id,
    workspaceId: price.workspaceId,
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
