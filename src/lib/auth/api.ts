import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAccount } from "@/lib/auth/rbac";
import type { AuthAccount } from "@/lib/auth/server";
import { isSameOriginRequest, resolveRequestId } from "@/lib/observability/http";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";

type AuthorizedAccountRequest = { ok: true; actor: AuthAccount; clientIp: string; requestId: string };
type RejectedAccountRequest = { ok: false; response: NextResponse };

export async function authorizeAccountRequest(
  request: Request,
  options: { rateLimitKey: string; limit?: number; mutation?: boolean }
): Promise<AuthorizedAccountRequest | RejectedAccountRequest> {
  if (options.mutation && !isSameOriginRequest(request, process.env.APP_URL ? [process.env.APP_URL] : [])) {
    return { ok: false, response: NextResponse.json({ error: "Invalid request origin" }, { status: 403 }) };
  }
  const clientIp = getClientIp(request.headers);
  const rate = await checkDistributedRateLimit({ key: `${options.rateLimitKey}:${clientIp}`, limit: options.limit ?? 120, windowMs: 60_000 });
  if (!rate.allowed) return { ok: false, response: rateLimitResponse(rate) };
  try {
    return { ok: true, actor: await requireAccount(), clientIp, requestId: resolveRequestId(request.headers) };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
}

export function accountRouteErrorResponse(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  if (error instanceof Error && (error.message === "Request body is too large" || error.message === "Request body is required")) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof Error && "status" in error && typeof error.status === "number" && "code" in error && typeof error.code === "string") {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return null;
}
