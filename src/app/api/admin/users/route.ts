import { NextResponse } from "next/server";

import { requireAdminAccount } from "@/lib/auth/rbac";
import { listRecentUsers } from "@/lib/auth/server";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";

export async function GET(request: Request) {
  const rateLimit = await checkDistributedRateLimit({
    key: `admin-users:${getClientIp(request.headers)}`,
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

  const users = await listRecentUsers(50);
  return NextResponse.json({ users });
}
