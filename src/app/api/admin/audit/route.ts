import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { listAuditLogs, parseAuditLogQuery } from "@/lib/admin/audit";
import { requireAdminAccount } from "@/lib/auth/rbac";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";

export async function GET(request: Request) {
  const rateLimit = await checkDistributedRateLimit({
    key: `admin-audit:${getClientIp(request.headers)}`,
    limit: 120,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  try {
    await requireAdminAccount();
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = parseAuditLogQuery(new URL(request.url).searchParams);
    return NextResponse.json(await listAuditLogs(query));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid query", issues: error.issues }, { status: 400 });
    }

    throw error;
  }
}
