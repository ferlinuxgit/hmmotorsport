import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { updateFeatureFlag } from "@/lib/config/runtime";
import { readJsonBody } from "@/lib/observability/http";

export async function PATCH(request: Request, context: { params: Promise<{ key: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-flag-update", limit: 60, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const key = z.string().min(3).max(160).parse((await context.params).key);
    const input = z.object({ enabled: z.boolean(), rolloutPercentage: z.number().int().min(0).max(100), expectedVersion: z.number().int().min(0) }).parse(await readJsonBody(request, 4_096));
    return NextResponse.json({ flag: await updateFeatureFlag(auth.actor, key, input, auth) });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
