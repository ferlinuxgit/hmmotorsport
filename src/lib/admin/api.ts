import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAdminAccount } from "@/lib/auth/rbac";
import type { AuthAccount } from "@/lib/auth/server";
import { isSameOriginRequest, resolveRequestId } from "@/lib/observability/http";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";

type AuthorizedAdminRequest = {
  ok: true;
  actor: AuthAccount;
  clientIp: string;
  requestId: string;
};

type RejectedAdminRequest = { ok: false; response: NextResponse };

export async function authorizeAdminRequest(
  request: Request,
  options: { rateLimitKey: string; limit?: number; mutation?: boolean }
): Promise<AuthorizedAdminRequest | RejectedAdminRequest> {
  if (options.mutation && !isSameOriginRequest(request, process.env.APP_URL ? [process.env.APP_URL] : [])) {
    return { ok: false, response: NextResponse.json({ error: "Invalid request origin" }, { status: 403 }) };
  }

  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkDistributedRateLimit({
    key: `${options.rateLimitKey}:${clientIp}`,
    limit: options.limit ?? 120,
    windowMs: 60_000
  });
  if (!rateLimit.allowed) return { ok: false, response: rateLimitResponse(rateLimit) };

  try {
    const actor = await requireAdminAccount();
    return { ok: true, actor, clientIp, requestId: resolveRequestId(request.headers) };
  } catch (error) {
    const status = error instanceof Error && error.message === "Forbidden" ? 403 : 401;
    return {
      ok: false,
      response: NextResponse.json({ error: status === 403 ? "Forbidden" : "Unauthorized" }, { status })
    };
  }
}

export function adminRouteErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
  }
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  if (error instanceof Error && error.message === "Request body is too large") {
    return NextResponse.json({ error: "Request body is too large" }, { status: 400 });
  }
  if (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return null;
}
