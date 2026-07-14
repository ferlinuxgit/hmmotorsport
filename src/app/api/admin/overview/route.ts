import { NextResponse } from "next/server";

import { requireAdminAccount } from "@/lib/auth/rbac";
import { getAdminOverview } from "@/lib/admin/overview";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";

export async function GET(request: Request) {
  const rateLimit = await checkDistributedRateLimit({
    key: `admin-overview:${getClientIp(request.headers)}`,
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

  return NextResponse.json(await getAdminOverview());
}
