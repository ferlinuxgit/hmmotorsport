import { getAuth } from "@/lib/auth/auth";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";

async function handle(request: Request) {
  if (request.method !== "GET") {
    const rateLimit = await checkDistributedRateLimit({
      key: `auth:${getClientIp(request.headers)}`,
      limit: 20,
      windowMs: 60_000
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }
  }

  return getAuth().handler(request);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
