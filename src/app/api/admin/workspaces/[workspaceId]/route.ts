import { NextResponse } from "next/server";
import { z } from "zod";

import { adminRouteErrorResponse, authorizeAdminRequest } from "@/lib/admin/api";
import { adminWorkspaceUpdateSchema, getAdminWorkspace, updateWorkspaceByAdmin } from "@/lib/admin/workspaces";
import { readJsonBody } from "@/lib/observability/http";

const idSchema = z.string().uuid();

export async function GET(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-workspace-detail" });
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({ workspace: await getAdminWorkspace(idSchema.parse((await context.params).workspaceId)) });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  const auth = await authorizeAdminRequest(request, { rateLimitKey: "admin-workspace-update", limit: 60, mutation: true });
  if (!auth.ok) return auth.response;
  try {
    const workspaceId = idSchema.parse((await context.params).workspaceId);
    const input = adminWorkspaceUpdateSchema.parse(await readJsonBody(request, 8_192));
    return NextResponse.json({ workspace: await updateWorkspaceByAdmin(auth.actor, workspaceId, input, auth) });
  } catch (error) {
    const response = adminRouteErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
