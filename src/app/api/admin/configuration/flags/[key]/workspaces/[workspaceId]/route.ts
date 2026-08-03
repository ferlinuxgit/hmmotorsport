import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { removeWorkspaceFeatureFlagOverride, setWorkspaceFeatureFlagOverride } from "@/lib/config/runtime";
import { readJsonBody } from "@/lib/observability/http";

async function params(context: { params: Promise<{ key: string; workspaceId: string }> }) {
  const value = await context.params;
  return { key: z.string().min(3).max(160).parse(value.key), workspaceId: z.uuid().parse(value.workspaceId) };
}

export async function PUT(request: Request, context: { params: Promise<{ key: string; workspaceId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-flag-override", limit: 60, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const value = await params(context);
    const { enabled } = z.object({ enabled: z.boolean() }).parse(await readJsonBody(request, 1_024));
    return NextResponse.json({ override: await setWorkspaceFeatureFlagOverride(auth.actor, value.key, value.workspaceId, enabled, auth) });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ key: string; workspaceId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-flag-override", limit: 60, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const value = await params(context);
    return NextResponse.json({ override: await removeWorkspaceFeatureFlagOverride(auth.actor, value.key, value.workspaceId, auth) });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
