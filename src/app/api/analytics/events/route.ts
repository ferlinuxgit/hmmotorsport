import { NextResponse } from "next/server";

import { getCurrentAccount } from "@/lib/auth/server";
import { analyticsEventInputSchema, trackAnalyticsEvent } from "@/lib/analytics/events";
import { REQUEST_ID_HEADER, readJsonBody, resolveRequestId } from "@/lib/observability/http";
import { logger } from "@/lib/observability/logger";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";

export async function POST(request: Request) {
  const requestId = resolveRequestId(request.headers);
  const rateLimit = await checkDistributedRateLimit({
    key: `analytics:${getClientIp(request.headers)}`,
    limit: 120,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  let input;

  try {
    input = analyticsEventInputSchema.parse(await readJsonBody(request, 16_384));
  } catch {
    return NextResponse.json({ error: "Invalid analytics event" }, { status: 400 });
  }

  try {
    const account = await getCurrentAccount();
    await trackAnalyticsEvent({
      ...input,
      userId: account?.id ?? null,
      userAgent: request.headers.get("user-agent")
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn("Analytics event skipped because local storage is unavailable", { error, requestId });
      const response = NextResponse.json({ ok: true, stored: false }, { status: 202 });
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    }

    logger.error("Analytics event could not be stored", { error, requestId });
    return NextResponse.json({ error: "Analytics event could not be stored" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true }, { status: 202 });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}
