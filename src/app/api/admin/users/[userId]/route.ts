import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { AdminUserOperationError, adminUserUpdateSchema, updateUserByAdmin } from "@/lib/admin/users";
import { requireAdminAccount } from "@/lib/auth/rbac";
import { isSameOriginRequest, readJsonBody, resolveRequestId } from "@/lib/observability/http";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";

const userIdSchema = z.string().uuid();

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  if (!isSameOriginRequest(request, process.env.APP_URL ? [process.env.APP_URL] : [])) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkDistributedRateLimit({
    key: `admin-user-update:${clientIp}`,
    limit: 30,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  let actor;
  try {
    actor = await requireAdminAccount();
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await context.params;
    const targetUserId = userIdSchema.parse(userId);
    const input = adminUserUpdateSchema.parse(await readJsonBody(request, 4_096));
    const result = await updateUserByAdmin(actor, targetUserId, input, {
      requestId: resolveRequestId(request.headers),
      ipAddress: clientIp
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError || (error instanceof Error && error.message === "Request body is too large")) {
      return NextResponse.json(
        { error: "Invalid request", issues: error instanceof ZodError ? error.issues : undefined },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (error instanceof AdminUserOperationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    throw error;
  }
}
