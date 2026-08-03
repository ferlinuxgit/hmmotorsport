import { NextResponse } from "next/server";

import { getPublicRuntimeSettings } from "@/lib/config/runtime";
import { checkDistributedRateLimit, getClientIp, rateLimitResponse } from "@/lib/observability/rate-limit";

export async function GET(request: Request) {
  const rate = await checkDistributedRateLimit({ key: `public-config:${getClientIp(request.headers)}`, limit: 120, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate);
  return NextResponse.json({ settings: await getPublicRuntimeSettings() }, { headers: { "cache-control": "public, max-age=30, stale-while-revalidate=120" } });
}
